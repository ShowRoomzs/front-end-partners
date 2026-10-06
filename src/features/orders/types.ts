import type { BaseParams } from "@/common/types/page"

/*
  파트너센터 주문 관리(§34 · 시안 ui-partner-10a~10e). 타입은 백엔드
  `api/seller/order/dto`·`domain/order/type`을 그대로 옮긴다 — 라벨·배지 색은 서버가 정하고
  화면은 받은 값을 그린다(OrderBadgeTone 주석 「FE가 매핑표를 들지 않는다」).
*/

/** 목록 탭 9종 — 작업 큐 3(신규·상품준비중·취소 요청) · 조회 6. 탭이 기본 기간·정렬을 소유한다 */
export type OrderTab =
  | "ALL"
  | "NEW"
  | "PREPARING"
  | "CANCEL_REQUESTED"
  | "SHIPPING"
  | "RETURNING"
  | "DELIVERED"
  | "CONFIRMED"
  | "CANCELLED"

/** 조회 기준 5종 — 결제일 · 발주확인일 · 발송처리일 · 배송완료일 · 구매확정일 */
export type OrderDateBasis =
  | "PAID"
  | "PREPARE_STARTED"
  | "SHIPPED"
  | "DELIVERED"
  | "CONFIRMED"

export type OrderSearchType =
  | "ORDER_NUMBER"
  | "RECIPIENT_NAME"
  | "TRACKING_NUMBER"
  | "PRODUCT_NAME"

/** 정렬 — 기준 시각은 결제일. 발송기한 정렬은 신규·상품준비중 탭의 열 정렬용 */
export type OrderSortType = "OLDEST_FIRST" | "LATEST_FIRST" | "SHIP_DUE_ASC"

/** 이행 상태 — 취소 요청·배송 이상·발송기한 경과는 상태가 아니라 오버레이다 */
export type FulfillmentStatus =
  | "NEW"
  | "PREPARING"
  | "SHIPPING"
  | "RETURNING"
  | "DELIVERED"
  | "CONFIRMED"
  | "CANCELLED"

export type OrderBadgeTone =
  | "NEUTRAL"
  | "INFO"
  | "WARNING"
  | "SUCCESS"
  | "DANGER"

/** 배송 이상 2단 — 집화 확인 필요(경고) · 추적 정지(위험) */
export type TrackingAlert = "PICKUP_UNCONFIRMED" | "STALLED"

/** 택배사 11종 · 사용 빈도순 — 자유 입력·「미지원 택배사」 없음 */
export type DeliveryCarrier =
  | "CJ"
  | "LOTTE"
  | "HANJIN"
  | "EPOST"
  | "KYUNGDONG"
  | "DAESIN"
  | "LOGEN"
  | "HAPDONG"
  | "COUPANG"
  | "WOORI"
  | "CU"

export type PurchaseOrderColumn =
  | "ORDER_NUMBER"
  | "RECIPIENT"
  | "PHONE"
  | "ZIP_CODE"
  | "ADDRESS"
  | "PRODUCT_NAME"
  | "OPTION"
  | "QUANTITY"
  | "DELIVERY_MEMO"
  | "GROUP_BUY_NAME"
  | "ORDERED_AT"
  | "PAID_AMOUNT"
  | "SUB_ORDER_NUMBER"

/** 직권 취소 사유(E5) — 기타는 설명 입력이 필수 */
export type SellerCancelReason =
  | "SOLD_OUT"
  | "DEFECT"
  | "UNDELIVERABLE_AREA"
  | "ETC"

// ── 목록 ─────────────────────────────────────────────

export interface OrderOverlays {
  /** 검토 중 취소 요청 있음 — 취소 요청 탭으로 간다 */
  cancelRequested: boolean
  trackingAlert: TrackingAlert | null
  trackingAlertLabel: string | null
  /** 발송기한 경과 — 브랜드 귀책(위험). 신규·상품준비중에서만 판정 */
  shipOverdue: boolean
  /** 진행 중인 반품·교환 건수 — 배송완료 탭에서 D-N이 왜 비었는지 설명한다 */
  openClaimCount: number
}

export interface OrderCancelRequestSummary {
  cancelRequestId: number
  reasonLabel: string
  reasonDetail: string | null
  requestedAt: string
  /** 경과 열 — 요청 후 경과 시간(시간 단위 내림) */
  elapsedHours: number
  /** 「3건 중 1건 요청 · 남은 2건 발송 대기」 */
  summary: string
}

export interface OrderItem {
  orderProductId: number
  productName: string
  /** 단일 상품이면 null */
  optionName: string | null
  quantity: number
  /** 공구가(판매 단가) */
  price: number
  amount: number
  /** 취소 / 반품 / 구매확정 / 그 외는 하위주문 상태 문구 */
  itemStatusLabel: string
  cancelled: boolean
  /** 검토 중 취소 요청의 대상 항목 — C11 경고 톤 */
  cancelRequested: boolean
}

export interface OrderListItem {
  /** 하위주문 id — 상세·액션 API의 키 */
  deliveryGroupId: number
  orderNumber: string
  subOrderNumber: string
  groupBuyName: string | null
  /** 소비자명 — 전체 표기(rev.6) */
  recipientName: string
  /** 「상품명 외 N건」 */
  productSummary: string | null
  totalQuantity: number
  status: FulfillmentStatus
  statusLabel: string
  statusTone: OrderBadgeTone
  overlays: OrderOverlays
  orderedAt: string
  shipDueAt: string | null
  carrier: DeliveryCarrier | null
  carrierLabel: string | null
  trackingNumber: string | null
  /** 배송중 열 「최종 갱신」 — 갱신이 멈춘 것이 문제 신호다 */
  lastTrackingAt: string | null
  deliveredAt: string | null
  /** 자동 확인 / 운영자 처리 */
  deliveredSourceLabel: string | null
  /** 구매확정 예정 D-N — 배송완료가 아니거나 보류 클레임이 있으면 null */
  confirmRemainingDays: number | null
  confirmedAt: string | null
  /** 판매가 합 + 배송비 — 구매확정 탭 「결제금액」 */
  paidAmount: number
  /** 정산 — 정산 모듈 전이라 null(0이 아니다) */
  settlementLabel: string | null
  cancelledAt: string | null
  /** 취소 탭 「취소 사유」 — 소비자 취소 · 준비 시작 전 / 취소 요청 승인 · 브랜드 승인 / 브랜드 직권 취소 */
  cancelTypeLabel: string | null
  cancelRequest: OrderCancelRequestSummary | null
  items: Array<OrderItem>
}

export interface OrderSummaryResponse {
  actionBar: {
    prepareStart: number
    invoiceRegister: number
    /** 집화 확인 필요 + 추적 정지 + 반송중 */
    deliveryIssue: number
    /** 반품·교환의 검수 단계 건수 */
    incomingCheck: number
    /** 재발송 대기 건수 */
    reshipExchange: number
  }
  tabCounts: Record<OrderTab, number>
}

/** 시안 프리셋 — 오늘 · 7일 · 1개월 · 3개월 · 직접 입력(rev.6) */
export type PeriodPreset = "TODAY" | "WEEK" | "MONTH" | "QUARTER" | "CUSTOM"

/** 목록 조건 — URL과 동기화된다. 기간은 프리셋으로 들고 다니고 요청 직전에 날짜로 푼다 */
export interface OrderListParams extends BaseParams {
  tab: OrderTab
  dateBasis: OrderDateBasis
  /** 빈 값이면 탭 기본 기간 — 작업 큐 7일 · 조회 탭 1개월 */
  period: PeriodPreset | ""
  /** 직접 입력일 때만 쓴다 — YYYY-MM-DD */
  from: string
  to: string
  searchType: OrderSearchType
  keyword: string
  /** 빈 값이면 탭 기본 정렬(작업 큐 오래된순 · 조회 탭 최신순) */
  sort: OrderSortType | ""
}

/** 서버로 보내는 조건 — 프리셋을 날짜로 푼 뒤 */
export interface OrderQueryParams {
  tab: OrderTab
  dateBasis: OrderDateBasis
  from: string
  to: string
  searchType?: OrderSearchType
  keyword?: string
  sort?: OrderSortType
  page: number
  size: number
}

// ── 상세 ─────────────────────────────────────────────

export interface OrderRecipient {
  name: string
  phone: string
  zipCode: string
  address: string
  detailAddress: string | null
  deliveryMemo: string | null
}

export interface OrderAmounts {
  /** 상품 합계 — 취소 항목 포함 */
  productTotal: number
  deliveryFee: number
  totalAmount: number
  /** 검토 중 취소 요청분 — 없으면 null */
  cancelRequestedAmount: number | null
  /** 확정된 취소분(항목 합) */
  cancelledAmount: number
}

export interface OrderTimeline {
  shipDueAt: string | null
  prepareStartedAt: string | null
  shippedAt: string | null
  carrier: DeliveryCarrier | null
  carrierLabel: string | null
  trackingNumber: string | null
  lastTrackingAt: string | null
  returnDetectedAt: string | null
  deliveredAt: string | null
  deliveredSourceLabel: string | null
  /** 구매확정 예정 — 보류 클레임이 있으면 null */
  confirmDueAt: string | null
  confirmedAt: string | null
  cancelledAt: string | null
  cancelTypeLabel: string | null
  cancelReasonLabel: string | null
  cancelReasonDetail: string | null
}

export interface OrderCancelRequestBlock {
  cancelRequestId: number
  reasonLabel: string
  reasonDetail: string | null
  requestedAt: string
  statusAtRequestLabel: string
  /** 준비 시작 후 경과(시간) — 준비 시작 전 요청이면 null */
  hoursSincePrepareStart: number | null
  items: Array<{
    orderProductId: number
    productName: string
    optionName: string | null
    quantity: number
    refundAmount: number
  }>
  /** 요청 항목 환불 예정 합계 — 배송비 제외 */
  totalRefundAmount: number
  /** 남은(미요청·미취소) 항목 수 */
  remainingItemCount: number
}

/** 버튼 노출 규칙의 정본 — 서버가 소유한다 */
export interface OrderActions {
  canPrepareStart: boolean
  canRegisterInvoice: boolean
  canUpdateInvoice: boolean
  canCancelDirectly: boolean
  canDecideCancelRequest: boolean
}

export interface OrderHistoryItem {
  eventType: string
  label: string
  /** SYSTEM · SELLER · ADMIN · CONSUMER · TRACKER */
  actorType: string
  actorLabel: string
  detail: string | null
  occurredAt: string
}

export interface OrderDetailResponse {
  deliveryGroupId: number
  orderNumber: string
  subOrderNumber: string
  orderedAt: string
  groupBuyId: number | null
  groupBuyName: string | null
  paymentMethod: string | null
  status: FulfillmentStatus
  statusLabel: string
  statusTone: OrderBadgeTone
  overlays: OrderOverlays
  recipient: OrderRecipient
  items: Array<OrderItem>
  amounts: OrderAmounts
  timeline: OrderTimeline
  cancelRequest: OrderCancelRequestBlock | null
  actions: OrderActions
  history: Array<OrderHistoryItem>
}

// ── 액션 ─────────────────────────────────────────────

/** 다건 액션의 부분 성공 응답 — 제외 행은 사유와 함께 돌아온다 */
export interface BatchActionResponse {
  succeeded: number
  skipped: Array<{
    deliveryGroupId: number
    /** ORDER_STATE_CHANGED · CANCEL_REQUEST_PENDING_EXISTS · INVOICE_DUPLICATE · INVOICE_FORMAT_INVALID · ORDER_GROUP_NOT_FOUND */
    code: string
    message: string
  }>
}

export interface ShipmentRow {
  deliveryGroupId: number
  carrier: DeliveryCarrier
  trackingNumber: string
}

export interface PurchaseOrderTemplate {
  /** 저장된(없으면 기본 8종) 구성 — 순서가 곧 열 순서 */
  columns: Array<PurchaseOrderColumn>
  available: Array<{
    code: PurchaseOrderColumn
    header: string
    basic: boolean
  }>
}

export interface PurchaseOrderBody {
  /** 비어 있으면 아래 필터(현재 탭 전체)로 대상을 정한다 */
  deliveryGroupIds?: Array<number>
  columns: Array<PurchaseOrderColumn>
  saveAsDefault?: boolean
  tab?: OrderTab
  dateBasis?: OrderDateBasis
  from?: string
  to?: string
  searchType?: OrderSearchType
  keyword?: string
}

export interface ShipmentParseResponse {
  totalRows: number
  /** 「N건 목록에 채우기」의 N */
  validRows: number
  rows: Array<{
    rowNumber: number
    orderNumber: string
    subOrderNumber: string | null
    deliveryGroupId: number | null
    /** 칸이 비었으면 null — 목록 셀에서 고른 뒤 확정한다 */
    carrier: DeliveryCarrier | null
    trackingNumber: string
    valid: boolean
    errorCode: string | null
    message: string | null
  }>
}

export interface DirectCancelBody {
  deliveryGroupIds: Array<number>
  reasonCode: SellerCancelReason
  consumerMessage: string
}

/** 반품·교환 요약 — 판매 관리 상단 「반품·교환 관리」 탭 건수만 쓴다 */
export interface ClaimSummaryResponse {
  tabCounts: Record<string, number>
}
