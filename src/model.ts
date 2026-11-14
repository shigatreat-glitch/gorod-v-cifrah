import data from './data.json'
export const { districts, months, campuses } = data
export type District = (typeof districts)[number]
export type Filters = { budget: number; minutes: number; campus: number }
export type Report = { ids: string[]; campus: number }
export const defaultFilters: Filters = {budget: 90000, minutes: 70, campus: 0}
export const colors = ['#245BE8', '#0B877E', '#A04AA2']
export const number = (value: number) => new Intl.NumberFormat('ru-RU').format(value)
export const money = (value: number) => number(value) + ' ₽'
export const matches = (d: District, f: Filters) => d.rent <= f.budget && d.travel[f.campus] <= f.minutes
export const resolve = (ids: string[]) => ids.flatMap(id => districts.find(d => d.id === id) ?? [])
export const metrics = [
  { key: 'rent', name: 'Аренда', unit: '₽/мес.', max: 90000, value: (d: District) => d.rent, format: money },
  { key: 'time', name: 'До кампуса', unit: 'мин', max: 70, value: (d: District, c: number) => d.travel[c], format: (v: number) => number(v) + ' мин' },
  { key: 'metro', name: 'До метро', unit: 'м', max: 1000, value: (d: District) => d.metro, format: (v: number) => number(v) + ' м' },
  { key: 'green', name: 'Зелёные зоны', unit: '%', max: 100, value: (d: District) => d.green, format: (v: number) => number(v) + '%' },
]
export function conclusion(rows: District[], campus: number) {
  const cheapest = Math.min(...rows.map(d => d.rent))
  const quickest = Math.min(...rows.map(d => d.travel[campus]))
  const rentNames = rows.filter(d => d.rent === cheapest).map(d => d.name).join(', ')
  const timeNames = rows.filter(d => d.travel[campus] === quickest).map(d => d.name).join(', ')
  if (rows.length === 1) return `Аренда в выбранном районе — ${money(cheapest)} в месяц, дорога до кампуса — ${number(quickest)} мин.`
  return `Самая доступная аренда — ${rentNames} (${money(cheapest)} в месяц). Самая короткая дорога до кампуса — ${timeNames} (${number(quickest)} мин).`
}
