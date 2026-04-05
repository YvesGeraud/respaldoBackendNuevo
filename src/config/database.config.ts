import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { config } from '@/config/servidor.config';
import { auditExtension } from './prisma_auditoria';

declare global {
  var prisma: ReturnType<typeof crearCliente> | undefined;
}

function crearCliente() {
  const adapter = new PrismaMariaDb({
    host: config.db.host,
    port: config.db.port,
    database: config.db.nombre,
    user: config.db.usuario,
    password: config.db.password,
    connectionLimit: config.esProduccion ? 20 : 5,
    acquireTimeout: 8_000,
    idleTimeout: 600_000,
    connectTimeout: 5_000,
  });

  const client = new PrismaClient({
    adapter,
    log: config.nodeEnv === 'development' ? ['query', 'warn', 'error'] : ['error'],
  });

  return client.$extends(auditExtension);
}

export const prisma = globalThis.prisma ?? crearCliente();

if (!config.esProduccion) {
  globalThis.prisma = prisma;
}
