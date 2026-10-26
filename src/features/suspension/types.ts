/*
  계정 이용 정지 — 백엔드 main `api/common/account/dto/MemberAccountStatusResponse.java` ·
  `api/common/sanction/SanctionHoldView.java`를 그대로 옮겼다(1017 설계서 8-10 · 1021 기-02).

  시각은 두 종류가 섞인다.
  - `suspendedAt` — 운영자가 정지한 순간(`now()`) → UTC 벽시계 → `parseServerDateTime`
  - `endsOn` · `autoReleaseAt` · `appealDeadlineAt` — 종료일과 거기서 나온 기한 → 벽시계 그대로(`dayjs`)
*/

/** 브랜드는 DORMANT도 있다. 모르는 값이 와도 깨지지 않게 문자열로 연다 */
export type MemberAccountStatus =
  | "ACTIVE"
  | "SUSPENDED"
  | "WITHDRAWN"
  | "DORMANT"
  | (string & {})

/** 정지 기간 · 자동 해제 · 이의 신청 기한(1021 기-02 【잠정】) */
export interface MemberSanctionTerm {
  /** 정지 종료일(포함) — 기간 없는 정지면 null */
  endsOn: string | null
  /** 종료일 다음 날 00:00 */
  autoReleaseAt: string | null
  /** 시작일 · 종료일 포함 */
  periodDays: number | null
  /** 통지 + N영업일 23:59:59 — 표시용(기한 뒤에도 접수한다) */
  appealDeadlineAt: string | null
  /** 소명 검토 N영업일 — [정책값 미정]이면 null */
  appealReviewBusinessDays: number | null
}

export interface MemberAccountSanction {
  /** 정형 사유 코드(예: SETTLEMENT_INFO_MISMATCH) */
  reason: string
  /** 배너 「사유: …」 */
  reasonLabel: string
  /** 운영자가 입력한 상세 사유 — 있을 때만 [자세히]로 펼친다 */
  reasonDetail: string | null
  suspendedAt: string
  /** 지급 정지 사유 — true면 배너에 정산 줄을 붙인다 */
  payoutHeld: boolean
  /** [운영팀에 소명하기] 목적지 */
  operatorChannelThreadId: number | null
  /** 그 채널의 「계정 이용 정지」 시스템 카드 */
  suspendCardMessageId: number | null
  /** 개발 서버 옛 버전 · 부분 응답에서 빠질 수 있어 선택으로 둔다 */
  term?: MemberSanctionTerm | null
}

export interface MemberAccountStatusResponse {
  status: MemberAccountStatus
  /** 열린 정지 — 정지가 아니면 null */
  sanction: MemberAccountSanction | null
  withdrawalPending: boolean
}

/**
 * 정지 보류 보조 배지 — 계약 · 공구 상태 옆에 붙는다(상태는 그대로).
 * MINE = 내 계정 이용 정지(경고) · COUNTERPARTY = 상대 계정 사정(중립 · 상대 정지 사실은 내리지 않는다).
 */
export interface SanctionHoldView {
  kind: "MINE" | "COUNTERPARTY" | "ADMIN" | (string & {})
  /** 예: 「체결 보류 · 계정 이용 정지」 · 「승인 보류 · 상대 계정」 · 「편집 불가」 */
  label: string
  tone: "WARNING" | "NEUTRAL" | (string & {})
  party: string | null
}
