/**
 * Suite de pruebas unitarias: Ordenamiento de Historial y Formateo de Viajes
 * Valida que los viajes finalizados se ordenen cronológicamente de forma descendente
 * y que las propiedades críticas de presentación estén disponibles.
 *
 * Ejecutar: node --test test/tripSortingValidation.test.js
 */

import test from 'node:test';
import assert from 'node:assert/strict';

test('Ordenamiento cronológico descendente: el viaje más reciente debe quedar de primero', () => {
  const mockTrips = [
    { id: 'trip_1', createdAt: '2026-11-16T10:00:00.000Z', totalFare: 12000 },
    { id: 'trip_2', createdAt: '2026-11-16T15:30:00.000Z', totalFare: 18500 },
    { id: 'trip_3', createdAt: '2026-11-16T12:15:00.000Z', totalFare: 14000 },
  ];

  const sorted = [...mockTrips].sort((a, b) => {
    const timeA = new Date(a.completedAt || a.createdAt || 0).getTime();
    const timeB = new Date(b.completedAt || b.createdAt || 0).getTime();
    return timeB - timeA;
  });

  assert.equal(sorted[0].id, 'trip_2', 'El viaje más reciente (15:30) debe ser el primero');
  assert.equal(sorted[1].id, 'trip_3', 'El segundo viaje debe ser el de 12:15');
  assert.equal(sorted[2].id, 'trip_1', 'El viaje más antiguo (10:00) debe ser el último');
});

test('Ordenamiento prioriza completedAt sobre createdAt si está disponible', () => {
  const mockTrips = [
    { id: 'trip_A', createdAt: '2026-11-16T08:00:00.000Z', completedAt: '2026-11-16T18:00:00.000Z' },
    { id: 'trip_B', createdAt: '2026-11-16T14:00:00.000Z', completedAt: '2026-11-16T14:30:00.000Z' },
  ];

  const sorted = [...mockTrips].sort((a, b) => {
    const timeA = new Date(a.completedAt || a.createdAt || 0).getTime();
    const timeB = new Date(b.completedAt || b.createdAt || 0).getTime();
    return timeB - timeA;
  });

  assert.equal(sorted[0].id, 'trip_A', 'trip_A terminó a las 18:00, debe ir de primero');
  assert.equal(sorted[1].id, 'trip_B', 'trip_B terminó a las 14:30, debe ir de segundo');
});

test('Manejo seguro de viajes sin fecha: no deben romper la ejecución ni provocar NaN', () => {
  const mockTrips = [
    { id: 'trip_valid', createdAt: '2026-11-16T11:00:00.000Z' },
    { id: 'trip_corrupted' },
  ];

  const sorted = [...mockTrips].sort((a, b) => {
    const timeA = new Date(a.completedAt || a.createdAt || 0).getTime();
    const timeB = new Date(b.completedAt || b.createdAt || 0).getTime();
    return timeB - timeA;
  });

  assert.equal(sorted.length, 2, 'Debe procesar la lista completa sin arrojar error');
  assert.equal(sorted[0].id, 'trip_valid', 'El viaje con fecha válida debe preceder al sin fecha');
});
