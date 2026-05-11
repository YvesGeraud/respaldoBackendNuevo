import { Router } from 'express';
import excelController from '@/controllers/excel.controller';
import { autenticado } from '@/middlewares/autenticacion.middleware';

const router = Router();

// GET /api/excel/menu → Excel del menú del día (descarga .xlsx)
router.get('/menu', excelController.menuDelDia);

// GET /api/excel/ventas → Reporte de ventas (requiere login)
router.get('/ventas', autenticado, excelController.reporteVentas);

export { router as excelRouter };
