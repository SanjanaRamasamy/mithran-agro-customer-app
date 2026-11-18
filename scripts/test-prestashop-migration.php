<?php
define('_PS_VERSION_', '9.2.1');
define('_DB_PREFIX_', 'ps_');

function pSQL($value)
{
    return addslashes($value);
}

function bqSQL($value)
{
    return str_replace('`', '\\`', $value);
}

class PrestaShopLogger
{
    public static $messages = [];

    public static function addLog($message, $severity)
    {
        self::$messages[] = [$message, $severity];
    }
}

class Db
{
    public static $instance;
    public $columns = [];
    public $sessions = [];
    public $idempotencyRecords = [];
    public $metadataFailure = null;
    public $alterFailure = null;
    public $sessionUpdateFailure = false;
    public $lastError = 0;
    public $queries = [];
    public $metadataCacheFlags = [];

    public static function getInstance()
    {
        return self::$instance;
    }

    public function getRow($sql, $use_cache = true)
    {
        $this->queries[] = $sql;
        $this->metadataCacheFlags[] = $use_cache;
        $this->lastError = 0;
        preg_match("/`TABLE_NAME` = '([^']+)'/", $sql, $tableMatch);
        preg_match("/`COLUMN_NAME` = '([^']+)'/", $sql, $columnMatch);
        $table = $tableMatch[1] ?? '';
        $column = $columnMatch[1] ?? '';

        if ($this->metadataFailure === $table . '.' . $column) {
            $this->lastError = 1142;

            return false;
        }

        return $this->columns[$table][$column] ?? false;
    }

    public function getNumberError()
    {
        return $this->lastError;
    }

    public function execute($sql)
    {
        $this->queries[] = $sql;
        $this->lastError = 0;
        if (preg_match(
            "/ALTER TABLE `([^`]+)`\s+ADD `([^`]+)` CHAR\((\d+)\)\s+CHARACTER SET ascii NOT NULL DEFAULT '' AFTER `([^`]+)`/s",
            $sql,
            $matches
        )) {
            $table = $matches[1];
            $column = $matches[2];
            if ($this->alterFailure === $table . '.' . $column) {
                $this->lastError = 1060;

                return false;
            }

            $this->columns[$table][$column] = self::definition((int) $matches[3]);

            return true;
        }

        if (preg_match(
            "/UPDATE `([^`]+)`\s+SET `revoked` = 1\s+WHERE `password_fingerprint` = ''/s",
            $sql,
            $matches
        )) {
            if ($this->sessionUpdateFailure) {
                $this->lastError = 1142;

                return false;
            }

            foreach ($this->sessions as &$session) {
                if ($session['password_fingerprint'] === '') {
                    $session['revoked'] = 1;
                }
            }
            unset($session);

            return true;
        }

        throw new RuntimeException('Unexpected SQL issued by migration: ' . $sql);
    }

    public static function definition($length)
    {
        return [
            'data_type' => 'char',
            'character_maximum_length' => $length,
            'character_set_name' => 'ascii',
            'is_nullable' => 'NO',
            'column_default' => '',
        ];
    }
}

class MockModule
{
    public $hookResult = true;
    public $registeredHooks = [];

    public function registerHook($hook)
    {
        $this->registeredHooks[] = $hook;

        return $this->hookResult;
    }
}

require_once __DIR__ . '/../prestashop-module/mithranagroapp/upgrade/upgrade-1.2.1.php';

function expect($condition, $message)
{
    if (!$condition) {
        throw new RuntimeException($message);
    }
}

function setupMigration($fingerprint = null, $claimToken = null)
{
    $db = new Db();
    Db::$instance = $db;
    $db->sessions = [
        ['id_session' => 1, 'password_fingerprint' => '', 'revoked' => 0],
        ['id_session' => 2, 'password_fingerprint' => str_repeat('a', 64), 'revoked' => 0],
    ];
    $db->idempotencyRecords = [
        [
            'idempotency_key' => str_repeat('b', 64),
            'id_customer' => 42,
            'request_hash' => str_repeat('c', 64),
            'claim_token' => str_repeat('d', 32),
            'state' => 'order_pending',
            'id_cart' => 123,
            'id_order' => 456,
            'date_upd' => '2026-11-18 12:00:00',
        ],
    ];
    if ($fingerprint !== null) {
        $db->columns['ps_mithranagro_session']['password_fingerprint'] = $fingerprint;
    }
    if ($claimToken !== null) {
        $db->columns['ps_mithranagro_idempotency']['claim_token'] = $claimToken;
    }

    return $db;
}

function runMigration($db, $hookResult = true)
{
    $module = new MockModule();
    $module->hookResult = $hookResult;
    $success = upgrade_module_1_2_1($module);

    return [$success, $module];
}

$expectedRecords = [
    [
        'idempotency_key' => str_repeat('b', 64),
        'id_customer' => 42,
        'request_hash' => str_repeat('c', 64),
        'claim_token' => str_repeat('d', 32),
        'state' => 'order_pending',
        'id_cart' => 123,
        'id_order' => 456,
        'date_upd' => '2026-11-18 12:00:00',
    ],
];

$db = setupMigration();
list($success) = runMigration($db);
expect($success, 'Neither-column scenario should succeed.');
expect(count($db->columns['ps_mithranagro_session']) === 1, 'Fingerprint should be added.');
expect(count($db->columns['ps_mithranagro_idempotency']) === 1, 'Claim token should be added.');
expect($db->sessions[0]['revoked'] === 1 && $db->sessions[1]['revoked'] === 0, 'Only empty fingerprints should be revoked.');
expect($db->idempotencyRecords === $expectedRecords, 'Idempotency records must be preserved.');
expect(!in_array(true, $db->metadataCacheFlags, true), 'Metadata queries must bypass the query cache.');

$db = setupMigration(Db::definition(64));
list($success) = runMigration($db);
expect($success, 'Existing fingerprint with missing claim token should succeed.');
expect(isset($db->columns['ps_mithranagro_idempotency']['claim_token']), 'Claim token should be added.');
expect($db->idempotencyRecords === $expectedRecords, 'Idempotency fields must remain unchanged.');

$db = setupMigration(null, Db::definition(32));
list($success) = runMigration($db);
expect($success, 'Existing claim token with missing fingerprint should succeed.');
expect(isset($db->columns['ps_mithranagro_session']['password_fingerprint']), 'Fingerprint should be added.');
expect($db->sessions[0]['revoked'] === 1 && $db->sessions[1]['revoked'] === 0, 'Pre-existing claim token must not skip empty-fingerprint session revocation.');
expect($db->idempotencyRecords === $expectedRecords, 'Idempotency fields must remain unchanged.');

$db = setupMigration(Db::definition(64), Db::definition(32));
list($success) = runMigration($db);
expect($success, 'Both compatible columns should be accepted.');
expect($db->sessions[0]['revoked'] === 1 && $db->sessions[1]['revoked'] === 0, 'Both-existing-columns scenario must revoke empty fingerprints.');
expect($db->idempotencyRecords === $expectedRecords, 'Both-columns scenario must preserve idempotency fields.');

$incompatible = Db::definition(64);
$incompatible['column_default'] = null;
$db = setupMigration($incompatible);
list($success) = runMigration($db);
expect(!$success, 'Incompatible existing column must fail.');
expect(!isset($db->columns['ps_mithranagro_idempotency']['claim_token']), 'Failure must not continue with later schema changes.');

$incompatible = Db::definition(16);
$db = setupMigration(Db::definition(64), $incompatible);
list($success) = runMigration($db);
expect(!$success, 'Incompatible claim token definition must fail.');
expect($db->idempotencyRecords === $expectedRecords, 'Incompatible claim token must not rewrite idempotency fields.');

$db = setupMigration();
$db->metadataFailure = 'ps_mithranagro_session.password_fingerprint';
list($success) = runMigration($db);
expect(!$success, 'Metadata query failure must fail.');
expect($db->columns === [], 'Metadata query failure must not add columns.');

$db = setupMigration();
$db->alterFailure = 'ps_mithranagro_idempotency.claim_token';
list($success) = runMigration($db);
expect(!$success, 'ALTER failure must fail.');
expect(isset($db->columns['ps_mithranagro_session']['password_fingerprint']), 'Earlier successful DDL may remain after a later failure.');
expect(!isset($db->columns['ps_mithranagro_idempotency']['claim_token']), 'Failed ALTER must leave the missing column absent.');

$db = setupMigration();
$db->alterFailure = 'ps_mithranagro_session.password_fingerprint';
list($success) = runMigration($db);
expect(!$success, 'Fingerprint ALTER failure must fail.');
expect($db->columns === [], 'Migration must stop after fingerprint ALTER failure.');

$db = setupMigration();
$db->sessionUpdateFailure = true;
list($success) = runMigration($db);
expect(!$success, 'Session UPDATE failure must fail.');
expect(!isset($db->columns['ps_mithranagro_idempotency']['claim_token']), 'Migration must stop after session UPDATE failure.');
expect($db->idempotencyRecords === $expectedRecords, 'Session UPDATE failure must preserve idempotency fields.');

$db = setupMigration();
list($success, $module) = runMigration($db, false);
expect(!$success, 'Hook registration failure must fail.');
expect($module->registeredHooks === ['actionPasswordRenew'], 'Migration must attempt to register the expected hook.');
expect($db->idempotencyRecords === $expectedRecords, 'Hook failure must preserve idempotency fields.');

echo "All mocked migration scenarios passed.\n";
