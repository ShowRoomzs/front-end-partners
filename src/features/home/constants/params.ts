/** 실시간 카드만 1분 갱신한다 — 처리 대기는 진입 시 갱신(1017 설계서 4-0 ②) */
export const HOME_LIVE_POLL_INTERVAL = 60_000

/** 종 배지 — 파트너 · 스튜디오는 60초 폴링(1017 설계서 1-0 ⑥) */
export const NOTIFICATION_POLL_INTERVAL = 60_000

/** 드롭다운 한 번에 받는 줄 수 — 서버 기본값과 같다 */
export const NOTIFICATION_PAGE_SIZE = 20

/** 달력 한 칸에 쌓는 막대 줄 수 — 넘치면 「+N」(16 rule 「공구 일정」) */
export const CALENDAR_MAX_BAR_ROWS = 3

export const HOME_QUERY_KEYS = {
  HOME: ["seller", "home"],
  LIVE: ["seller", "home", "live"],
  CALENDAR: ["seller", "home", "calendar"],
  BADGES: ["seller", "badges"],
  NOTIFICATION_SUMMARY: ["seller", "notifications", "summary"],
  NOTIFICATION_LIST: ["seller", "notifications", "list"],
} as const
