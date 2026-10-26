/*
  계정 이용 정지 — 상품 관리 문구(시안 ui-partner-15 rev.3 S2b · B10).
  공통 문구(툴팁 · 빈 상태 제목 · [운영팀에 소명하기])는 `@/features/suspension`에 있다.
*/

/** S2b 직접 진입 빈 상태의 기능 이름 — 「계정 이용 정지 중에는 상품 등록을 이용할 수 없습니다」 */
export const REGISTER_FEATURE_NAME = "상품 등록"

export const REGISTER_BLOCKED_DESCRIPTION =
  "정지가 해제되면 바로 등록할 수 있습니다. 등록된 상품의 수정·품절 처리는 상품 목록에서 계속할 수 있습니다."

/** B10 — 브랜드 요청 미진열 상품: 진열 복귀(미진열 → 진열)는 정지 중 막힌다 */
export const REDISPLAY_BLOCKED_NOTICE = {
  title: "계정 이용 정지 중에는 진열 복귀를 요청할 수 없습니다.",
  body: "정지가 해제되면 연결·소통 스레드에서 진열 요청을 보내 주세요. 상품 정보 수정과 재고 입력은 지금도 저장됩니다.",
} as const
