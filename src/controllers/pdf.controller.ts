import type { Request, Response } from 'express';
import pdfService from '@/services/pdf.service';

class PdfController {
  async menuDelDia(_req: Request, res: Response): Promise<void> {
    await pdfService.menuDelDia(res);
  }

  async reporteVentas(req: Request, res: Response): Promise<void> {
    await pdfService.reporteVentas(res, req.query);
  }
}

export default new PdfController();
