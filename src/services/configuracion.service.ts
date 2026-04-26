import { Prisma } from '@prisma/client';
import { prisma } from '@/config/database.config';
import { ActualizarConfiguracionDTO } from '@/schemas/configuracion.schema';

class ConfiguracionService {
  /**
   * Obtiene la configuración actual del restaurante.
   * Si no existe, crea una por defecto.
   */
  async obtener(): Promise<Prisma.ct_configuracionGetPayload<object>> {
    let config = await prisma.ct_configuracion.findFirst();

    if (!config) {
      config = await prisma.ct_configuracion.create({
        data: {
          nombre_restaurante: 'Mi Restaurante',
          moneda: '$',
          impuesto_porcentaje: 0.16,
        },
      });
    }

    return config;
  }

  async actualizar(
    id_ct_usuario_mod: number,
    datos: ActualizarConfiguracionDTO
  ): Promise<Prisma.ct_configuracionGetPayload<object>> {
    const configActual = await this.obtener();

    return prisma.ct_configuracion.update({
      where: { id_ct_configuracion: configActual.id_ct_configuracion },
      data: {
        ...datos,
        id_ct_usuario_mod,
        fecha_mod: new Date(),
      },
    });
  }
}

export default new ConfiguracionService();
