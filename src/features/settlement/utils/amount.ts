import type {
  SettlementBreakdown,
  SettlementCreatorTax,
} from "@/features/settlement/types"

/*
  정산 산식(§41-4) 중 **화면이 직접 계산해야 하는 부분**만 둔다 — C1 정산 조정 요청의 자동 계산.
  나머지 금액은 서버가 내려준 값을 그대로 그린다(이 화면이 금액의 단일 소스이고, 같은 숫자를 두 곳에서
  따로 계산하지 않는다). 세율·요율은 문구에 고정하지 않고 응답의 `*Rate`를 쓴다.

  원 단위 처리는 시안마다 달라 확정 대기다(§46 B-2) — 지금은 시안 수치에 맞춘다:
  상한만 10원 미만 절사(C1 5,555,450원), 부가세·원천징수는 원 미만 절사(C1 487,368원).
*/

/** amount × rate% — 원 미만 절사. 3.3% 같은 소수 요율의 부동소수 오차를 피하려고 정수로 바꿔 곱한다 */
export function percentOf(amount: number, rate: number) {
  return Math.floor(Math.round(amount * rate * 100) / 10000)
}

/** 10원 미만 절사 */
export function floorTo10(value: number) {
  return Math.floor(value / 10) * 10
}

/**
 * 조정할 리워드 금액의 상한 — 리워드 + 리워드 부가세가 브랜드 몫을 넘지 않는 범위.
 * (확정 거래액 − PG 수수료 − 플랫폼 수수료) ÷ (1 + 부가세율) · 10원 미만 절사(§42-1).
 */
export function adjustmentUpperBound(breakdown: SettlementBreakdown) {
  const base =
    breakdown.confirmedSales - breakdown.pgFee - breakdown.platformFee
  return Math.max(0, floorTo10((base * 100) / (100 + breakdown.rewardVatRate)))
}

/** 리워드를 바꿨을 때의 인플루언서 실지급 · 브랜드 수취액 */
export function previewAdjustment(
  breakdown: SettlementBreakdown,
  creatorTax: SettlementCreatorTax,
  rewardAmount: number
) {
  const rewardVat = percentOf(rewardAmount, breakdown.rewardVatRate)
  const creatorNet = creatorTax.isBusiness
    ? rewardAmount + rewardVat
    : rewardAmount - percentOf(rewardAmount, creatorTax.withholdingRate)
  const brandReceivable =
    breakdown.confirmedSales -
    breakdown.pgFee -
    breakdown.platformFee -
    rewardAmount -
    rewardVat +
    breakdown.reshipFee
  return { rewardVat, creatorNet, brandReceivable }
}
