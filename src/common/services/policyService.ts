import { authInstance } from "@/common/lib/authInstance"

/**
 * 정책 영업일 · 일수 — `GET /v1/common/policy-values`(인증 불요 · 58 6-1).
 * 서버 설정이 없는 값은 null이다 — 화면은 「N영업일」로 둔다.
 */
export interface PolicyValues {
  /** 반품 검수 기한 — 반품을 돌려받은 날(회수 배송완료) + N영업일. 기한 안에 판정이 없으면 자동 승인(2026-11-10 · 자동 입고 폐지) */
  claimInspectDueBusinessDays: number
  /** 검수 승인 후 PG 환불 기한 N영업일 */
  claimRefundDueBusinessDays: number
  /** 마지막 추적 이벤트 + N일이면 추적 정지 */
  trackingStallAlertDays: number
  /** 추적 정지 + N일이면 소비자가 재발송 / 환불을 고를 수 있다 */
  stallConsumerChoiceDays: number
  settlementReviewBusinessDays: number
  /** 확정일 + N영업일 지급 예정 */
  settlementPayoutBusinessDays: number
  adjustmentDeadlineBusinessDays: number
  fixedFeePaymentBusinessDays: number | null
  /** 정지 통지 + N영업일 이의 신청 기한 */
  sanctionAppealBusinessDays: number
  sanctionAppealReviewBusinessDays: number | null
  /** 취소 요청 응답 기한 — 요청 + N영업일. 자동 승인은 없다 — 넘기면 운영팀이 브랜드 확인 후 취소(2026-11-10) */
  cancelRequestRespondBusinessDays: number
  creatorAccountReviewBusinessDays: number | null
  groupBuySuspensionAppealBusinessDays: number
}

export const policyService = {
  getPolicyValues: async () => {
    const { data } = await authInstance.get<PolicyValues>(
      "/common/policy-values",
      { suppressErrorToast: true }
    )
    return data
  },
}
