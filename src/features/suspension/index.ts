/*
  계정 이용 정지 공용 모듈 — 화면별 차단(상품 · 공구 · 계약 · 정산 · 운영팀 채널)은 이 입구로만 가져다 쓴다.

  - useAccountSuspension()  내 정지 상태(isSuspended · sanction). 실패 · 「준비 중」은 정지 아님으로 읽는다
  - <SuspensionBanner />    모든 페이지 탑바 아래 배너(정지가 아니면 null)
  - <SuspensionChip />      탑바 브랜드명 옆 「정지」 칩
  - <SanctionHoldBadge hold={row.hold} />  계약 · 공구 상태 옆 보류 배지(서버 SanctionHoldView)
  - <SuspendedEmptyState feature="상품 등록" />  URL 직접 진입 차단 화면
  - SUSPENSION_COPY.blockedTooltip  진입 버튼 비활성 툴팁
*/
export { default as SanctionHoldBadge } from "./components/SanctionHoldBadge"
export { default as SuspendedEmptyState } from "./components/SuspendedEmptyState"
export { default as SuspensionBanner } from "./components/SuspensionBanner"
export { default as SuspensionChip } from "./components/SuspensionChip"
export { SUSPENSION_COPY, SUSPENSION_NAME } from "./constants/copy"
export {
  ACCOUNT_STATUS_QUERY_KEY,
  useAccountSuspension,
  type AccountSuspension,
} from "./hooks/useAccountSuspension"
export { isSuspendedScenario } from "./services/accountStatusService"
export type {
  MemberAccountSanction,
  MemberAccountStatusResponse,
  MemberSanctionTerm,
  SanctionHoldView,
} from "./types"
export { appealPath } from "./utils/paths"
