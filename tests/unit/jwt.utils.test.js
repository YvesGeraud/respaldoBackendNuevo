'use strict';
var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        var desc = Object.getOwnPropertyDescriptor(m, k);
        if (!desc || ('get' in desc ? !m.__esModule : desc.writable || desc.configurable)) {
          desc = {
            enumerable: true,
            get: function () {
              return m[k];
            },
          };
        }
        Object.defineProperty(o, k2, desc);
      }
    : function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        o[k2] = m[k];
      });
var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? function (o, v) {
        Object.defineProperty(o, 'default', { enumerable: true, value: v });
      }
    : function (o, v) {
        o['default'] = v;
      });
var __importStar =
  (this && this.__importStar) ||
  (function () {
    var ownKeys = function (o) {
      ownKeys =
        Object.getOwnPropertyNames ||
        function (o) {
          var ar = [];
          for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
          return ar;
        };
      return ownKeys(o);
    };
    return function (mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null)
        for (var k = ownKeys(mod), i = 0; i < k.length; i++)
          if (k[i] !== 'default') __createBinding(result, mod, k[i]);
      __setModuleDefault(result, mod);
      return result;
    };
  })();
Object.defineProperty(exports, '__esModule', { value: true });
const vitest_1 = require('vitest');
const jsonwebtoken_1 = __importStar(require('jsonwebtoken'));
const jwt_utils_1 = require('@/utils/jwt.utils');
const PAYLOAD = {
  id_ct_usuario: 42,
  usuario: 'docente01',
  email: 'docente@escuela.edu.mx',
  rol: 'DOCENTE',
};
(0, vitest_1.describe)('generarAccessToken', () => {
  (0, vitest_1.it)('devuelve un string con formato JWT (header.payload.firma)', () => {
    const token = (0, jwt_utils_1.generarAccessToken)(PAYLOAD);
    (0, vitest_1.expect)(typeof token).toBe('string');
    (0, vitest_1.expect)(token.split('.')).toHaveLength(3);
  });
  (0, vitest_1.it)('el token contiene el payload correcto al verificarlo', () => {
    const token = (0, jwt_utils_1.generarAccessToken)(PAYLOAD);
    const decoded = (0, jwt_utils_1.verificarAccessToken)(token);
    (0, vitest_1.expect)(decoded.id_ct_usuario).toBe(PAYLOAD.id_ct_usuario);
    (0, vitest_1.expect)(decoded.usuario).toBe(PAYLOAD.usuario);
    (0, vitest_1.expect)(decoded.rol).toBe(PAYLOAD.rol);
  });
  (0, vitest_1.it)(
    'dos tokens generados en el mismo ms tienen el mismo payload pero pueden diferir',
    () => {
      const t1 = (0, jwt_utils_1.generarAccessToken)(PAYLOAD);
      const t2 = (0, jwt_utils_1.generarAccessToken)(PAYLOAD);
      const d1 = (0, jwt_utils_1.verificarAccessToken)(t1);
      const d2 = (0, jwt_utils_1.verificarAccessToken)(t2);
      (0, vitest_1.expect)(d1.id_ct_usuario).toBe(d2.id_ct_usuario);
    },
  );
});
(0, vitest_1.describe)('verificarAccessToken', () => {
  (0, vitest_1.it)('lanza JsonWebTokenError con un string que no es JWT', () => {
    (0, vitest_1.expect)(() => (0, jwt_utils_1.verificarAccessToken)('esto.no.es.un.jwt')).toThrow(
      jsonwebtoken_1.JsonWebTokenError,
    );
  });
  (0, vitest_1.it)('lanza JsonWebTokenError con firma de un secreto diferente', () => {
    const tokenFalso = jsonwebtoken_1.default.sign(PAYLOAD, 'secreto-totalmente-diferente');
    (0, vitest_1.expect)(() => (0, jwt_utils_1.verificarAccessToken)(tokenFalso)).toThrow(
      jsonwebtoken_1.JsonWebTokenError,
    );
  });
  (0, vitest_1.it)('lanza TokenExpiredError con un token ya expirado', () => {
    const tokenExpirado = jsonwebtoken_1.default.sign(PAYLOAD, process.env['JWT_SECRET'], {
      expiresIn: 0,
    });
    (0, vitest_1.expect)(() => (0, jwt_utils_1.verificarAccessToken)(tokenExpirado)).toThrow(
      jsonwebtoken_1.TokenExpiredError,
    );
  });
});
(0, vitest_1.describe)('generarRefreshToken + verificarRefreshToken', () => {
  (0, vitest_1.it)('el refresh token es válido y contiene el payload', () => {
    const token = (0, jwt_utils_1.generarRefreshToken)(PAYLOAD);
    const decoded = (0, jwt_utils_1.verificarRefreshToken)(token);
    (0, vitest_1.expect)(decoded.id_ct_usuario).toBe(PAYLOAD.id_ct_usuario);
    (0, vitest_1.expect)(decoded.usuario).toBe(PAYLOAD.usuario);
  });
  (0, vitest_1.it)('el refresh token NO puede verificarse con el access secret', () => {
    const refresh = (0, jwt_utils_1.generarRefreshToken)(PAYLOAD);
    (0, vitest_1.expect)(() => (0, jwt_utils_1.verificarAccessToken)(refresh)).toThrow(
      jsonwebtoken_1.JsonWebTokenError,
    );
  });
  (0, vitest_1.it)('el access token NO puede verificarse con el refresh secret', () => {
    const access = (0, jwt_utils_1.generarAccessToken)(PAYLOAD);
    (0, vitest_1.expect)(() => (0, jwt_utils_1.verificarRefreshToken)(access)).toThrow(
      jsonwebtoken_1.JsonWebTokenError,
    );
  });
});
//# sourceMappingURL=jwt.utils.test.js.map
