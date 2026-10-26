/*
  【잠정】 문구 — 결정 노트 v0.2의 계약 항목 중 변호사 확인 뒤 바뀔 수 있는 것(시안 08 rev.9).
  바뀌면 이 파일만 고친다. 굵게 표시할 구절은 따로 떼어 둔다.
*/

/** 기-06 — 검토 통과 뒤 취소는 운영자 직권만. 상대방 동의를 운영팀 채널에서 확인한다(B4 계열 · B8) */
export const CANCEL_CONSENT_PHRASE = "상대방 동의를 운영팀 채널에서 확인한 뒤"

/** 기-09 — 지급 완료 기록 뒤의 회수 문제(B5a) */
export const NO_CLAWBACK_TEXT =
  "SHOWROOMZ는 지급액 회수를 대행하지 않습니다. 당사자 간 청구는 계약서에 따릅니다."

/** 기-05 — 해지(성립 뒤 · 공구 오픈 전)는 운영자가 상대 의사를 확인해 처리한다(C9 · B9) */
export const TERMINATION_HANDLER_PHRASE = "운영자가 상대 의사를 확인해 처리"

/**
 * 기-05 — C9 해지 요청은 자유 입력 한 칸뿐이라 서버 사유 4종 중 「기타」로 보낸다(기타는 메모 필수).
 * 사유 분류가 화면에 생기면 이 값을 고르게 바꾼다.
 */
export const TERMINATION_REASON_CODE = "ETC" as const
export const TERMINATION_MEMO_MAX_LENGTH = 1000
