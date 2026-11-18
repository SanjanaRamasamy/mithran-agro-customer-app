<?php
if (!defined('_PS_VERSION_')) {
    exit;
}

function upgrade_module_1_1_0($module)
{
    $engine = _MYSQL_ENGINE_;
    $table = _DB_PREFIX_ . 'mithranagro_customer_data';
    $idempotencyTable = _DB_PREFIX_ . 'mithranagro_idempotency';

    $hasRequestHash = Db::getInstance()->getValue(
        'SHOW COLUMNS FROM `' . bqSQL($idempotencyTable) . '` LIKE \'request_hash\''
    );
    if (!$hasRequestHash && !Db::getInstance()->execute(
        'ALTER TABLE `' . bqSQL($idempotencyTable) . '`
         ADD `request_hash` CHAR(64) CHARACTER SET ascii NOT NULL DEFAULT \'\' AFTER `id_customer`'
    )) {
        return false;
    }

    return Db::getInstance()->execute(
        "CREATE TABLE IF NOT EXISTS `{$table}` (
            `id_customer` INT UNSIGNED NOT NULL,
            `data_type` VARCHAR(16) CHARACTER SET ascii NOT NULL,
            `data_json` MEDIUMTEXT NOT NULL,
            `date_upd` DATETIME NOT NULL,
            PRIMARY KEY (`id_customer`, `data_type`)
        ) ENGINE={$engine} DEFAULT CHARSET=utf8mb4"
    ) && $module->registerHook('actionPasswordRenew');
}
