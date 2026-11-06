import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getDaysInMonth,
  getFirstDayOfWeek,
  parseDateString,
  formatDateString,
  formatReadableDate,
  calculateAge,
  calculateRemainingDays,
  isLegalAge,
  isSoatValid,
} from '../src/utils/dateUtils.js';

test('getDaysInMonth calcula correctamente los días para meses estándar y bisiestos', () => {
  assert.equal(getDaysInMonth(2024, 2), 29, 'Febrero 2024 bisiesto debe tener 29 días');
  assert.equal(getDaysInMonth(2025, 2), 28, 'Febrero 2025 debe tener 28 días');
  assert.equal(getDaysInMonth(2026, 1), 31, 'Enero debe tener 31 días');
  assert.equal(getDaysInMonth(2026, 4), 30, 'Abril debe tener 30 días');
});

test('getFirstDayOfWeek retorna el índice de día correcto (0 = Lunes, ..., 6 = Domingo)', () => {
  // 1 de Noviembre 2026 es Domingo -> índice 6
  assert.equal(getFirstDayOfWeek(2026, 11), 6);
  // 1 de Junio 2026 es Lunes -> índice 0
  assert.equal(getFirstDayOfWeek(2026, 6), 0);
});

test('parseDateString descompone correctamente fechas AAAA-MM-DD', () => {
  const res = parseDateString('2000-08-15');
  assert.deepEqual(res, { year: 2000, month: 8, day: 15 });

  const invalid = parseDateString('');
  assert.ok(invalid.year >= 2000, 'Debe retornar fecha por defecto si es vacía');
});

test('formatDateString genera formato ISO estándar AAAA-MM-DD con ceros a la izquierda', () => {
  assert.equal(formatDateString(2027, 4, 5), '2027-04-05');
  assert.equal(formatDateString(2025, 12, 31), '2025-12-31');
});

test('formatReadableDate genera texto en español natural y comprensible', () => {
  assert.equal(formatReadableDate(2026, 11, 5), '5 de Noviembre de 2026');
  assert.equal(formatReadableDate(2000, 1, 1), '1 de Enero de 2000');
});

test('calculateAge calcula correctamente la edad según el día de hoy', () => {
  const today = new Date();
  const year20Ago = today.getFullYear() - 20;
  assert.equal(calculateAge(year20Ago, today.getMonth() + 1, today.getDate()), 20);

  // Si aún no ha cumplido años este año (mañana)
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const yearNotYet = today.getFullYear() - 20;
  assert.equal(calculateAge(yearNotYet, tomorrow.getMonth() + 1, tomorrow.getDate()), 19);
});

test('Regla de mayoría de edad: isLegalAge exige mínimo 18 años cumplidos', () => {
  const today = new Date();
  const minorYear = today.getFullYear() - 17;
  const adultYear = today.getFullYear() - 19;

  assert.equal(isLegalAge(minorYear, today.getMonth() + 1, today.getDate()), false, '17 años no cumple mayoría de edad');
  assert.equal(isLegalAge(adultYear, today.getMonth() + 1, today.getDate()), true, '19 años cumple mayoría de edad');
});

test('Regla legal de vigencia de SOAT: isSoatValid exige mínimo 1 día restante', () => {
  const today = new Date();

  // Fecha de ayer (vencido)
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  assert.equal(isSoatValid(yesterday.getFullYear(), yesterday.getMonth() + 1, yesterday.getDate()), false, 'SOAT de ayer no tiene vigencia');

  // Fecha de hoy (vence hoy, 0 días restantes)
  assert.equal(isSoatValid(today.getFullYear(), today.getMonth() + 1, today.getDate()), false, 'SOAT que vence hoy debe ser rechazado');

  // Fecha de mañana (1 día de vigencia restante)
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  assert.equal(isSoatValid(tomorrow.getFullYear(), tomorrow.getMonth() + 1, tomorrow.getDate()), true, 'SOAT de mañana tiene 1 día de vigencia legal');

  // Fecha futura a 1 año
  const nextYear = new Date(today);
  nextYear.setFullYear(nextYear.getFullYear() + 1);
  assert.equal(isSoatValid(nextYear.getFullYear(), nextYear.getMonth() + 1, nextYear.getDate()), true, 'SOAT de próximo año tiene vigencia amplia');
});
