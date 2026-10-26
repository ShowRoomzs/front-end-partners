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
  | "WAIVED"

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
  /** 운영자가 대신 연 클레임 — 「운영자 개설 · 구매확정 후 하자 · 증빙 N장」 */
  openedByOperator: boolean
  openReason: string | null
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
  /**
   * [사유 번복] — 입고 확인 뒤 · 착불(브랜드 귀책) 신청 건. 1021 백엔드(main)에서 생긴 값이라
   * 아직 배포되지 않은 서버는 내려 주지 않는다(undefined) — 그 서버는 귀책 변경 · 사유 번복을 모른다.
   */
  canOverturn?: boolean
}

/** 검수 판정(서버 ClaimInspectionResult) */
export type ClaimInspectionResult = "PASSED" | "REASON_OVERTURNED" | "REJECTED"

/** 운임 정산 발생 계기(서버 FreightAdjustmentTrigger) */
export type FreightAdjustmentTrigger =
  | "REASON_OVERTURNED"
  | "FAULT_TO_SELLER_ON_PASS"
  | "REJECT_WITH_COLLECT"
  | "DISPUTE_ACCEPTED"

/** 운임 정산 한 행 — 브랜드 정산 「± 운임 정산」과 같은 행(서버 SellerClaimFreightRow) */
export interface ClaimFreightRow {
  trigger: FreightAdjustmentTrigger
  triggerLabel: string
  /** CHARGE_CONSUMER 소비자 부담(정산 +) · REFUND_CONSUMER 소비자 환급(정산 −) */
  direction: "CHARGE_CONSUMER" | "REFUND_CONSUMER"
  collectFreight: number
  prepaidFreight: number
  /** 차감했던 최초 배송비 환원 — 표시용(정산 금액에는 들어가지 않는다) */
  initialFeeRestored: number
  /** 정산 반영 금액(부호 있음) */
  signedAmount: number
  settledVia:
    | "REFUND_DEDUCTION"
    | "CHARGE"
    | "REFUND_ADDITION"
    | "BANK_TRANSFER"
}

/** 검수 판정 · 자동 입고 · 운임 정산(서버 SellerClaimInspection) — 판정 기록도 운임 행도 없으면 null */
export interface ClaimInspection {
  result: ClaimInspectionResult | null
  resultLabel: string | null
  /** 사유 번복 설명 — 소비자에게 그대로 보인다 */
  explanation: string | null
  /** 택배 도착 후 N영업일 동안 입고 확인이 없어 시스템이 입고 처리했다 */
  autoReceived: boolean
  /** 교환 사유 번복 결제 금액(재발송 배송비 + 착불 운임) */
  overturnFee: number | null
  freight: Array<ClaimFreightRow>
}

/** 구매확정 타이머 — 「정지 · 남은 4일」(서버 SellerClaimPurchaseConfirm) */
export interface ClaimPurchaseConfirm {
  paused: boolean
  remainingDays: number | null
  dueAt: string | null
}

export interface ClaimDetailResponse {
  summary: ClaimListItem
  orderNumber: string
  deliveryGroupId: number
  /** 마스킹된 값 */
  consumerPhone: string | null
  reasonDetail: string | null
  /** @deprecated 서버 호환 필드 — `reshipFeeCharged`와 같은 값(기-18로 「교환비」가 없어졌다) */
  exchangeFeeCharged: boolean | null
  /** 교환만 — 고객 귀책이면 요청 때 재발송 배송비를 결제했다. 1021 서버부터 내려온다 */
  reshipFeeCharged?: boolean | null
  /** 반품만 */
  refund: ClaimRefund | null
  consumerAttachments: Array<string>
  sellerEvidences: Array<string>
  rejectDetail: string | null
  /** 배송완료 전이면 null */
  purchaseConfirm: ClaimPurchaseConfirm | null
  result: ClaimResult | null
  notices: Array<ClaimNotice>
  history: Array<ClaimHistoryItem>
  actions: ClaimDetailActions
  /** 1021 서버부터 — 판정이 기록됐거나 운임 정산 행이 있을 때만(아직 배포 전 서버는 undefined) */
  inspection?: ClaimInspection | null
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
  /** true 면 브랜드 귀책으로 인정(차감한 최초 배송비 환원 · 반려 재발송비 브랜드 부담) */
  faultChangedToSeller?: boolean
  consumerMessage: string
  evidenceImageUrls: Array<string>
}

/** 검수 통과(서버 SellerClaimPassRequest) — 생략하면 신청 때 귀책 그대로 */
export interface ClaimPassBody {
  /** 브랜드 귀책으로 인정 — 선불(소비자 귀책) 신청일 때만 의미가 있다 */
  faultToSeller: boolean
}

/** 검수 사유 번복(서버 SellerClaimOverturnRequest) — 설명 · 증빙 1~5장 필수 */
export interface ClaimOverturnBody {
  explanation: string
  evidenceImageUrls: Array<string>
}

/**
 * 판정 전 운임 미리보기 — **서버에 아직 없는 값**(B2b · B1r · M1 금액 줄).
 * 상세 응답에는 판정 뒤의 운임 행(`inspection.freight`)만 있어, 판정 전에 「착불 운임 3,000원」을 그릴 원천이 없다.
 * 개발 서버만 목업으로 채우고 배포본은 null(금액 줄을 그리지 않는다).
 */
export interface ClaimFreightPreview {
  /** 운임 정액 = 그 주문의 기본 배송비(기-93 보완) — 착불 운임 · 선불 운임 */
  freight: number
  /** 교환 재발송 배송비(기본 배송비 + 권역 추가비) */
  reshipFee: number
  /** 원래 결제액 — 이를 넘는 환급분은 운영자가 계좌로 송금한다 */
  originalPaidAmount: number
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
