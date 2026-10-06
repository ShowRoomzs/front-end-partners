import type {
  ClaimListParams,
  ClaimPeriodPreset,
  ClaimReason,
  ClaimRejectReason,
  ClaimTab,
  ClaimType,
  DeliveryCarrier,
} from "@/features/claims/types"
import dayjs from "dayjs"

export const CLAIM_LIST_PATH = "/sales/claims"

export const CLAIM_QUERY_KEYS = {
  LIST: "sellerClaimList",
  /** 주문 관리 화면(features/orders)과 같은 키 — 같은 엔드포인트·같은 응답이라 캐시를 나눠 쓴다 */
  SUMMARY: "sellerClaimSummary",
  DETAIL: "sellerClaimDetail",
  RESHIP_TEMPLATE: "sellerClaimReshipTemplate",
} as const

/** 시안 상태 탭 7종 — 순서가 화면 순서다 */
export const CLAIM_TAB_OPTIONS: Array<{ value: ClaimTab; label: string }> = [
  { value: "ALL", label: "전체" },
  { value: "COLLECT_WAIT", label: "회수 대기" },
  { value: "COLLECTING", label: "회수 중" },
  { value: "INSPECTION", label: "입고·검수" },
  { value: "RESHIP", label: "재발송" },
  { value: "REJECT_HOLD", label: "반려 보류" },
  { value: "DONE", label: "완료" },
]

export const CLAIM_TAB_LABEL = Object.fromEntries(
  CLAIM_TAB_OPTIONS.map(option => [option.value, option.label])
) as Record<ClaimTab, string>

export const CLAIM_TYPE_OPTIONS: Array<{ value: ClaimType; label: string }> = [
  { value: "RETURN", label: "반품" },
  { value: "EXCHANGE", label: "교환" },
]

/** 사유 5종 — 소비자 앱과 같은 문자열(서버 ClaimReason) */
export const CLAIM_REASON_OPTIONS: Array<{
  value: ClaimReason
  label: string
}> = [
  { value: "CHANGE_OF_MIND", label: "단순 변심" },
  { value: "ORDER_MISTAKE", label: "주문 실수" },
  { value: "SIZE_MISMATCH", label: "사이즈가 맞지 않음" },
  { value: "DAMAGED_OR_DEFECTIVE", label: "배송 상품 파손 및 불량" },
  { value: "WRONG_OR_LATE_DELIVERY", label: "오배송 및 배송 지연" },
]

/** 서버 ClaimReason.feeBearer · detailRequired — 브랜드 부담 사유는 상세 내용이 필수다 */
export const SELLER_BORNE_REASONS: ReadonlyArray<ClaimReason> = [
  "DAMAGED_OR_DEFECTIVE",
  "WRONG_OR_LATE_DELIVERY",
]

/** 검수 반려 사유 5종(서버 ClaimRejectReason) */
export const REJECT_REASON_OPTIONS: Array<{
  value: ClaimRejectReason
  label: string
}> = [
  { value: "USED", label: "개봉·사용 흔적" },
  { value: "PACKAGE_DAMAGED", label: "포장 훼손" },
  { value: "PRODUCT_MISMATCH", label: "상품 불일치" },
  { value: "PERIOD_EXPIRED", label: "기간 경과" },
  { value: "ETC", label: "기타" },
]

/**
 * 시안 B1r 「법적 근거」 — 전자상거래법 제17조② 각 호.
 * 서버 반려 요청에 이 필드가 없어 화면에만 둔다(제출되지 않는다).
 */
export const REJECT_LEGAL_BASIS_OPTIONS = [
  "전자상거래법 제17조②1호 · 소비자 책임으로 멸실·훼손",
  "제17조②2호 · 사용·소비로 가치 현저히 감소",
  "제17조②3호 · 시간 경과로 재판매 곤란",
  "제17조②5호 · 복제 가능 상품 포장 훼손",
]

/** 택배사 11종 · 사용 빈도순(서버 DeliveryCarrier) — 자유 입력 없음 */
export const CARRIER_OPTIONS: Array<{ value: DeliveryCarrier; label: string }> =
  [
    { value: "CJ", label: "CJ대한통운" },
    { value: "LOTTE", label: "롯데택배" },
    { value: "HANJIN", label: "한진택배" },
    { value: "EPOST", label: "우체국택배" },
    { value: "KYUNGDONG", label: "경동택배" },
    { value: "DAESIN", label: "대신택배" },
    { value: "LOGEN", label: "로젠택배" },
    { value: "HAPDONG", label: "합동택배" },
    { value: "COUPANG", label: "쿠팡택배" },
    { value: "WOORI", label: "우리택배" },
    { value: "CU", label: "CU편의점택배" },
  ]

export const PERIOD_OPTIONS: Array<{
  value: ClaimPeriodPreset
  label: string
}> = [
  { value: "TODAY", label: "오늘" },
  { value: "7D", label: "7일" },
  { value: "1M", label: "1개월" },
  { value: "3M", label: "3개월" },
  { value: "CUSTOM", label: "직접 입력" },
]

export const DATE_PARAM_FORMAT = "YYYY-MM-DD"

/** 프리셋 → 신청일시 기간(양끝 포함). 직접 입력은 호출부가 정한다 */
export function periodRange(preset: Exclude<ClaimPeriodPreset, "CUSTOM">) {
  const today = dayjs()
  const from = {
    TODAY: today,
    "7D": today.subtract(6, "day"),
    "1M": today.subtract(1, "month"),
    "3M": today.subtract(3, "month"),
  }[preset]
  return {
    from: from.format(DATE_PARAM_FORMAT),
    to: today.format(DATE_PARAM_FORMAT),
  }
}

export const CLAIM_PAGE_SIZES = [20, 50]

/** 서버 기본 탭이 회수 대기다 — 브랜드가 매일 처음 보는 작업 큐 */
export const CLAIM_INITIAL_PARAMS: ClaimListParams = {
  tab: "COLLECT_WAIT",
  types: ["RETURN", "EXCHANGE"],
  reason: "",
  period: "1M",
  ...periodRange("1M"),
  keyword: "",
  page: 1,
  size: 20,
}

/** 조회 기간 상한 — 서버가 1년 초과를 400으로 막는다 */
export const MAX_PERIOD_DAYS = 365

/** 반려 증빙 — 1~5장 · PNG·JPG · 10MB(시안 B1r) */
export const EVIDENCE_MAX_COUNT = 5
export const EVIDENCE_MAX_BYTES = 10 * 1024 * 1024
export const EVIDENCE_FILE_TYPES = ["image/png", "image/jpeg"]

export const CLAIM_SUMMARY_POLL_INTERVAL = 30_000

/** 「운영자 문의」 — 연결·소통의 운영팀 채널 */
export const OPERATOR_THREAD_PATH = "/connections?operator=1"
