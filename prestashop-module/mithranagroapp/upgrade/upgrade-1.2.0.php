<?php
if (!defined('_PS_VERSION_')) {
    exit;
}

function upgrade_module_1_2_0($module)
{
    $db = Db::getInstance();
    $sessionTable = _DB_PREFIX_ . 'mithranagro_session';
    $idempotencyTable = _DB_PREFIX_ . 'mithranagro_idempotency';

    $hasPasswordFingerprint = $db->getValue(
        'SHOW COLUMNS FROM `' . bqSQL($sessionTable) . '` LIKE \'password_fingerprint\''
    );
    if ($hasPasswordFingerprint === false && $db->getNumberError() > 0) {
        return false;
    }
    if (!$hasPasswordFingerprint) {
        if (!$db->execute(
            'ALTER TABLE `' . bqSQL($sessionTable) . '`
             ADD `password_fingerprint` CHAR(64) CHARACTER SET ascii NOT NULL DEFAULT \'\' AFTER `id_customer`'
        ) || !$db->execute(
            'UPDATE `' . bqSQL($sessionTable) . '` SET `revoked` = 1'
        )) {
            return false;
        }
    }

    $hasClaimToken = $db->getValue(
        'SHOW COLUMNS FROM `' . bqSQL($idempotencyTable) . '` LIKE \'claim_token\''
    );
    if ($hasClaimToken === false && $db->getNumberError() > 0) {
        return false;
    }
    if (!$hasClaimToken && !$db->execute(
        'ALTER TABLE `' . bqSQL($idempotencyTable) . '`
         ADD `claim_token` CHAR(32) CHARACTER SET ascii NOT NULL DEFAULT \'\' AFTER `request_hash`'
    )) {
        return false;
    }

    if (!$db->execute(
        'UPDATE `' . bqSQL($idempotencyTable) . '`
         SET `claim_token` = REPLACE(UUID(), \'-\', \'\'), `id_cart` = 0, `date_upd` = NOW()
         WHERE `state` = \'failed\' AND `claim_token` = \'\''
    )) {
        return false;
    }

    if (!$db->execute(
        'UPDATE `' . bqSQL($idempotencyTable) . '`
         SET `state` = \'order_pending\', `date_upd` = NOW()
         WHERE `state` = \'processing\' AND `claim_token` = \'\''
    )) {
        return false;
    }

    return $module->registerHook('actionPasswordRenew');
}
