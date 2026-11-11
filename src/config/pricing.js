/**
 * Módulo de Configuración de Tarifas y Precios de la Plataforma (pricing.js).
 * Estructurado según las directrices académicas del proyecto UberClone Conductor:
 * - Define las reglas tarifarias por categoría de vehículo (Economy, XL, Premium).
 * - Calcula el valor total del viaje, la comisión de la plataforma y las ganancias netas del conductor.
 * - Formatea monedas en pesos colombianos (COP).
 */

export const PRICING_TIERS = {
  economy: {
    id: 'economy',
    name: 'Uber Economy',
    description: 'Viajes cotidianos asequibles en vehículos estándar',
    baseFare: 4500, // Tarifa base de arranque
    perKmRate: 1200, // Costo por kilómetro recorrido
    perMinuteRate: 250, // Costo por minuto estimado
    minimumFare: 6500, // Tarifa mínima del servicio
    platformCommissionRate: 0.15, // 15% retenido por la plataforma
  },
  xl: {
    id: 'xl',
    name: 'Uber XL',
    description: 'Camionetas y vehículos de capacidad extendida (mín. 6 puestos)',
    baseFare: 7000,
    perKmRate: 1800,
    perMinuteRate: 350,
    minimumFare: 10000,
    platformCommissionRate: 0.15, // 15% retenido por la plataforma
  },
  premium: {
    id: 'premium',
    name: 'Uber Premium',
    description: 'Vehículos de alta gama con mayor confort y atención preferencial',
    baseFare: 9000,
    perKmRate: 2400,
    perMinuteRate: 500,
    minimumFare: 14000,
    platformCommissionRate: 0.20, // 20% retenido por la plataforma
  },
};

/**
 * Retorna la configuración tarifaria para una categoría dada.
 * Si la categoría no existe, retorna por defecto 'economy'.
 * 
 * @param {string} category - 'economy' | 'xl' | 'premium'
 * @returns {Object} Configuración del tier
 */
export function getCategoryPricing(category) {
  const key = String(category || '').toLowerCase().trim();
  return PRICING_TIERS[key] || PRICING_TIERS.economy;
}

/**
 * Formatea un valor numérico a moneda colombiana (COP) con separador de miles.
 * Ejemplo: 15400 -> "$ 15.400"
 * 
 * @param {number} amount
 * @returns {string}
 */
export function formatCOP(amount) {
  const numeric = Math.round(Number(amount) || 0);
  const formatted = numeric.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `$ ${formatted}`;
}

/**
 * Calcula la liquidación completa de un viaje.
 * 
 * @param {string} category - Categoría del servicio
 * @param {number} distanceKm - Distancia en kilómetros
 * @param {number} durationMinutes - Duración en minutos
 * @param {number} [surgeMultiplier=1.0] - Multiplicador de tarifa dinámica
 * @returns {Object} Desglose completo de cobro y liquidación del conductor
 */
export function calculateTripFare(category, distanceKm, durationMinutes, surgeMultiplier = 1.0) {
  const tier = getCategoryPricing(category);
  const dist = Math.max(0, Number(distanceKm) || 0);
  const time = Math.max(0, Number(durationMinutes) || 0);
  const surge = Math.max(1.0, Number(surgeMultiplier) || 1.0);

  // 1. Costos individuales
  const distanceCost = Math.round(dist * tier.perKmRate);
  const timeCost = Math.round(time * tier.perMinuteRate);
  const subtotalBeforeSurge = tier.baseFare + distanceCost + timeCost;

  // 2. Aplicación de tarifa dinámica y regla de tarifa mínima
  const totalWithSurge = Math.round(subtotalBeforeSurge * surge);
  const finalTotalFare = Math.max(tier.minimumFare, totalWithSurge);

  // 3. Liquidación: Comisión de la plataforma y ganancia neta del conductor
  const platformFee = Math.round(finalTotalFare * tier.platformCommissionRate);
  const driverEarnings = finalTotalFare - platformFee;

  return {
    category: tier.id,
    categoryName: tier.name,
    baseFare: tier.baseFare,
    distanceKm: Number(dist.toFixed(1)),
    durationMinutes: Math.round(time),
    surgeMultiplier: surge,
    distanceCost,
    timeCost,
    totalFare: finalTotalFare,
    platformFee,
    driverEarnings,
    formattedTotal: formatCOP(finalTotalFare),
    formattedDriverEarnings: formatCOP(driverEarnings),
    formattedPlatformFee: formatCOP(platformFee),
    isMinimumFareApplied: finalTotalFare === tier.minimumFare && totalWithSurge < tier.minimumFare,
  };
}

export default {
  PRICING_TIERS,
  getCategoryPricing,
  formatCOP,
  calculateTripFare,
};
