import { mockDelay } from "@/common/utils/devMock"
import type {
  ClaimDetailResponse,
  ClaimFreightPreview,
  ClaimOverturnBody,
} from "@/features/claims/types"
import dayjs from "dayjs"

/*
  개발 서버 전용 — 1021 검수 판정(사유 번복 · 통과 귀책 변경 · 운임 미리보기) 목업.
  claimService가 `DEV_MOCK_ENABLED` 가드 안에서 동적 import 하므로 배포 번들에 들어가지 않는다.

  아직 배포되지 않은 서버가 준 상세에 1021 필드를 채우고, 목업으로 판정한 건은 기억해 두었다가
  다시 읽어도(목록 갱신 · 모달 재진입) 판정된 상태로 보이게 한다.
*/

/** 시안 rev.5 예시 — 운임 = 상품 기본 배송비 정액 3,000원 */
const SAMPLE_BASE_DELIVERY_FEE = 3_000

const judged = new Map<number, ClaimDetailResponse>()

/** 서버 시각 규칙(UTC 벽시계)에 맞춘 지금 */
const serverNow = () =>
  dayjs().subtract(9, "hour").format("YYYY-MM-DDTHH:mm:ss")

export function applyMock1021(
  detail: ClaimDetailResponse
): ClaimDetailResponse {
  const stored = judged.get(detail.summary.claimId)
  if (stored) return stored
  if (typeof detail.actions.canOverturn === "boolean") return detail
  // canOverturn은 채우지 않는다 — 그 값의 유무가 「서버가 1021 판정을 아는가」의 신호다(utils/inspection)
  return {
    ...detail,
    reshipFeeCharged: detail.reshipFeeCharged ?? detail.exchangeFeeCharged,
    inspection: detail.inspection ?? null,
  }
}

export function freightPreviewMock(
  detail: ClaimDetailResponse
): Promise<ClaimFreightPreview> {
  return mockDelay({
    freight: SAMPLE_BASE_DELIVERY_FEE,
    reshipFee: SAMPLE_BASE_DELIVERY_FEE,
    originalPaidAmount: detail.refund?.itemAmount ?? 0,
  })
}

const closedActions = {
  canConfirmReceipt: false,
  canPass: false,
  canReject: false,
  canRegisterReshipment: false,
  canUpdateReshipment: false,
  canOverturn: false,
}

/** 사유 번복 — 교환은 결제 대기(반려 보류 화면 재사용) · 반품은 착불 운임을 뺀 환불 대기 */
export function overturnMock(
  current: ClaimDetailResponse,
  body: ClaimOverturnBody
): Promise<ClaimDetailResponse> {
  const freight = SAMPLE_BASE_DELIVERY_FEE
  const isExchange = current.summary.type === "EXCHANGE"
  const overturnFee = SAMPLE_BASE_DELIVERY_FEE + freight
  const now = serverNow()
  const next: ClaimDetailResponse = {
    ...current,
    summary: {
      ...current.summary,
      status: isExchange ? "REJECT_HOLD" : "REFUND_PENDING",
      statusLabel: isExchange ? "반려 보류" : "환불 대기",
      stage: isExchange ? "REJECT_HOLD" : "DONE",
      stageEnteredAt: now,
      elapsedDays: 0,
      reshipFee: isExchange
        ? {
            amount: overturnFee,
            status: "PENDING",
            statusLabel: "결제 대기",
            // 결제 기한은 서버가 UTC 벽시계로 준다(KST 14일 뒤 23:59:59)
            dueAt: dayjs()
              .add(14, "day")
              .endOf("day")
              .subtract(9, "hour")
              .format("YYYY-MM-DDTHH:mm:ss"),
          }
        : current.summary.reshipFee,
      outcome: isExchange
        ? null
        : { code: "REFUND_PENDING", label: "환불 대기", finalized: false },
    },
    refund: current.refund && {
      ...current.refund,
      requestExpectedAmount: current.refund.requestExpectedAmount - freight,
      basisLabel: "상품 금액 − 착불 운임",
    },
    sellerEvidences: body.evidenceImageUrls,
    actions: closedActions,
    inspection: {
      result: "REASON_OVERTURNED",
      resultLabel: "사유 번복",
      explanation: body.explanation,
      autoReceived: false,
      overturnFee: isExchange ? overturnFee : null,
      freight: [
        {
          trigger: "REASON_OVERTURNED",
          triggerLabel: "사유 번복",
          direction: "CHARGE_CONSUMER",
          collectFreight: freight,
          prepaidFreight: 0,
          initialFeeRestored: 0,
          signedAmount: freight,
          settledVia: isExchange ? "CHARGE" : "REFUND_DEDUCTION",
        },
      ],
    },
    history: [
      {
        eventType: "REASON_OVERTURNED",
        eventLabel: "검수 사유 번복",
        actorType: "SELLER",
        actorLabel: "브랜드",
        detail: null,
        occurredAt: now,
      },
      ...current.history,
    ],
  }
  judged.set(current.summary.claimId, next)
  return mockDelay(next)
}

/** 통과 + 브랜드 귀책 인정(반품) — 차감했던 최초 배송비가 0이 되고 선불 운임을 환불에 더한다 */
export function passWithFaultMock(
  current: ClaimDetailResponse
): Promise<ClaimDetailResponse> {
  const prepaid = SAMPLE_BASE_DELIVERY_FEE
  const deduction = current.refund?.requestDeduction ?? 0
  const now = serverNow()
  const next: ClaimDetailResponse = {
    ...current,
    summary: {
      ...current.summary,
      status: "REFUND_PENDING",
      statusLabel: "환불 대기",
      stage: "DONE",
      stageEnteredAt: now,
      elapsedDays: 0,
      outcome: { code: "REFUND_PENDING", label: "환불 대기", finalized: false },
    },
    refund: current.refund && {
      ...current.refund,
      requestDeduction: 0,
      requestExpectedAmount:
        current.refund.requestExpectedAmount + deduction + prepaid,
      basisLabel: "브랜드 귀책 — 배송비 차감 없음 · 선불 운임 환급",
    },
    actions: closedActions,
    inspection: {
      result: "PASSED",
      resultLabel: "검수 통과",
      explanation: null,
      autoReceived: false,
      overturnFee: null,
      freight: [
        {
          trigger: "FAULT_TO_SELLER_ON_PASS",
          triggerLabel: "귀책 변경 · 통과",
          direction: "REFUND_CONSUMER",
          collectFreight: 0,
          prepaidFreight: prepaid,
          initialFeeRestored: deduction,
          signedAmount: -prepaid,
          settledVia: "REFUND_ADDITION",
        },
      ],
    },
    history: [
      {
        eventType: "FAULT_ACCEPTED_ON_PASS",
        eventLabel: "브랜드 귀책 인정",
        actorType: "SELLER",
        actorLabel: "브랜드",
        detail: null,
        occurredAt: now,
      },
      ...current.history,
    ],
  }
  judged.set(current.summary.claimId, next)
  return mockDelay(next)
}
