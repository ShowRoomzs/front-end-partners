import { isSuspendedScenario } from "@/features/suspension"

/*
  계정 이용 정지 · 상대 계정 보류 문구 — 시안 ui-partner-15 rev.3 S4a · S4b · R1.
  명칭(기-01)이 【잠정】이라 바뀌면 이 파일과 `@/features/suspension`의 copy만 고친다.
*/

/** S4a — 정지 전에 써 둔 초안: 열람 · 삭제만 */
export const DRAFT_SUSPENDED_NOTICE = {
  title:
    "계정 이용 정지 중에는 계약을 작성·수정하거나 검토를 요청할 수 없습니다.",
  body: "작성한 내용은 그대로 보관되며 정지가 해제되면 이어서 작성할 수 있습니다. 필요 없으면 삭제할 수 있습니다.",
} as const

/** S4b — 내 정지 · 서명 진행중: 체결 보류 */
export const SIGNING_SUSPENDED_NOTICE = {
  title: "계정 이용 정지 중에는 계약이 체결되지 않습니다.",
  body: '서명 기한은 정지 기간 동안 멈추며, 정지가 해제되면 남은 기한부터 이어집니다. 인플루언서에게는 "상대 브랜드 사정으로 체결이 보류 중"으로만 안내됩니다.',
} as const

/** R1 — 상대 인플루언서 정지 · 서명 진행중. 정지 사실 · 사유는 내리지 않는다(「상대 계정 사정」) */
export const SIGNING_COUNTERPARTY_HELD_NOTICE = {
  title: "상대 인플루언서 계정 사정으로 체결이 보류 중입니다.",
  body: "서명 기한은 보류 기간 동안 멈추며, 보류가 풀리면 남은 기한부터 이어집니다. 서명은 지금 해 두셔도 됩니다.",
} as const

/** S4b — 내 칸 [서명 안내 다시 받기] 아래 */
export const RESEND_SUSPENDED_TEXT =
  "계정 이용 정지 중에는 서명 안내 재발송을 요청할 수 없습니다."

/**
 * 서명 기한 아래 줄 — 서버 `signatureDeadlinePaused`(정지 중 멈춤 · 해제 후 남은 기한부터).
 * 시안은 날짜만 두고 위 안내로 설명하지만, 기한 숫자가 그대로 읽히지 않게 같은 말을 한 줄 붙인다(시안에 없는 문구).
 */
export const DEADLINE_PAUSED_NOTE = {
  MINE: "정지 중 멈춤 · 해제 후 남은 기한부터",
  COUNTERPARTY: "보류 중 멈춤 · 해제 후 남은 기한부터",
} as const

/**
 * 개발 서버 목업 — 상대 인플루언서 정지(시안 15 R1 · R2). 내 정지 시나리오(`suspended*`)는
 * `@/features/suspension`의 `isSuspendedScenario`가 가른다. 계약 · 공구 서비스가 함께 쓴다.
 */
export const COUNTERPARTY_SUSPENDED_SCENARIO = "counterparty-suspended"

/** 정지 목업 시나리오면 상대 정지인지(true) · 내 정지인지(false), 아니면 null */
export function sanctionMockKind(scenario: string | null): boolean | null {
  if (scenario === COUNTERPARTY_SUSPENDED_SCENARIO) return true
  return isSuspendedScenario(scenario) ? false : null
}
