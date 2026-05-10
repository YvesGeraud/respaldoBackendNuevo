import Stripe from 'stripe';
import { logger } from '@/utils/logger.utils';

// ── Instancia de Stripe ─────────────────────────────────────────────────────
// Se crea una única instancia (singleton) del cliente de Stripe para toda
// la aplicación. Esto es más eficiente que crear una nueva instancia por request.
//
// apiVersion: versión fija de la API de Stripe para evitar cambios inesperados
// si Stripe actualiza su API en el futuro. Siempre es mejor versión fija en prod.
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-04-22.dahlia',
});

/**
 * Servicio de abstracción de la API de Stripe.
 *
 * RESPONSABILIDAD ÚNICA: este servicio solo conoce Stripe.
 * No conoce la base de datos, ni las reglas de negocio del restaurante.
 * Cualquier lógica de negocio debe ir en pago.service.ts.
 *
 * Patrón de diseño: Facade — oculta la complejidad de la API de Stripe
 * detrás de métodos simples y con nombres en español para el resto del sistema.
 */
class StripeService {
  /**
   * Crea un intento de pago con captura MANUAL (Authorize & Capture).
   *
   * La diferencia clave con un pago normal:
   *   - Pago normal (capture_method: 'automatic'): se cobra inmediatamente.
   *   - capture_method: 'manual': solo RESERVA los fondos en la tarjeta.
   *     El cobro real ocurre cuando llamamos a capturarPago().
   *     Si no capturamos en 7 días, Stripe libera la autorización automáticamente.
   *
   * @param montoCentavos - Monto a autorizar en centavos (ej: 20000 = $200 MXN)
   * @param moneda - Código ISO de la moneda (ej: 'mxn', 'usd')
   * @param metadatos - Datos adicionales para rastrear en el dashboard de Stripe
   *                    (ej: id de reservación, nombre del cliente)
   * @returns El PaymentIntent creado por Stripe con su client_secret
   */
  async crearIntentoPago(
    montoCentavos: number,
    moneda: string = 'mxn',
    metadatos: Record<string, string> = {},
  ) {
    logger.info('[StripeService] Creando intento de pago', { montoCentavos, moneda, metadatos });

    return stripe.paymentIntents.create({
      amount: montoCentavos,
      currency: moneda,
      // 'manual' = captura diferida: solo autoriza, no cobra hasta llamar a capture()
      capture_method: 'manual',
      // Los metadatos aparecen en el dashboard de Stripe para rastreo
      metadata: metadatos,
    });
  }

  /**
   * Captura (cobra) un pago previamente autorizado.
   *
   * Se usa en dos escenarios:
   *   1. No-show: el cliente no se presentó → se cobra la penalización
   *   2. Cancelación tardía: canceló después del período de gracia → cobro parcial
   *
   * Si no se especifica montoCentavos, se captura el monto completo autorizado.
   * Stripe permite captura parcial (ej: cobrar solo el 50% como penalización).
   *
   * @param claveIntentoPago - El ID del PaymentIntent en Stripe (pi_...)
   * @param montoCentavos - Monto a capturar. Si es undefined, captura el total.
   */
  async capturarPago(claveIntentoPago: string, montoCentavos?: number) {
    logger.info('[StripeService] Capturando pago', { claveIntentoPago, montoCentavos });

    const opciones: Parameters<typeof stripe.paymentIntents.capture>[1] = {};

    // Solo enviamos amount_to_capture si es una captura parcial
    if (montoCentavos !== undefined) {
      opciones!.amount_to_capture = montoCentavos;
    }

    return stripe.paymentIntents.capture(claveIntentoPago, opciones);
  }

  /**
   * Libera (cancela) una autorización de pago sin cobrar nada al cliente.
   *
   * Se usa cuando:
   *   - El cliente cancela dentro del período de gracia (sin cargo)
   *   - El restaurante cancela la reservación
   *   - El cliente asistió y todo estuvo bien (no hay penalización)
   *
   * IMPORTANTE: "cancel" en Stripe no significa que el cliente pagó y se reembolsó,
   * sino que la autorización nunca se convirtió en cobro real.
   *
   * @param claveIntentoPago - El ID del PaymentIntent en Stripe (pi_...)
   */
  async liberarAutorizacion(claveIntentoPago: string) {
    logger.info('[StripeService] Liberando autorización (sin cobro)', { claveIntentoPago });

    return stripe.paymentIntents.cancel(claveIntentoPago);
  }

  /**
   * Valida y parsea un evento de webhook recibido de Stripe.
   *
   * POR QUÉ ES IMPORTANTE:
   * Cualquiera podría enviar un POST falso a /api/webhooks/stripe simulando
   * un pago exitoso. Stripe firma cada evento con HMAC-SHA256 usando el
   * STRIPE_WEBHOOK_SECRET. Si la firma no coincide, rechazamos el request.
   *
   * REQUISITO TÉCNICO:
   * Esta función necesita el body RAW (Buffer), NO el body parseado por express.json().
   * Por eso la ruta del webhook usa express.raw() en lugar de express.json().
   *
   * @param payload - El body crudo del request (Buffer o string)
   * @param firma - El header 'stripe-signature' del request
   * @returns El evento de Stripe parseado y verificado
   * @throws Error si la firma es inválida o el payload está malformado
   */
  construirEvento(payload: Buffer | string, firma: string) {
    return stripe.webhooks.constructEvent(payload, firma, process.env.STRIPE_WEBHOOK_SECRET!);
  }
}

// Exportamos una instancia única (singleton) — evita crear múltiples conexiones
export default new StripeService();
