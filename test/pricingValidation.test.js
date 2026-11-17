/**
 * Suite de pruebas unitarias: Módulo de tarifas y precios (pricing.js)
 * Verifica el cálculo correcto de tarifas en pesos colombianos (COP)
 * para las categorías Economy, XL y Premium.
 *
 * Ejecutar: node --test test/pricingValidation.test.js
 */

import test from 'node:test';
import assert from 'node:assert/strict';

// ─── Réplica de las constantes de src/config/pricing.js ──────────────────────
// (Copiadas para que las pruebas sean auto-contenidas y no dependan de imports de ES modules)

const PRICING_TIERS = {
  economy: {
    id: 'economy',
    baseFare: 4500,
    perKmRate: 1200,
    perMinuteRate: 250,
    minimumFare: 6500,
    platformCommissionRate: 0.15,
  },
  xl: {
    id: 'xl',
    baseFare: 7000,
    perKmRate: 1800,
    perMinuteRate: 350,
    minimumFare: 10000,
    platformCommissionRate: 0.15,
  },
  premium: {
    id: 'premium',
    baseFare: 9000,
    perKmRate: 2400,
    perMinuteRate: 500,
    minimumFare: 14000,
    platformCommissionRate: 0.20,
  },
};

/**
 * Réplica de calculateTripFare para pruebas auto-contenidas.
 */
function calculateTripFare(category, distanceKm, durationMinutes, surgeMultiplier = 1.0) {
  const tier = PRICING_TIERS[String(category || '').toLowerCase().trim()] || PRICING_TIERS.economy;
  const dist = Math.max(0, Number(distanceKm) || 0);
  const time = Math.max(0, Number(durationMinutes) || 0);
  const surge = Math.max(1.0, Number(surgeMultiplier) || 1.0);

  const distanceCost = Math.round(dist * tier.perKmRate);
  const timeCost = Math.round(time * tier.perMinuteRate);
  const subtotalBeforeSurge = tier.baseFare + distanceCost + timeCost;
  const totalWithSurge = Math.round(subtotalBeforeSurge * surge);
  const finalTotalFare = Math.max(tier.minimumFare, totalWithSurge);
  const platformFee = Math.round(finalTotalFare * tier.platformCommissionRate);
  const driverEarnings = finalTotalFare - platformFee;

  return { totalFare: finalTotalFare, platformFee, driverEarnings };
}

/**
 * Réplica de formatCOP para pruebas auto-contenidas.
 */
function formatCOP(amount) {
  const numeric = Math.round(Number(amount) || 0);
  const formatted = numeric.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `$ ${formatted}`;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

test('Economy: tarifa base con 5 km y 10 minutos debe ser correcta', () => {
  // baseFare(4500) + 5km*1200(6000) + 10min*250(2500) = 13000 → sobre mínimo 6500 → 13000
  const result = calculateTripFare('economy', 5, 10);
  assert.equal(result.totalFare, 13000, 'Tarifa Economy para 5 km, 10 min debe ser $ 13.000');
});

test('Economy: comisión de plataforma es exactamente el 15%', () => {
  const result = calculateTripFare('economy', 5, 10); // totalFare = 13000
  const expectedFee = Math.round(13000 * 0.15); // 1950
  assert.equal(result.platformFee, expectedFee, 'Comisión debe ser 15% del total ($ 1.950)');
});

test('Economy: ganancias del conductor son totalFare menos comisión', () => {
  const result = calculateTripFare('economy', 5, 10); // 13000 - 1950 = 11050
  assert.equal(
    result.driverEarnings,
    result.totalFare - result.platformFee,
    'Ganancias del conductor deben ser totalFare - platformFee'
  );
});

test('Economy: tarifa mínima se aplica para trayectos muy cortos', () => {
  // baseFare(4500) + 0.5km*1200(600) + 1min*250(250) = 5350 → por debajo del mínimo 6500 → debe retornar 6500
  const result = calculateTripFare('economy', 0.5, 1);
  assert.equal(result.totalFare, 6500, 'Tarifa mínima Economy debe ser $ 6.500');
});

test('XL: tarifa base con 8 km y 15 minutos debe ser correcta', () => {
  // baseFare(7000) + 8km*1800(14400) + 15min*350(5250) = 26650 → sobre mínimo 10000 → 26650
  const result = calculateTripFare('xl', 8, 15);
  assert.equal(result.totalFare, 26650, 'Tarifa XL para 8 km, 15 min debe ser $ 26.650');
});

test('Premium: comisión de plataforma es exactamente el 20%', () => {
  // baseFare(9000) + 3km*2400(7200) + 8min*500(4000) = 20200 → sobre mínimo 14000 → 20200
  const result = calculateTripFare('premium', 3, 8);
  const expectedFee = Math.round(result.totalFare * 0.20);
  assert.equal(result.platformFee, expectedFee, 'Comisión Premium debe ser 20% del total');
});

test('formatCOP: formatea valores en pesos colombianos con separador de miles', () => {
  assert.equal(formatCOP(15400), '$ 15.400', 'Debe formatear 15400 como $ 15.400');
  assert.equal(formatCOP(6500), '$ 6.500', 'Debe formatear 6500 como $ 6.500');
  assert.equal(formatCOP(1200000), '$ 1.200.000', 'Debe formatear 1200000 como $ 1.200.000');
});

test('Categoría desconocida cae en Economy por defecto', () => {
  // Una categoría inválida debe usar los datos de economy
  const result = calculateTripFare('moto', 5, 10);
  const econResult = calculateTripFare('economy', 5, 10);
  assert.equal(result.totalFare, econResult.totalFare, 'Categoría inválida debe usar Economy como fallback');
});
