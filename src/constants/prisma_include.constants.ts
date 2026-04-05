import { Prisma } from '@prisma/client';

/**
 * Define objetos de 'include' reutilizables para Prisma.
 * Centraliza las relaciones comunes para evitar duplicar código en servicios.
 */

/**
 * Consulta un Platillo junto con su Categoría.
 */
export const INCLUDE_PLATILLO_CATEGORIA = Prisma.validator<Prisma.ct_platilloInclude>()({
  categoria: true,
});

/**
 * Consulta una Orden con el usuario que la realizó y sus detalles.
 */
export const INCLUDE_ORDEN_USUARIO_DETALLES = Prisma.validator<Prisma.dt_ordenInclude>()({
  usuario: {
    select: {
      nombre_completo: true,
      usuario: true,
    },
  },
  detalles: {
    include: {
      platillo: {
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
  rol: true,
});
