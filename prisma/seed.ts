import 'dotenv/config';
import { prisma } from '../src/config/database.config';
import { RolUsuario } from '../src/generated/prisma/client';
import bcrypt from 'bcrypt';

async function main() {
  console.log('🌱 Iniciando seed de base de datos...');

  // Limpiar datos existentes (en orden inverso por las relaciones)
  console.log('🧹 Limpiando datos existentes...');
  await prisma.dt_detalle_orden.deleteMany();
  await prisma.dt_orden.deleteMany();
  await prisma.dt_reservacion.deleteMany();
  await prisma.ct_platillo.deleteMany();
  await prisma.ct_usuario.deleteMany();
  console.log('✅ Datos limpiados');

  // Crear categorías con upsert (crea o actualiza si existe)
  const categorias = await Promise.all([
    prisma.ct_categoria.upsert({
      where: { nombre: 'Entradas' },
      update: {},
      create: {
        nombre: 'Entradas',
        descripcion: 'Aperitivos y entradas',
      },
    }),
    prisma.ct_categoria.upsert({
      where: { nombre: 'Platos Fuertes' },
      update: {},
      create: {
        nombre: 'Platos Fuertes',
        descripcion: 'Platos principales',
      },
    }),
    prisma.ct_categoria.upsert({
      where: { nombre: 'Postres' },
      update: {},
      create: {
        nombre: 'Postres',
        descripcion: 'Dulces y postres',
      },
    }),
    prisma.ct_categoria.upsert({
      where: { nombre: 'Bebidas' },
      update: {},
      create: {
        nombre: 'Bebidas',
        descripcion: 'Bebidas frías y calientes',
      },
    }),
  ]);

  console.log(`✅ ${categorias.length} categorías creadas`);

  // Crear platillos
  const platillos = await Promise.all([
    // Entradas
    prisma.ct_platillo.create({
      data: {
        nombre: 'Nachos con Queso',
        descripcion: 'Crujientes nachos con salsa de queso fundido',
        precio: 85.0,
        imagen_url:
          'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQDqPcmsUGWLPqXuwR5UZQUd-MYn0UanMESTg&s',
        id_ct_categoria: categorias[0].id_ct_categoria,
      },
    }),
    prisma.ct_platillo.create({
      data: {
        nombre: 'Alitas BBQ',
        descripcion: '10 alitas con salsa BBQ y aderezo ranch',
        precio: 120.0,
        imagen_url: 'https://cdn7.kiwilimon.com/recetaimagen/33623/960x640/39037.jpg.jpg',
        id_ct_categoria: categorias[0].id_ct_categoria,
      },
    }),
    // Platos Fuertes
    prisma.ct_platillo.create({
      data: {
        nombre: 'Hamburguesa Clásica',
        descripcion: 'Carne de res, queso, lechuga, tomate y papas',
        precio: 150.0,
        imagen_url:
          'https://assets.tmecosys.com/image/upload/t_web_rdp_recipe_584x480/img/recipe/ras/Assets/FBB73F91-2A4F-475E-BB25-CE12D72C9D19/Derivates/d1eddcbc-5604-4592-bb85-1ef70ee15f96.jpg',
        id_ct_categoria: categorias[1].id_ct_categoria,
      },
    }),
    prisma.ct_platillo.create({
      data: {
        nombre: 'Pasta Alfredo',
        descripcion: 'Fettuccine en salsa cremosa con pollo',
        precio: 165.0,
        imagen_url:
          'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR99DLttbqSdmIrf6Amem4EePZJ_kZRE92Elw&s',
        id_ct_categoria: categorias[1].id_ct_categoria,
      },
    }),
    // Postres
    prisma.ct_platillo.create({
      data: {
        nombre: 'Brownie con Helado',
        descripcion: 'Brownie de chocolate caliente con helado de vainilla',
        precio: 75.0,
        imagen_url:
          'https://mandolina.co/wp-content/uploads/2020/11/brownie-con-helado-destacada.jpg',
        id_ct_categoria: categorias[2].id_ct_categoria,
      },
    }),
    // Bebidas
    prisma.ct_platillo.create({
      data: {
        nombre: 'Limonada Natural',
        descripcion: 'Limonada recién exprimida',
        precio: 35.0,
        imagen_url:
          'https://cdnx.jumpseller.com/magnifique1/image/65465114/thumb/1079/1439?1752774094',
        id_ct_categoria: categorias[3].id_ct_categoria,
      },
    }),
  ]);

  console.log(`✅ ${platillos.length} platillos creados`);

  // Crear usuarios para testing
  const passwordHash = await bcrypt.hash('password123', 12);

  const usuarios = await Promise.all([
    prisma.ct_usuario.create({
      data: {
        usuario: 'mesero1',
        contrasena: passwordHash,
        email: 'mesero1@restaurante.com',
        nombre_completo: 'Juan Pérez',
        rol: RolUsuario.CAJERO,
      },
    }),
    prisma.ct_usuario.create({
      data: {
        usuario: 'cocinero1',
        contrasena: passwordHash,
        email: 'cocinero1@restaurante.com',
        nombre_completo: 'María García',
        rol: RolUsuario.COCINERO,
      },
    }),
  ]);

  console.log(`✅ ${usuarios.length} usuarios creados`);

  console.log('🎉 Seed completado exitosamente!');
  console.log('\n📋 Datos de acceso:');
  console.log('   👤 Usuario mesero: mesero1');
  console.log('   👤 Usuario cocinero: cocinero1');
  console.log('   🔑 Contraseña para ambos: password123');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
