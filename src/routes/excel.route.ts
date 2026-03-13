import { Router } from 'express';
import excelController from '@/controllers/excel.controller';

const router = Router();

// GET /api/excel/menu → Excel del menú del día (descarga .xlsx)
router.get('/menu', excelController.menuDelDia);

export { router as excelRouter };
