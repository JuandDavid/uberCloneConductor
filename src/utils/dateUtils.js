/**
 * Utilidades para manejo de fechas, calendarios y validaciones legales
 * de conductores (mayoría de edad y vigencia de SOAT).
 */

export const MONTHS_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

export const MONTHS_SHORT = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
];

export const DAYS_OF_WEEK = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

/**
 * Retorna la cantidad de días que tiene un mes en un año específico (considera años bisiestos).
 */
export const getDaysInMonth = (year, month) => {
  return new Date(year, month, 0).getDate();
};

/**
 * Retorna el índice de día de semana para el primer día del mes (0 = Lunes, ..., 6 = Domingo).
 */
export const getFirstDayOfWeek = (year, month) => {
  const day = new Date(year, month - 1, 1).getDay();
  return (day + 6) % 7;
};

/**
 * Descompone una cadena AAAA-MM-DD en objeto con year, month y day numéricos.
 */
export const parseDateString = (dateStr) => {
  if (!dateStr || typeof dateStr !== 'string' || !dateStr.includes('-')) {
    const today = new Date();
    return {
      year: today.getFullYear(),
      month: today.getMonth() + 1,
      day: today.getDate(),
    };
  }
  const parts = dateStr.split('-');
  return {
    year: parseInt(parts[0], 10) || 2000,
    month: parseInt(parts[1], 10) || 1,
    day: parseInt(parts[2], 10) || 1,
  };
};

/**
 * Formatea valores numéricos en una cadena estándar ISO AAAA-MM-DD.
 */
export const formatDateString = (year, month, day) => {
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
};

/**
 * Formatea una fecha en texto legible en español (ej: "15 de Marzo de 2026").
 */
export const formatReadableDate = (year, month, day) => {
  const mName = MONTHS_ES[month - 1] || '';
  return `${day} de ${mName} de ${year}`;
};

/**
 * Calcula la edad exacta de una persona en años cumplidos.
 */
export const calculateAge = (year, month, day) => {
  const today = new Date();
  let age = today.getFullYear() - year;
  const m = today.getMonth() + 1 - month;
  if (m < 0 || (m === 0 && today.getDate() < day)) {
    age--;
  }
  return age;
};

/**
 * Calcula los días de vigencia restante para una fecha futura respecto a hoy a las 00:00:00.
 */
export const calculateRemainingDays = (year, month, day) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const targetDate = new Date(year, month - 1, day);
  targetDate.setHours(0, 0, 0, 0);
  const diffTime = targetDate.getTime() - today.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Valida si una persona tiene al menos 18 años cumplidos.
 */
export const isLegalAge = (year, month, day) => {
  return calculateAge(year, month, day) >= 18;
};

/**
 * Valida si el SOAT tiene al menos 1 día de vigencia legal restante (la ley no permite pólizas que vencen hoy o vencidas).
 */
export const isSoatValid = (year, month, day) => {
  return calculateRemainingDays(year, month, day) >= 1;
};
