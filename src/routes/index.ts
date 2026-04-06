import { Router } from 'express';

//* Servicios
import { platilloRouter } from '@/routes/platillo.route';
import { categoriaRouter } from '@/routes/categoria.route';

//* Reportes
import { pdfRouter } from '@/routes/pdf.route';
import { excelRouter } from './excel.route';

//* Archivos
import { archivoRouter } from '@/routes/archivo.route';

//* emails
import { emailRouter } from './email.route';

/**
 * Router raíz de la API — monta cada módulo bajo su prefijo.
 * Patrón para agregar nuevos módulos:
 *   import { authRouter } from './auth.route';
 *   router.use('/auth', authRouter);
 */
export const router = Router();

//* Servicios
router.use('/platillos', platilloRouter);
router.use('/categorias', categoriaRouter);

//* Reportes
router.use('/pdf', pdfRouter);
router.use('/excel', excelRouter);

//* Archivos
router.use('/archivos', archivoRouter);

//* emails
router.use('/emails', emailRouter);

// Módulos pendientes:
// import { authRouter }          from './auth.route';
// import { usuariosRouter }      from './usuario.route';
// import { ordenesRouter }       from './orden.route';
// import { reservacionesRouter } from './reservacion.route';

// router.use('/auth',          authRouter);
// router.use('/usuarios',      usuariosRouter);
// router.use('/ordenes',       ordenesRouter);
// router.use('/reservaciones', reservacionesRouter);
