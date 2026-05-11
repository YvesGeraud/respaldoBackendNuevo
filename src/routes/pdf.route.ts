import { Router } from 'express';
import pdfController from '@/controllers/pdf.controller';
import { autenticado } from '@/middlewares/autenticacion.middleware';

const router = Router();

// GET /api/pdf/menu → PDF del menú del día (abre en navegador)
router.get('/menu', pdfController.menuDelDia);

// GET /api/pdf/ventas → Reporte de ventas (requiere login)
router.get('/ventas', autenticado, pdfController.reporteVentas);

export { router as pdfRouter };
