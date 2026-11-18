<?php
if (!defined('_PS_VERSION_')) {
    exit;
}

class MithranAgroApiException extends Exception
{
    private $httpStatus;
    private $apiCode;

    public function __construct($apiCode, $httpStatus)
    {
        parent::__construct((string) $apiCode);
        $this->apiCode = (string) $apiCode;
        $this->httpStatus = (int) $httpStatus;
    }

    public function getHttpStatus()
    {
        return $this->httpStatus;
    }

    public function getApiCode()
    {
        return $this->apiCode;
    }
}

class HeadlessCustomerApi
{
    private const SESSION_DAYS = 14;
    private const RATE_BUCKET_SECONDS = 900;
    private const COD_PAYMENT_NAME = 'Cash on Delivery';

    private $module;
    private $context;

    public function __construct($module, $context)
    {
        $this->module = $module;
        $this->context = $context;
    }

    public function dispatch($action, array $body)
    {
        $this->assertIntegrationSecret();

        switch ($action) {
            case 'login':
                return $this->login($body);
            case 'register':
                return $this->register($body);
            case 'password:request-reset':
                return $this->requestPasswordReset($body);
            case 'session':
                return $this->session();
            case 'logout':
                return $this->logout();
            case 'profile:update':
                return $this->updateProfile($body);
            case 'addresses:create':
                return $this->createAddress($body);
            case 'addresses:update':
                return $this->updateAddress($body);
            case 'addresses:delete':
                return $this->deleteAddress($body);
            case 'orders:list':
                return $this->listOrders();
            case 'orders:get':
                return $this->getOrder($body);
            case 'checkout:quote':
                return $this->quoteCheckout($body);
            case 'checkout:create':
                return $this->createOrder($body);
            case 'cart:get':
                return $this->getCustomerData('cart');
            case 'cart:save':
                return $this->saveCart($body);
            case 'wishlist:get':
                return $this->getCustomerData('wishlist');
            case 'wishlist:save':
                return $this->saveWishlist($body);
            case 'notifications:get':
                return $this->getCustomerData('notifications');
            case 'notifications:update':
                return $this->updateNotification($body);
            case 'support:list':
                return $this->getCustomerData('support');
            case 'support:create':
                return $this->createSupportTicket($body);
            case 'support:reply':
                return $this->replySupportTicket($body);
            case 'farms:list':
                return $this->listFarms();
            case 'farms:get':
                return $this->getFarm($body);
            default:
                throw new MithranAgroApiException('not_found', 404);
        }
    }

    private function assertIntegrationSecret()
    {
        $configuredHash = (string) Configuration::get('MITHRAN_APP_SECRET_HASH');
        $provided = (string) ($_SERVER['HTTP_X_MITHRAN_INTEGRATION_KEY'] ?? '');
        if ($configuredHash === '' || strlen($provided) < 32) {
            throw new MithranAgroApiException('configuration', 503);
        }
        if (!hash_equals($configuredHash, hash('sha256', $provided))) {
            throw new MithranAgroApiException('unauthorized', 401);
        }
    }

    private function login(array $body)
    {
        $email = $this->normalizedEmail($body['email'] ?? null);
        $password = $body['password'] ?? null;
        if ($email === null || !is_string($password) || $password === '' || strlen($password) > 4096) {
            throw new MithranAgroApiException('invalid_input', 400);
        }
        $this->enforceRateLimit('login', $email, 8);

        $customer = (new Customer())->getByEmail($email, $password, true);
        if (!$customer || !$customer->active || $customer->deleted || $customer->is_guest) {
            throw new MithranAgroApiException('invalid_credentials', 401);
        }

        return $this->authenticationPayload($customer);
    }

    private function register(array $body)
    {
        $name = $this->boundedText($body['name'] ?? null, 2, 128);
        $email = $this->normalizedEmail($body['email'] ?? null);
        $password = $body['password'] ?? null;
        if ($name === null || $email === null || !is_string($password) || !Validate::isPasswd($password, 8, 72)) {
            throw new MithranAgroApiException('invalid_input', 400);
        }
        $this->enforceRateLimit('register', $email, 4);

        $parts = preg_split('/\s+/', trim($name), 2);
        if (!is_array($parts) || count($parts) !== 2 || !Validate::isName($parts[0]) || !Validate::isName($parts[1])) {
            throw new MithranAgroApiException('invalid_input', 400);
        }
        if (Customer::customerExists($email)) {
            throw new MithranAgroApiException('duplicate_email', 409);
        }

        $customer = new Customer();
        $customer->firstname = $parts[0];
        $customer->lastname = $parts[1];
        $customer->email = $email;
        $customer->id_default_group = (int) Configuration::get('PS_CUSTOMER_GROUP');
        $customer->active = true;
        $customer->is_guest = false;
        $customer->optin = false;

        try {
            $customer->setWsPasswd($password);
            if (!$customer->add()) {
                if (Customer::customerExists($email)) {
                    throw new MithranAgroApiException('duplicate_email', 409);
                }
                throw new MithranAgroApiException('unavailable', 503);
            }
        } catch (MithranAgroApiException $error) {
            throw $error;
        } catch (Throwable $error) {
            throw new MithranAgroApiException('unavailable', 503);
        }

        $this->appendCustomerNotification(
            (int) $customer->id,
            'registration-' . bin2hex(random_bytes(8)),
            'system',
            'Welcome to Mithran Agro',
            'Your store customer account is ready.',
            '/account'
        );
        return $this->authenticationPayload($customer);
    }

    private function requestPasswordReset(array $body)
    {
        $email = $this->normalizedEmail($body['email'] ?? null);
        if ($email === null) {
            throw new MithranAgroApiException('invalid_input', 400);
        }
        $this->enforceRateLimit('password-reset', $email, 5);

        $customer = new Customer();
        $customer->getByEmail($email);
        if (!Validate::isLoadedObject($customer) || !$customer->active || $customer->deleted || $customer->is_guest) {
            return ['success' => true];
        }

        if (defined('_PS_MODE_DEV_') && _PS_MODE_DEV_) {
            return ['success' => true];
        }

        $minimumInterval = max(0, (int) Configuration::get('PS_PASSWD_TIME_FRONT'));
        if (
            $minimumInterval > 0 &&
            strtotime($customer->last_passwd_gen . ' +' . $minimumInterval . ' minutes') > time()
        ) {
            return ['success' => true];
        }

        if (!$customer->hasRecentResetPasswordToken()) {
            $customer->stampResetPasswordToken();
            if (!$customer->update()) {
                throw new MithranAgroApiException('unavailable', 503);
            }
        }
        $resetToken = $customer->getValidResetPasswordToken();
        if (!is_string($resetToken) || $resetToken === '') {
            throw new MithranAgroApiException('unavailable', 503);
        }

        $resetUrl = $this->context->link->getPageLink(
            'password',
            null,
            null,
            'token=' . $customer->secure_key .
            '&id_customer=' . (int) $customer->id .
            '&reset_token=' . $resetToken
        );
        try {
            $sent = Mail::Send(
                (int) $customer->id_lang ?: (int) Configuration::get('PS_LANG_DEFAULT'),
                'password_query',
                'Password query confirmation',
                [
                    '{email}' => $customer->email,
                    '{lastname}' => $customer->lastname,
                    '{firstname}' => $customer->firstname,
                    '{url}' => $resetUrl,
                ],
                $customer->email,
                $customer->firstname . ' ' . $customer->lastname
            );
        } catch (Throwable $error) {
            PrestaShopLogger::addLog('Mithran Agro password reset mail delivery failed.', 3);
            return ['success' => true];
        }
        if (!$sent) {
            PrestaShopLogger::addLog('Mithran Agro password reset mail delivery failed.', 3);
            return ['success' => true];
        }

        $this->appendCustomerNotification(
            (int) $customer->id,
            'password-reset-' . bin2hex(random_bytes(8)),
            'system',
            'Password reset requested',
            'A password reset email was sent by PrestaShop.',
            '/login'
        );
        return ['success' => true];
    }

    private function getCustomerData($dataType)
    {
        $customer = $this->authenticatedCustomer();
        $db = Db::getInstance();
        $row = $db->getRow(
            'SELECT `data_json` FROM `' . _DB_PREFIX_ . 'mithranagro_customer_data`
             WHERE `id_customer` = ' . (int) $customer->id . '
             AND `data_type` = \'' . pSQL($dataType) . '\''
        );
        if ($row === false && $db->getNumberError() > 0) {
            throw new MithranAgroApiException('unavailable', 503);
        }
        $data = [];
        if ($row) {
            $decoded = json_decode((string) $row['data_json'], true);
            if (!is_array($decoded)) {
                throw new MithranAgroApiException('unavailable', 503);
            }
            $data = $decoded;
        }

        $key = [
            'cart' => 'items',
            'wishlist' => 'entries',
            'notifications' => 'notifications',
            'support' => 'tickets',
        ][$dataType] ?? 'data';
        return [
            'success' => true,
            $key => $data,
        ];
    }

    private function updateNotification(array $body)
    {
        $customer = $this->authenticatedCustomer();
        $notificationId = $this->boundedText($body['id'] ?? null, 1, 96);
        $readAll = !empty($body['readAll']);
        $remove = !empty($body['remove']);
        if (!$readAll && $notificationId === null) {
            throw new MithranAgroApiException('invalid_input', 400);
        }

        $notifications = $this->customerDataArray((int) $customer->id, 'notifications');
        $found = $readAll;
        $updated = [];
        foreach ($notifications as $notification) {
            if (!is_array($notification) || !isset($notification['id'])) {
                continue;
            }
            if ($readAll || (string) $notification['id'] === $notificationId) {
                $found = true;
                if ($remove) {
                    continue;
                }
                $notification['read'] = true;
            }
            $updated[] = $notification;
        }
        if (!$found) {
            throw new MithranAgroApiException('not_found', 404);
        }
        $this->saveCustomerData((int) $customer->id, 'notifications', $updated);

        return ['success' => true, 'notifications' => $updated];
    }

    private function createSupportTicket(array $body)
    {
        $customer = $this->authenticatedCustomer();
        $subject = $this->boundedText($body['subject'] ?? null, 4, 120);
        $message = $this->boundedText($body['message'] ?? null, 10, 4000);
        if ($subject === null || $message === null) {
            throw new MithranAgroApiException('invalid_input', 400);
        }
        $this->enforceRateLimit('support', (string) $customer->id, 10);
        $tickets = $this->customerDataArray((int) $customer->id, 'support');
        $ticket = [
            'id' => bin2hex(random_bytes(16)),
            'subject' => $subject,
            'status' => 'open',
            'createdAt' => date('c'),
            'updatedAt' => date('c'),
            'messages' => [[
                'id' => bin2hex(random_bytes(16)),
                'author' => 'customer',
                'body' => $message,
                'createdAt' => date('c'),
            ]],
        ];
        array_unshift($tickets, $ticket);
        $this->saveCustomerData((int) $customer->id, 'support', array_slice($tickets, 0, 100));

        return ['success' => true, 'ticket' => $ticket];
    }

    /**
     * Append a customer reply to a ticket owned by the authenticated customer.
     * Ownership is enforced because tickets live inside the customer's own row.
     */
    private function replySupportTicket(array $body)
    {
        $customer = $this->authenticatedCustomer();
        $ticketId = $this->boundedText($body['ticketId'] ?? null, 32, 32);
        $message = $this->boundedText($body['message'] ?? null, 2, 4000);
        if ($ticketId === null || !ctype_xdigit($ticketId) || $message === null) {
            throw new MithranAgroApiException('invalid_input', 400);
        }
        $this->enforceRateLimit('support', (string) $customer->id, 10);
        $tickets = $this->customerDataArray((int) $customer->id, 'support');
        $updatedTicket = null;
        foreach ($tickets as $index => $ticket) {
            if (!is_array($ticket) || (string) ($ticket['id'] ?? '') !== $ticketId) {
                continue;
            }
            if (($ticket['status'] ?? '') === 'closed') {
                throw new MithranAgroApiException('ticket_closed', 409);
            }
            $messages = isset($ticket['messages']) && is_array($ticket['messages']) ? $ticket['messages'] : [];
            if (count($messages) >= 200) {
                throw new MithranAgroApiException('invalid_input', 400);
            }
            $messages[] = [
                'id' => bin2hex(random_bytes(16)),
                'author' => 'customer',
                'body' => $message,
                'createdAt' => date('c'),
            ];
            $ticket['messages'] = $messages;
            $ticket['status'] = 'open';
            $ticket['updatedAt'] = date('c');
            $tickets[$index] = $ticket;
            $updatedTicket = $ticket;
            break;
        }
        if ($updatedTicket === null) {
            throw new MithranAgroApiException('not_found', 404);
        }
        $this->saveCustomerData((int) $customer->id, 'support', array_values($tickets));

        return ['success' => true, 'ticket' => $updatedTicket];
    }

    /**
     * Public farm directory. Farms are created by store administrators in the
     * module configuration page; only active farms and their active, visible
     * products are returned. No customer session is required, but the shared
     * integration secret is still enforced by dispatch().
     */
    private function listFarms()
    {
        $rows = Db::getInstance()->executeS(
            'SELECT * FROM `' . _DB_PREFIX_ . 'mithranagro_farm`
             WHERE `active` = 1
             ORDER BY `position` ASC, `name` ASC'
        );
        if ($rows === false) {
            throw new MithranAgroApiException('unavailable', 503);
        }
        $productIds = $this->farmProductIds(array_map(function ($row) {
            return (int) $row['id_farm'];
        }, $rows));

        $farms = [];
        foreach ($rows as $row) {
            $farms[] = $this->farmPayload($row, $productIds[(int) $row['id_farm']] ?? []);
        }

        return ['success' => true, 'farms' => $farms];
    }

    private function getFarm(array $body)
    {
        $slug = $this->boundedText($body['slug'] ?? null, 1, 128);
        if ($slug === null || !Validate::isLinkRewrite($slug)) {
            throw new MithranAgroApiException('invalid_input', 400);
        }
        $row = Db::getInstance()->getRow(
            'SELECT * FROM `' . _DB_PREFIX_ . 'mithranagro_farm`
             WHERE `active` = 1 AND `slug` = \'' . pSQL($slug) . '\''
        );
        if (!$row) {
            throw new MithranAgroApiException('not_found', 404);
        }
        $productIds = $this->farmProductIds([(int) $row['id_farm']]);

        return [
            'success' => true,
            'farm' => $this->farmPayload($row, $productIds[(int) $row['id_farm']] ?? []),
        ];
    }

    /**
     * @param int[] $farmIds
     *
     * @return array<int, string[]>
     */
    private function farmProductIds(array $farmIds)
    {
        $farmIds = array_values(array_filter(array_map('intval', $farmIds)));
        if (!$farmIds) {
            return [];
        }
        $shopId = (int) $this->context->shop->id;
        $rows = Db::getInstance()->executeS(
            'SELECT fp.`id_farm`, fp.`id_product`
             FROM `' . _DB_PREFIX_ . 'mithranagro_farm_product` fp
             INNER JOIN `' . _DB_PREFIX_ . 'product_shop` ps
                ON ps.`id_product` = fp.`id_product` AND ps.`id_shop` = ' . $shopId . '
             WHERE fp.`id_farm` IN (' . implode(',', $farmIds) . ')
               AND ps.`active` = 1
               AND ps.`visibility` <> \'none\'
             ORDER BY fp.`id_product` ASC'
        );
        if ($rows === false) {
            throw new MithranAgroApiException('unavailable', 503);
        }
        $result = [];
        foreach ($rows as $row) {
            $result[(int) $row['id_farm']][] = (string) (int) $row['id_product'];
        }

        return $result;
    }

    private function farmPayload(array $row, array $productIds)
    {
        return [
            'id' => (string) (int) $row['id_farm'],
            'slug' => (string) $row['slug'],
            'name' => (string) $row['name'],
            'ownerName' => (string) $row['owner_name'],
            'location' => (string) $row['location'],
            'shortDescription' => (string) $row['short_description'],
            'story' => (string) $row['story'],
            'logoUrl' => (string) $row['logo_url'],
            'coverUrl' => (string) $row['cover_url'],
            'isVerified' => (int) $row['is_verified'] === 1,
            'verificationNote' => (string) $row['verification_note'],
            'contactEmail' => (int) $row['show_contact'] === 1 ? (string) $row['contact_email'] : '',
            'contactPhone' => (int) $row['show_contact'] === 1 ? (string) $row['contact_phone'] : '',
            'productIds' => array_values($productIds),
            'updatedAt' => (string) $row['date_upd'],
        ];
    }

    private function customerDataArray($customerId, $dataType)
    {
        $db = Db::getInstance();
        $row = $db->getRow(
            'SELECT `data_json` FROM `' . _DB_PREFIX_ . 'mithranagro_customer_data`
             WHERE `id_customer` = ' . (int) $customerId . '
             AND `data_type` = \'' . pSQL($dataType) . '\''
        );
        if ($row === false && $db->getNumberError() > 0) {
            throw new MithranAgroApiException('unavailable', 503);
        }
        if (!$row) {
            return [];
        }
        $data = json_decode((string) $row['data_json'], true);
        if (!is_array($data)) {
            throw new MithranAgroApiException('unavailable', 503);
        }
        return $data;
    }

    private function appendCustomerNotification($customerId, $id, $type, $title, $body, $actionHref)
    {
        try {
            $notifications = $this->customerDataArray($customerId, 'notifications');
            foreach ($notifications as $notification) {
                if (is_array($notification) && (string) ($notification['id'] ?? '') === $id) {
                    return;
                }
            }
            array_unshift($notifications, [
                'id' => $id,
                'type' => $type,
                'title' => $title,
                'body' => $body,
                'timestamp' => date('c'),
                'read' => false,
                'actionLabel' => 'View',
                'actionHref' => $actionHref,
            ]);
            $this->saveCustomerData($customerId, 'notifications', array_slice($notifications, 0, 100));
        } catch (Throwable $error) {
            PrestaShopLogger::addLog('Mithran Agro could not persist a customer notification.', 3);
        }
    }

    private function orderHistoryPayload($orderId, $languageId)
    {
        $rows = Db::getInstance()->executeS(
            'SELECT oh.`id_order_history`, oh.`id_order_state`, oh.`date_add`, osl.`name`
             FROM `' . _DB_PREFIX_ . 'order_history` oh
             INNER JOIN `' . _DB_PREFIX_ . 'order_state_lang` osl
                ON osl.`id_order_state` = oh.`id_order_state`
                AND osl.`id_lang` = ' . (int) $languageId . '
             WHERE oh.`id_order` = ' . (int) $orderId . '
             ORDER BY oh.`date_add` ASC, oh.`id_order_history` ASC'
        );
        if (!is_array($rows)) {
            throw new MithranAgroApiException('unavailable', 503);
        }

        $events = [];
        foreach ($rows as $row) {
            $state = new OrderState((int) $row['id_order_state']);
            if (!Validate::isLoadedObject($state)) {
                continue;
            }
            $name = trim((string) $row['name']);
            if ($name === '') {
                continue;
            }
            $events[] = [
                'id' => (string) (int) $row['id_order_history'],
                'status' => $this->appOrderStatus($state, $name),
                'title' => $name,
                'description' => 'Status recorded by PrestaShop.',
                'timestamp' => (string) $row['date_add'],
                'completed' => true,
            ];
        }

        return $events;
    }

    private function saveCart(array $body)
    {
        $customer = $this->authenticatedCustomer();
        $items = $this->validatedCartItems($body['items'] ?? null, $customer, true);
        $this->saveCustomerData((int) $customer->id, 'cart', $items);

        return ['success' => true, 'items' => $items];
    }

    private function saveWishlist(array $body)
    {
        $customer = $this->authenticatedCustomer();
        $entries = $body['entries'] ?? null;
        if (!is_array($entries) || count($entries) > 500) {
            throw new MithranAgroApiException('invalid_input', 400);
        }

        $normalized = [];
        $seen = [];
        foreach ($entries as $entry) {
            if (!is_array($entry)) {
                throw new MithranAgroApiException('invalid_input', 400);
            }
            $productId = $this->positiveId($entry['productId'] ?? null);
            if ($productId === null || isset($seen[$productId])) {
                throw new MithranAgroApiException('invalid_input', 400);
            }
            $product = new Product($productId, false, (int) $this->context->language->id, (int) $this->context->shop->id);
            if (!Validate::isLoadedObject($product)) {
                throw new MithranAgroApiException('invalid_input', 400);
            }
            $seen[$productId] = true;
            $addedAt = $entry['addedAt'] ?? null;
            $normalized[] = [
                'productId' => (string) $productId,
                'addedAt' => is_string($addedAt) && strtotime($addedAt) !== false ? $addedAt : date('c'),
            ];
        }
        $this->saveCustomerData((int) $customer->id, 'wishlist', $normalized);

        return ['success' => true, 'entries' => $normalized];
    }

    private function saveCustomerData($customerId, $dataType, array $data)
    {
        $json = json_encode($data, JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE);
        if (!is_string($json)) {
            throw new MithranAgroApiException('invalid_input', 400);
        }
        $table = _DB_PREFIX_ . 'mithranagro_customer_data';
        $sql = 'INSERT INTO `' . $table . '` (`id_customer`, `data_type`, `data_json`, `date_upd`)
                VALUES (' . (int) $customerId . ', \'' . pSQL($dataType) . '\', \'' . pSQL($json, true) . '\', NOW())
                ON DUPLICATE KEY UPDATE `data_json` = VALUES(`data_json`), `date_upd` = NOW()';
        if (!Db::getInstance()->execute($sql)) {
            throw new MithranAgroApiException('unavailable', 503);
        }
    }

    private function authenticationPayload($customer)
    {
        return [
            'success' => true,
            'token' => $this->createSession($customer),
            'user' => $this->customerPayload($customer),
            'addresses' => $this->customerAddresses($customer),
        ];
    }

    private function session()
    {
        $customer = $this->authenticatedCustomer();
        return [
            'success' => true,
            'user' => $this->customerPayload($customer),
            'addresses' => $this->customerAddresses($customer),
        ];
    }

    private function logout()
    {
        $token = $this->sessionToken();
        if ($token !== null) {
            if (!Db::getInstance()->update(
                'mithranagro_session',
                ['revoked' => 1],
                '`token_hash` = \'' . pSQL(hash('sha256', $token)) . '\''
            )) {
                throw new MithranAgroApiException('unavailable', 503);
            }
        }

        return ['success' => true];
    }

    private function updateProfile(array $body)
    {
        $customer = $this->authenticatedCustomer();
        $changed = false;
        if (array_key_exists('name', $body)) {
            $name = $this->boundedText($body['name'], 2, 128);
            $parts = $name === null ? null : preg_split('/\s+/', trim($name), 2);
            if (
                !is_array($parts) ||
                count($parts) !== 2 ||
                !Validate::isName($parts[0]) ||
                !Validate::isName($parts[1])
            ) {
                throw new MithranAgroApiException('invalid_input', 400);
            }
            $customer->firstname = $parts[0];
            $customer->lastname = $parts[1];
            $changed = true;
        }

        if (array_key_exists('phone', $body)) {
            $phone = $this->phone($body['phone']);
            $addresses = $this->customerAddressesRaw($customer);
            if (!$addresses) {
                throw new MithranAgroApiException('invalid_input', 400);
            }
            $addressId = $this->defaultAddressId($customer, $addresses);
            $address = new Address($addressId);
            if ((int) $address->id_customer !== (int) $customer->id) {
                throw new MithranAgroApiException('not_found', 404);
            }
            $address->phone_mobile = $phone;
            if (!$address->update()) {
                throw new MithranAgroApiException('unavailable', 503);
            }
        }

        if ($changed && !$customer->update()) {
            throw new MithranAgroApiException('unavailable', 503);
        }

        $customer = new Customer((int) $customer->id);
        return [
            'success' => true,
            'user' => $this->customerPayload($customer),
        ];
    }

    private function createAddress(array $body)
    {
        $customer = $this->authenticatedCustomer();
        $address = $this->newAddressFromPayload($body, $customer);
        if (!$address->add()) {
            throw new MithranAgroApiException('invalid_input', 400);
        }

        $addresses = $this->customerAddressesRaw($customer);
        $makeDefault = !empty($body['isDefault']) || count($addresses) === 1;
        if ($makeDefault) {
            $this->setDefaultAddressId($customer, (int) $address->id);
        }

        return [
            'success' => true,
            'address' => $this->addressPayload($address, $makeDefault),
        ];
    }

    private function updateAddress(array $body)
    {
        $customer = $this->authenticatedCustomer();
        $addressId = $this->positiveId($body['id'] ?? null);
        $address = $addressId === null ? null : new Address($addressId);
        if (!$address || !Validate::isLoadedObject($address) || (int) $address->id_customer !== (int) $customer->id) {
            throw new MithranAgroApiException('address_not_found', 404);
        }

        $editable = ['name', 'phone', 'line1', 'line2', 'city', 'state', 'pincode', 'label'];
        $hasAddressChanges = false;
        foreach ($editable as $field) {
            if (!array_key_exists($field, $body)) {
                continue;
            }
            $hasAddressChanges = true;
        }
        if ($hasAddressChanges) {
            $fields = [
                'name' => $address->firstname . ' ' . $address->lastname,
                'phone' => $address->phone_mobile ?: $address->phone,
                'line1' => $address->address1,
                'line2' => $address->address2,
                'city' => $address->city,
                'state' => (new State((int) $address->id_state))->name[$this->context->language->id] ?? '',
                'pincode' => $address->postcode,
                'label' => $address->alias,
                'isDefault' => !empty($body['isDefault']),
            ];
            foreach ($editable as $field) {
                if (array_key_exists($field, $body)) {
                    $fields[$field] = $body[$field];
                }
            }
            $updated = $this->newAddressFromPayload($fields, $customer, $address);
            if (!$updated->update()) {
                throw new MithranAgroApiException('invalid_input', 400);
            }
            $address = $updated;
        }

        $isDefault = $this->isDefaultAddress($customer, (int) $address->id);
        if (!empty($body['isDefault'])) {
            $this->setDefaultAddressId($customer, (int) $address->id);
            $isDefault = true;
        }

        return [
            'success' => true,
            'address' => $this->addressPayload($address, $isDefault),
        ];
    }

    private function deleteAddress(array $body)
    {
        $customer = $this->authenticatedCustomer();
        $addressId = $this->positiveId($body['id'] ?? null);
        $address = $addressId === null ? null : new Address($addressId);
        if (!$address || !Validate::isLoadedObject($address) || (int) $address->id_customer !== (int) $customer->id) {
            throw new MithranAgroApiException('address_not_found', 404);
        }
        $wasDefault = $this->isDefaultAddress($customer, $addressId);
        if (!$address->delete()) {
            throw new MithranAgroApiException('unavailable', 503);
        }

        if ($wasDefault) {
            $remaining = $this->customerAddressesRaw($customer);
            if ($remaining) {
                $this->setDefaultAddressId($customer, (int) $remaining[0]['id_address']);
            } else {
                if (!Db::getInstance()->delete(
                    'mithranagro_address_preference',
                    '`id_customer` = ' . (int) $customer->id
                )) {
                    throw new MithranAgroApiException('unavailable', 503);
                }
            }
        }

        return ['success' => true];
    }

    private function listOrders()
    {
        $customer = $this->authenticatedCustomer();
        $rows = Order::getCustomerOrders((int) $customer->id, true, $this->context);
        $orders = [];
        foreach ($rows as $row) {
            $orderId = (int) ($row['id_order'] ?? 0);
            $order = $orderId > 0 ? new Order($orderId) : null;
            if (!$order || !Validate::isLoadedObject($order) || (int) $order->id_customer !== (int) $customer->id) {
                continue;
            }
            $orders[] = $this->orderPayload($order, $customer);
        }

        return ['success' => true, 'orders' => $orders];
    }

    private function getOrder(array $body)
    {
        $customer = $this->authenticatedCustomer();
        $orderId = $this->positiveId($body['id'] ?? null);
        $order = $orderId === null ? null : new Order($orderId);
        if (
            !$order ||
            !Validate::isLoadedObject($order) ||
            (int) $order->id_customer !== (int) $customer->id
        ) {
            throw new MithranAgroApiException('order_not_found', 404);
        }

        return [
            'success' => true,
            'order' => $this->orderPayload($order, $customer),
        ];
    }

    private function quoteCheckout(array $body)
    {
        $customer = $this->authenticatedCustomer();
        $address = $this->deliveryAddress($body['addressId'] ?? null, $customer);
        $cart = $this->buildCart($body['items'] ?? null, $customer, $address);
        $total = (float) $cart->getOrderTotal(true, Cart::BOTH);
        if (!is_finite($total) || $total <= 0) {
            $cart->delete();
            throw new MithranAgroApiException('stock_changed', 409);
        }
        if (!$cart->delete()) {
            throw new MithranAgroApiException('unavailable', 503);
        }

        return [
            'success' => true,
            'quote' => [
                'total' => round($total, 2),
                'currency' => 'INR',
            ],
        ];
    }

    private function createOrder(array $body)
    {
        $customer = $this->authenticatedCustomer();
        $address = $this->deliveryAddress($body['addressId'] ?? null, $customer);
        $idempotencyKey = $body['idempotencyKey'] ?? null;
        $expectedTotal = $body['expectedTotal'] ?? null;
        if (
            !is_string($idempotencyKey) ||
            !preg_match('/^[a-f0-9-]{36}$/i', $idempotencyKey) ||
            !is_numeric($expectedTotal) ||
            !is_finite((float) $expectedTotal) ||
            (float) $expectedTotal <= 0
        ) {
            throw new MithranAgroApiException('invalid_input', 400);
        }

        $keyHash = hash('sha256', $idempotencyKey);
        $requestHash = $this->checkoutRequestHash(
            $body['items'] ?? null,
            (int) $address->id,
            (float) $expectedTotal
        );
        $claim = $this->claimIdempotency((int) $customer->id, $keyHash, $requestHash);
        if ($claim['order_id'] > 0) {
            $existingOrder = new Order($claim['order_id']);
            if (!Validate::isLoadedObject($existingOrder) || (int) $existingOrder->id_customer !== (int) $customer->id) {
                throw new MithranAgroApiException('unavailable', 503);
            }
            return ['success' => true, 'order' => $this->orderPayload($existingOrder, $customer)];
        }

        $cart = null;
        $orderCreationStarted = false;
        $claimToken = $claim['claim_token'];
        try {
            $cart = $this->buildCart($body['items'] ?? null, $customer, $address);
            if (!$this->setIdempotencyCart(
                (int) $customer->id,
                $keyHash,
                (int) $cart->id,
                $claimToken
            )) {
                throw new MithranAgroApiException('duplicate_submission', 409);
            }
            $total = (float) $cart->getOrderTotal(true, Cart::BOTH);
            if (!is_finite($total) || $total <= 0) {
                throw new MithranAgroApiException('stock_changed', 409);
            }
            if (abs(round($total, 2) - round((float) $expectedTotal, 2)) >= 0.01) {
                throw new MithranAgroApiException('price_changed', 409);
            }

            $this->context->cart = $cart;
            $this->context->customer = $customer;
            $this->context->currency = new Currency((int) $cart->id_currency);
            $this->context->language = new Language((int) $cart->id_lang);

            $orderStateId = (int) Configuration::get('MITHRAN_COD_ORDER_STATE');
            $orderState = new OrderState($orderStateId);
            if (
                !Validate::isLoadedObject($orderState) ||
                empty($orderState->active) ||
                $orderState->paid ||
                $orderState->logable ||
                (string) $orderState->module_name !== (string) $this->module->name
            ) {
                throw new MithranAgroApiException('configuration', 503);
            }
            if (!$this->beginIdempotencyOrderCreation(
                (int) $customer->id,
                $keyHash,
                (int) $cart->id,
                $claimToken
            )) {
                throw new MithranAgroApiException('duplicate_submission', 409);
            }
            $orderCreationStarted = true;
            if (!$this->module->validateOrder(
                (int) $cart->id,
                $orderStateId,
                0,
                self::COD_PAYMENT_NAME,
                null,
                [],
                (int) $cart->id_currency,
                false,
                (string) $customer->secure_key,
                $this->context->shop
            )) {
                throw new MithranAgroApiException('unavailable', 503);
            }

            $orderId = (int) Order::getIdByCartId((int) $cart->id);
            if ($orderId < 1) {
                throw new MithranAgroApiException('unavailable', 503);
            }
            $order = new Order($orderId);
            if (!Validate::isLoadedObject($order) || (int) $order->id_customer !== (int) $customer->id) {
                throw new MithranAgroApiException('unavailable', 503);
            }
            if (!$this->completeIdempotency((int) $customer->id, $keyHash, $orderId, $claimToken)) {
                throw new MithranAgroApiException('unavailable', 503);
            }
            $this->appendCustomerNotification(
                (int) $customer->id,
                'order-' . $orderId,
                'order',
                'Order received',
                'Your PrestaShop order ' . (string) $order->reference . ' was placed.',
                '/account/orders/' . $orderId
            );
            return [
                'success' => true,
                'order' => $this->orderPayload($order, $customer),
            ];
        } catch (Throwable $error) {
            if ($cart && (int) $cart->id > 0) {
                $orderId = (int) Order::getIdByCartId((int) $cart->id);
                if ($orderId > 0) {
                    $order = new Order($orderId);
                    if (
                        !Validate::isLoadedObject($order) ||
                        (int) $order->id_customer !== (int) $customer->id ||
                        !$this->completeIdempotency(
                            (int) $customer->id,
                            $keyHash,
                            $orderId,
                            $claimToken
                        )
                    ) {
                        throw new MithranAgroApiException('unavailable', 503);
                    }
                    $this->appendCustomerNotification(
                        (int) $customer->id,
                        'order-' . $orderId,
                        'order',
                        'Order received',
                        'Your PrestaShop order ' . (string) $order->reference . ' was placed.',
                        '/account/orders/' . $orderId
                    );
                    return [
                        'success' => true,
                        'order' => $this->orderPayload($order, $customer),
                    ];
                }
                if (!$orderCreationStarted) {
                    if (!$cart->delete()) {
                        throw new MithranAgroApiException('unavailable', 503);
                    }
                    if (!$this->failIdempotency(
                        (int) $customer->id,
                        $keyHash,
                        $claimToken
                    )) {
                        throw new MithranAgroApiException('unavailable', 503);
                    }
                } else {
                    throw new MithranAgroApiException('duplicate_submission', 409);
                }
            } elseif (!$orderCreationStarted) {
                if (!$this->failIdempotency(
                    (int) $customer->id,
                    $keyHash,
                    $claimToken
                )) {
                    throw new MithranAgroApiException('unavailable', 503);
                }
            } else {
                throw new MithranAgroApiException('duplicate_submission', 409);
            }
            if ($error instanceof MithranAgroApiException) {
                throw $error;
            }
            throw new MithranAgroApiException('unavailable', 503);
        }
    }

    private function validatedCartItems($items, $customer, $allowEmpty)
    {
        if (
            !is_array($items) ||
            (!$allowEmpty && count($items) < 1) ||
            count($items) > 50
        ) {
            throw new MithranAgroApiException('invalid_input', 400);
        }

        $languageId = (int) $customer->id_lang ?: (int) Configuration::get('PS_LANG_DEFAULT');
        $shopId = (int) $this->context->shop->id;
        $seen = [];
        $normalized = [];
        foreach ($items as $item) {
            if (!is_array($item)) {
                throw new MithranAgroApiException('invalid_input', 400);
            }
            $productId = $this->positiveId($item['productId'] ?? null);
            $quantity = $this->positiveId($item['quantity'] ?? null);
            if ($productId === null || $quantity === null || $quantity > 10000) {
                throw new MithranAgroApiException('invalid_input', 400);
            }

            $product = new Product($productId, false, $languageId, $shopId);
            if (
                !Validate::isLoadedObject($product) ||
                !$product->active ||
                !$product->available_for_order ||
                $product->visibility === 'none'
            ) {
                throw new MithranAgroApiException('stock_changed', 409);
            }

            $defaultAttributeId = max(0, (int) $product->cache_default_attribute);
            $attributeId = array_key_exists('attributeId', $item)
                ? $this->nonNegativeId($item['attributeId'])
                : $defaultAttributeId;
            if ($attributeId === null || $attributeId !== $defaultAttributeId) {
                throw new MithranAgroApiException('stock_changed', 409);
            }

            $expectedVariantId = $this->variantIdentifier($productId, $attributeId);
            $legacyVariantId = 'prestashop-' . $productId;
            if (
                isset($item['variantId']) &&
                (!is_string($item['variantId']) ||
                    ($item['variantId'] !== $expectedVariantId && $item['variantId'] !== $legacyVariantId))
            ) {
                throw new MithranAgroApiException('invalid_input', 400);
            }

            $minimum = max(1, (int) $product->minimal_quantity);
            $stock = (int) StockAvailable::getQuantityAvailableByProduct($productId, $attributeId, $shopId);
            if ($quantity < $minimum || $quantity > $stock) {
                throw new MithranAgroApiException('stock_changed', 409);
            }

            $lineKey = $productId . ':' . $attributeId;
            if (isset($seen[$lineKey])) {
                throw new MithranAgroApiException('invalid_input', 400);
            }
            $seen[$lineKey] = true;
            $addedAt = $item['addedAt'] ?? null;
            if (!is_string($addedAt) || strtotime($addedAt) === false) {
                $addedAt = date('c');
            }
            $variantId = $this->variantIdentifier($productId, $attributeId);
            $normalized[] = [
                'id' => $productId . ':' . $variantId,
                'productId' => (string) $productId,
                'variantId' => $variantId,
                'attributeId' => $attributeId,
                'quantity' => $quantity,
                'addedAt' => $addedAt,
            ];
        }

        return $normalized;
    }

    private function variantIdentifier($productId, $attributeId)
    {
        return 'prestashop-' . (int) $productId .
            ((int) $attributeId > 0 ? '-' . (int) $attributeId : '');
    }

    private function buildCart($items, $customer, $address)
    {
        if (!(bool) Configuration::get('MITHRAN_COD_ENABLED')) {
            throw new MithranAgroApiException('configuration', 503);
        }
        $items = $this->validatedCartItems($items, $customer, false);
        $currencyId = (int) Configuration::get('PS_CURRENCY_DEFAULT');
        $languageId = (int) $customer->id_lang ?: (int) Configuration::get('PS_LANG_DEFAULT');
        $currency = new Currency($currencyId);
        $carrierId = (int) Configuration::get('PS_CARRIER_DEFAULT');
        $carrier = $carrierId > 0 ? new Carrier($carrierId, $languageId) : null;
        if (
            !Validate::isLoadedObject($currency) ||
            strtoupper((string) $currency->iso_code) !== 'INR' ||
            !$carrier ||
            !Validate::isLoadedObject($carrier) ||
            !$carrier->active
        ) {
            throw new MithranAgroApiException('configuration', 503);
        }

        $cart = new Cart();
        $cart->id_customer = (int) $customer->id;
        $cart->id_address_delivery = (int) $address->id;
        $cart->id_address_invoice = (int) $address->id;
        $cart->id_currency = $currencyId;
        $cart->id_lang = $languageId;
        $cart->id_shop = (int) $this->context->shop->id;
        $cart->id_carrier = $carrierId;
        $cart->secure_key = (string) $customer->secure_key;
        if (!$cart->add()) {
            throw new MithranAgroApiException('unavailable', 503);
        }

        $this->context->cart = $cart;
        $this->context->customer = $customer;
        $this->context->currency = $currency;
        $this->context->language = new Language($languageId);

        try {
            foreach ($items as $item) {
                $productId = (int) $item['productId'];
                $quantity = (int) $item['quantity'];
                $attributeId = (int) $item['attributeId'];
                $product = new Product($productId, false, $languageId, (int) $this->context->shop->id);
                $updated = $cart->updateQty(
                    $quantity,
                    $productId,
                    $attributeId,
                    false,
                    'up',
                    (int) $address->id,
                    $this->context->shop,
                    true,
                    false
                );
                if (!$updated) {
                    throw new MithranAgroApiException('stock_changed', 409);
                }
            }
        } catch (Throwable $error) {
            if (!$cart->delete()) {
                PrestaShopLogger::addLog('Mithran Agro could not clean up an incomplete checkout cart.', 3);
            }
            throw $error;
        }

        return $cart;
    }

    private function deliveryAddress($addressId, $customer)
    {
        $id = $this->positiveId($addressId);
        $address = $id === null ? null : new Address($id);
        if (
            !$address ||
            !Validate::isLoadedObject($address) ||
            (int) $address->id_customer !== (int) $customer->id ||
            $address->deleted
        ) {
            throw new MithranAgroApiException('address_not_found', 404);
        }

        return $address;
    }

    private function newAddressFromPayload(array $body, $customer, $existing = null)
    {
        $name = $this->boundedText($body['name'] ?? null, 2, 128);
        $phone = $this->phone($body['phone'] ?? null);
        $line1 = $this->boundedText($body['line1'] ?? null, 3, 128);
        $line2 = $this->boundedText($body['line2'] ?? '', 0, 128);
        $city = $this->boundedText($body['city'] ?? null, 2, 64);
        $stateName = $this->boundedText($body['state'] ?? null, 2, 64);
        $pincode = $this->boundedText($body['pincode'] ?? null, 6, 12);
        $label = $this->boundedText($body['label'] ?? null, 2, 32);
        if (
            $name === null || $phone === null || $line1 === null || $line2 === null ||
            $city === null || $stateName === null || $pincode === null || $label === null ||
            !preg_match('/^\d{6}$/', $pincode)
        ) {
            throw new MithranAgroApiException('invalid_input', 400);
        }
        $parts = preg_split('/\s+/', trim($name), 2);
        if (!is_array($parts) || count($parts) !== 2 || !Validate::isName($parts[0]) || !Validate::isName($parts[1])) {
            throw new MithranAgroApiException('invalid_input', 400);
        }

        $countryId = (int) Country::getByIso('IN');
        $country = $countryId > 0 ? new Country($countryId) : null;
        $stateId = (int) State::getIdByName($stateName);
        $state = $stateId > 0 ? new State($stateId) : null;
        if (
            !$country ||
            !Validate::isLoadedObject($country) ||
            !$country->active ||
            !$state ||
            !Validate::isLoadedObject($state) ||
            (int) $state->id_country !== $countryId
        ) {
            throw new MithranAgroApiException('invalid_input', 400);
        }

        $address = $existing ?: new Address();
        $address->id_customer = (int) $customer->id;
        $address->id_country = $countryId;
        $address->id_state = $stateId;
        $address->alias = $label;
        $address->firstname = $parts[0];
        $address->lastname = $parts[1];
        $address->address1 = $line1;
        $address->address2 = $line2;
        $address->city = $city;
        $address->postcode = $pincode;
        $address->phone_mobile = $phone;
        $address->active = true;

        return $address;
    }

    private function customerPayload($customer)
    {
        $addresses = $this->customerAddressesRaw($customer);
        $defaultId = $addresses ? $this->defaultAddressId($customer, $addresses) : 0;
        $phone = '';
        foreach ($addresses as $address) {
            if ((int) $address['id_address'] === $defaultId) {
                $phone = (string) ($address['phone_mobile'] ?: $address['phone']);
                break;
            }
        }

        return [
            'id' => (string) $customer->id,
            'name' => trim((string) $customer->firstname . ' ' . (string) $customer->lastname),
            'email' => (string) $customer->email,
            'phone' => $phone,
            'avatar' => '',
            'memberSince' => (string) $customer->date_add,
            'loyaltyPoints' => 0,
            'tier' => 'sprout',
        ];
    }

    private function customerAddresses($customer)
    {
        $rows = $this->customerAddressesRaw($customer);
        $defaultId = $rows ? $this->defaultAddressId($customer, $rows) : 0;
        $result = [];
        foreach ($rows as $row) {
            if (!empty($row['deleted'])) {
                continue;
            }
            $address = new Address((int) $row['id_address']);
            if (!Validate::isLoadedObject($address) || (int) $address->id_customer !== (int) $customer->id) {
                continue;
            }
            $result[] = $this->addressPayload(
                $address,
                (int) $address->id === $defaultId
            );
        }

        return $result;
    }

    private function customerAddressesRaw($customer)
    {
        return $customer->getAddresses((int) $this->context->language->id);
    }

    private function addressPayload($address, $isDefault)
    {
        $state = new State((int) $address->id_state);
        $stateName = is_array($state->name)
            ? (string) ($state->name[(int) $this->context->language->id] ?? '')
            : (string) $state->name;
        $label = (string) $address->alias;
        $normalizedLabel = strtolower($label);
        $type = in_array($normalizedLabel, ['home', 'work', 'other'], true) ? $normalizedLabel : 'other';

        return [
            'id' => (string) $address->id,
            'label' => $label,
            'name' => trim((string) $address->firstname . ' ' . (string) $address->lastname),
            'phone' => (string) ($address->phone_mobile ?: $address->phone),
            'line1' => (string) $address->address1,
            'line2' => (string) $address->address2,
            'city' => (string) $address->city,
            'state' => $stateName,
            'pincode' => (string) $address->postcode,
            'type' => $type,
            'isDefault' => (bool) $isDefault,
            'deliveryInstructions' => '',
        ];
    }

    private function orderPayload($order, $customer)
    {
        $deliveryAddress = new Address((int) $order->id_address_delivery);
        $invoiceNumber = (int) $order->invoice_number;
        if (
            !Validate::isLoadedObject($deliveryAddress) ||
            (int) $deliveryAddress->id_customer !== (int) $customer->id
        ) {
            throw new MithranAgroApiException('unavailable', 503);
        }

        $state = new OrderState((int) $order->current_state);
        if (!Validate::isLoadedObject($state)) {
            throw new MithranAgroApiException('unavailable', 503);
        }
        $languageId = (int) $this->context->language->id;
        $stateName = is_array($state->name)
            ? (string) ($state->name[$languageId] ?? '')
            : (string) $state->name;
        $status = $this->appOrderStatus($state, $stateName);

        $items = [];
        foreach ($order->getProducts() as $row) {
            $quantity = (int) ($row['product_quantity'] ?? 0);
            $unitPrice = (float) ($row['unit_price_tax_incl'] ?? 0);
            $lineTotal = (float) ($row['total_price_tax_incl'] ?? ($unitPrice * $quantity));
            $productId = (string) (int) ($row['product_id'] ?? 0);
            if ($quantity < 1 || $productId === '0') {
                continue;
            }
            $items[] = [
                'id' => (string) $row['id_order_detail'],
                'productId' => $productId,
                'variantId' => $this->variantIdentifier(
                    (int) $productId,
                    max(0, (int) ($row['product_attribute_id'] ?? 0))
                ),
                'name' => (string) ($row['product_name'] ?? ''),
                'image' => '',
                'sellerName' => 'Mithran Agro',
                'packLabel' => (string) ($row['product_reference'] ?? 'Unit'),
                'quantity' => $quantity,
                'price' => round($unitPrice, 2),
                'mrp' => round($unitPrice, 2),
                'lineTotal' => round($lineTotal, 2),
            ];
        }

        $subtotal = (float) $order->total_products_wt;
        $total = (float) $order->total_paid_tax_incl;
        $tax = max(0, $total - (float) $order->total_paid_tax_excl);
        $carrier = new Carrier((int) $order->id_carrier, $languageId);
        $carrierName = Validate::isLoadedObject($carrier) && is_array($carrier->name)
            ? (string) ($carrier->name[$languageId] ?? '')
            : '';
        $placedAt = (string) $order->date_add;
        $tracking = $this->orderHistoryPayload((int) $order->id, $languageId);

        return [
            'id' => (string) $order->id,
            'reference' => (string) $order->reference,
            'userId' => (string) $customer->id,
            'items' => $items,
            'status' => $status,
            'placedAt' => $placedAt,
            'scheduledSlot' => $carrierName !== '' ? 'Delivery via ' . $carrierName : 'Delivery via store carrier',
            'address' => $this->addressPayload($deliveryAddress, false),
            'paymentMethod' => (string) $order->payment,
            'paymentId' => 'Not applicable for Cash on Delivery',
            'paymentStatus' => $state->paid ? 'paid' : 'pending',
            'totals' => [
                'subtotal' => round($subtotal, 2),
                'mrpTotal' => round($subtotal, 2),
                'savings' => 0,
                'deliveryFee' => round((float) $order->total_shipping_tax_incl, 2),
                'handlingFee' => 0,
                'greenFee' => 0,
                'discount' => round((float) $order->total_discounts_tax_incl, 2),
                'tax' => round($tax, 2),
                'total' => round($total, 2),
            ],
            'invoiceNo' => $invoiceNumber > 0 ? (string) $invoiceNumber : 'Not issued',
            'tracking' => $tracking,
            'canCancel' => false,
            'canReturn' => false,
            'deliveryPartner' => $carrierName,
        ];
    }

    private function appOrderStatus($state, $stateName)
    {
        $name = strtolower($stateName);
        if (strpos($name, 'cancel') !== false || strpos($name, 'refund') !== false) {
            return 'cancelled';
        }
        if (strpos($name, 'deliver') !== false) {
            return 'delivered';
        }
        if ($state->shipped) {
            return 'out-for-delivery';
        }
        if (strpos($name, 'pack') !== false || strpos($name, 'prepar') !== false) {
            return 'packed';
        }
        if (strpos($name, 'await') !== false || strpos($name, 'pending') !== false) {
            return 'placed';
        }

        return 'confirmed';
    }

    private function createSession($customer)
    {
        $token = bin2hex(random_bytes(32));
        $expiresAt = date('Y-m-d H:i:s', time() + self::SESSION_DAYS * 86400);
        $inserted = Db::getInstance()->insert('mithranagro_session', [
            'id_customer' => (int) $customer->id,
            'password_fingerprint' => pSQL($this->customerPasswordFingerprint($customer)),
            'token_hash' => pSQL(hash('sha256', $token)),
            'expires_at' => pSQL($expiresAt),
            'revoked' => 0,
            'date_add' => date('Y-m-d H:i:s'),
        ]);
        if (!$inserted) {
            throw new MithranAgroApiException('unavailable', 503);
        }

        return $token;
    }

    private function authenticatedCustomer()
    {
        $token = $this->sessionToken();
        if ($token === null) {
            throw new MithranAgroApiException('unauthorized', 401);
        }
        $tokenHash = pSQL(hash('sha256', $token));
        $row = Db::getInstance()->getRow(
            'SELECT `id_customer`, `password_fingerprint` FROM `' . _DB_PREFIX_ . 'mithranagro_session`
             WHERE `token_hash` = \'' . $tokenHash . '\'
             AND `revoked` = 0 AND `expires_at` > NOW()'
        );
        if (!$row && Db::getInstance()->getNumberError() > 0) {
            throw new MithranAgroApiException('unavailable', 503);
        }
        if (!$row) {
            throw new MithranAgroApiException('unauthorized', 401);
        }
        $customer = new Customer((int) $row['id_customer']);
        if (
            !Validate::isLoadedObject($customer) ||
            !$customer->active ||
            $customer->deleted ||
            $customer->is_guest
        ) {
            throw new MithranAgroApiException('unauthorized', 401);
        }
        $fingerprint = (string) ($row['password_fingerprint'] ?? '');
        if (
            $fingerprint === '' ||
            !hash_equals($fingerprint, $this->customerPasswordFingerprint($customer))
        ) {
            throw new MithranAgroApiException('unauthorized', 401);
        }

        return $customer;
    }

    private function customerPasswordFingerprint($customer)
    {
        return hash_hmac('sha256', (string) $customer->passwd, _COOKIE_KEY_);
    }

    private function sessionToken()
    {
        $header = (string) ($_SERVER['HTTP_AUTHORIZATION'] ?? '');
        if ($header === '' && function_exists('getallheaders')) {
            $headers = getallheaders();
            $header = (string) ($headers['Authorization'] ?? $headers['authorization'] ?? '');
        }
        if (!preg_match('/^Bearer ([a-f0-9]{64,128})$/i', $header, $matches)) {
            return null;
        }

        return $matches[1];
    }

    private function enforceRateLimit($scope, $email, $limit)
    {
        $bucket = (int) floor(time() / self::RATE_BUCKET_SECONDS);
        $remoteAddress = (string) ($_SERVER['REMOTE_ADDR'] ?? '');
        $ip = filter_var($remoteAddress, FILTER_VALIDATE_IP) ? $remoteAddress : 'unknown';
        $subject = hash('sha256', strtolower($email) . '|' . $ip);
        $scopeSql = pSQL($scope);
        $subjectSql = pSQL($subject);
        $table = _DB_PREFIX_ . 'mithranagro_attempt';
        $query = 'INSERT INTO `' . $table . '` (`scope`, `subject_hash`, `bucket`, `attempts`)
                  VALUES (\'' . $scopeSql . '\', \'' . $subjectSql . '\', ' . $bucket . ', 1)
                  ON DUPLICATE KEY UPDATE `attempts` = `attempts` + 1';
        if (!Db::getInstance()->execute($query)) {
            throw new MithranAgroApiException('unavailable', 503);
        }
        $attemptValue = Db::getInstance()->getValue(
            'SELECT `attempts` FROM `' . $table . '`
             WHERE `scope` = \'' . $scopeSql . '\'
             AND `subject_hash` = \'' . $subjectSql . '\'
             AND `bucket` = ' . $bucket
        );
        if ($attemptValue === false || Db::getInstance()->getNumberError() > 0) {
            throw new MithranAgroApiException('unavailable', 503);
        }
        $attempts = (int) $attemptValue;
        if ($attempts > $limit) {
            throw new MithranAgroApiException('rate_limited', 429);
        }
        if (mt_rand(1, 100) === 1 && !Db::getInstance()->execute(
            'DELETE FROM `' . $table . '` WHERE `bucket` < ' . max(0, $bucket - 4)
        )) {
            PrestaShopLogger::addLog('Mithran Agro rate-limit cleanup failed.', 3);
        }
    }

    private function checkoutRequestHash($items, $addressId, $expectedTotal)
    {
        if (!is_array($items) || count($items) < 1 || count($items) > 50) {
            throw new MithranAgroApiException('invalid_input', 400);
        }

        $fingerprintItems = [];
        foreach ($items as $item) {
            if (!is_array($item)) {
                throw new MithranAgroApiException('invalid_input', 400);
            }
            $productId = $this->positiveId($item['productId'] ?? null);
            $quantity = $this->positiveId($item['quantity'] ?? null);
            $attributeId = array_key_exists('attributeId', $item)
                ? $this->nonNegativeId($item['attributeId'])
                : null;
            if (
                $productId === null ||
                $quantity === null ||
                $quantity > 10000 ||
                (array_key_exists('attributeId', $item) && $attributeId === null)
            ) {
                throw new MithranAgroApiException('invalid_input', 400);
            }
            $fingerprintItems[] = [
                'productId' => $productId,
                'attributeId' => $attributeId,
                'quantity' => $quantity,
            ];
        }
        usort($fingerprintItems, function ($left, $right) {
            return [$left['productId'], $left['attributeId'] ?? -1] <=>
                [$right['productId'], $right['attributeId'] ?? -1];
        });
        $encoded = json_encode([
            'addressId' => (int) $addressId,
            'expectedTotal' => round((float) $expectedTotal, 2),
            'items' => $fingerprintItems,
        ], JSON_UNESCAPED_SLASHES);
        if (!is_string($encoded)) {
            throw new MithranAgroApiException('invalid_input', 400);
        }

        return hash('sha256', $encoded);
    }

    private function claimIdempotency($customerId, $keyHash, $requestHash)
    {
        $table = _DB_PREFIX_ . 'mithranagro_idempotency';
        $claimToken = bin2hex(random_bytes(16));
        $inserted = Db::getInstance()->insert('mithranagro_idempotency', [
            'idempotency_key' => pSQL($keyHash),
            'id_customer' => (int) $customerId,
            'request_hash' => pSQL($requestHash),
            'claim_token' => pSQL($claimToken),
            'state' => 'processing',
            'id_cart' => 0,
            'id_order' => 0,
            'date_upd' => date('Y-m-d H:i:s'),
        ]);
        if ($inserted) {
            return ['order_id' => 0, 'id_cart' => 0, 'claim_token' => $claimToken];
        }

        $row = Db::getInstance()->getRow(
            'SELECT `state`, `request_hash`, `claim_token`, `id_cart`, `id_order`, `date_upd` FROM `' . $table . '`
             WHERE `id_customer` = ' . (int) $customerId . '
             AND `idempotency_key` = \'' . pSQL($keyHash) . '\''
        );
        if (!$row && Db::getInstance()->getNumberError() > 0) {
            throw new MithranAgroApiException('unavailable', 503);
        }
        if (!$row) {
            throw new MithranAgroApiException('unavailable', 503);
        }
        if (
            (string) $row['request_hash'] === '' ||
            !hash_equals((string) $row['request_hash'], $requestHash)
        ) {
            throw new MithranAgroApiException('duplicate_submission', 409);
        }
        $currentClaimToken = (string) $row['claim_token'];
        $orderId = (int) $row['id_order'];
        $cartId = (int) $row['id_cart'];
        if ($orderId < 1 && $cartId > 0) {
            $orderId = (int) Order::getIdByCartId($cartId);
            if ($orderId > 0) {
                $order = new Order($orderId);
                if (
                    !Validate::isLoadedObject($order) ||
                    (int) $order->id_customer !== (int) $customerId ||
                    !$this->completeIdempotency(
                        $customerId,
                        $keyHash,
                        $orderId,
                        $currentClaimToken
                    )
                ) {
                    throw new MithranAgroApiException('unavailable', 503);
                }
            }
        }
        if ($orderId > 0) {
            return [
                'order_id' => $orderId,
                'id_cart' => $cartId,
                'claim_token' => $currentClaimToken,
            ];
        }

        $state = (string) $row['state'];
        $oldClaimCanBeReplaced = $state === 'failed' && $cartId === 0;
        if ($state === 'processing' && $currentClaimToken !== '') {
            $staleBefore = date('Y-m-d H:i:s', time() - 600);
            $oldClaimCanBeReplaced = strtotime((string) $row['date_upd']) < strtotime($staleBefore);
        }
        if ($oldClaimCanBeReplaced && $currentClaimToken !== '') {
            $reclaimed = Db::getInstance()->execute(
                'UPDATE `' . $table . '`
                 SET `state` = \'processing\', `claim_token` = \'' . pSQL($claimToken) . '\',
                     `id_cart` = 0, `date_upd` = NOW()
                 WHERE `id_customer` = ' . (int) $customerId . '
                 AND `idempotency_key` = \'' . pSQL($keyHash) . '\'
                 AND `request_hash` = \'' . pSQL($requestHash) . '\'
                 AND `claim_token` = \'' . pSQL($currentClaimToken) . '\'
                 AND `id_order` = 0 AND `id_cart` = ' . $cartId . '
                 AND `state` = \'' . pSQL($state) . '\''
                 . ($state === 'processing'
                    ? ' AND `date_upd` < \'' . pSQL($staleBefore) . '\''
                    : '')
            );
            if (!$reclaimed) {
                throw new MithranAgroApiException('unavailable', 503);
            }
            $claimed = Db::getInstance()->getRow(
                'SELECT `state`, `claim_token` FROM `' . $table . '`
                 WHERE `id_customer` = ' . (int) $customerId . '
                 AND `idempotency_key` = \'' . pSQL($keyHash) . '\''
            );
            if (!$claimed && Db::getInstance()->getNumberError() > 0) {
                throw new MithranAgroApiException('unavailable', 503);
            }
            if ($claimed && (string) $claimed['claim_token'] === $claimToken) {
                return ['order_id' => 0, 'id_cart' => 0, 'claim_token' => $claimToken];
            }
        }

        throw new MithranAgroApiException('duplicate_submission', 409);
    }

    private function setIdempotencyCart($customerId, $keyHash, $cartId, $claimToken)
    {
        $table = _DB_PREFIX_ . 'mithranagro_idempotency';
        if (!Db::getInstance()->execute(
            'UPDATE `' . $table . '`
             SET `id_cart` = ' . (int) $cartId . ', `date_upd` = NOW()
             WHERE `id_customer` = ' . (int) $customerId . '
             AND `idempotency_key` = \'' . pSQL($keyHash) . '\'
             AND `claim_token` = \'' . pSQL($claimToken) . '\'
             AND `state` = \'processing\' AND `id_cart` = 0'
        )) {
            return false;
        }
        $row = Db::getInstance()->getRow(
            'SELECT `claim_token`, `state`, `id_cart` FROM `' . $table . '`
             WHERE `id_customer` = ' . (int) $customerId . '
             AND `idempotency_key` = \'' . pSQL($keyHash) . '\''
        );
        return $row &&
            (string) $row['claim_token'] === $claimToken &&
            (string) $row['state'] === 'processing' &&
            (int) $row['id_cart'] === (int) $cartId;
    }

    private function beginIdempotencyOrderCreation($customerId, $keyHash, $cartId, $claimToken)
    {
        $table = _DB_PREFIX_ . 'mithranagro_idempotency';
        if (!Db::getInstance()->execute(
            'UPDATE `' . $table . '`
             SET `state` = \'order_pending\', `date_upd` = NOW()
             WHERE `id_customer` = ' . (int) $customerId . '
             AND `idempotency_key` = \'' . pSQL($keyHash) . '\'
             AND `claim_token` = \'' . pSQL($claimToken) . '\'
             AND `state` = \'processing\' AND `id_cart` = ' . (int) $cartId . '
             AND `id_order` = 0'
        )) {
            return false;
        }
        $row = Db::getInstance()->getRow(
            'SELECT `claim_token`, `state`, `id_cart` FROM `' . $table . '`
             WHERE `id_customer` = ' . (int) $customerId . '
             AND `idempotency_key` = \'' . pSQL($keyHash) . '\''
        );
        return $row &&
            (string) $row['claim_token'] === $claimToken &&
            (string) $row['state'] === 'order_pending' &&
            (int) $row['id_cart'] === (int) $cartId;
    }

    private function completeIdempotency($customerId, $keyHash, $orderId, $claimToken)
    {
        $table = _DB_PREFIX_ . 'mithranagro_idempotency';
        if (!Db::getInstance()->execute(
            'UPDATE `' . $table . '`
             SET `state` = \'complete\', `id_order` = ' . (int) $orderId . ', `date_upd` = NOW()
             WHERE `id_customer` = ' . (int) $customerId . '
             AND `idempotency_key` = \'' . pSQL($keyHash) . '\'
             AND `claim_token` = \'' . pSQL($claimToken) . '\'
             AND `id_order` IN (0, ' . (int) $orderId . ')'
        )) {
            return false;
        }
        $row = Db::getInstance()->getRow(
            'SELECT `state`, `id_order`, `claim_token` FROM `' . $table . '`
             WHERE `id_customer` = ' . (int) $customerId . '
             AND `idempotency_key` = \'' . pSQL($keyHash) . '\''
        );
        return $row &&
            (string) $row['claim_token'] === $claimToken &&
            (string) $row['state'] === 'complete' &&
            (int) $row['id_order'] === (int) $orderId;
    }

    private function failIdempotency($customerId, $keyHash, $claimToken)
    {
        $table = _DB_PREFIX_ . 'mithranagro_idempotency';
        if (!Db::getInstance()->execute(
            'UPDATE `' . $table . '`
             SET `state` = \'failed\', `id_cart` = 0, `date_upd` = NOW()
             WHERE `id_customer` = ' . (int) $customerId . '
             AND `idempotency_key` = \'' . pSQL($keyHash) . '\'
             AND `claim_token` = \'' . pSQL($claimToken) . '\'
             AND `state` = \'processing\' AND `id_order` = 0'
        )) {
            return false;
        }
        $row = Db::getInstance()->getRow(
            'SELECT `state`, `id_cart`, `claim_token` FROM `' . $table . '`
             WHERE `id_customer` = ' . (int) $customerId . '
             AND `idempotency_key` = \'' . pSQL($keyHash) . '\''
        );
        return $row &&
            (string) $row['state'] === 'failed' &&
            (int) $row['id_cart'] === 0 &&
            (string) $row['claim_token'] === $claimToken;
    }

    private function setDefaultAddressId($customer, $addressId)
    {
        if (!Db::getInstance()->execute(
            'REPLACE INTO `' . _DB_PREFIX_ . 'mithranagro_address_preference`
             (`id_customer`, `id_address`) VALUES (' . (int) $customer->id . ', ' . (int) $addressId . ')'
        )) {
            throw new MithranAgroApiException('unavailable', 503);
        }
    }

    private function defaultAddressId($customer, array $addresses)
    {
        $stored = (int) Db::getInstance()->getValue(
            'SELECT `id_address` FROM `' . _DB_PREFIX_ . 'mithranagro_address_preference`
             WHERE `id_customer` = ' . (int) $customer->id
        );
        foreach ($addresses as $address) {
            if ((int) $address['id_address'] === $stored && empty($address['deleted'])) {
                return $stored;
            }
        }
        foreach ($addresses as $address) {
            if (empty($address['deleted'])) {
                return (int) $address['id_address'];
            }
        }

        return 0;
    }

    private function isDefaultAddress($customer, $addressId)
    {
        $rows = $this->customerAddressesRaw($customer);
        return $this->defaultAddressId($customer, $rows) === (int) $addressId;
    }

    private function normalizedEmail($value)
    {
        if (!is_string($value) || strlen($value) > 254) {
            return null;
        }
        $email = strtolower(trim($value));
        return Validate::isEmail($email) ? $email : null;
    }

    private function boundedText($value, $min, $max)
    {
        if (!is_string($value)) {
            return null;
        }
        $text = trim($value);
        $length = Tools::strlen($text);
        if ($length < $min || $length > $max || !Validate::isCleanHtml($text)) {
            return null;
        }

        return $text;
    }

    private function phone($value)
    {
        if (!is_string($value)) {
            return null;
        }
        $phone = trim($value);
        if (!preg_match('/^\+?[0-9][0-9 ()-]{7,17}$/', $phone)) {
            return null;
        }

        return $phone;
    }

    private function positiveId($value)
    {
        if (is_int($value) && $value > 0) {
            return $value;
        }
        if (is_string($value) && preg_match('/^[1-9]\d{0,9}$/', $value)) {
            return (int) $value;
        }
        return null;
    }

    private function nonNegativeId($value)
    {
        if (is_int($value) && $value >= 0) {
            return $value;
        }
        if (is_string($value) && preg_match('/^(0|[1-9]\d{0,9})$/', $value)) {
            return (int) $value;
        }
        return null;
    }
}
