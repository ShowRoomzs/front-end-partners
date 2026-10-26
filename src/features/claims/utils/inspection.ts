import { DEV_MOCK_ENABLED } from "@/common/utils/devMock"
import { SELLER_BORNE_REASONS } from "@/features/claims/constants/params"
import type { ClaimDetailResponse } from "@/features/claims/types"

/*
  검수 3갈래 · 통과 귀책 변경(1021 기-17 · 기-93) — 백엔드 main에는 있으나 개발 서버에 아직 배포되지 않았다.
  배포 전 서버는 `actions.canOverturn`을 내려 주지 않고, 통과 요청 본문(`faultToSeller`)을 **조용히 무시**한다.
  그래서 그 값의 유무로 서버가 이 기능을 아는지 가른다 — 모르는 서버에 귀책을 바꿔 보내면 소비자 귀책으로 통과돼 버린다.
  개발 서버(`pnpm dev`)는 화면 확인을 위해 항상 연다(제출은 claimService가 목업으로 받는다).
*/

/** 서버가 1021 검수 판정(사유 번복 · 통과 귀책 변경)을 아는가 */
export const isInspection1021Ready = (detail: ClaimDetailResponse) =>
  typeof detail.actions.canOverturn === "boolean"

/** 착불(브랜드 귀책)로 신청한 건 — 불량 · 오배송 */
export const isSellerBorne = (detail: ClaimDetailResponse) =>
  SELLER_BORNE_REASONS.includes(detail.summary.reasonCode)

/**
 * [사유 번복] 노출 — 서버 판정(`canOverturn`)이 정본이다. 시안은 교환 검수만 3갈래(B2 · B2b)이고
 * 반품 검수(B1)는 2갈래라 교환에만 둔다.
 */
export function canOverturnOf(detail: ClaimDetailResponse) {
  if (detail.summary.type !== "EXCHANGE") return false
  if (isInspection1021Ready(detail)) return detail.actions.canOverturn === true
  return DEV_MOCK_ENABLED && detail.actions.canPass && isSellerBorne(detail)
}

/**
 * M1 귀책 선택 — 선불(소비자 귀책) 반품만 의미가 있다(서버 SellerClaimPassRequest).
 * 시안 M1은 반품 예시뿐이라 교환 귀책 변경(재발송비 결제 취소 + 선불 운임 송금)은 아직 열지 않는다.
 */
export function canChangeFaultOnPass(detail: ClaimDetailResponse) {
  if (detail.summary.type !== "RETURN" || isSellerBorne(detail)) return false
  return isInspection1021Ready(detail) || DEV_MOCK_ENABLED
}
