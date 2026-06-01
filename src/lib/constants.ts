export const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'מנהל מערכת',
  SUBMITTER: 'מגיש',
  PROCUREMENT: 'רכש',
  SUBCONTRACT_MANAGER: 'מנהל קבלני משנה',
  COO: 'סמנכ"ל תפעול',
}

export const STATUS_LABELS: Record<string, string> = {
  PENDING_PROCUREMENT: 'ממתין לאישור רכש',
  PENDING_SUBCONTRACT: 'ממתין לאישור מנהל קבלני משנה',
  PENDING_COO: 'ממתין לאישור סמנכ"ל תפעול',
  APPROVED: 'אושר',
  REJECTED: 'נדחה',
}

export const STAGE_FOR_ROLE: Record<string, string> = {
  PROCUREMENT: 'PENDING_PROCUREMENT',
  SUBCONTRACT_MANAGER: 'PENDING_SUBCONTRACT',
  COO: 'PENDING_COO',
}
