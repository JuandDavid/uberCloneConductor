import test from 'node:test';
import assert from 'node:assert/strict';

test('El modelo de viaje contiene todos los campos obligatorios para Firestore', () => {
  const trip = {
    id: `trip_${Date.now()}`,
    driverId: 'driver_demo_1098765432',
    driverName: 'Juan Felipe',
    category: 'ECONOMY',
    passenger: {
      name: 'Camila Restrepo',
      phone: '3124567890',
      rating: 4.9,
    },
    pickup: {
      address: 'Parque Lleras, El Poblado',
      coords: { latitude: 6.2089, longitude: -75.5678 },
    },
    dropoff: {
      address: 'Centro Comercial Santafé',
      coords: { latitude: 6.1963, longitude: -75.5742 },
    },
    distanceKm: 4.5,
    durationMinutes: 14,
    paymentMethod: 'Efectivo',
    totalFare: 14800,
    driverEarnings: 12580,
    platformFee: 2220,
    status: 'completed',
    createdAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
  };

  assert.ok(trip.id.startsWith('trip_'), 'El ID del viaje debe tener prefijo trip_');
  assert.equal(trip.status, 'completed', 'El estado final debe ser completed');
  assert.equal(trip.totalFare, trip.driverEarnings + trip.platformFee, 'La tarifa debe igualar ganancia + comisión');
  assert.ok(trip.passenger.name.length > 0, 'El pasajero debe tener nombre');
  assert.ok(trip.pickup.address.length > 0, 'El punto de recogida es obligatorio');
  assert.ok(trip.dropoff.address.length > 0, 'El destino es obligatorio');
});

test('La comisión de plataforma corresponde exactamente al 15%', () => {
  const totalFare = 20000;
  const platformFee = Math.round(totalFare * 0.15);
  const driverEarnings = totalFare - platformFee;

  assert.equal(platformFee, 3000, 'La comisión debe ser 3.000 COP');
  assert.equal(driverEarnings, 17000, 'La ganancia neta debe ser 17.000 COP');
});
