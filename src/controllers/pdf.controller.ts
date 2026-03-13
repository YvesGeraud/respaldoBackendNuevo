import type { Request, Response } from 'express';
import pdfService from '@/services/pdf.service';

class PdfController {
  async menuDelDia(_req: Request, res: Response): Promise<void> {
    await pdfService.menuDelDia(res);
  }
}

export default new PdfController();
