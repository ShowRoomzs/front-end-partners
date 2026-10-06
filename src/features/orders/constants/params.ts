import type {
  DeliveryCarrier,
  OrderDateBasis,
  OrderListParams,
  OrderSearchType,
  OrderSortType,
  OrderTab,
  PeriodPreset,
  SellerCancelReason,
} from "@/features/orders/types"

export const ORDER_LIST_PATH = "/sales/orders"
export const CLAIM_LIST_PATH = "/sales/claims"

export const ORDER_QUERY_KEYS = {
  LIST: "sellerOrderList",
  SUMMARY: "sellerOrderSummary",
  DETAIL: "sellerOrderDetail",
  PURCHASE_ORDER_TEMPLATE: "sellerPurchaseOrderTemplate",
  CLAIM_SUMMARY: "sellerClaimSummary",
} as const

/** 요약 바·탭 카운트·GNB 배지 — 공구 관리와 같은 주기로 셸에서 폴링한다 */
export const ORDER_SUMMARY_POLL_INTERVAL = 30_000

/** 시안 `.tabs` 순서 그대로 — 작업 큐(신규·취소 요청·상품준비중)가 앞에 모여 있다 */
export const ORDER_TABS: Array<{ value: OrderTab; label: string }> = [
  { value: "ALL", label: "전체" },
  { value: "NEW", label: "신규(준비 대기)" },
  { value: "CANCEL_REQUESTED", label: "취소 요청" },
  { value: "PREPARING", label: "상품준비중" },
  { value: "SHIPPING", label: "배송중" },
  { value: "RETURNING", label: "반송중" },
  { value: "DELIVERED", label: "배송완료" },
  { value: "CONFIRMED", label: "구매확정" },
  { value: "CANCELLED", label: "취소" },
]

/**
 * 작업 큐 3탭(rev.6) — 기본 기간 7일 · 기본 정렬 오래된순. 나머지 조회 탭은 1개월 · 최신순.
 * 처리할 일은 최근 것이지만 찾는 일은 과거를 뒤지는 행동이라 기본 창이 좁으면 매번 늘려야 한다.
 */
const WORK_QUEUE_TABS: Array<OrderTab> = [
  "NEW",
  "PREPARING",
  "CANCEL_REQUESTED",
]

export function isWorkQueueTab(tab: OrderTab) {
  return WORK_QUEUE_TABS.includes(tab)
}

export function defaultPeriodOf(tab: OrderTab): PeriodPreset {
  return isWorkQueueTab(tab) ? "WEEK" : "MONTH"
}

export function defaultSortOf(tab: OrderTab): OrderSortType {
  return isWorkQueueTab(tab) ? "OLDEST_FIRST" : "LATEST_FIRST"
}

/**
 * 발송기한 열 정렬이 있는 탭 — 시안의 「발송기한▼」가 있는 상품준비중(10b)·전체(10e).
 * 신규 탭은 주문 순서가 곧 기한 순서라 따로 두지 않는다(시안 10a).
 */
export function hasShipDueSort(tab: OrderTab) {
  return tab === "PREPARING" || tab === "ALL"
}

/** 기본 진입 탭은 신규(준비 대기) — 브랜드가 매일 처음 여는 작업 큐다 */
export const ORDER_INITIAL_PARAMS: OrderListParams = {
  tab: "NEW",
  dateBasis: "PAID",
  period: "",
  from: "",
  to: "",
  searchType: "ORDER_NUMBER",
  keyword: "",
  sort: "",
  page: 1,
  size: 20,
}

/** 셀렉트 항목은 업계 표준 날짜 필드명을 유지한다(발주확인일·발송처리일) — 버튼 라벨과 다른 이유는 rev.3 참고 */
export const DATE_BASIS_OPTIONS: Array<{
  value: OrderDateBasis
  label: string
}> = [
  { value: "PAID", label: "결제일" },
  { value: "PREPARE_STARTED", label: "발주확인일" },
  { value: "SHIPPED", label: "발송처리일" },
  { value: "DELIVERED", label: "배송완료일" },
  { value: "CONFIRMED", label: "구매확정일" },
]

export const PERIOD_PRESETS: Array<{ value: PeriodPreset; label: string }> = [
  { value: "TODAY", label: "오늘" },
  { value: "WEEK", label: "7일" },
  { value: "MONTH", label: "1개월" },
  { value: "QUARTER", label: "3개월" },
  { value: "CUSTOM", label: "직접 입력" },
]

/** 조회 상한 — 서버 `order.search-range-max-days`(365)와 같다 */
export const SEARCH_RANGE_MAX_DAYS = 365

/** 검색은 타입을 먼저 고른다 — 송장번호와 주문번호가 섞여 오조회가 나지 않게 */
export const SEARCH_TYPE_OPTIONS: Array<{
  value: OrderSearchType
  label: string
}> = [
  { value: "ORDER_NUMBER", label: "주문번호" },
  { value: "RECIPIENT_NAME", label: "수취인명" },
  { value: "TRACKING_NUMBER", label: "송장번호" },
  { value: "PRODUCT_NAME", label: "상품명" },
]

export const SORT_LABELS: Record<OrderSortType, string> = {
  OLDEST_FIRST: "주문일시 오래된순",
  LATEST_FIRST: "최신순",
  SHIP_DUE_ASC: "발송기한 임박순",
}

export const ORDER_PAGE_SIZES = [20, 50]

/**
 * 택배사 11종 · 사용 빈도순(rev.4 확정) — 목록에서만 고른다.
 * 조회 주소는 서버 `DeliveryCarrier.trackingUrlTemplate`과 같다. 없으면 [택배사에서 조회 ↗]를 내리지 않는다.
 */
export const CARRIERS: Array<{
  value: DeliveryCarrier
  label: string
  trackingUrl: string | null
}> = [
  {
    value: "CJ",
    label: "CJ대한통운",
    trackingUrl: "https://trace.cjlogistics.com/next/tracking.html?wblNo={no}",
  },
  {
    value: "LOTTE",
    label: "롯데택배",
    trackingUrl:
      "https://www.lotteglogis.com/home/reservation/tracking/linkView?InvNo={no}",
  },
  {
    value: "HANJIN",
    label: "한진택배",
    trackingUrl:
      "https://www.hanjin.com/kor/CMS/DeliveryMgr/WaybillResult.do?mCode=MN038&schLang=KR&wblnumText2={no}",
  },
  {
    value: "EPOST",
    label: "우체국택배",
    trackingUrl:
      "https://service.epost.go.kr/trace.RetrieveDomRigiTraceList.comm?sid1={no}",
  },
  {
    value: "KYUNGDONG",
    label: "경동택배",
    trackingUrl:
      "https://kdexp.com/service/delivery/etc/delivery.do?barcode={no}",
  },
  { value: "DAESIN", label: "대신택배", trackingUrl: null },
  {
    value: "LOGEN",
    label: "로젠택배",
    trackingUrl: "https://www.ilogen.com/web/personal/trace/{no}",
  },
  { value: "HAPDONG", label: "합동택배", trackingUrl: null },
  { value: "COUPANG", label: "쿠팡택배", trackingUrl: null },
  { value: "WOORI", label: "우리택배", trackingUrl: null },
  {
    value: "CU",
    label: "CU편의점택배",
    trackingUrl:
      "https://www.cupost.co.kr/postbox/delivery/localResult.cupost?invoice_no={no}",
  },
]

export function carrierLabelOf(carrier: DeliveryCarrier | null | undefined) {
  return CARRIERS.find(item => item.value === carrier)?.label ?? ""
}

export function trackingUrlOf(
  carrier: DeliveryCarrier | null,
  trackingNumber: string | null
) {
  const template = CARRIERS.find(item => item.value === carrier)?.trackingUrl
  return template && trackingNumber
    ? template.replace("{no}", trackingNumber)
    : null
}

/** 직권 취소 사유(E5) — 서버 SellerCancelReason */
export const CANCEL_REASON_OPTIONS: Array<{
  value: SellerCancelReason
  label: string
}> = [
  { value: "SOLD_OUT", label: "품절" },
  { value: "DEFECT", label: "상품 하자" },
  { value: "UNDELIVERABLE_AREA", label: "배송 불가 지역" },
  { value: "ETC", label: "기타(직접 입력)" },
]

/**
 * 취소 요청 거부 사유(E7) — 서버는 자유 문장(`reason`) 하나를 받는다. 선택지는 화면이 정한
 * 문장이고, 기타만 직접 입력이다. 고른 문장이 그대로 소비자에게 전달된다.
 */
export const REJECT_REASON_OPTIONS = [
  "이미 포장·출고가 완료됨",
  "택배사 집화가 완료됨",
  "주문 제작·맞춤 상품",
] as const

export const REJECT_REASON_ETC = "기타(직접 입력)"

/** 거부 사유·직권 취소 설명 글자 수 상한 — 서버 @Size */
export const REJECT_REASON_MAX = 500
export const CANCEL_MESSAGE_MAX = 300

/** 엑셀 업로드 상한 — 서버 `order.shipment-upload-max-rows` */
export const SHIPMENT_UPLOAD_MAX_ROWS = 1000

/** 취소 요청 「경과」 열 — 이 시간을 넘기면 경고색(시안 A2f의 15시간 행) */
export const CANCEL_REQUEST_WARN_HOURS = 12
