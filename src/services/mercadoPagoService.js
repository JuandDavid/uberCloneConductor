/**
 * Servicio de Integración con Mercado Pago Checkout Pro (mercadoPagoService.js)
 * Estructurado según las especificaciones académicas del proyecto UberClone Conductor:
 * - Soporte para entorno Sandbox (modo de pruebas) con tarjetas oficiales de Mercado Pago Colombia.
 * - Generación de preferencias de pago con ID único de transacción.
 * - Simulación y procesamiento de pagos aprobados, pendientes o rechazados.
 * - Desacopla la lógica de pasarela de pago de la vista de recibo.
 */

// Tarjetas de prueba oficiales de Mercado Pago (Sandbox Colombia)
export const SANDBOX_TEST_CARDS = [
  {
    id: 'card_visa_approved',
    brand: 'Visa',
    number: '4242 •••• •••• 4242',
    rawNumber: '4242424242424242',
    holderName: 'APROBADO MEDELLIN',
    expiry: '11/29',
    cvv: '123',
    expectedStatus: 'approved',
    statusDescription: 'Pago acreditado inmediatamente en modo Sandbox',
  },
  {
    id: 'card_mc_approved',
    brand: 'Mastercard',
    number: '5031 •••• •••• 0404',
    rawNumber: '5031755734530404',
    holderName: 'APROBADO BOGOTA',
    expiry: '08/30',
    cvv: '789',
    expectedStatus: 'approved',
    statusDescription: 'Pago aprobado satisfactoriamente por la entidad bancaria',
  },
  {
    id: 'card_visa_rejected',
    brand: 'Visa (Fondos insuficientes)',
    number: '4038 •••• •••• 0002',
    rawNumber: '4038000000000002',
    holderName: 'RECHAZADO FONDOS',
    expiry: '12/28',
    cvv: '456',
    expectedStatus: 'rejected',
    statusDescription: 'Fondos insuficientes en la tarjeta de prueba',
  },
];

/**
 * Genera una preferencia de cobro para Mercado Pago Checkout Pro.
 * 
 * @param {Object} params
 * @param {string} params.tripId - Identificador del viaje
 * @param {number} params.amount - Monto total en COP
 * @param {string} [params.description] - Detalle del viaje
 * @param {string} [params.payerEmail] - Correo del pasajero
 * @returns {Promise<Object>} Preferencia de pago creada con preferenceId y checkoutUrl
 */
export async function createPaymentPreference({ tripId, amount, description, payerEmail }) {
  const timestamp = Date.now();
  const preferenceId = `PREF-MP-${tripId || 'TRIP'}-${timestamp}`;

  return {
    preferenceId,
    tripId: tripId || `trip_${timestamp}`,
    amount: Math.round(Number(amount) || 0),
    currency: 'COP',
    description: description || 'Servicio de transporte UberClone Conductor',
    payerEmail: payerEmail || 'pasajero.demo@mercadopago.com',
    sandboxInitPoint: `https://sandbox.mercadopago.com.co/checkout/v1/redirect?pref_id=${preferenceId}`,
    createdAt: new Date().toISOString(),
    status: 'created',
  };
}

/**
 * Procesa un pago en entorno Sandbox de Mercado Pago con una tarjeta seleccionada.
 * 
 * @param {Object} params
 * @param {string} params.preferenceId - ID de la preferencia
 * @param {Object} params.card - Tarjeta de prueba seleccionada (de SANDBOX_TEST_CARDS o personalizada)
 * @param {number} params.amount - Monto total cobrado
 * @returns {Promise<Object>} Resultado del pago procesado
 */
export async function processSandboxPayment({ preferenceId, card, amount }) {
  // Simular latencia de red de pasarela (700ms)
  await new Promise((resolve) => setTimeout(resolve, 700));

  const chosenCard = card || SANDBOX_TEST_CARDS[0];
  const isApproved = chosenCard.expectedStatus !== 'rejected';
  const paymentId = `MP-PAY-${Date.now()}`;

  if (!isApproved) {
    return {
      success: false,
      paymentId,
      preferenceId,
      paymentStatus: 'rejected',
      statusDetail: 'cc_rejected_insufficient_amount',
      statusMessage: 'Pago rechazado: ' + (chosenCard.statusDescription || 'Fondos insuficientes'),
      amount: Math.round(Number(amount) || 0),
      paymentMethod: 'mercadopago',
      cardBrand: chosenCard.brand || 'Tarjeta de prueba',
      lastFourDigits: (chosenCard.rawNumber || '0000').slice(-4),
      processedAt: new Date().toISOString(),
    };
  }

  return {
    success: true,
    paymentId,
    preferenceId,
    paymentStatus: 'approved',
    statusDetail: 'accredited',
    statusMessage: 'Pago aprobado y acreditado exitosamente por Mercado Pago',
    amount: Math.round(Number(amount) || 0),
    paymentMethod: 'mercadopago',
    cardBrand: chosenCard.brand || 'Visa',
    lastFourDigits: (chosenCard.rawNumber || '4242').slice(-4),
    processedAt: new Date().toISOString(),
  };
}

/**
 * Traduce y formatea visualmente el estado devuelto por Mercado Pago.
 * 
 * @param {string} status - 'approved' | 'in_process' | 'rejected' | 'pending' | 'cash'
 * @returns {Object} Configuración visual con texto, color y badge
 */
export function formatPaymentStatusBadge(status) {
  const norm = String(status || '').toLowerCase().trim();

  switch (norm) {
    case 'approved':
    case 'aprobado':
      return {
        label: 'Aprobado',
        color: '#15803D',
        bgColor: '#DCFCE7',
        borderColor: '#86EFAC',
        icon: 'checkmark-circle',
      };
    case 'in_process':
    case 'pending':
    case 'pendiente':
      return {
        label: 'Pendiente',
        color: '#B45309',
        bgColor: '#FEF3C7',
        borderColor: '#FDE68A',
        icon: 'time',
      };
    case 'rejected':
    case 'rechazado':
      return {
        label: 'Rechazado',
        color: '#B91C1C',
        bgColor: '#FEE2E2',
        borderColor: '#FCA5A5',
        icon: 'close-circle',
      };
    case 'cash':
    case 'efectivo':
    default:
      return {
        label: 'Efectivo',
        color: '#15803D',
        bgColor: '#F0FDF4',
        borderColor: '#BBF7D0',
        icon: 'cash-outline',
      };
  }
}

export default {
  SANDBOX_TEST_CARDS,
  createPaymentPreference,
  processSandboxPayment,
  formatPaymentStatusBadge,
};
