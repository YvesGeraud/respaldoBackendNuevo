// dotenv debe cargarse PRIMERO — antes de cualquier import que lea process.env
import 'dotenv/config';

import app from '@/setup';
import { config } from '@/config/servidor.config';
import { prisma } from '@/config/database.config';

// ── Iniciar servidor ──────────────────────────────────────────────────────────

const servidor = app.listen(config.puerto, () => {
  console.log(
    `\n    ╔════════════════════════════════════════════╗` +
      `\n    ║  🍽️  RESTAURANTE API                        ║` +
      `\n    ║  🚀 http://localhost:${config.puerto}                  ║` +
      `\n    ║  🌍 Entorno: ${config.nodeEnv.toUpperCase().padEnd(30)}║` +
      `\n    ╚════════════════════════════════════════════╝\n`,
  );
});

// ── Manejo de errores de red y arranque ────────────────────────────────────────

servidor.on('error', (error: NodeJS.ErrnoException) => {
  if (error.code === 'EADDRINUSE') {
    console.error(
      `\n❌ Error FATAL: El puerto ${config.puerto} ya está siendo usado por otro proceso.`,
    );
    console.error('   Sugerencia: Termina el proceso anterior o cambia el PORT en el .env');
  } else {
    console.error('\n❌ Error al iniciar el servidor:', error);
  }
  process.exit(1);
});

// Capturar errores no manejados para que no muera en silencio
process.on('unhandledRejection', (reason) => {
  console.error('\n⚠️ RECHAZO NO MANEJADO (Promise):', reason);
});

process.on('uncaughtException', (error) => {
  console.error('\n❌ EXCEPCIÓN NO CAPTURADA:', error);
  process.exit(1);
});

// ── Cierre limpio ─────────────────────────────────────────────────────────────

// El ciclo de vida del proceso pertenece al punto de entrada, no a app.ts,
// para que los tests puedan importar app sin arrancar ni cerrar servidores.
const shutdown = async (signal: string): Promise<void> => {
  console.log(`\n[${signal}] Cerrando servidor...`);
  servidor.close(async () => {
    await prisma.$disconnect();
    console.log('Conexiones cerradas. Proceso terminado.');
    process.exit(0);
  });
};

process.once('SIGTERM', () => shutdown('SIGTERM'));
process.once('SIGINT', () => shutdown('SIGINT'));
