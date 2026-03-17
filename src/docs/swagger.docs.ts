import { OpenAPIRegistry, OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';
import { config } from '@/config/servidor.config';
import { registerPlatillosDocs } from '@/docs/platillos.docs';
import { registerAuthDocs } from '@/docs/auth.docs';
import { registerEmailDocs } from '@/docs/email.docs';

const registry = new OpenAPIRegistry();

// ── ✅ REGISTRAR COMPONENTES PRIMERO ──────────────────────────────────────────

registry.registerComponent(
  'securitySchemes',
  'bearerAuth',
  {
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT',
  }
);

// ── Registrar módulos (cuando los actives) ────────────────────────────────────

 registerPlatillosDocs(registry);
 registerAuthDocs(registry);
 registerEmailDocs(registry);

// ── Generar documento ─────────────────────────────────────────────────────────

const generator = new OpenApiGeneratorV3(registry.definitions);

export const swaggerSpec = generator.generateDocument({
  openapi: '3.0.0',
  info: {
    title: 'API Restaurante',
    version: '1.0.0',
    description: 'API REST para el sistema de restaurante',
  },
  servers: [
    {
      url: `http://localhost:${config.puerto}`,
      description: config.esProduccion ? 'Producción' : 'Desarrollo',
    },
  ],
  tags: [
    //{ name: 'Auth', description: 'Autenticación y sesión' },
    { name: 'Platillos', description: 'Catálogo de platillos' },
   // { name: 'Email', description: 'Envío de correos' },
  ],
});