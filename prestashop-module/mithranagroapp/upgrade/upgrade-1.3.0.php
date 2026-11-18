<?php
/**
 * 1.3.0 — farm directory.
 *
 * Adds `mithranagro_farm` and `mithranagro_farm_product`. Both statements use
 * CREATE TABLE IF NOT EXISTS, so re-running the upgrade is safe and existing
 * customer, session, idempotency and order data are untouched.
 *
 * Rollback: the tables are additive. Disabling or downgrading the module leaves
 * them in place; they can be dropped manually after a backup if required.
 */
if (!defined('_PS_VERSION_')) {
    exit;
}

function upgrade_module_1_3_0($module)
{
    $db = Db::getInstance();
    foreach (Mithranagroapp::farmTableQueries() as $query) {
        if (!$db->execute($query)) {
            PrestaShopLogger::addLog('Mithran Agro 1.3.0 upgrade could not create farm tables.', 3);

            return false;
        }
    }

    return true;
}
