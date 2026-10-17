/*
  반품·교환 관리(35 설계서) — 백엔드 `api/seller/claim/dto/*` · `domain/order/type/Claim*`를 그대로 옮겼다.
  LocalDateTime 값은 문자열로 받고 표시할 때 `parseServerDateTime`으로 읽는다.
*/

export const CLAIM_TABS = [
  "ALL",
  "COLLECT_WAIT",
  "COLLECTING",
  "INSPECTION",
  "RESHIP",
  "REJECT_HOLD",
  "DONE",
] as const
export type ClaimTab = (typeof CLAIM_TABS)[number]

export type ClaimType = "RETURN" | "EXCHANGE"

export type ClaimReason =
  | "CHANGE_OF_MIND"
  | "ORDER_MISTAKE"
  | "SIZE_MISMATCH"
  | "DAMAGED_OR_DEFECTIVE"
  | "WRONG_OR_LATE_DELIVERY"

export type ClaimStatus =
  | "PAYMENT_PENDING"
  | "REQUESTED"
  | "COLLECTING"
  | "ARRIVED"
  | "RECEIVED"
  | "REFUND_PENDING"
  | "RESHIP_READY"
  | "RESHIPPING"
  | "REJECT_HOLD"
  | "COMPLETED"

export type ClaimRejectReason =
  | "USED"
  | "PACKAGE_DAMAGED"
  | "PRODUCT_MISMATCH"
  | "PERIOD_EXPIRED"
  | "ETC"

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

export type BadgeTone = "NEUTRAL" | "INFO" | "WARNING" | "SUCCESS" | "DANGER"

export type ClaimReshipReason = "EXCHANGE" | "REJECT_RETURN"

export type StoragePhase = "NOTICE_PENDING" | "STORING" | "EXPIRED"

export type ClaimOutcomeCode =
  | "REFUND_PENDING"
  | "RESHIPPING"
  | "REFUNDED"
  | "EXCHANGED"
  | "REJECTED"
  | "CANCELLED"

export type ClaimReshipColumn =
  | "CLAIM_NUMBER"
  | "RECIPIENT"
  | "PHONE"
  | "ZIP_CODE"
  | "ADDRESS"
  | "PRODUCT_NAME"
  | "OPTION"
  | "QUANTITY"
  | "RESHIP_REASON"
  | "REQUESTED_AT"
  | "ORDER_NUMBER"
  | "GROUP_BUY_NAME"
  | "CLAIM_TYPE"

/** 회수 묶음(박스) — 같은 요청의 클레임들이 회수 송장 하나를 나눠 갖는다 */
export interface ClaimCollection {
  collectionId: number
  /** 2 이상이면 그룹 행으로 그린다 */
  size: number
  leadClaimNumber: string
  carrier: DeliveryCarrier | null
  carrierLabel: string | null
  trackingNumber: string | null
  lastTrackingLabel: string | null
  lastTrackingAt: string | null
  arrivedAt: string | null
}

export interface ClaimStorage {
  noticeCount: number
  lastNoticeAt: string | null
  /** 고지 2회 미만이면 null(기한 미정) */
  storageDueAt: string | null
  phase: StoragePhase
}

export interface ClaimOutcome {
  code: ClaimOutcomeCode
  label: string
  finalized: boolean
}

export interface ClaimListActions {
  canConfirmReceipt: boolean
  canInspect: boolean
  canRegisterReshipment: boolean
}

export interface ClaimOrderItem {
  productName: string
  optionName: string | null
  orderedQuantity: number
  /** 이 요청에서 신청한 수량 — 신청하지 않은 항목은 0 */
  claimedQuantity: number
  price: number
  itemStatusLabel: string
}

/** 재발송비 상태(서버 ClaimChargeStatus) */
export type ClaimChargeStatus =
  | "PENDING"
  | "PAID"
  | "DEDUCTED"
  | "COVERED"
  | "VOID"
  | "REFUNDED"

export interface ClaimReshipFee {
  amount: number
  status: ClaimChargeStatus
  statusLabel: string
  /** 반려 재발송비 결제 기한 — 결제가 필요 없거나 판정 중이면 null */
  dueAt: string | null
}

export interface ClaimListItem {
  claimId: number
  claimNumber: string
  type: ClaimType
  typeLabel: string
  consumerName: string
  productName: string
  optionName: string | null
  exchangeOptionName: string | null
  /** 「상품 옵션 → 교환 옵션」 */
  productLabel: string
  /** 재발송·반려 보류 탭의 「보낼 상품·옵션」/「보관 중인 상품」 */
  shipLabel: string | null
  quantity: number
  reasonCode: ClaimReason
  reasonLabel: string
  consumerAttachmentCount: number
  status: ClaimStatus
  statusLabel: string
  stage: ClaimTab | null
  statusTone: BadgeTone
  requestedAt: string
  stageEnteredAt: string
  /** 「경과」 열 — 현재 단계 진입부터의 달력일 */
  elapsedDays: number
  /** 기한 초과 — 회수 대기 방치 또는 검수 기한 경과 */
  overdue: boolean
  collection: ClaimCollection | null
  receivedAt: string | null
  inspectDueAt: string | null
  reshipReason: ClaimReshipReason | null
  reshipReasonLabel: string | null
  reshipCarrier: DeliveryCarrier | null
  reshipCarrierLabel: string | null
  reshipTrackingNumber: string | null
  /** 재발송비 — 청구가 없으면 null(브랜드 귀책 교환 · 반려 판정 전) */
  reshipFee: ClaimReshipFee | null
  rejectReasonLabel: string | null
  sellerEvidenceCount: number
  rejectedAt: string | null
  storage: ClaimStorage | null
  outcome: ClaimOutcome | null
  /** 완료 탭 「금액」 — 환불 확정액(환불 대기면 그 항목의 상품 금액). 교환·반려는 null */
  amount: number | null
  completedAt: string | null
  actions: ClaimListActions
  orderItems: Array<ClaimOrderItem>
  /** 「3개 항목 중 1개 신청」 */
  orderSummary: string
}

export interface ClaimRefund {
  itemAmount: number
  requestDeduction: number
  requestExpectedAmount: number
  basisLabel: string
}

export interface ClaimResult {
  reshipDeliveredAt: string | null
  confirmDueAt: string | null
  /** RETURNED 반송 완료 · DISPOSED 보관 기간 만료 후 폐기 */
  rejectionEnd: "RETURNED" | "DISPOSED" | null
  disposedAt: string | null
}

export interface ClaimNotice {
  seq: number
  notifiedAt: string
  channel: string | null
}

export interface ClaimHistoryItem {
  eventType: string
  eventLabel: string
  actorType: string
  actorLabel: string
  detail: string | null
  occurredAt: string
}

export interface ClaimDetailActions {
  canConfirmReceipt: boolean
  canPass: boolean
  canReject: boolean
  canRegisterReshipment: boolean
  canUpdateReshipment: boolean
}

export interface ClaimDetailResponse {
  summary: ClaimListItem
  orderNumber: string
  deliveryGroupId: number
  /** 마스킹된 값 */
  consumerPhone: string | null
  reasonDetail: string | null
  /** 교환만 — 고객 귀책이면 요청 때 결제했다 */
  exchangeFeeCharged: boolean | null
  /** 반품만 */
  refund: ClaimRefund | null
  consumerAttachments: Array<string>
  sellerEvidences: Array<string>
  rejectDetail: string | null
  result: ClaimResult | null
  notices: Array<ClaimNotice>
  history: Array<ClaimHistoryItem>
  actions: ClaimDetailActions
}

export interface ClaimSummaryResponse {
  kpi: {
    collectWait: number
    inspection: number
    reship: number
    /** 0이면 경고 톤을 뺀다 */
    overdue: number
  }
  tabCounts: Record<ClaimTab, number>
  typeCounts: Record<ClaimType, number>
}

export interface ClaimBatchResponse {
  succeeded: number
  skipped: Array<{ claimId: number; code: string; message: string }>
}

/** 검수 반려 법적 근거 — 전자상거래법 제17조② 각 호(서버 ClaimRejectLegalBasis) */
export type ClaimRejectLegalBasis =
  | "ART17_2_1"
  | "ART17_2_2"
  | "ART17_2_3"
  | "ART17_2_5"

/** 검수 반려 6항목(서버 SellerClaimRejectRequest) — 사유·상세·법적 근거·소비자 메시지·증빙은 필수 */
export interface ClaimRejectBody {
  reasonCode: ClaimRejectReason
  detail: string
  legalBasis: ClaimRejectLegalBasis
  /** 생략하거나 신청 수량과 같으면 전체 반려, 작으면 일부 반려 */
  rejectedQuantity?: number
  /** true 면 브랜드 귀책으로 인정(반품 배송비 차감 환원 · 반려 재발송비 브랜드 부담) */
  faultChangedToSeller?: boolean
  consumerMessage: string
  evidenceImageUrls: Array<string>
}

export interface ReshipItem {
  claimId: number
  carrier: DeliveryCarrier | null
  trackingNumber: string
}

export interface ReshipTemplateResponse {
  columns: Array<ClaimReshipColumn>
  available: Array<{ code: ClaimReshipColumn; header: string; basic: boolean }>
}

export interface ReshipExportBody {
  claimIds: Array<number> | null
  columns: Array<ClaimReshipColumn>
  saveAsDefault: boolean
}

export interface ReshipParsedRow {
  rowNumber: number
  claimNumber: string
  claimId: number | null
  carrier: DeliveryCarrier | null
  trackingNumber: string
  valid: boolean
  errorCode: string | null
  message: string | null
}

export interface ReshipParseResponse {
  totalRows: number
  validRows: number
  rows: Array<ReshipParsedRow>
}

/** 기간 프리셋 — 서버에는 from·to만 간다 */
export type ClaimPeriodPreset = "TODAY" | "7D" | "1M" | "3M" | "CUSTOM"

export interface ClaimListParams {
  tab: ClaimTab
  types: Array<ClaimType>
  /** 빈 문자열 = 전체 */
  reason: ClaimReason | ""
  period: ClaimPeriodPreset
  from: string
  to: string
  keyword: string
  page: number
  size: number
}
