import type {
  EarlyCloseReasonCode,
  GroupBuyIssueType,
  GroupBuyListParams,
  GroupBuyPostStatus,
  GroupBuySortType,
  GroupBuyTab,
  SuspensionReasonCode,
} from "@/features/groupBuy/types"

export const GROUP_BUY_LIST_PATH = "/group-buy"

export const GROUP_BUY_QUERY_KEYS = {
  LIST: "sellerGroupBuyList",
  SUMMARY: "sellerGroupBuySummary",
  DETAIL: "sellerGroupBuyDetail",
  /** 계약 상세의 해지 요청 — 공구 상세에 해지 요청 블록이 없어 따로 읽는다 */
  TERMINATION: "sellerGroupBuyContractTermination",
} as const

/**
 * 시안 A1 상태 탭 6종 — 건수 키는 서버 `summary.tabCounts`와 같다.
 * 중단 예정은 탭이 아니라 진행중 탭 안의 배지로만 나타난다(서버 매핑).
 */
export const GROUP_BUY_TABS: Array<{ label: string; value: GroupBuyTab }> = [
  { label: "전체", value: "ALL" },
  { label: "준비중", value: "PREPARING" },
  { label: "준비완료", value: "READY" },
  { label: "진행중", value: "IN_PROGRESS" },
  { label: "종료·정산", value: "ENDED" },
  { label: "중단", value: "SUSPENDED" },
]

export const GROUP_BUY_SORT_OPTIONS: Array<{
  label: string
  value: GroupBuySortType
}> = [
  { label: "시작일 빠른순", value: "START_AT_ASC" },
  { label: "생성일순", value: "CREATED_DESC" },
]

export const GROUP_BUY_PAGE_SIZES = [20, 50]

export const GROUP_BUY_INITIAL_PARAMS: GroupBuyListParams = {
  tab: "ALL",
  keyword: "",
  sort: "START_AT_ASC",
  page: 1,
  size: 20,
}

/** GNB 배지·탭 카운트 폴링 간격 — 계약 관리와 같은 주기 */
export const GROUP_BUY_SUMMARY_POLL_INTERVAL = 30_000

/** 시안 C2 중단 사유 · C4 해지 사유 — 서버 SuspensionReasonCode(해지 요청도 같은 4종) */
export const SUSPENSION_REASON_OPTIONS: Array<{
  label: string
  value: SuspensionReasonCode
}> = [
  { label: "상품 품질 이슈", value: "QUALITY_ISSUE" },
  { label: "가격·조건 오기", value: "PRICE_TERMS_ERROR" },
  { label: "인플루언서와 협의 결렬", value: "NEGOTIATION_BROKEN" },
  { label: "기타(직접 입력)", value: "ETC" },
]

/** 시안 C3 조기 마감 사유 — 서버 EarlyCloseReasonCode */
export const EARLY_CLOSE_REASON_OPTIONS: Array<{
  label: string
  value: EarlyCloseReasonCode
}> = [
  { label: "재고 소진", value: "STOCK_OUT" },
  { label: "판매 목표 달성", value: "TARGET_REACHED" },
  { label: "기타(직접 입력)", value: "ETC" },
]

/** 이슈 유형 — rev.5에서 개설 경로(C5)는 폐기됐고, 폐기 전에 열린 이슈를 보여줄 때만 쓴다 */
export const ISSUE_TYPE_LABEL: Record<GroupBuyIssueType, string> = {
  CONTENT_FULFILLMENT: "콘텐츠 이행 문제",
  TERMS_INTERPRETATION: "계약 조건 해석 이견",
  SETTLEMENT_AMOUNT: "정산 금액 이견",
  ETC: "기타",
}

/** 제17조① 호수 — 시안 B4i·C9 「중단 사유」 */
export const SUSPENSION_CLAUSE_TEXT: Record<
  string,
  { label: string; clause: string }
> = {
  ART17_1_LAW: {
    label: "관련 법령 위반 또는 위반 우려",
    clause: "제17조① 1호",
  },
  ART17_2_IP_DEFECT: {
    label: "지식재산권 침해 또는 상품의 중대한 하자·위해성",
    clause: "제17조① 2호",
  },
  ART17_3_BREACH: {
    label: "중대 의무 불이행",
    clause: "제17조① 3호",
  },
  ART17_4_DISPUTE: {
    label: "분쟁 심화 · 플랫폼 신용 훼손",
    clause: "제17조① 4호",
  },
}

/** 제17조③ 긴급 사유 */
export const EMERGENCY_REASON_LABEL: Record<string, string> = {
  CONSUMER_HARM: "소비자 위해 방지",
  AUTHORITY_ORDER: "행정·사법기관의 명령",
  DAMAGE_SURGE: "피해 급증 우려",
}

/** 소명 증빙 — 서버 허용 형식·크기(PNG · JPG · PDF · 10MB) */
export const APPEAL_FILE_TYPES = ["image/png", "image/jpeg", "application/pdf"]
export const APPEAL_FILE_MAX_BYTES = 10 * 1024 * 1024
export const APPEAL_FILE_MAX_COUNT = 5

/** 오픈 반려 사유(GroupBuyPostRejectReason) — 운영자 설명이 없을 때만 쓴다 */
export const POST_REJECT_REASON_LABEL: Record<string, string> = {
  AD_EFFECT_ASSERTION: "표시광고법 위반 문구 — 효과 단정",
  AD_MEDICAL_CLAIM: "표시광고법 위반 문구 — 의료적 효능 표현",
  AD_SUPERLATIVE: "표시광고법 위반 문구 — 최저가·최상급 표현",
  CONTRACT_PRODUCT_MISMATCH: "계약과 다른 상품 구성",
  CONTRACT_PRICE_MISMATCH: "계약과 다른 가격 표기",
  DISCLOSURE_DAMAGED: "대가관계 표시 훼손",
  ETC: "기타",
}

/**
 * 플랫폼 수수료율(%) — 시안 B6 「플랫폼 수수료 2%·원천징수를 포함한…」 안내에만 쓴다.
 * 상세 응답에 수수료율이 없어 고정값으로 둔다. 금액 계산에는 쓰지 않는다(정산 관리 소관).
 */
export const PLATFORM_FEE_RATE = 2

/**
 * 【잠정 · 기-05】 준비중 · 준비완료 공구의 종결은 「중단」이 아니라 「해지」다(「중단」은 진행중만).
 * 변호사 확인 뒤 바뀔 수 있어 화면 곳곳의 해지 문구를 여기 모은다.
 */
export const TERMINATION_TEXT = {
  action: "해지 요청",
  modalTitle: "공구 해지를 요청할까요?",
  reasonLabel: "해지 사유",
  irreversible: "해지가 처리되면 되돌릴 수 없습니다",
  /** 시안 B3 `.st-hint` */
  railHint: "시작 전에는 중단이 아니라 해지로",
  toast: "해지를 요청했습니다. 운영자가 확인한 뒤 처리합니다.",
} as const

/**
 * 게시물 상태 표시 라벨 — 서버 라벨이 옛 값(`HIDDEN("숨김")`)이어도 시안 명칭(기-08 「노출 중지」)으로 덮는다.
 * 백엔드 main은 이미 `EXPOSURE_SUSPENDED("노출 중지")`라 배포되면 덮을 필요가 없다.
 */
export const POST_STATUS_LABEL_OVERRIDE: Partial<
  Record<GroupBuyPostStatus, string>
> = {
  HIDDEN: "노출 중지",
  EXPOSURE_SUSPENDED: "노출 중지",
}

/** 기-10 지급 기한 흐름 — 지급 영업일은 [정책값 미정]이라 숫자를 쓰지 않고 「N영업일」로 둔다 */
export const PAYOUT_FLOW_TEXT =
  "주문 종결 → 정산 확인 3영업일 → 자동 확정 → N영업일 후 지급"

/** 종료 후 지연 감시 기본 일수 — 서버 `afterEnd.settlementWatchAt`이 없을 때만 쓴다(시안 rev.2 「종료 +30일」) */
export const SETTLEMENT_WATCH_DAYS_FALLBACK = 30
