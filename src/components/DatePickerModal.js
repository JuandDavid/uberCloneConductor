import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../styles/theme';

import {
  MONTHS_ES,
  MONTHS_SHORT,
  DAYS_OF_WEEK,
  getDaysInMonth,
  getFirstDayOfWeek,
  parseDateString,
  formatDateString,
  formatReadableDate,
  calculateAge,
  calculateRemainingDays,
  isLegalAge,
  isSoatValid,
} from '../utils/dateUtils';

export {
  MONTHS_ES,
  MONTHS_SHORT,
  DAYS_OF_WEEK,
  getDaysInMonth,
  getFirstDayOfWeek,
  parseDateString,
  formatDateString,
  formatReadableDate,
  calculateAge,
  calculateRemainingDays,
  isLegalAge,
  isSoatValid,
};

export function DatePickerModal({
  visible,
  onClose,
  onSelect,
  initialDate,
  title = 'Seleccionar Fecha',
  mode = 'general', // 'birthDate' | 'futureDate' | 'general'
}) {
  const currentYear = new Date().getFullYear();
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' | 'months' | 'years'

  const parsed = useMemo(() => parseDateString(initialDate), [initialDate]);

  const [selectedYear, setSelectedYear] = useState(parsed.year);
  const [selectedMonth, setSelectedMonth] = useState(parsed.month);
  const [selectedDay, setSelectedDay] = useState(parsed.day);

  // Sincronizar fecha al abrir el modal
  useEffect(() => {
    if (visible) {
      const p = parseDateString(initialDate);
      setSelectedYear(p.year);
      setSelectedMonth(p.month);
      setSelectedDay(p.day);
      setViewMode('calendar');
    }
  }, [visible, initialDate]);

  // Rangos de años según el modo
  const { minYear, maxYear } = useMemo(() => {
    if (mode === 'birthDate') {
      return { minYear: 1950, maxYear: currentYear - 18 };
    }
    if (mode === 'futureDate') {
      return { minYear: currentYear, maxYear: currentYear + 10 };
    }
    return { minYear: 1950, maxYear: currentYear + 10 };
  }, [mode, currentYear]);

  // Años disponibles en orden descendente o ascendente
  const availableYears = useMemo(() => {
    const list = [];
    if (mode === 'birthDate') {
      for (let y = maxYear; y >= minYear; y--) list.push(y);
    } else {
      for (let y = minYear; y <= maxYear; y++) list.push(y);
    }
    return list;
  }, [minYear, maxYear, mode]);

  // Cálculo de edad para fecha de nacimiento
  const calculatedAge = useMemo(() => {
    if (mode !== 'birthDate') return null;
    const today = new Date();
    let age = today.getFullYear() - selectedYear;
    const m = today.getMonth() + 1 - selectedMonth;
    if (m < 0 || (m === 0 && today.getDate() < selectedDay)) {
      age--;
    }
    return age;
  }, [mode, selectedYear, selectedMonth, selectedDay]);

  // Cálculo de días de vigencia restante para fechas futuras (ej: SOAT)
  const daysRemaining = useMemo(() => {
    if (mode !== 'futureDate') return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expDate = new Date(selectedYear, selectedMonth - 1, selectedDay);
    expDate.setHours(0, 0, 0, 0);
    const diff = expDate.getTime() - today.getTime();
    return Math.round(diff / (1000 * 60 * 60 * 24));
  }, [mode, selectedYear, selectedMonth, selectedDay]);

  // Validación de fecha permitida
  const isValidSelection = useMemo(() => {
    if (mode === 'birthDate') {
      return calculatedAge !== null && calculatedAge >= 18;
    }
    if (mode === 'futureDate') {
      return daysRemaining !== null && daysRemaining >= 1;
    }
    return true;
  }, [mode, calculatedAge, daysRemaining]);

  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      if (selectedYear > minYear) {
        setSelectedYear((y) => y - 1);
        setSelectedMonth(12);
      }
    } else {
      setSelectedMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      if (selectedYear < maxYear) {
        setSelectedYear((y) => y + 1);
        setSelectedMonth(1);
      }
    } else {
      setSelectedMonth((m) => m + 1);
    }
  };

  const handleConfirm = () => {
    const maxDays = getDaysInMonth(selectedYear, selectedMonth);
    const validDay = Math.min(selectedDay, maxDays);
    const dateFormatted = formatDateString(selectedYear, selectedMonth, validDay);
    onSelect(dateFormatted);
    onClose();
  };

  const renderDaysGrid = () => {
    const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);
    const firstDayIndex = getFirstDayOfWeek(selectedYear, selectedMonth);
    const cells = [];

    for (let i = 0; i < firstDayIndex; i++) {
      cells.push(<View key={`empty-${i}`} style={styles.dayCellEmpty} />);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const isSelected = d === selectedDay;
      cells.push(
        <TouchableOpacity
          key={`day-${d}`}
          style={[styles.dayCell, isSelected && styles.dayCellSelected]}
          onPress={() => setSelectedDay(d)}
          activeOpacity={0.7}
        >
          <Text style={[styles.dayText, isSelected && styles.dayTextSelected]}>
            {d}
          </Text>
        </TouchableOpacity>
      );
    }

    return (
      <View style={styles.calendarContainer}>
        <View style={styles.weekRow}>
          {DAYS_OF_WEEK.map((dName) => (
            <Text key={dName} style={styles.weekDayText}>
              {dName}
            </Text>
          ))}
        </View>
        <View style={styles.daysWrap}>{cells}</View>
      </View>
    );
  };

  const renderMonthsGrid = () => (
    <View style={styles.monthsGrid}>
      {MONTHS_SHORT.map((mName, idx) => {
        const monthNum = idx + 1;
        const isSelected = monthNum === selectedMonth;
        return (
          <TouchableOpacity
            key={mName}
            style={[styles.monthCell, isSelected && styles.monthCellSelected]}
            onPress={() => {
              setSelectedMonth(monthNum);
              setViewMode('calendar');
            }}
            activeOpacity={0.7}
          >
            <Text style={[styles.monthCellText, isSelected && styles.monthCellTextSelected]}>
              {MONTHS_ES[idx]}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderYearsGrid = () => (
    <ScrollView style={styles.yearsScrollView} showsVerticalScrollIndicator={true}>
      <View style={styles.yearsGrid}>
        {availableYears.map((yr) => {
          const isSelected = yr === selectedYear;
          return (
            <TouchableOpacity
              key={`yr-${yr}`}
              style={[styles.yearCell, isSelected && styles.yearCellSelected]}
              onPress={() => {
                setSelectedYear(yr);
                setViewMode('calendar');
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.yearCellText, isSelected && styles.yearCellTextSelected]}>
                {yr}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Cabecera del selector */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Ionicons name="calendar" size={20} color={colors.black} />
              <Text style={styles.modalTitle}>{title}</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Fecha seleccionada y estado de vigencia/edad */}
          <View style={styles.previewBox}>
            <Text style={styles.previewDateText}>
              {formatReadableDate(selectedYear, selectedMonth, selectedDay)}
            </Text>

            {mode === 'birthDate' && calculatedAge !== null && (
              <View
                style={[
                  styles.statusBadge,
                  calculatedAge >= 18 ? styles.statusBadgeValid : styles.statusBadgeInvalid,
                ]}
              >
                <Ionicons
                  name={calculatedAge >= 18 ? 'checkmark-circle' : 'alert-circle'}
                  size={15}
                  color={calculatedAge >= 18 ? '#15803D' : '#BE123C'}
                />
                <Text
                  style={[
                    styles.statusBadgeText,
                    calculatedAge >= 18 ? styles.statusTextValid : styles.statusTextInvalid,
                  ]}
                >
                  {calculatedAge >= 18
                    ? `${calculatedAge} años`
                    : `${calculatedAge} años (debes ser mayor de 18)`}
                </Text>
              </View>
            )}

            {mode === 'futureDate' && daysRemaining !== null && (
              <View
                style={[
                  styles.statusBadge,
                  daysRemaining >= 1 ? styles.statusBadgeValid : styles.statusBadgeInvalid,
                ]}
              >
                <Ionicons
                  name={daysRemaining >= 1 ? 'shield-checkmark' : 'alert-circle'}
                  size={15}
                  color={daysRemaining >= 1 ? '#15803D' : '#BE123C'}
                />
                <Text
                  style={[
                    styles.statusBadgeText,
                    daysRemaining >= 1 ? styles.statusTextValid : styles.statusTextInvalid,
                  ]}
                >
                  {daysRemaining >= 1
                    ? `Vigente (${daysRemaining} días restantes)`
                    : 'Póliza vencida o sin vigencia'}
                </Text>
              </View>
            )}
          </View>

          {/* Barra de navegación de mes y año */}
          <View style={styles.navBar}>
            <TouchableOpacity
              style={styles.navArrow}
              onPress={handlePrevMonth}
              disabled={viewMode !== 'calendar'}
            >
              <Ionicons
                name="chevron-back"
                size={20}
                color={viewMode === 'calendar' ? colors.black : colors.border}
              />
            </TouchableOpacity>

            <View style={styles.navPillsRow}>
              <TouchableOpacity
                style={[styles.navPill, viewMode === 'months' && styles.navPillActive]}
                onPress={() => setViewMode(viewMode === 'months' ? 'calendar' : 'months')}
                activeOpacity={0.7}
              >
                <Text style={[styles.navPillText, viewMode === 'months' && styles.navPillTextActive]}>
                  {MONTHS_ES[selectedMonth - 1]}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.navPill, viewMode === 'years' && styles.navPillActive]}
                onPress={() => setViewMode(viewMode === 'years' ? 'calendar' : 'years')}
                activeOpacity={0.7}
              >
                <Text style={[styles.navPillText, viewMode === 'years' && styles.navPillTextActive]}>
                  {selectedYear}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.navArrow}
              onPress={handleNextMonth}
              disabled={viewMode !== 'calendar'}
            >
              <Ionicons
                name="chevron-forward"
                size={20}
                color={viewMode === 'calendar' ? colors.black : colors.border}
              />
            </TouchableOpacity>
          </View>

          {/* Contenido según el modo de vista */}
          <View style={styles.bodyContainer}>
            {viewMode === 'calendar' && renderDaysGrid()}
            {viewMode === 'months' && renderMonthsGrid()}
            {viewMode === 'years' && renderYearsGrid()}
          </View>

          {/* Botones de acción */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.7}>
              <Text style={styles.cancelBtnText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmBtn, !isValidSelection && styles.confirmBtnDisabled]}
              onPress={handleConfirm}
              disabled={!isValidSelection}
              activeOpacity={0.8}
            >
              <Text style={[styles.confirmBtnText, !isValidSelection && styles.confirmBtnTextDisabled]}>
                Aceptar
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  previewBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  previewDateText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 6,
    textAlign: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeValid: {
    backgroundColor: '#DCFCE7',
  },
  statusBadgeInvalid: {
    backgroundColor: '#FFE4E6',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  statusTextValid: {
    color: '#15803D',
  },
  statusTextInvalid: {
    color: '#BE123C',
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    paddingHorizontal: 4,
  },
  navArrow: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  navPillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  navPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  navPillActive: {
    backgroundColor: colors.black,
    borderColor: colors.black,
  },
  navPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  navPillTextActive: {
    color: colors.white,
  },
  bodyContainer: {
    minHeight: 235,
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  calendarContainer: {
    width: '100%',
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 6,
  },
  weekDayText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    width: 36,
    textAlign: 'center',
  },
  daysWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCellEmpty: {
    width: `${100 / 7}%`,
    height: 36,
  },
  dayCell: {
    width: `${100 / 7}%`,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    marginVertical: 2,
  },
  dayCellSelected: {
    backgroundColor: colors.black,
  },
  dayText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  dayTextSelected: {
    color: colors.white,
    fontWeight: '800',
  },
  monthsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    paddingVertical: spacing.xs,
  },
  monthCell: {
    width: '30%',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  monthCellSelected: {
    backgroundColor: colors.black,
    borderColor: colors.black,
  },
  monthCellText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  monthCellTextSelected: {
    color: colors.white,
    fontWeight: '800',
  },
  yearsScrollView: {
    maxHeight: 220,
  },
  yearsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    paddingVertical: spacing.xs,
  },
  yearCell: {
    width: '22%',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  yearCellSelected: {
    backgroundColor: colors.black,
    borderColor: colors.black,
  },
  yearCellText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  yearCellTextSelected: {
    color: colors.white,
    fontWeight: '800',
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  confirmBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: colors.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnDisabled: {
    backgroundColor: '#E2E8F0',
  },
  confirmBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.white,
  },
  confirmBtnTextDisabled: {
    color: colors.textMuted,
  },
});
