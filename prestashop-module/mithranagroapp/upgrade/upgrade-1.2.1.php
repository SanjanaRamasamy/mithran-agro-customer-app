<?php
if (!defined('_PS_VERSION_')) {
    exit;
}

function upgrade_module_1_2_1($module)
{
    $db = Db::getInstance();
    $sessionTable = _DB_PREFIX_ . 'mithranagro_session';
    $idempotencyTable = _DB_PREFIX_ . 'mithranagro_idempotency';

    $fail = function ($message) {
        PrestaShopLogger::addLog('Mithran Agro v1.2.1 migration failed: ' . $message, 3);

        return false;
    };

    $inspectColumn = function ($table, $column) use ($db) {
        $row = $db->getRow(
            'SELECT `DATA_TYPE` AS `data_type`,
                    `CHARACTER_MAXIMUM_LENGTH` AS `character_maximum_length`,
                    `CHARACTER_SET_NAME` AS `character_set_name`,
                    `IS_NULLABLE` AS `is_nullable`,
                    `COLUMN_DEFAULT` AS `column_default`
             FROM `information_schema`.`COLUMNS`
             WHERE `TABLE_SCHEMA` = DATABASE()
             AND `TABLE_NAME` = \'' . pSQL($table) . '\'
             AND `COLUMN_NAME` = \'' . pSQL($column) . '\'',
            false
        );

        if ($row === false && $db->getNumberError() > 0) {
            return ['status' => 'error'];
        }
        if (!$row) {
            return ['status' => 'missing'];
        }

        return ['status' => 'found', 'definition' => $row];
    };

    $matchesDefinition = function ($column, $length) {
        $definition = $column['definition'];

        return strtolower((string) ($definition['data_type'] ?? '')) === 'char'
            && (int) ($definition['character_maximum_length'] ?? 0) === $length
            && strtolower((string) ($definition['character_set_name'] ?? '')) === 'ascii'
            && (string) ($definition['is_nullable'] ?? '') === 'NO'
            && array_key_exists('column_default', $definition)
            && $definition['column_default'] === '';
    };

    $ensureColumn = function ($table, $column, $length, $after) use (
        $db,
        $inspectColumn,
        $matchesDefinition,
        $fail
    ) {
        $existing = $inspectColumn($table, $column);
        if ($existing['status'] === 'error') {
            return $fail('could not inspect ' . $table . '.' . $column);
        }
        if ($existing['status'] === 'found') {
            if (!$matchesDefinition($existing, $length)) {
                return $fail('incompatible definition for ' . $table . '.' . $column);
            }

            return true;
        }

        $altered = $db->execute(
            'ALTER TABLE `' . bqSQL($table) . '`
             ADD `' . bqSQL($column) . '` CHAR(' . (int) $length . ')
             CHARACTER SET ascii NOT NULL DEFAULT \'\' AFTER `' . bqSQL($after) . '`'
        );
        if (!$altered) {
            return $fail('could not add ' . $table . '.' . $column);
        }

        $added = $inspectColumn($table, $column);
        if ($added['status'] === 'error') {
            return $fail('could not inspect added column ' . $table . '.' . $column);
        }
        if ($added['status'] === 'missing') {
            return $fail('added column is still missing: ' . $table . '.' . $column);
        }
        if (!$matchesDefinition($added, $length)) {
            return $fail('could not verify added column ' . $table . '.' . $column);
        }

        return true;
    };

    if (!$ensureColumn($sessionTable, 'password_fingerprint', 64, 'id_customer')) {
        return false;
    }

    if (!$db->execute(
        'UPDATE `' . bqSQL($sessionTable) . '`
         SET `revoked` = 1
         WHERE `password_fingerprint` = \'\''
    )) {
        return $fail('could not revoke sessions with empty password fingerprints');
    }

    if (!$ensureColumn($idempotencyTable, 'claim_token', 32, 'request_hash')) {
        return false;
    }

    $passwordFingerprint = $inspectColumn($sessionTable, 'password_fingerprint');
    $claimToken = $inspectColumn($idempotencyTable, 'claim_token');
    if ($passwordFingerprint['status'] === 'error' || $claimToken['status'] === 'error') {
        return $fail('could not query the final schema');
    }
    if ($passwordFingerprint['status'] === 'missing' || $claimToken['status'] === 'missing') {
        return $fail('a required column is missing after migration');
    }
    if (
        !$matchesDefinition($passwordFingerprint, 64) ||
        !$matchesDefinition($claimToken, 32)
    ) {
        return $fail('a required column has an incompatible final definition');
    }

    if (!$module->registerHook('actionPasswordRenew')) {
        return $fail('could not register actionPasswordRenew');
    }

    return true;
}
