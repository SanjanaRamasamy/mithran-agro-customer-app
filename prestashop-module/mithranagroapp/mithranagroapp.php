<?php

if (!defined('_PS_VERSION_')) {
    exit;
}

class Mithranagroapp extends PaymentModule
{
    public function __construct()
    {
        $this->name = 'mithranagroapp';
        $this->tab = 'payments_gateways';
        $this->version = '1.3.0';
        $this->author = 'Mithran Agro';
        $this->need_instance = 0;
        $this->bootstrap = true;
        $this->ps_versions_compliancy = [
            'min' => '9.0.0',
            'max' => _PS_VERSION_,
        ];
        $this->displayName = 'Mithran Agro Customer App';
        $this->description = 'Secure customer and Cash on Delivery integration for the Mithran Agro Next.js app.';

        parent::__construct();
    }

    /**
     * Install the module, database tables, hooks and COD order state.
     */
    public function install()
    {
        $installed = parent::install()
            && $this->registerHook('actionPasswordRenew')
            && $this->installTables()
            && $this->installCodOrderState();

        if (!$installed) {
            return false;
        }

        if (Configuration::get('MITHRAN_COD_ENABLED') === false) {
            return Configuration::updateValue('MITHRAN_COD_ENABLED', false);
        }

        return true;
    }

    /**
     * Revoke customer sessions after a password reset.
     *
     * @param array $params
     */
    public function hookActionPasswordRenew($params)
    {
        $customer = $params['customer'] ?? null;

        if ($customer instanceof Customer && (int) $customer->id > 0) {
            if (!Db::getInstance()->update(
                'mithranagro_session',
                ['revoked' => 1],
                '`id_customer` = ' . (int) $customer->id
            )) {
                PrestaShopLogger::addLog(
                    'Mithran Agro could not revoke sessions after a password reset.',
                    3
                );
            }
        }
    }

    /**
     * Revoke sessions and remove module configuration during uninstall.
     */
    public function uninstall()
    {
        if (!Db::getInstance()->update(
            'mithranagro_session',
            ['revoked' => 1],
            '1 = 1'
        )) {
            return false;
        }

        return Configuration::deleteByName('MITHRAN_APP_SECRET_HASH')
            && Configuration::deleteByName('MITHRAN_COD_ENABLED')
            && parent::uninstall();
    }

    /**
     * Display and save Customer App integration settings.
     *
     * The shared secret is stored only as a SHA-256 hash.
     * COD remains disabled unless explicitly enabled by the administrator.
     */
    public function getContent()
    {
        $output = '';

        if (Tools::isSubmit('submitMithranAgroAppConfig')) {
            $secret = trim((string) Tools::getValue('MITHRAN_APP_SECRET'));

            if (strlen($secret) < 32) {
                $output .= $this->displayError(
                    $this->l(
                        'Enter a shared integration secret containing at least 32 characters.'
                    )
                );
            } else {
                $secretSaved = Configuration::updateValue(
                    'MITHRAN_APP_SECRET_HASH',
                    hash('sha256', $secret)
                );

                if (!$secretSaved) {
                    $output .= $this->displayError(
                        $this->l(
                            'Could not save the integration secret. Please try again.'
                        )
                    );
                } else {
                    $codSaved = Configuration::updateValue(
                        'MITHRAN_COD_ENABLED',
                        (bool) Tools::getValue('MITHRAN_COD_ENABLED')
                    );

                    if (!$codSaved) {
                        $output .= $this->displayError(
                            $this->l(
                                'The integration secret was saved, but the COD setting could not be saved. Please retry.'
                            )
                        );
                    } else {
                        $output .= $this->displayConfirmation(
                            $this->l(
                                'Integration settings saved. The secret itself is not stored in plain text.'
                            )
                        );
                    }
                }
            }
        }

        $isConfigured = (bool) Configuration::get(
            'MITHRAN_APP_SECRET_HASH'
        );

        $codEnabled = (bool) Configuration::get(
            'MITHRAN_COD_ENABLED'
        );

        $output .= '<div class="panel">';
        $output .= '<h3>' . $this->l('Customer App integration') . '</h3>';

        $output .= '<p>' . (
            $isConfigured
                ? $this->l('A shared secret is configured.')
                : $this->l('The API is disabled until a shared secret is configured.')
        ) . '</p>';

        $output .= '<p>' . (
            $codEnabled
                ? $this->l('Cash on Delivery order creation is enabled.')
                : $this->l('Cash on Delivery order creation is disabled until explicitly enabled.')
        ) . '</p>';

        $output .= '<form method="post">';

        $output .= '<div class="form-group">';
        $output .= '<label for="MITHRAN_APP_SECRET">';
        $output .= $this->l('Shared integration secret');
        $output .= '</label>';

        $output .= '<input'
            . ' class="form-control"'
            . ' type="password"'
            . ' id="MITHRAN_APP_SECRET"'
            . ' name="MITHRAN_APP_SECRET"'
            . ' minlength="32"'
            . ' autocomplete="new-password"'
            . ' required>';
        $output .= '</div>';

        $output .= '<div class="checkbox">';
        $output .= '<label>';

        $output .= '<input'
            . ' type="checkbox"'
            . ' name="MITHRAN_COD_ENABLED"'
            . ' value="1"'
            . ($codEnabled ? ' checked' : '')
            . '> ';

        $output .= $this->l(
            'Enable COD orders after verifying the store COD workflow, carrier, currency, taxes, and fulfillment process.'
        );

        $output .= '</label>';
        $output .= '</div>';

        $output .= '<button'
            . ' class="btn btn-primary"'
            . ' type="submit"'
            . ' name="submitMithranAgroAppConfig">';

        $output .= $this->l('Save integration settings');

        $output .= '</button>';

        $output .= '</form>';
        $output .= '</div>';

        if (Tools::isSubmit('submitMithranFarm')) {
            $output .= $this->processFarmSubmission();
        } elseif (Tools::isSubmit('deleteMithranFarm')) {
            $output .= $this->processFarmDeletion();
        }
        $output .= $this->renderFarmAdmin();

        return $output;
    }

    /**
     * Create the module database tables.
     */
    private function installTables()
    {
        $engine = _MYSQL_ENGINE_;
        $prefix = _DB_PREFIX_;

        $queries = [
            "CREATE TABLE IF NOT EXISTS `{$prefix}mithranagro_session` (
                `id_session` INT UNSIGNED NOT NULL AUTO_INCREMENT,
                `id_customer` INT UNSIGNED NOT NULL,
                `password_fingerprint` CHAR(64) CHARACTER SET ascii NOT NULL DEFAULT '',
                `token_hash` CHAR(64) CHARACTER SET ascii NOT NULL,
                `expires_at` DATETIME NOT NULL,
                `revoked` TINYINT(1) NOT NULL DEFAULT 0,
                `date_add` DATETIME NOT NULL,
                PRIMARY KEY (`id_session`),
                UNIQUE KEY `token_hash` (`token_hash`),
                KEY `customer_id` (`id_customer`),
                KEY `expires_at` (`expires_at`)
            ) ENGINE={$engine} DEFAULT CHARSET=utf8mb4",

            "CREATE TABLE IF NOT EXISTS `{$prefix}mithranagro_attempt` (
                `id_attempt` INT UNSIGNED NOT NULL AUTO_INCREMENT,
                `scope` VARCHAR(24) CHARACTER SET ascii NOT NULL,
                `subject_hash` CHAR(64) CHARACTER SET ascii NOT NULL,
                `bucket` INT UNSIGNED NOT NULL,
                `attempts` INT UNSIGNED NOT NULL DEFAULT 0,
                PRIMARY KEY (`id_attempt`),
                UNIQUE KEY `scope_subject_bucket` (`scope`, `subject_hash`, `bucket`)
            ) ENGINE={$engine} DEFAULT CHARSET=utf8mb4",

            "CREATE TABLE IF NOT EXISTS `{$prefix}mithranagro_idempotency` (
                `idempotency_key` CHAR(64) CHARACTER SET ascii NOT NULL,
                `id_customer` INT UNSIGNED NOT NULL,
                `request_hash` CHAR(64) CHARACTER SET ascii NOT NULL,
                `claim_token` CHAR(32) CHARACTER SET ascii NOT NULL DEFAULT '',
                `state` VARCHAR(16) CHARACTER SET ascii NOT NULL,
                `id_cart` INT UNSIGNED NOT NULL DEFAULT 0,
                `id_order` INT UNSIGNED NOT NULL DEFAULT 0,
                `date_upd` DATETIME NOT NULL,
                PRIMARY KEY (`id_customer`, `idempotency_key`),
                KEY `id_order` (`id_order`)
            ) ENGINE={$engine} DEFAULT CHARSET=utf8mb4",

            "CREATE TABLE IF NOT EXISTS `{$prefix}mithranagro_address_preference` (
                `id_customer` INT UNSIGNED NOT NULL,
                `id_address` INT UNSIGNED NOT NULL,
                PRIMARY KEY (`id_customer`)
            ) ENGINE={$engine} DEFAULT CHARSET=utf8mb4",

            "CREATE TABLE IF NOT EXISTS `{$prefix}mithranagro_customer_data` (
                `id_customer` INT UNSIGNED NOT NULL,
                `data_type` VARCHAR(16) CHARACTER SET ascii NOT NULL,
                `data_json` MEDIUMTEXT NOT NULL,
                `date_upd` DATETIME NOT NULL,
                PRIMARY KEY (`id_customer`, `data_type`)
            ) ENGINE={$engine} DEFAULT CHARSET=utf8mb4",
        ];

        foreach (array_merge($queries, self::farmTableQueries()) as $query) {
            if (!Db::getInstance()->execute($query)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Farm directory tables (added in 1.3.0). Shared by install() and
     * upgrade/upgrade-1.3.0.php; every statement is idempotent.
     *
     * A product belongs to at most one farm (id_product is the primary key of
     * the mapping table), so farm pages can never show another farm's product.
     *
     * @return string[]
     */
    public static function farmTableQueries()
    {
        $engine = _MYSQL_ENGINE_;
        $prefix = _DB_PREFIX_;

        return [
            "CREATE TABLE IF NOT EXISTS `{$prefix}mithranagro_farm` (
                `id_farm` INT UNSIGNED NOT NULL AUTO_INCREMENT,
                `slug` VARCHAR(128) CHARACTER SET ascii NOT NULL,
                `name` VARCHAR(128) NOT NULL,
                `owner_name` VARCHAR(128) NOT NULL DEFAULT '',
                `location` VARCHAR(160) NOT NULL DEFAULT '',
                `short_description` VARCHAR(400) NOT NULL DEFAULT '',
                `story` TEXT NOT NULL,
                `logo_url` VARCHAR(500) NOT NULL DEFAULT '',
                `cover_url` VARCHAR(500) NOT NULL DEFAULT '',
                `contact_email` VARCHAR(255) NOT NULL DEFAULT '',
                `contact_phone` VARCHAR(32) NOT NULL DEFAULT '',
                `show_contact` TINYINT(1) NOT NULL DEFAULT 0,
                `is_verified` TINYINT(1) NOT NULL DEFAULT 0,
                `verification_note` VARCHAR(255) NOT NULL DEFAULT '',
                `active` TINYINT(1) NOT NULL DEFAULT 0,
                `position` INT UNSIGNED NOT NULL DEFAULT 0,
                `date_add` DATETIME NOT NULL,
                `date_upd` DATETIME NOT NULL,
                PRIMARY KEY (`id_farm`),
                UNIQUE KEY `slug` (`slug`),
                KEY `active_position` (`active`, `position`)
            ) ENGINE={$engine} DEFAULT CHARSET=utf8mb4",

            "CREATE TABLE IF NOT EXISTS `{$prefix}mithranagro_farm_product` (
                `id_product` INT UNSIGNED NOT NULL,
                `id_farm` INT UNSIGNED NOT NULL,
                `date_add` DATETIME NOT NULL,
                PRIMARY KEY (`id_product`),
                KEY `id_farm` (`id_farm`)
            ) ENGINE={$engine} DEFAULT CHARSET=utf8mb4",
        ];
    }

    /* ------------------------------------------------------------------ */
    /*  Farm directory administration                                      */
    /* ------------------------------------------------------------------ */

    private function farmAdminUrl(array $params = [])
    {
        $url = AdminController::$currentIndex
            . '&configure=' . urlencode($this->name)
            . '&token=' . Tools::getAdminTokenLite('AdminModules');
        foreach ($params as $key => $value) {
            $url .= '&' . urlencode($key) . '=' . urlencode((string) $value);
        }

        return $url;
    }

    private function escape($value)
    {
        return htmlspecialchars((string) $value, ENT_QUOTES, 'UTF-8');
    }

    /**
     * Validate and persist a farm submitted from the configuration page.
     *
     * @return string HTML feedback
     */
    private function processFarmSubmission()
    {
        $db = Db::getInstance();
        $prefix = _DB_PREFIX_;
        $errors = [];
        $farmId = (int) Tools::getValue('id_farm');

        $text = function ($key, $max) {
            return trim(strip_tags((string) Tools::getValue($key)));
        };
        $name = $text('farm_name', 128);
        $slugInput = trim((string) Tools::getValue('farm_slug'));
        $slug = Tools::str2url($slugInput !== '' ? $slugInput : $name);
        $ownerName = $text('farm_owner_name', 128);
        $location = $text('farm_location', 160);
        $shortDescription = $text('farm_short_description', 400);
        $story = $text('farm_story', 5000);
        $logoUrl = trim((string) Tools::getValue('farm_logo_url'));
        $coverUrl = trim((string) Tools::getValue('farm_cover_url'));
        $contactEmail = trim((string) Tools::getValue('farm_contact_email'));
        $contactPhone = trim((string) Tools::getValue('farm_contact_phone'));
        $showContact = (bool) Tools::getValue('farm_show_contact');
        $isVerified = (bool) Tools::getValue('farm_is_verified');
        $verificationNote = $text('farm_verification_note', 255);
        $active = (bool) Tools::getValue('farm_active');
        $position = max(0, (int) Tools::getValue('farm_position'));
        $productInput = (string) Tools::getValue('farm_product_ids');

        if (Tools::strlen($name) < 2 || Tools::strlen($name) > 128 || !Validate::isGenericName($name)) {
            $errors[] = $this->l('Farm name must be 2–128 characters without special markup.');
        }
        if ($slug === '' || Tools::strlen($slug) > 128 || !Validate::isLinkRewrite($slug)) {
            $errors[] = $this->l('URL slug may only contain lowercase letters, numbers and hyphens.');
        }
        foreach ([
            [$ownerName, 128, $this->l('Owner name')],
            [$location, 160, $this->l('Location')],
            [$shortDescription, 400, $this->l('Short description')],
            [$story, 5000, $this->l('Farm story')],
            [$verificationNote, 255, $this->l('Verification record')],
        ] as [$value, $max, $label]) {
            if (Tools::strlen($value) > $max || !Validate::isCleanHtml($value)) {
                $errors[] = sprintf($this->l('%s is too long or contains unsupported content.'), $label);
            }
        }
        foreach ([[$logoUrl, $this->l('Logo URL')], [$coverUrl, $this->l('Cover image URL')]] as [$url, $label]) {
            if ($url !== '' && (Tools::strlen($url) > 500 || strpos($url, 'https://') !== 0 || !Validate::isAbsoluteUrl($url))) {
                $errors[] = sprintf($this->l('%s must be an https:// address.'), $label);
            }
        }
        if ($contactEmail !== '' && !Validate::isEmail($contactEmail)) {
            $errors[] = $this->l('Contact email is not valid.');
        }
        if ($contactPhone !== '' && (!Validate::isPhoneNumber($contactPhone) || Tools::strlen($contactPhone) > 32)) {
            $errors[] = $this->l('Contact phone is not valid.');
        }
        if ($showContact && $contactEmail === '' && $contactPhone === '') {
            $errors[] = $this->l('Add a contact email or phone before publishing contact details.');
        }
        if ($isVerified && $verificationNote === '') {
            $errors[] = $this->l('Record what was verified (e.g. certificate number and date) before marking a farm as verified.');
        }

        $productIds = [];
        foreach (preg_split('/[\s,]+/', $productInput, -1, PREG_SPLIT_NO_EMPTY) as $token) {
            if (!ctype_digit($token) || (int) $token < 1) {
                $errors[] = sprintf($this->l('"%s" is not a valid product ID.'), $this->escape($token));
                continue;
            }
            $productIds[(int) $token] = (int) $token;
        }
        if (count($productIds) > 2000) {
            $errors[] = $this->l('Too many products in one farm.');
        }
        foreach ($productIds as $productId) {
            if (!(int) $db->getValue('SELECT `id_product` FROM `' . $prefix . 'product` WHERE `id_product` = ' . (int) $productId)) {
                $errors[] = sprintf($this->l('Product #%d does not exist.'), $productId);
                continue;
            }
            $owner = (int) $db->getValue(
                'SELECT `id_farm` FROM `' . $prefix . 'mithranagro_farm_product` WHERE `id_product` = ' . (int) $productId
            );
            if ($owner > 0 && $owner !== $farmId) {
                $errors[] = sprintf($this->l('Product #%1$d is already assigned to farm #%2$d. Remove it there first.'), $productId, $owner);
            }
        }

        $slugOwner = (int) $db->getValue(
            'SELECT `id_farm` FROM `' . $prefix . 'mithranagro_farm` WHERE `slug` = \'' . pSQL($slug) . '\''
        );
        if ($slugOwner > 0 && $slugOwner !== $farmId) {
            $errors[] = $this->l('Another farm already uses this URL slug.');
        }
        if ($farmId > 0 && !(int) $db->getValue('SELECT `id_farm` FROM `' . $prefix . 'mithranagro_farm` WHERE `id_farm` = ' . $farmId)) {
            $errors[] = $this->l('The farm being edited no longer exists.');
        }

        if ($errors) {
            return $this->displayError(implode('<br>', array_map([$this, 'escape'], $errors)));
        }

        $now = date('Y-m-d H:i:s');
        $data = [
            'slug' => pSQL($slug),
            'name' => pSQL($name),
            'owner_name' => pSQL($ownerName),
            'location' => pSQL($location),
            'short_description' => pSQL($shortDescription),
            'story' => pSQL($story),
            'logo_url' => pSQL($logoUrl),
            'cover_url' => pSQL($coverUrl),
            'contact_email' => pSQL($contactEmail),
            'contact_phone' => pSQL($contactPhone),
            'show_contact' => (int) $showContact,
            'is_verified' => (int) $isVerified,
            'verification_note' => pSQL($verificationNote),
            'active' => (int) $active,
            'position' => $position,
            'date_upd' => $now,
        ];

        $db->execute('START TRANSACTION');
        try {
            if ($farmId > 0) {
                $saved = $db->update('mithranagro_farm', $data, '`id_farm` = ' . $farmId);
            } else {
                $data['date_add'] = $now;
                $saved = $db->insert('mithranagro_farm', $data);
                $farmId = (int) $db->Insert_ID();
            }
            if (!$saved || $farmId < 1) {
                throw new Exception('farm_save');
            }
            if (!$db->delete('mithranagro_farm_product', '`id_farm` = ' . $farmId)) {
                throw new Exception('farm_products_clear');
            }
            foreach ($productIds as $productId) {
                if (!$db->insert('mithranagro_farm_product', [
                    'id_product' => (int) $productId,
                    'id_farm' => $farmId,
                    'date_add' => $now,
                ])) {
                    throw new Exception('farm_product_insert');
                }
            }
            $db->execute('COMMIT');
        } catch (Exception $error) {
            $db->execute('ROLLBACK');
            PrestaShopLogger::addLog('Mithran Agro could not save a farm profile.', 3);

            return $this->displayError($this->l('The farm could not be saved. No changes were applied.'));
        }

        return $this->displayConfirmation($this->l('Farm saved.'));
    }

    private function processFarmDeletion()
    {
        $farmId = (int) Tools::getValue('id_farm');
        if ($farmId < 1) {
            return $this->displayError($this->l('Invalid farm.'));
        }
        $db = Db::getInstance();
        $db->execute('START TRANSACTION');
        if (
            $db->delete('mithranagro_farm_product', '`id_farm` = ' . $farmId)
            && $db->delete('mithranagro_farm', '`id_farm` = ' . $farmId)
        ) {
            $db->execute('COMMIT');

            return $this->displayConfirmation($this->l('Farm deleted. Its products are no longer linked to any farm.'));
        }
        $db->execute('ROLLBACK');

        return $this->displayError($this->l('The farm could not be deleted.'));
    }

    private function renderFarmAdmin()
    {
        $db = Db::getInstance();
        $prefix = _DB_PREFIX_;
        $farms = $db->executeS('SELECT * FROM `' . $prefix . 'mithranagro_farm` ORDER BY `position` ASC, `name` ASC');
        if ($farms === false) {
            return $this->displayError($this->l('Farm tables are missing. Upgrade the module to 1.3.0.'));
        }
        $counts = [];
        foreach ((array) $db->executeS('SELECT `id_farm`, COUNT(*) AS c FROM `' . $prefix . 'mithranagro_farm_product` GROUP BY `id_farm`') as $row) {
            $counts[(int) $row['id_farm']] = (int) $row['c'];
        }

        $editId = (int) Tools::getValue('editFarm');
        $editing = [];
        $editingProducts = '';
        if ($editId > 0) {
            $editing = $db->getRow('SELECT * FROM `' . $prefix . 'mithranagro_farm` WHERE `id_farm` = ' . $editId) ?: [];
            $ids = $db->executeS('SELECT `id_product` FROM `' . $prefix . 'mithranagro_farm_product` WHERE `id_farm` = ' . $editId . ' ORDER BY `id_product`');
            $editingProducts = implode(', ', array_map(function ($r) { return (int) $r['id_product']; }, (array) $ids));
        }
        // Re-populate the form with submitted values after a validation error.
        $value = function ($postKey, $column) use ($editing) {
            if (Tools::isSubmit('submitMithranFarm')) {
                return $this->escape(Tools::getValue($postKey));
            }

            return $this->escape($editing[$column] ?? '');
        };
        $checked = function ($postKey, $column) use ($editing) {
            if (Tools::isSubmit('submitMithranFarm')) {
                return Tools::getValue($postKey) ? ' checked' : '';
            }

            return !empty($editing[$column]) ? ' checked' : '';
        };

        $html = '<div class="panel"><h3>' . $this->l('Farms & sellers') . '</h3>';
        $html .= '<p>' . $this->l('Farms published here appear on the Customer App "Our Farms" pages. Each product can belong to one farm. Only active PrestaShop products are shown to customers.') . '</p>';
        $html .= '<table class="table"><thead><tr><th>ID</th><th>' . $this->l('Name') . '</th><th>' . $this->l('Slug') . '</th><th>' . $this->l('Location') . '</th><th>' . $this->l('Products') . '</th><th>' . $this->l('Verified') . '</th><th>' . $this->l('Published') . '</th><th></th></tr></thead><tbody>';
        if (!$farms) {
            $html .= '<tr><td colspan="8">' . $this->l('No farms yet. Add the first farm below.') . '</td></tr>';
        }
        foreach ($farms as $farm) {
            $id = (int) $farm['id_farm'];
            $html .= '<tr><td>' . $id . '</td><td>' . $this->escape($farm['name']) . '</td><td>' . $this->escape($farm['slug'])
                . '</td><td>' . $this->escape($farm['location']) . '</td><td>' . ($counts[$id] ?? 0)
                . '</td><td>' . ((int) $farm['is_verified'] ? $this->l('Yes') : $this->l('No'))
                . '</td><td>' . ((int) $farm['active'] ? $this->l('Yes') : $this->l('No')) . '</td><td>'
                . '<a class="btn btn-default btn-sm" href="' . $this->escape($this->farmAdminUrl(['editFarm' => $id])) . '">' . $this->l('Edit') . '</a> '
                . '<form method="post" action="' . $this->escape($this->farmAdminUrl()) . '" style="display:inline" onsubmit="return confirm(\'' . $this->escape($this->l('Delete this farm? Products stay in the catalogue.')) . '\');">'
                . '<input type="hidden" name="id_farm" value="' . $id . '"><button class="btn btn-danger btn-sm" name="deleteMithranFarm" type="submit">' . $this->l('Delete') . '</button></form>'
                . '</td></tr>';
        }
        $html .= '</tbody></table></div>';

        $html .= '<div class="panel"><h3>' . ($editing ? sprintf($this->l('Edit farm #%d'), $editId) : $this->l('Add a farm')) . '</h3>';
        $html .= '<form method="post" action="' . $this->escape($this->farmAdminUrl($editing ? ['editFarm' => $editId] : [])) . '">';
        $html .= '<input type="hidden" name="id_farm" value="' . ($editing ? $editId : 0) . '">';
        $field = function ($name, $label, $val, $type = 'text', $help = '') {
            return '<div class="form-group"><label for="' . $name . '">' . $this->escape($label) . '</label>'
                . '<input class="form-control" type="' . $type . '" id="' . $name . '" name="' . $name . '" value="' . $val . '">'
                . ($help ? '<p class="help-block">' . $this->escape($help) . '</p>' : '') . '</div>';
        };
        $html .= $field('farm_name', $this->l('Farm name *'), $value('farm_name', 'name'));
        $html .= $field('farm_slug', $this->l('URL slug'), $value('farm_slug', 'slug'), 'text', $this->l('Leave empty to generate from the name. Used in /farms/[slug].'));
        $html .= $field('farm_owner_name', $this->l('Owner / grower name'), $value('farm_owner_name', 'owner_name'));
        $html .= $field('farm_location', $this->l('Location (village, district, state)'), $value('farm_location', 'location'));
        $html .= $field('farm_short_description', $this->l('Short description (max 400)'), $value('farm_short_description', 'short_description'));
        $html .= '<div class="form-group"><label for="farm_story">' . $this->l('Farm story') . '</label><textarea class="form-control" rows="5" id="farm_story" name="farm_story">' . $value('farm_story', 'story') . '</textarea></div>';
        $html .= $field('farm_logo_url', $this->l('Logo / profile image URL (https)'), $value('farm_logo_url', 'logo_url'), 'url');
        $html .= $field('farm_cover_url', $this->l('Cover image URL (https)'), $value('farm_cover_url', 'cover_url'), 'url');
        $html .= $field('farm_product_ids', $this->l('Product IDs'), Tools::isSubmit('submitMithranFarm') ? $this->escape(Tools::getValue('farm_product_ids')) : $this->escape($editingProducts), 'text', $this->l('Comma-separated PrestaShop product IDs grown/sold by this farm, e.g. 20, 21, 34.'));
        $html .= $field('farm_contact_email', $this->l('Contact email'), $value('farm_contact_email', 'contact_email'), 'email');
        $html .= $field('farm_contact_phone', $this->l('Contact phone'), $value('farm_contact_phone', 'contact_phone'));
        $html .= '<div class="checkbox"><label><input type="checkbox" name="farm_show_contact" value="1"' . $checked('farm_show_contact', 'show_contact') . '> ' . $this->l('Show contact details publicly (only with the farm\'s consent)') . '</label></div>';
        $html .= '<div class="checkbox"><label><input type="checkbox" name="farm_is_verified" value="1"' . $checked('farm_is_verified', 'is_verified') . '> ' . $this->l('Verified farm') . '</label></div>';
        $html .= $field('farm_verification_note', $this->l('Verification record (required when verified)'), $value('farm_verification_note', 'verification_note'), 'text', $this->l('e.g. "NPOP certificate ORG/123 checked 2026-11-01". Shown to customers.'));
        $html .= $field('farm_position', $this->l('Sort position'), $value('farm_position', 'position') ?: '0', 'number');
        $html .= '<div class="checkbox"><label><input type="checkbox" name="farm_active" value="1"' . $checked('farm_active', 'active') . '> ' . $this->l('Published on the Customer App') . '</label></div>';
        $html .= '<button class="btn btn-primary" type="submit" name="submitMithranFarm">' . $this->l('Save farm') . '</button>';
        if ($editing) {
            $html .= ' <a class="btn btn-default" href="' . $this->escape($this->farmAdminUrl()) . '">' . $this->l('Cancel') . '</a>';
        }
        $html .= '</form></div>';

        return $html;
    }

    /**
     * Install the custom unpaid COD order state.
     */
    private function installCodOrderState()
    {
        $existingId = (int) Configuration::get(
            'MITHRAN_COD_ORDER_STATE'
        );

        if (
            $existingId > 0
            && Validate::isLoadedObject(new OrderState($existingId))
        ) {
            return true;
        }

        $state = new OrderState();

        $state->name = [];

        foreach (Language::getLanguages(false) as $language) {
            $state->name[(int) $language['id_lang']] =
                'Awaiting Cash on Delivery';
        }

        $state->send_email = false;
        $state->invoice = false;
        $state->paid = false;
        $state->logable = false;
        $state->shipped = false;
        $state->delivery = false;
        $state->hidden = false;
        $state->color = '#4169E1';
        $state->module_name = $this->name;

        if (!$state->add()) {
            return false;
        }

        return Configuration::updateValue(
            'MITHRAN_COD_ORDER_STATE',
            (int) $state->id
        );
    }
}
