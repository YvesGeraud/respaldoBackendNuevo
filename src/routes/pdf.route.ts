import { Router } from 'express';
import pdfController from '@/controllers/pdf.controller';

const router = Router();

// GET /api/pdf/menu → PDF del menú del día (abre en navegador)
router.get('/menu', pdfController.menuDelDia);

export { router as pdfRouter };
