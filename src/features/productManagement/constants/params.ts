import type {
  ProductDisplayStatus,
  ProductGroupBuyStatus,
  ProductListSortType,
} from "@/features/productManagement/services/productService"

export const PRODUCT_DISPLAY_STATUS: Record<ProductDisplayStatus, string> = {
  DISPLAY: "진열",
  HIDDEN: "미진열",
  PENDING_REVIEW: "재검토 대기",
  HIDE_REQUEST: "미진열(요청)",
}

export const PRODUCT_GROUP_BUY_STATUS: Record<ProductGroupBuyStatus, string> = {
  PREPARING: "준비중",
  READY: "준비완료",
  IN_PROGRESS: "진행중",
  NOT_CONNECTED: "연결 없음",
}

export const PRODUCT_HIDE_REASON_LABELS: Record<string, string> = {
  PRODUCT_NOTICE_ERROR: "상품 정보 제공 고시 오류",
  AD_DISPLAY_VIOLATION: "표시·광고 위반 의심",
  BRAND_REQUEST: "브랜드 요청",
  OTHER: "기타",
}

export const PRODUCT_SORT_OPTIONS: Array<{
  value: ProductListSortType
  label: string
}> = [
  { value: "CREATED_AT", label: "등록일순" },
  { value: "MODIFIED_AT", label: "수정일순" },
  { value: "STOCK_ASC", label: "재고 적은순" },
]

/** 정가·옵션가 상한 — 초과 입력은 스냅이 아니라 **거부**한다(§11-5) */
export const PRICE_MAX = 9_999_999

/** 상품명 최대 길이 — 카운터·maxLength 양쪽에서 쓴다 */
export const PRODUCT_NAME_MAX_LENGTH = 100

/** 옵션 그룹 최대 3개, 그룹당 항목 1~30개 (§11-7) */
export const OPTION_GROUP_MAX = 3
export const OPTION_ITEM_MAX = 30

/** 커버 이미지 최대 4개 — 대표 이미지 1개와 별개(§11-6) */
export const COVER_IMAGE_MAX = 4

/**
 * 공구 상태가 이 값들이면 상품을 삭제할 수 없다(§11-10).
 * **진열 상태와 무관하다** — 판단 축이 잠금(진열 기준)과 다르다.
 * 백엔드 enum에는 종료·정산완료·취소가 없고 전부 NOT_CONNECTED로 합산돼 오므로,
 * 실제로 막히는 값은 준비중·준비완료·진행중 3종이다.
 */
export const DELETE_BLOCKED_GROUP_BUY_STATUSES: Array<ProductGroupBuyStatus> = [
  "PREPARING",
  "READY",
  "IN_PROGRESS",
]

/** "진열 상태와 무관"을 덧붙인다 — 삭제만 판단 축이 다르다는 게 이 화면에서 가장 헷갈리는 지점이다 */
export const DELETE_BLOCKED_TOOLTIP =
  "공구 준비~진행 구간에 연결된 상품은 삭제할 수 없습니다(진열 상태와 무관)"

/** 기능성 화장품 심사필 여부 — 자유 입력이 아니라 2지 선택이다(시안 `select`) */
export const FUNCTIONAL_COSMETIC_OPTIONS = [
  "해당사항 없음",
  "기능성 화장품(식품의약품안전처 심사필)",
]

/** 상품정보제공고시 11필드 — 화장품 고정, 표기 순서·컨트롤 종류도 시안 그대로 */
export const PRODUCT_NOTICE_FIELDS: Array<{
  key: string
  label: string
  control?: "input" | "textarea" | "select"
  /** 라벨 아래 회색 보조 문구 */
  hint?: string
}> = [
  { key: "capacityWeight", label: "용량·중량" },
  { key: "mainSpecs", label: "제품 주요 사양" },
  { key: "expirationPeriod", label: "사용기한·개봉 후 사용기간" },
  { key: "usageMethod", label: "사용방법" },
  { key: "manufacturerSeller", label: "화장품제조업자·책임판매업자" },
  { key: "origin", label: "제조국" },
  { key: "ingredients", label: "전성분", control: "textarea" },
  {
    key: "functionalCosmeticApproval",
    label: "기능성 화장품 식약처 심사필 여부",
    control: "select",
  },
  { key: "precautions", label: "사용 시 주의사항", control: "textarea" },
  { key: "qualityAssurance", label: "품질보증기준" },
  {
    key: "customerServicePhone",
    label: "소비자상담 전화번호",
    hint: "고객센터 전화번호로 자동 입력됨 · 수정 가능",
  },
]
