"use strict";
process.env['NODE_ENV'] = 'test';
process.env['JWT_SECRET'] = 'clave-secreta-test-minimo-32-caracteres!!';
process.env['JWT_REFRESH_SECRET'] = 'clave-refresh-test-minimo-32-caracteres!';
process.env['JWT_EXPIRES_IN'] = '15m';
process.env['JWT_REFRESH_EXPIRES_IN'] = '7d';
process.env['DATABASE_URL'] = 'mysql://test:test@localhost:3306/test_restaurante';
//# sourceMappingURL=setup.js.map