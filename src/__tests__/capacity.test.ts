import { workingDaysInRange, absenceDaysInRange, fmt } from '@/lib/capacity'

const NO_PH = new Set<string>()

describe('workingDaysInRange', () => {
  test('une semaine complète lun–ven = 5 jours', () => {
    // 2026-01-05 (lun) → 2026-01-09 (ven)
    expect(workingDaysInRange('2026-01-05', '2026-01-09', NO_PH)).toBe(5)
  })

  test('inclut lundi et vendredi, exclut sam et dim', () => {
    // 2026-01-05 (lun) → 2026-01-11 (dim) = 5 jours
    expect(workingDaysInRange('2026-01-05', '2026-01-11', NO_PH)).toBe(5)
  })

  test('un seul jour ouvré', () => {
    expect(workingDaysInRange('2026-01-05', '2026-01-05', NO_PH)).toBe(1)
  })

  test('un samedi seul = 0 jour', () => {
    // 2026-01-03 est un samedi
    expect(workingDaysInRange('2026-01-03', '2026-01-03', NO_PH)).toBe(0)
  })

  test('déduit les jours fériés tombant en semaine', () => {
    // 2026-01-01 (jeudi) = Jour de l'An
    const ph = new Set(['2026-01-01'])
    // Semaine du 29 déc → 2 jan : 4 jours ouvrés (01 jan exclu)
    expect(workingDaysInRange('2025-12-29', '2026-01-02', ph)).toBe(4)
  })

  test('jour férié tombant un dimanche ne change rien', () => {
    // 2026-11-01 (dim) = Toussaint
    const ph = new Set(['2026-11-01'])
    expect(workingDaysInRange('2026-10-26', '2026-11-01', NO_PH)).toBe(5)
    expect(workingDaysInRange('2026-10-26', '2026-11-01', ph)).toBe(5)
  })

  test('startDate === endDate un jour férié = 0 jour', () => {
    const ph = new Set(['2026-05-01'])
    expect(workingDaysInRange('2026-05-01', '2026-05-01', ph)).toBe(0)
  })

  test('mois de janvier 2026 complet', () => {
    // Jan 2026 : 22 jours ouvrés (pas de JF en dehors du 1er jan)
    // 1er jan = jeudi, donc semaine 1 = 4 jours, puis 3 semaines complètes = 15, dernière = 4 → 4+15+4 - 1(JF) = 22
    const ph = new Set(['2026-01-01'])
    expect(workingDaysInRange('2026-01-01', '2026-01-31', ph)).toBe(21)
  })
})

describe('absenceDaysInRange', () => {
  test('absence entièrement dans la plage', () => {
    expect(absenceDaysInRange('2026-01-05', '2026-01-09', '2026-01-01', '2026-01-31', NO_PH)).toBe(5)
  })

  test('absence débordant avant la plage', () => {
    // absence 28 déc → 5 jan, plage 1→31 jan
    // intersection : 1 jan (jeu), 2 jan (ven), 5 jan (lun) = 3 jours
    expect(absenceDaysInRange('2025-12-28', '2026-01-05', '2026-01-01', '2026-01-31', NO_PH)).toBe(3)
  })

  test('absence débordant après la plage', () => {
    // absence 28→31 jan, plage 1→30 jan → 28,29,30 = 3 jours
    expect(absenceDaysInRange('2026-01-28', '2026-01-31', '2026-01-01', '2026-01-30', NO_PH)).toBe(3)
  })

  test('absence sans intersection = 0', () => {
    expect(absenceDaysInRange('2026-02-01', '2026-02-28', '2026-01-01', '2026-01-31', NO_PH)).toBe(0)
  })

  test('absence sur week-end = 0 jour', () => {
    // 2026-01-03 (sam) → 2026-01-04 (dim)
    expect(absenceDaysInRange('2026-01-03', '2026-01-04', '2026-01-01', '2026-01-31', NO_PH)).toBe(0)
  })

  test('exclut le jour férié pendant l\'absence', () => {
    // 2026-05-01 (ven) = Fête du Travail
    const ph = new Set(['2026-05-01'])
    // absence 27 avr (lun) → 1er mai (ven) = 4 jours (mai exclu)
    expect(absenceDaysInRange('2026-04-27', '2026-05-01', '2026-04-01', '2026-05-31', ph)).toBe(4)
  })

  test('un seul jour, jour ouvré', () => {
    expect(absenceDaysInRange('2026-01-05', '2026-01-05', '2026-01-01', '2026-01-31', NO_PH)).toBe(1)
  })
})

describe('fmt', () => {
  test('entier → sans décimale', () => {
    expect(fmt(5)).toBe('5')
    expect(fmt(0)).toBe('0')
    expect(fmt(20)).toBe('20')
  })

  test('décimal → 1 chiffre après la virgule', () => {
    expect(fmt(4.5)).toBe('4.5')
    expect(fmt(2.5)).toBe('2.5')
    expect(fmt(0.5)).toBe('0.5')
  })
})
