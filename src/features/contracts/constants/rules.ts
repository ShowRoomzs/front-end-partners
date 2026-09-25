/*
  계약 입력 규칙(§25-6·§25-7) — 서버 `ContractValidator`와 같은 값이다.
  여기 값은 즉시 피드백·달력 잠금용이고, 검토 요청 시 서버가 전부 다시 본다.
*/

/** 공구 시작 일시 하한 — 검토 요청일 + 7일(H5). 서명·게시물 등록·오픈 승인 리드타임 */
export const LEAD_DAYS = 7
/** 공구 기간 3~30일(H4) — 양끝 포함 일수 */
export const MIN_PERIOD_DAYS = 3
export const MAX_PERIOD_DAYS = 30

export const TITLE_MIN_LENGTH = 2
export const TITLE_MAX_LENGTH = 40
export const NOTE_MAX_LENGTH = 500

/** 고정 지급비 — 0원 허용 · 최대 1,000만원 */
export const FIXED_FEE_MAX = 10_000_000
/** 리워드율 0~90% · 0.1% 단위(H3) */
export const REWARD_RATE_MAX = 90
/** 공구가 10원 단위(H2) */
export const PRICE_UNIT = 10

/** 달력 모달 시각 — 분은 5분 단위 드롭다운 */
export const MINUTE_STEP = 5
export const DEFAULT_START_TIME = { hour: 10, minute: 0 }
export const DEFAULT_END_TIME = { hour: 23, minute: 55 }

export const SECONDARY_USE_DEFAULT_MONTHS = 12

/** 경고 임계값 — 화면 표시(할인율 문구 등)용. 판정 자체는 서버 `/validate`가 한다 */
export const WARNING_PERIOD_DAYS = 14
