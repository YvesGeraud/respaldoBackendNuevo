import type { Request, Response } from 'express';
import excelService from '@/services/excel.service';

class ExcelController {
  async menuDelDia(_req: Request, res: Response): Promise<void> {
    await excelService.menuDelDia(res);
  }
}

export default new ExcelController();
