<?php
if (!defined('_PS_VERSION_')) {
    exit;
}

require_once _PS_MODULE_DIR_ . 'mithranagroapp/classes/HeadlessCustomerApi.php';

class MithranagroappApiModuleFrontController extends ModuleFrontController
{
    public $ssl = true;
    public $ajax = true;
    public $display_header = false;
    public $display_footer = false;

    public function postProcess()
    {
        header('Content-Type: application/json; charset=utf-8');
        header('Cache-Control: no-store, private');
        header('X-Content-Type-Options: nosniff');

        if (Tools::strtoupper($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
            $this->sendResponse(405, ['success' => false, 'code' => 'invalid_input']);
        }
        if (!Tools::usingSecureMode()) {
            $this->sendResponse(400, ['success' => false, 'code' => 'configuration']);
        }

        $rawBody = file_get_contents('php://input');
        if (!is_string($rawBody) || strlen($rawBody) > 65536) {
            $this->sendResponse(400, ['success' => false, 'code' => 'invalid_input']);
        }
        $body = json_decode($rawBody, true);
        if (!is_array($body)) {
            $this->sendResponse(400, ['success' => false, 'code' => 'invalid_input']);
        }

        try {
            $api = new HeadlessCustomerApi($this->module, $this->context);
            $result = $api->dispatch((string) Tools::getValue('action'), $body);
            $this->sendResponse(200, $result);
        } catch (MithranAgroApiException $error) {
            $this->sendResponse($error->getHttpStatus(), [
                'success' => false,
                'code' => $error->getApiCode(),
            ]);
        } catch (Throwable $error) {
            $safeAction = preg_replace('/[^a-zA-Z0-9:_-]/', '', (string) Tools::getValue('action'));
            PrestaShopLogger::addLog(
                sprintf(
                    'Mithran Agro customer API internal error [action=%s, exception=%s].',
                    $safeAction ?: 'unknown',
                    get_class($error)
                ),
                3
            );
            $this->sendResponse(500, ['success' => false, 'code' => 'unavailable']);
        }
    }

    private function sendResponse($status, array $payload)
    {
        http_response_code((int) $status);
        echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE);
        exit;
    }
}
