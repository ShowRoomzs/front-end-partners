/*
  안내 상자 공통값 — 세 앱(파트너 · 스튜디오 · 어드민) 11-21 합의.

  - 중립 `.sec-note`(스튜디오 v1.3): 11px · n-600 · n-50 바탕 · n-200 테두리 · r-sm · 9px 12px · 줄간 1.7
  - 정보 · 경고 · 위험 `.notice`(파트너 v1.3): 11px · 줄간 1.6 · 11px 13px · r-sm · 상태 -bg/-text · 테두리 없음 · b 600

  화면에서 직접 그리던 안내 상자는 전부 이 값을 쓴다(공용 `Notice` 컴포넌트도 같은 값).
*/

export const NOTE_CLASS =
  "rounded-[6px] border border-sz-n-200 bg-sz-n-50 px-3 py-[9px] text-[11px] leading-[1.7] text-sz-n-600 [&_b]:font-semibold [&_b]:text-sz-n-900"

export const NOTICE_BASE_CLASS =
  "rounded-[6px] px-[13px] py-[11px] text-[11px] leading-[1.6] [&_b]:font-semibold"

export const NOTICE_TONE_CLASS = {
  info: "bg-sz-info-bg text-sz-info-text",
  warn: "bg-sz-warning-bg text-sz-warning-text",
  danger: "bg-sz-danger-bg text-sz-danger-text",
  success: "bg-sz-success-bg text-sz-success-text",
} as const
