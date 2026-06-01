import { STATUS_LABELS } from '@/lib/constants'

const STATUS_COLORS: Record<string, string> = {
  PENDING_PROCUREMENT: 'bg-orange-100 text-orange-800 border-orange-200',
  PENDING_SUBCONTRACT: 'bg-blue-100 text-blue-800 border-blue-200',
  PENDING_COO: 'bg-purple-100 text-purple-800 border-purple-200',
  APPROVED: 'bg-green-100 text-green-800 border-green-200',
  REJECTED: 'bg-red-100 text-red-800 border-red-200',
}

export function StatusBadge({ status }: { status: string }) {
  const colors = STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-800 border-gray-200'
  const label = STATUS_LABELS[status] ?? status
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors}`}>
      {label}
    </span>
  )
}
