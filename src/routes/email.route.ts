import { Router } from 'express';
import emailController from '@/controllers/email.controller';
import { validar } from '@/middlewares/validar.middlewares';
import {
  confirmarReservacionSchema,
  recuperarPasswordSchema,
  enviarPruebaSchema,
} from '@/schemas/email.schema';

/**
 * Rutas de correo.
 * En producción, proteger con autenticación según necesidad.
 */
const router = Router();

router.post(
  '/confirmar-reservacion',
  validar(confirmarReservacionSchema),
  emailController.confirmarReservacion,
);

router.post(
  '/recuperar-password',
  validar(recuperarPasswordSchema),
  emailController.recuperarPassword,
);

router.post('/prueba', validar(enviarPruebaSchema), emailController.enviarPrueba);

export { router as emailRouter };
