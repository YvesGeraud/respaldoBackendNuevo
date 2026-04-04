import 'dotenv/config';
import { prisma } from '../src/config/database.config';
import bcrypt from 'bcrypt';

const PERMISOS = [
  'USUARIOS_VER',
  'USUARIOS_CREAR',
  'USUARIOS_EDITAR',
  'USUARIOS_BORRAR',
  'PLATILLOS_VER',
  'PLATILLOS_CREAR',
  'PLATILLOS_EDITAR',
  'PLATILLOS_BORRAR',
  'ORDENES_VER',
  'ORDENES_CREAR',
  'ORDENES_ESTADO',
  'ORDENES_CANCELAR',
  'CONFIG_VER',
  'AUDITORIA_VER',
  'REPORTES_VER',
];

const ROLES_CONFIG = {
  ADMIN: PERMISOS,
  GERENTE: [
    'USUARIOS_VER',
    'PLATILLOS_VER',
    'PLATILLOS_CREAR',
    'PLATILLOS_EDITAR',
    'ORDENES_VER',
    'ORDENES_CREAR',
    'ORDENES_ESTADO',
    'ORDENES_CANCELAR',
    'REPORTES_VER',
    'AUDITORIA_VER',
  ],
  CAJERO: [
    'PLATILLOS_VER',
    'ORDENES_VER',
    'ORDENES_CREAR',
    'ORDENES_ESTADO',
    'ORDENES_CANCELAR',
    'REPORTES_VER',
  ],
  MESERO: ['PLATILLOS_VER', 'ORDENES_VER', 'ORDENES_CREAR', 'ORDENES_ESTADO'],
  COCINA: ['PLATILLOS_VER', 'ORDENES_VER', 'ORDENES_ESTADO', 'PLATILLOS_CREAR'],
};

async function main() {
  console.log('🌱 Iniciando seed de base de datos...');

  // 1. Limpiar datos (orden inverso)
  console.log('🧹 Limpiando datos existentes...');
  await prisma.dt_bitacora.deleteMany();
  await prisma.dt_rol_permiso.deleteMany();
  await prisma.ct_permiso.deleteMany();
  await prisma.dt_refresh_token.deleteMany();
  await prisma.dt_detalle_orden.deleteMany();
  await prisma.dt_orden.deleteMany();
  await prisma.dt_reservacion.deleteMany();
  await prisma.ct_platillo.deleteMany();
  await prisma.ct_usuario.deleteMany();
  await prisma.ct_rol.deleteMany();
  console.log('✅ Datos limpiados');

  // 2. Crear Permisos
  console.log('🔑 Creando permisos...');
  const permisosMap: Record<string, number> = {};
  for (const codigo of PERMISOS) {
    const p = await prisma.ct_permiso.create({
      data: {
        codigo,
        nombre: codigo.replace(/_/g, ' ').toLowerCase(),
        descripcion: `Permiso para ${codigo.toLowerCase()}`,
      },
    });
    permisosMap[codigo] = p.id_ct_permiso;
  }

  // 3. Crear Roles y vincular permisos
  console.log('👥 Creando roles y vinculando permisos...');
  const rolesMap: Record<string, number> = {};
  for (const [nombre, listaPermisos] of Object.entries(ROLES_CONFIG)) {
    const rol = await prisma.ct_rol.create({
      data: {
        nombre,
        descripcion: `Rol de ${nombre.toLowerCase()}`,
      },
    });
    rolesMap[nombre] = rol.id_ct_rol;

    // Vincular permisos
    for (const codPermiso of listaPermisos) {
      await prisma.dt_rol_permiso.create({
        data: {
          id_ct_rol: rol.id_ct_rol,
          id_ct_permiso: permisosMap[codPermiso],
        },
      });
    }
  }

  // 4. Categorías
  const categorias = await Promise.all([
    prisma.ct_categoria.create({ data: { nombre: 'Entradas', descripcion: 'Aperitivos' } }),
    prisma.ct_categoria.create({ data: { nombre: 'Platos Fuertes', descripcion: 'Principales' } }),
    prisma.ct_categoria.create({ data: { nombre: 'Postres', descripcion: 'Dulces' } }),
    prisma.ct_categoria.create({ data: { nombre: 'Bebidas', descripcion: 'Líquidos' } }),
  ]);

  // 5. Platillos (ejemplo simplificado para el seed)

  await prisma.ct_platillo.create({
    data: {
      nombre: 'Nachos con Queso',
      descripcion: 'Crujientes nachos con salsa de queso fundido',
      precio: 85.0,
      imagen_url:
        'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQDqPcmsUGWLPqXuwR5UZQUd-MYn0UanMESTg&s',
      id_ct_categoria: categorias[0].id_ct_categoria,
    },
  });

  await prisma.ct_platillo.create({
    data: {
      nombre: 'Alitas BBQ',
      descripcion: '10 alitas con salsa BBQ y aderezo ranch',
      precio: 120.0,
      imagen_url: 'https://cdn7.kiwilimon.com/recetaimagen/33623/960x640/39037.jpg.jpg',
      id_ct_categoria: categorias[0].id_ct_categoria,
    },
  });

  await prisma.ct_platillo.create({
    data: {
      nombre: 'Hamburguesa Clásica',
      descripcion: 'Carne de res, queso, lechuga, tomate y papas',
      precio: 150.0,
      imagen_url:
        'https://assets.tmecosys.com/image/upload/t_web_rdp_recipe_584x480/img/recipe/ras/Assets/FBB73F91-2A4F-475E-BB25-CE12D72C9D19/Derivates/d1eddcbc-5604-4592-bb85-1ef70ee15f96.jpg',
      id_ct_categoria: categorias[1].id_ct_categoria,
    },
  });

  await prisma.ct_platillo.create({
    data: {
      nombre: 'Pasta Alfredo',
      descripcion: 'Fettuccine en salsa cremosa con pollo',
      precio: 165.0,
      imagen_url:
        'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR99DLttbqSdmIrf6Amem4EePZJ_kZRE92Elw&s',
      id_ct_categoria: categorias[1].id_ct_categoria,
    },
  });

  await prisma.ct_platillo.create({
    data: {
      nombre: 'Pastel de Chocolate',
      descripcion: 'Delicioso pastel de chocolate con crema',
      precio: 85.0,
      imagen_url:
        'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQDqPcmsUGWLPqXuwR5UZQUd-MYn0UanMESTg&s',
      id_ct_categoria: categorias[2].id_ct_categoria,
    },
  });

  await prisma.ct_platillo.create({
    data: {
      nombre: 'Brownie con Helado',
      descripcion: 'Brownie de chocolate caliente con helado de vainilla',
      precio: 75.0,
      imagen_url:
        'https://mandolina.co/wp-content/uploads/2020/11/brownie-con-helado-destacada.jpg',
      id_ct_categoria: categorias[2].id_ct_categoria,
    },
  });

  await prisma.ct_platillo.create({
    data: {
      nombre: 'Limonada Natural',
      descripcion: 'Limonada recién exprimida',
      precio: 35.0,
      imagen_url:
        'https://cdnx.jumpseller.com/magnifique1/image/65465114/thumb/1079/1439?1752774094',
      id_ct_categoria: categorias[3].id_ct_categoria,
    },
  });

  // 6. Usuarios
  console.log('👤 Creando usuarios...');
  const passwordHash = await bcrypt.hash('password123', 12);

  await prisma.ct_usuario.create({
    data: {
      usuario: 'admin',
      contrasena: passwordHash,
      email: 'admin@restaurante.com',
      nombre_completo: 'Administrador del Sistema',
      id_ct_rol: rolesMap['ADMIN'],
    },
  });

  await prisma.ct_usuario.create({
    data: {
      usuario: 'mesero1',
      contrasena: passwordHash,
      email: 'mesero1@restaurante.com',
      nombre_completo: 'Juan Pérez',
      id_ct_rol: rolesMap['MESERO'],
    },
  });

  // 7. Tipos de documento
  await prisma.ct_tipo_documento.create({
    data: {
      clave: 'imagenes',
      descripcion: 'Imágenes del sistema',
      max_size_bytes: 5242880,
      id_ct_usuario_in: 1,
    },
  });

  // 8. Plantillas de correo
  // 1. Plantilla de Cambio de Contraseña
  await prisma.ct_plantilla_correo.upsert({
    where: { clave: 'CAMBIO_CONTRASENA' },
    update: {},
    create: {
      clave: 'CAMBIO_CONTRASENA',
      nombre: 'Notificación de Cambio de Contraseña',
      asunto: '🔐 Alerta de Seguridad: Cambio de Contraseña',
      contenido_html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
          <h2 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">Notificación de Seguridad</h2>
          <p>Hola <strong>{{usuario}}</strong>,</p>
          <p>Te informamos que la contraseña de tu cuenta ha sido cambiada exitosamente.</p>
          <p>Si no fuiste tú quien realizó este cambio, por favor contacta al administrador de inmediato.</p>
          <br>
          <p style="font-size: 12px; color: #7f8c8d; border-top: 1px solid #eee; padding-top: 10px;">
            Este es un mensaje generado automáticamente desde el sistema USET, por lo que se solicita no responder al mismo.
          </p>
        </div>
      `,
      estado: true,
    },
  });

  // 2. Plantilla de Reseteo de Contraseña (Admin)
  await prisma.ct_plantilla_correo.upsert({
    where: { clave: 'RESETEO_CONTRASENA' },
    update: {},
    create: {
      clave: 'RESETEO_CONTRASENA',
      nombre: 'Reseteo de Contraseña por Administrador',
      asunto: '🔐 Tus nuevas credenciales de acceso - USET',
      contenido_html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
          <h2 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">Nuevas Credenciales</h2>
          <p>Hola <strong>{{usuario}}</strong>,</p>
          <p>Un administrador ha reseteado tu contraseña. Aquí tienes tus nuevas credenciales de acceso:</p>
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; border: 1px dashed #3498db;">
            <p style="margin: 5px 0;"><strong>Usuario:</strong> {{usuario}}</p>
            <p style="margin: 5px 0;"><strong>Nueva Contraseña:</strong> <code style="background: #eee; padding: 2px 5px;">{{contrasena}}</code></p>
          </div>
          <p>⚠️ <strong>IMPORTANTE:</strong> Se te solicitará cambiar esta contraseña en tu próximo inicio de sesión por motivos de seguridad.</p>
          <br>
          <p style="font-size: 12px; color: #7f8c8d; border-top: 1px solid #eee; padding-top: 10px;">
            Si no reconoces esta acción, por favor contacta al departamento de TI de inmediato.
          </p>
        </div>
      `,
      estado: true,
    },
  });

  // 3. Plantilla de Recuperación de Contraseña (Link)
  await prisma.ct_plantilla_correo.upsert({
    where: { clave: 'RECUPERAR_PASSWORD' },
    update: {},
    create: {
      clave: 'RECUPERAR_PASSWORD',
      nombre: 'Recuperación de Contraseña (Link)',
      asunto: '🔑 Restablece tu contraseña - USET',
      contenido_html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
          <h2 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">Recuperación de Cuenta</h2>
          <p>Hola,</p>
          <p>Has solicitado restablecer tu contraseña. Haz clic en el siguiente enlace para continuar:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{link}}" style="background-color: #3498db; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Restablecer Contraseña</a>
          </div>
          <p style="font-size: 13px; color: #7f8c8d;">Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
          <p style="font-size: 11px; word-break: break-all; color: #3498db;">{{link}}</p>
          <p>Este enlace expirará en 1 hora por motivos de seguridad.</p>
          <br>
          <p style="font-size: 12px; color: #7f8c8d; border-top: 1px solid #eee; padding-top: 10px;">
            Si no solicitaste este cambio, puedes ignorar este correo con seguridad.
          </p>
        </div>
      `,
      estado: true,
    },
  });

  console.log('🎉 Seed completado exitosamente!');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
