export const EMPLOYEE_COLORS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
  '#84cc16', // lime
  '#6366f1', // indigo
  '#14b8a6', // teal
  '#d946ef', // fuchsia
]

export function getNextColor(usedColors: string[]): string {
  const available = EMPLOYEE_COLORS.filter(c => !usedColors.includes(c))
  return available.length > 0
    ? available[0]
    : EMPLOYEE_COLORS[usedColors.length % EMPLOYEE_COLORS.length]
}
