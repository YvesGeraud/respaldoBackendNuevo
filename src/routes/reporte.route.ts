import { Router } from 'express';
import reporteController from '@/controllers/reporte.controller';
import { autenticado } from '@/middlewares/autenticacion.middleware';

const router = Router();

// GET /api/reportes/stats → Obtener métricas generales
router.get('/stats', autenticado, reporteController.getEstadisticas);

// GET /api/reportes/dashboard → Obtener métricas para el dashboard visual
router.get('/dashboard', autenticado, reporteController.getDashboardStats);

export { router as reporteRouter };
