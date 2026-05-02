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

  // 1. Limpiar datos con desactivación de llaves foráneas para evitar errores de orden/circularidad
  console.log('🧹 Limpiando datos existentes...');
  await prisma.$transaction([
    prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 0;'),
    prisma.$executeRawUnsafe('TRUNCATE TABLE dt_bitacora;'),
    prisma.$executeRawUnsafe('TRUNCATE TABLE rl_rol_permiso;'),
    prisma.$executeRawUnsafe('TRUNCATE TABLE ct_permiso;'),
    prisma.$executeRawUnsafe('TRUNCATE TABLE dt_refresh_token;'),
    prisma.$executeRawUnsafe('TRUNCATE TABLE dt_detalle_orden;'),
    prisma.$executeRawUnsafe('TRUNCATE TABLE ct_platillo;'),
    prisma.$executeRawUnsafe('TRUNCATE TABLE ct_categoria;'),
    prisma.$executeRawUnsafe('TRUNCATE TABLE ct_rol;'),
    prisma.$executeRawUnsafe('TRUNCATE TABLE rl_orden;'),
    prisma.$executeRawUnsafe('TRUNCATE TABLE rl_reservacion;'),
    prisma.$executeRawUnsafe('TRUNCATE TABLE ct_cliente;'),
    prisma.$executeRawUnsafe('TRUNCATE TABLE ct_mesa;'),
    prisma.$executeRawUnsafe('TRUNCATE TABLE ct_tipo_documento;'),
    prisma.$executeRawUnsafe('TRUNCATE TABLE ct_plantilla_correo;'),
    prisma.$executeRawUnsafe('TRUNCATE TABLE ct_usuario;'),
    prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1;'),
  ]);

  // 2. Crear el Súper Administrador Inicial
  console.log('👑 Creando usuario administrador base...');
  const passwordHash = await bcrypt.hash('password123', 12);

  // Usamos un transaction batch para asegurar que todo corre en la misma conexión
  // y apagar el FOREIGN_KEY_CHECKS temporalmente para resolver el problema circular.
  await prisma.$transaction([
    prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 0;'),

    // Forzamos el ID 1 para el rol ADMIN
    prisma.ct_rol.create({
      data: {
        id_ct_rol: 1,
        nombre: 'ADMIN',
        descripcion: 'Súper administrador del sistema',
        id_ct_usuario_reg: 1, // Se apunta a sí mismo
      },
    }),

    // Forzamos el ID 1 para el usuario admin
    prisma.ct_usuario.create({
      data: {
        id_ct_usuario: 1,
        usuario: 'admin',
        contrasena: passwordHash,
        email: 'admin@restaurante.com',
        nombre_completo: 'Administrador del Sistema',
        id_ct_rol: 1,
        id_ct_usuario_reg: 1, // Se apunta a sí mismo
      },
    }),

    prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1;'),
  ]);

  console.log('✅ Administrador base creado con éxito');

  // Ahora todo lo demás puede usar id_ct_usuario_reg: 1 normalmente

  // 3. Crear Permisos
  console.log('🔑 Creando permisos...');
  const permisosMap: Record<string, number> = {};
  for (const codigo of PERMISOS) {
    const p = await prisma.ct_permiso.create({
      data: {
        codigo,
        nombre: codigo.replace(/_/g, ' ').toLowerCase(),
        descripcion: `Permiso para ${codigo.toLowerCase()}`,
        id_ct_usuario_reg: 1,
      },
    });
    permisosMap[codigo] = p.id_ct_permiso;
  }

  // Vincular todos los permisos al rol ADMIN (ID 1)
  for (const codigo of PERMISOS) {
    await prisma.rl_rol_permiso.create({
      data: {
        id_ct_rol: 1,
        id_ct_permiso: permisosMap[codigo],
        id_ct_usuario_reg: 1,
      },
    });
  }

  // 4. Crear Roles secundarios y vincular permisos
  console.log('👥 Creando roles secundarios y vinculando permisos...');
  const rolesMap: Record<string, number> = {};
  for (const [nombre, listaPermisos] of Object.entries(ROLES_CONFIG)) {
    const rol = await prisma.ct_rol.create({
      data: {
        nombre,
        descripcion: `Rol de ${nombre.toLowerCase()}`,
        id_ct_usuario_reg: 1,
      },
    });
    rolesMap[nombre] = rol.id_ct_rol;

    for (const codPermiso of listaPermisos) {
      await prisma.rl_rol_permiso.create({
        data: {
          id_ct_rol: rol.id_ct_rol,
          id_ct_permiso: permisosMap[codPermiso],
          id_ct_usuario_reg: 1,
        },
      });
    }
  }

  // 5. Categorías
  console.log('🍲 Creando categorías...');
  const categorias = await Promise.all([
    prisma.ct_categoria.create({
      data: { nombre: 'Entradas', descripcion: 'Aperitivos', id_ct_usuario_reg: 1 },
    }),
    prisma.ct_categoria.create({
      data: { nombre: 'Platos Fuertes', descripcion: 'Principales', id_ct_usuario_reg: 1 },
    }),
    prisma.ct_categoria.create({
      data: { nombre: 'Postres', descripcion: 'Dulces', id_ct_usuario_reg: 1 },
    }),
    prisma.ct_categoria.create({
      data: { nombre: 'Bebidas', descripcion: 'Líquidos', id_ct_usuario_reg: 1 },
    }),
  ]);

  // 6. Platillos
  console.log('🍕 Creando platillos...');
  const platillosData = [
    { nombre: 'Nachos con Queso', desc: 'Crujientes nachos', imagen_url:
        'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQDqPcmsUGWLPqXuwR5UZQUd-MYn0UanMESTg&s', precio: 85.0, cat: 0 },
    { nombre: 'Alitas BBQ', desc: '10 alitas BBQ',  imagen_url: 'https://cdn7.kiwilimon.com/recetaimagen/33623/960x640/39037.jpg.jpg', precio: 120.0, cat: 0 },
    { nombre: 'Hamburguesa Clásica', desc: 'Carne de res, queso', imagen_url:
        'https://assets.tmecosys.com/image/upload/t_web_rdp_recipe_584x480/img/recipe/ras/Assets/FBB73F91-2A4F-475E-BB25-CE12D72C9D19/Derivates/d1eddcbc-5604-4592-bb85-1ef70ee15f96.jpg', precio: 150.0, cat: 1 },
    { nombre: 'Pasta Alfredo', desc: 'Fettuccine en salsa', imagen_url:
        'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR99DLttbqSdmIrf6Amem4EePZJ_kZRE92Elw&s', precio: 165.0, cat: 1 },
    { nombre: 'Pastel de Chocolate', desc: 'Delicioso pastel', imagen_url:
        'https://www.verybestbaking.com/sites/g/files/jgfbjl326/files/styles/large/public/recipe-thumbnail/103679-2020_06_09T08_18_01_mrs_ImageRecipes_1810lrg.jpg?itok=DR3HQYQ1', precio: 85.0, cat: 2 },
    { nombre: 'Brownie con Helado', desc: 'Con helado',  imagen_url:
        'https://mandolina.co/wp-content/uploads/2020/11/brownie-con-helado-destacada.jpg', precio: 75.0, cat: 2 },
    { nombre: 'Limonada Natural', desc: 'Recién exprimida', imagen_url:
        'https://cdnx.jumpseller.com/magnifique1/image/65465114/thumb/1079/1439?1752774094', precio: 35.0, cat: 3 },
  ];

  for (const p of platillosData) {
    await prisma.ct_platillo.create({
      data: {
        nombre: p.nombre,
        descripcion: p.desc,
        precio: p.precio,
        imagen_url: p.imagen_url,
        id_ct_categoria: categorias[p.cat].id_ct_categoria,
        id_ct_usuario_reg: 1,
      },
    });
  }

  // 6.5. Mesas
  console.log('🪑 Creando mesas...');
  const mesasData = [
    { codigo: 'MESA-01', capacidad: 2 },
    { codigo: 'MESA-02', capacidad: 2 },
    { codigo: 'MESA-03', capacidad: 4 },
    { codigo: 'MESA-04', capacidad: 4 },
    { codigo: 'MESA-05', capacidad: 4 },
    { codigo: 'MESA-06', capacidad: 6 },
    { codigo: 'MESA-07', capacidad: 8 },
    { codigo: 'VIP-01', capacidad: 10 },
  ];

  for (const m of mesasData) {
    await prisma.ct_mesa.create({
      data: {
        codigo: m.codigo,
        capacidad: m.capacidad,
        id_ct_usuario_reg: 1,
      },
    });
  }

  // 6.6. Clientes
  console.log('👥 Creando clientes...');
  const clientesData = [
    { nombre: 'Juan Manuel Lopez', correo: 'juan.lopez@email.com', telefono: 88776655 },
    { nombre: 'Maria Fernanda Garcia', correo: 'maria.garcia@email.com', telefono: 77665544 },
    { nombre: 'Carlos Roberto Gomez', correo: 'carlos.gomez@email.com', telefono: 66554433 },
  ];

  for (const c of clientesData) {
    await prisma.ct_cliente.create({
      data: {
        ...c,
        id_ct_usuario_reg: 1,
      },
    });
  }

  // 7. Otros Usuarios
  console.log('👤 Creando usuarios secundarios...');
  await prisma.ct_usuario.create({
    data: {
      usuario: 'mesero1',
      contrasena: passwordHash,
      email: 'mesero1@restaurante.com',
      nombre_completo: 'Juan Pérez',
      id_ct_rol: rolesMap['MESERO'],
      id_ct_usuario_reg: 1,
    },
  });

  // 8. Tipos de documento
  console.log('📁 Creando tipos de documento...');
  await prisma.ct_tipo_documento.create({
    data: {
      clave: 'imagenes',
      descripcion: 'Imágenes del sistema',
      max_size_bytes: 5242880,
      id_ct_usuario_reg: 1,
    },
  });

  // 9. Plantillas
  console.log('✉️ Creando plantillas...');
  await prisma.ct_plantilla_correo.upsert({
    where: { clave: 'CAMBIO_CONTRASENA' },
    update: {},
    create: {
      clave: 'CAMBIO_CONTRASENA',
      nombre: 'Notificación de Cambio de Contraseña',
      asunto: '🔐 Alerta de Seguridad',
      contenido_html: '<html><body>Cambio de contraseña exitoso</body></html>',
      estado: true,
      id_ct_usuario_reg: 1,
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
