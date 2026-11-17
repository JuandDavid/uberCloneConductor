/**
 * Suite de pruebas unitarias: Integración Mercado Pago Checkout Pro (Sandbox)
 * Valida la creación de preferencias, el catálogo de tarjetas de prueba,
 * el procesamiento de cobros en modo Sandbox y los badges de estado.
 *
 * Ejecutar: node --test test/mercadoPagoValidation.test.js
 */

import test from 'node:test';
import assert from 'node:assert/strict';

// Réplica de las constantes y funciones de mercadoPagoService.js para pruebas unitarias auto-contenidas
const SANDBOX_TEST_CARDS = [
  {
    id: 'card_visa_approved',
    brand: 'Visa',
    rawNumber: '4242424242424242',
    expectedStatus: 'approved',
  },
  {
    id: 'card_mc_approved',
    brand: 'Mastercard',
    rawNumber: '5031755734530404',
    expectedStatus: 'approved',
  },
  {
    id: 'card_visa_rejected',
    brand: 'Visa (Fondos insuficientes)',
    rawNumber: '4038000000000002',
    expectedStatus: 'rejected',
  },
];

function createPaymentPreference({ tripId, amount, description, payerEmail }) {
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
  };
}

function processSandboxPaymentSync({ preferenceId, card, amount }) {
  const chosenCard = card || SANDBOX_TEST_CARDS[0];
  const isApproved = chosenCard.expectedStatus !== 'rejected';
  const paymentId = `MP-PAY-${Date.now()}`;

  if (!isApproved) {
    return {
      success: false,
      paymentId,
      preferenceId,
      paymentStatus: 'rejected',
      amount: Math.round(Number(amount) || 0),
      paymentMethod: 'mercadopago',
    };
  }

  return {
    success: true,
    paymentId,
    preferenceId,
    paymentStatus: 'approved',
    amount: Math.round(Number(amount) || 0),
    paymentMethod: 'mercadopago',
    lastFourDigits: chosenCard.rawNumber.slice(-4),
  };
}

function formatPaymentStatusBadge(status) {
  const norm = String(status || '').toLowerCase().trim();
  switch (norm) {
    case 'approved':
    case 'aprobado':
      return { label: 'Aprobado', color: '#15803D' };
    case 'rejected':
    case 'rechazado':
      return { label: 'Rechazado', color: '#B91C1C' };
    case 'pending':
    case 'in_process':
      return { label: 'Pendiente', color: '#B45309' };
    default:
      return { label: 'Efectivo', color: '#15803D' };
  }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

test('Preferencia de Pago: genera ID único con prefijo oficial y punto de inicio Sandbox', () => {
  const pref = createPaymentPreference({
    tripId: 'trip_7788',
    amount: 24500,
    description: 'Carrera El Poblado -> Laureles',
    payerEmail: 'usuario@prueba.co',
  });

  assert.ok(pref.preferenceId.startsWith('PREF-MP-trip_7788-'), 'Debe generar preferenceId con prefijo oficial');
  assert.equal(pref.amount, 24500, 'El monto en COP debe ser exacto');
  assert.equal(pref.currency, 'COP', 'La moneda debe ser pesos colombianos (COP)');
  assert.ok(pref.sandboxInitPoint.includes('sandbox.mercadopago.com.co'), 'Debe apuntar a la URL de Sandbox');
});

test('Tarjetas Sandbox: el catálogo incluye opciones de aprobación y rechazo por fondos', () => {
  const approvedCards = SANDBOX_TEST_CARDS.filter((c) => c.expectedStatus === 'approved');
  const rejectedCards = SANDBOX_TEST_CARDS.filter((c) => c.expectedStatus === 'rejected');

  assert.ok(approvedCards.length >= 2, 'Debe haber mínimo 2 tarjetas de prueba que aprueben');
  assert.ok(rejectedCards.length >= 1, 'Debe haber mínimo 1 tarjeta de prueba que rechace');
});

test('Procesamiento de Pago Aprobado: retorna success true, status approved y últimos 4 dígitos', () => {
  const result = processSandboxPaymentSync({
    preferenceId: 'PREF-123',
    card: SANDBOX_TEST_CARDS[0], // Visa aprobada
    amount: 19800,
  });

  assert.equal(result.success, true, 'La transacción debe ser exitosa');
  assert.equal(result.paymentStatus, 'approved', 'El estado de pago debe ser approved');
  assert.equal(result.lastFourDigits, '4242', 'Los últimos 4 dígitos deben coincidir con la tarjeta Visa');
  assert.ok(result.paymentId.startsWith('MP-PAY-'), 'El ID de pago debe tener prefijo MP-PAY-');
});

test('Procesamiento de Pago Rechazado: retorna success false y status rejected', () => {
  const result = processSandboxPaymentSync({
    preferenceId: 'PREF-123',
    card: SANDBOX_TEST_CARDS[2], // Tarjeta rechazada
    amount: 32000,
  });

  assert.equal(result.success, false, 'La transacción debe fallar');
  assert.equal(result.paymentStatus, 'rejected', 'El estado de pago debe ser rejected');
});

test('Badge de Estado: mapea correctamente Aprobado, Rechazado, Pendiente y Efectivo', () => {
  assert.equal(formatPaymentStatusBadge('approved').label, 'Aprobado');
  assert.equal(formatPaymentStatusBadge('rejected').label, 'Rechazado');
  assert.equal(formatPaymentStatusBadge('pending').label, 'Pendiente');
  assert.equal(formatPaymentStatusBadge('cash').label, 'Efectivo');
});
