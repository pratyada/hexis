import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string | null): string {
  if (!date) return '—'
  const d = new Date(date)
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function formatDateTime(date: Date | string | null): string {
  if (!date) return '—'
  const d = new Date(date)
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatCurrency(amount: number | null): string {
  if (!amount) return '—'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function getDaysUntil(date: Date | string | null): number | null {
  if (!date) return null
  const diff = new Date(date).getTime() - new Date().getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export function getUrgencyColor(daysUntil: number | null): string {
  if (daysUntil === null) return 'text-gray-400'
  if (daysUntil < 0) return 'text-red-600'
  if (daysUntil <= 2) return 'text-red-500'
  if (daysUntil <= 7) return 'text-amber-500'
  return 'text-green-600'
}

export function generateCode(prefix: string, num: number): string {
  return `${prefix}-${String(num).padStart(4, '0')}`
}

export const CASE_TYPES = [
  { value: 'CIVIL', label: 'Civil' },
  { value: 'CRIMINAL', label: 'Criminal' },
  { value: 'WRIT', label: 'Writ Petition' },
  { value: 'ARBITRATION', label: 'Arbitration' },
  { value: 'CONSUMER', label: 'Consumer Forum' },
  { value: 'LABOUR', label: 'Labour / Industrial' },
  { value: 'TAXATION', label: 'Taxation' },
  { value: 'MATRIMONIAL', label: 'Matrimonial' },
  { value: 'PROPERTY', label: 'Property / Land' },
  { value: 'CORPORATE', label: 'Corporate / Commercial' },
  { value: 'IPR', label: 'Intellectual Property' },
]

export const COURT_TYPES = [
  { value: 'SC', label: 'Supreme Court of India' },
  { value: 'HC', label: 'Delhi High Court' },
  { value: 'DC', label: 'District Court' },
  { value: 'TRIBUNAL', label: 'Tribunal / Forum' },
  { value: 'NCLT', label: 'NCLT' },
  { value: 'NGT', label: 'NGT' },
  { value: 'SAT', label: 'SAT' },
]

export const DRAFT_TYPES = [
  { value: 'WRIT_PETITION', label: 'Writ Petition' },
  { value: 'CIVIL_SUIT', label: 'Civil Suit / Plaint' },
  { value: 'CRIMINAL_COMPLAINT', label: 'Criminal Complaint' },
  { value: 'REPLY', label: 'Reply / Counter Affidavit' },
  { value: 'REJOINDER', label: 'Rejoinder Affidavit' },
  { value: 'APPLICATION', label: 'Application / IA' },
  { value: 'NOTICE', label: 'Legal Notice' },
  { value: 'AGREEMENT', label: 'Agreement / Contract' },
  { value: 'VAKALATNAMA', label: 'Vakalatnama' },
  { value: 'AFFIDAVIT', label: 'Affidavit' },
  { value: 'APPEAL', label: 'Appeal' },
  { value: 'BAIL_APPLICATION', label: 'Bail Application' },
]

export const STATES_INDIA = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Chandigarh', 'Jammu & Kashmir', 'Ladakh', 'Puducherry',
]

export const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'हिंदी (Hindi)' },
  { value: 'en-hi', label: 'English + Hindi (Bilingual)' },
]
