import type { HistoryDotTone } from "@/common/components/HistoryList/HistoryList"
import type {
  ContractActorType,
  ContractEventType,
  FixedFeeTrigger,
  SecondaryUsePeriodType,
} from "@/features/contracts/types"

/**
 * 파트너센터 호칭 — 운영자는 「어드민」(익명), 시스템 이벤트는 「시스템」(§25-10).
 * 브랜드·인플루언서는 서버가 준 표시명(스냅샷)을 쓴다.
 */
export const ACTOR_LABEL: Record<ContractActorType, string> = {
  SELLER: "브랜드",
  CREATOR: "인플루언서",
  ADMIN: "어드민",
  SYSTEM: "시스템",
}

/** 이력 문구 — 시안 B3c~B8 `.htxt`. 모르는 이벤트는 코드를 그대로 보여준다 */
export const EVENT_LABEL: Record<ContractEventType, string> = {
  CREATED: "계약 작성 시작",
  REVIEW_REQUESTED: "어드민 검토 요청 · 편집 잠금",
  REVIEW_REQUEST_CANCELED: "검토 요청 취소 · 작성중 복귀",
  REVIEW_APPROVED: "어드민 검토 통과 · 계약서 생성",
  REVIEW_REJECTED: "어드민 검토 반려 · 편집 재개",
  SIGNATURE_SENT: "양측에 전자서명 요청 발송 · 메일·문자",
  BRAND_SIGNED: "브랜드 서명 완료",
  CREATOR_SIGNED: "인플루언서 서명 완료",
  SIGNATURE_UPDATED: "서명 현황 갱신 · 어드민 확인",
  BOTH_SIGNED_CONFIRMED: "양측 서명 완료 확인",
  RESEND_REQUESTED: "서명 안내 재발송 요청 · 소통 스레드 자동 등록",
  RESEND_HANDLED: "서명 안내 재발송 · 스레드 답글",
  CONTRACT_PDF_GENERATED: "계약서 생성본 발급",
  DOCUMENT_UPLOADED: "체결 문서 업로드",
  DOCUMENT_DELETED: "체결 문서 삭제",
  CONCLUDED: "체결완료 · PDF·인증서 발급",
  DECLINED: "인플루언서 거절",
  EXPIRED: "서명 기한 초과 확인 · 만료 처리",
  CANCELED: "계약 취소",
  FIXED_FEE_PAID: "고정 지급비 지급 완료 기록 · 브랜드 직접 지급",
  GROUP_BUY_CREATED: "공구 자동 생성",
}

/**
 * 이력 점 색(시안 `.hdot`) — 정상 진행은 정보, 서명·체결·지급은 성공, 반려·만료·취소는 경고,
 * 거절만 위험(부정 결과 확정). 목록에 없는 이벤트는 무채색.
 */
export const HISTORY_TONE: Partial<Record<ContractEventType, HistoryDotTone>> =
  {
    REVIEW_REQUESTED: "accent",
    REVIEW_APPROVED: "accent",
    SIGNATURE_SENT: "accent",
    SIGNATURE_UPDATED: "accent",
    RESEND_REQUESTED: "accent",
    RESEND_HANDLED: "accent",
    CONTRACT_PDF_GENERATED: "accent",
    DOCUMENT_UPLOADED: "accent",
    GROUP_BUY_CREATED: "accent",
    BRAND_SIGNED: "success",
    CREATOR_SIGNED: "success",
    BOTH_SIGNED_CONFIRMED: "success",
    CONCLUDED: "success",
    FIXED_FEE_PAID: "success",
    REVIEW_REJECTED: "warn",
    EXPIRED: "warn",
    CANCELED: "warn",
    DECLINED: "danger",
  }

export const FIXED_FEE_TRIGGER_OPTIONS: Array<{
  value: FixedFeeTrigger
  label: string
}> = [
  { value: "POST_REGISTERED", label: "공구 게시물 등록 후" },
  { value: "GROUP_BUY_ENDED", label: "공구 종료 후" },
  { value: "SETTLEMENT_COMPLETED", label: "정산 완료 후" },
]

export const FIXED_FEE_TRIGGER_LABEL: Record<FixedFeeTrigger, string> = {
  POST_REGISTERED: "공구 게시물 등록 후",
  GROUP_BUY_ENDED: "공구 종료 후",
  SETTLEMENT_COMPLETED: "정산 완료 후",
}

export const SECONDARY_USE_PERIOD_LABEL: Record<
  SecondaryUsePeriodType,
  string
> = {
  FIXED: "기간 지정",
  UNLIMITED: "무기한",
}

/**
 * 서버 위반 `field` 접두사 → 폼 카드 anchor id. 첫 규칙 위반 카드로 스크롤할 때 쓴다.
 * 접두사가 긴 것부터 검사한다.
 */
export const VIOLATION_FIELD_CARD: Array<{ prefix: string; cardId: string }> = [
  { prefix: "items", cardId: "contract-card-items" },
  { prefix: "groupBuy", cardId: "contract-card-period" },
  { prefix: "fixedFee", cardId: "contract-card-fixed-fee" },
  { prefix: "content", cardId: "contract-card-content" },
  { prefix: "secondaryUse", cardId: "contract-card-content" },
  { prefix: "title", cardId: "contract-card-identity" },
  { prefix: "creatorId", cardId: "contract-card-identity" },
  { prefix: "note", cardId: "contract-card-note" },
]

/**
 * 어드민 검토 반려 사유(`ContractReviewRejectReason`) 화면 문구 — 서버는 코드만 내려준다.
 * 문구는 어드민 설계서 §6-1 표 그대로다.
 */
export const REVIEW_REJECT_REASON_LABEL: Record<string, string> = {
  AGREEMENT_MISMATCH: "계약 조건이 인플루언서 합의 내용과 다릅니다",
  INFO_MISMATCH: "계약 조건과 상품 정보가 일치하지 않습니다",
  OBLIGATION_UNVERIFIABLE: "콘텐츠 의무가 이행 판정 가능한 형태가 아닙니다",
  TYPO_OR_OMISSION: "계약 내용에 오기·누락이 있습니다",
  ACCOUNT_STATUS: "당사자 계정 상태 문제",
  ETC: "기타",
}

export function reviewRejectReasonLabel(code: string | null | undefined) {
  if (!code) {
    return "—"
  }
  return REVIEW_REJECT_REASON_LABEL[code] ?? code
}
