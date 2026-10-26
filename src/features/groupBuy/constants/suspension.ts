/*
  계정 이용 정지 · 상대 계정 보류 — 공구 관리 문구(시안 ui-partner-15 rev.3 S3a · R2).
  공통 문구(툴팁 · 배너)는 `@/features/suspension`에 있다.
*/

/** S3a — 진행중 공구: [기간 연장 요청]만 막히고 조기 마감 · 중단은 그대로 */
export const EXTENSION_SUSPENDED_TEXT =
  "계정 이용 정지 중에는 기간 연장을 요청할 수 없습니다. 조기 마감·중단 요청은 그대로 할 수 있습니다."

/** R2 — 상대 인플루언서 정지 · 오픈 전 공구. 정지 사실 · 사유는 내리지 않는다(「상대 계정 사정」) */
export const OPEN_COUNTERPARTY_HELD_NOTICE = {
  title: "상대 인플루언서 계정 사정으로 공구 오픈이 보류 중입니다.",
  body: "보류가 풀리면 원래 일정대로 이어 갑니다. 그 사이 공구 시작일이 지나면 운영팀이 일정 조정을 안내합니다.",
} as const
