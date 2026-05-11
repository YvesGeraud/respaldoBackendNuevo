import type { Request, Response } from 'express';
import reporteService from '@/services/reporte.service';

class ReporteController {
  async getEstadisticas(req: Request, res: Response): Promise<void> {
    const stats = await reporteService.obtenerEstadisticas(req.query);
    res.json({
      mensaje: 'Estadísticas obtenidas con éxito',
      datos: stats
    });
  }

  async getDashboardStats(req: Request, res: Response): Promise<void> {
    const stats = await reporteService.obtenerDashboardStats();
    res.json({
      mensaje: 'Estadísticas de dashboard obtenidas con éxito',
      datos: stats
    });
  }
}

export default new ReporteController();
