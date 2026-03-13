/**
 * Se ejecuta ANTES de cada archivo de test (setupFiles en vitest.config.ts).
 * Establece variables de entorno para que servidor.config.ts pueda importarse
 * sin fallar por variables "requeridas" ausentes.
 *
 * NO cargamos dotenv aquí — así evitamos que los valores reales de .env
 * interfieran con los tests.
 */

process.env['NODE_ENV'] = 'test';
process.env['JWT_SECRET'] = 'clave-secreta-test-minimo-32-caracteres!!';
process.env['JWT_REFRESH_SECRET'] = 'clave-refresh-test-minimo-32-caracteres!';
process.env['JWT_EXPIRES_IN'] = '15m';
process.env['JWT_REFRESH_EXPIRES_IN'] = '7d';

// DATABASE_URL es requerida por servidor.config — valor falso está bien
// porque en tests la BD se mockea y nunca se usa para conectar
process.env['DATABASE_URL'] = 'mysql://test:test@localhost:3306/test_restaurante';
