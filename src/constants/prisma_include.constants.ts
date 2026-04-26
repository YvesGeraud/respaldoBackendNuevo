import { Prisma } from '@prisma/client';

/**
 * Define objetos de 'include' reutilizables para Prisma.
 * Centraliza las relaciones comunes para evitar duplicar código en servicios.
 */

/**
 * Consulta un Platillo junto con su Categoría.
 */
export const INCLUDE_PLATILLO_CATEGORIA = Prisma.validator<Prisma.ct_platilloInclude>()({
  ct_categoria: true,
});

/**
 * Consulta una Orden con el usuario que la realizó y sus detalles.
 */
export const INCLUDE_ORDEN_USUARIO_DETALLES = Prisma.validator<Prisma.rl_ordenInclude>()({
  usuario_registro: {
    select: {
      nombre_completo: true,
      usuario: true,
    },
  },
  dt_detalle_orden: {
    include: {
      ct_platillo: {
        select: {
          nombre: true,
          precio: true,
          imagen_url: true,
        },
      },
    },
  },
});

/**
 * Consulta un Usuario con su Rol.
 */
export const INCLUDE_USUARIO_ROL = Prisma.validator<Prisma.ct_usuarioInclude>()({
  ct_rol: true,
});

/**
 * Consulta una Reservación con Cliente, Mesa y Usuario.
 */
export const INCLUDE_RESERVACION_TODO = Prisma.validator<Prisma.rl_reservacionInclude>()({
  ct_cliente: true,
  ct_mesa: true,
  usuario_registro: {
    select: {
      id_ct_usuario: true,
      usuario: true,
      nombre_completo: true,
    },
  },
});
