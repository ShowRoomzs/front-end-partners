import type { DeliveryCarrier } from "@/features/claims/types"
import { digitsOnly } from "@/features/claims/utils/format"

/** 재발송 셀 입력 — 확정 전 클라이언트 임시값. 확정은 [송장 등록] 하나다 */
export interface ReshipDraft {
  carrier: DeliveryCarrier | ""
  trackingNumber: string
  /** 등록 시 서버가 제외한 사유 — 그 셀 아래 인라인으로 띄운다 */
  error?: string
}

export function isDraftFilled(draft: ReshipDraft | undefined) {
  return !!draft && !!draft.carrier && digitsOnly(draft.trackingNumber) !== ""
}
