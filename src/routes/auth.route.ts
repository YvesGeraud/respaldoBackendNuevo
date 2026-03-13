import { Router } from 'express';
import authController from '@/controllers/auth.controller';
import { autenticado } from '@/middlewares/autenticacion.middleware';
import { validar } from '@/middlewares/validar.middlewares';
import { loginSchema } from '@/schemas/auth.schema';

const router = Router();

// ── Públicas (sin autenticación) ──────────────────────────────────────────────

// El rate limiting estricto se aplica en app.ts al montar este router
router.post('/login', validar(loginSchema), authController.login);
router.post('/refresh', authController.refrescarTokens);

// ── Protegidas (requieren cookie accessToken válida) ──────────────────────────

router.post('/logout', autenticado, authController.logout);
router.get('/me', autenticado, authController.yo);

export { router as authRouter };
