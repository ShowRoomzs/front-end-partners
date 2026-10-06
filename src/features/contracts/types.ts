import type { BaseParams } from "@/common/types/page"

/*
  계약 관리(§25·§26) 타입 — 백엔드 `api/seller/contract/dto/*.java`·`domain/contract/type/*.java`와 1:1.
  서버가 내려주는 값을 그대로 쓰고, 화면 문구·색은 서버 `statusLabel`·`statusTone`을 따른다.
*/

/** 상태 9종 — 3서피스 공통(§25-2). 「서명 진행중」을 쪼개지 않는다 */
export type ContractStatus =
  | "DRAFT"
  | "REVIEW_PENDING"
  | "REVIEW_REJECTED"
  | "SIGNING"
  | "CONCLUSION_PENDING"
  | "CONCLUDED"
  | "DECLINED"
  | "EXPIRED"
  | "CANCELED"

/** 배지 색 — 서버가 상태별로 하나만 내린다(원칙 ③ 같은 상태는 같은 색) */
export type ContractStatusTone =
  | "NEUTRAL"
  | "INFO"
  | "WARNING"
  | "SUCCESS"
  | "DANGER"

/** 목록 탭 — 서버 `ContractTab`. 탭은 필터일 뿐, 응답 `status`는 9종 개별 값이다 */
export type ContractTab =
  | "ALL"
  | "DRAFT"
  | "REVIEW"
  | "SIGNING"
  | "CONCLUDED"
  | "CLOSED"

export type ContractSortType = "CREATED_DESC" | "START_AT_ASC"

export type FixedFeeTrigger =
  | "POST_REGISTERED"
  | "GROUP_BUY_ENDED"
  | "SETTLEMENT_COMPLETED"

export type SecondaryUsePeriodType = "FIXED" | "UNLIMITED"

export type WithholdingType = "WITHHOLDING_3_3" | "TAX_INVOICE"

export type ContractDocumentType =
  | "GENERATED_DRAFT"
  | "SIGNED_PDF"
  | "AUDIT_TRAIL"

export type ContractActorType = "SELLER" | "CREATOR" | "ADMIN" | "SYSTEM"

/** 이력 이벤트 — append-only. 서버가 값을 늘려도 화면이 죽지 않게 라벨 표는 기본값을 둔다 */
export type ContractEventType =
  | "CREATED"
  | "REVIEW_REQUESTED"
  | "REVIEW_REQUEST_CANCELED"
  | "REVIEW_APPROVED"
  | "REVIEW_REJECTED"
  | "SIGNATURE_SENT"
  | "BRAND_SIGNED"
  | "CREATOR_SIGNED"
  | "SIGNATURE_UPDATED"
  | "BOTH_SIGNED_CONFIRMED"
  | "RESEND_REQUESTED"
  | "RESEND_HANDLED"
  | "CONTRACT_PDF_GENERATED"
  | "DOCUMENT_UPLOADED"
  | "DOCUMENT_DELETED"
  | "CONCLUDED"
  | "DECLINED"
  | "EXPIRED"
  | "CANCELED"
  | "FIXED_FEE_PAID"
  | "GROUP_BUY_CREATED"
  | "DELETED"

/**
 * 하드 검증 위반의 종류(§25-6 절대 규칙).
 * REQUIRED = 미입력 → 문구 없이 [검토 요청]만 비활성 / RULE = 규칙 위반 → 해당 필드에 에러 문구
 */
export type ContractViolationKind = "REQUIRED" | "RULE"

export interface ContractViolation {
  code: string
  kind: ContractViolationKind
  /** 화면 필드 경로 — 항목 위반은 index를 포함한다(예: `items[0].groupBuyPrice`) */
  field: string | null
  message: string
}

/** 경고 W1~W6 — 막지 않고 검토 요청 확인 모달(C3)에 열거된다 */
export interface ContractWarning {
  code: string
  message: string
}

/** 행 클릭 시 진입 모드 — 서버가 판정한다(§26-1) */
export type ContractEntryMode = "EDIT" | "VIEW"

export interface ContractListItem {
  contractId: number
  /** 검토 요청 전에는 null */
  contractNumber: string | null
  /** 작성중이면 null — 서버는 (공구명 미입력) 같은 표시 문구를 지어내지 않는다 */
  title: string | null
  counterpartyName: string | null
  itemCount: number
  startAt: string | null
  endAt: string | null
  createdAt: string
  status: ContractStatus
  statusLabel: string
  statusTone: ContractStatusTone
  entryMode: ContractEntryMode
}

export interface ContractListParams extends BaseParams {
  tab: ContractTab
  keyword: string
  /** 공구 기간이 걸치는 구간(yyyy-MM-dd). 비우면 조건 없음 */
  startDate: string
  endDate: string
  sort: ContractSortType
}

export interface ContractSummaryResponse {
  /** 키는 탭 코드 — 서버가 세지 않은 탭은 키가 없을 수 있다 */
  tabCounts: Partial<Record<ContractTab, number>>
  /** GNB 배지 — 검토 반려 + 「상대만 서명 완료」(B4c)만 센다 */
  actionRequiredCount: number
}

export interface ContractCounterpartyOption {
  creatorId: number
  showroomName: string
  connectionId: number
  profileImageUrl: string | null
}

export interface ContractProductOption {
  productId: number
  productName: string
  /** 현재 정가 — 계약 항목에는 이 값이 스냅샷으로 복사된다 */
  regularPrice: number
  thumbnailUrl: string | null
  /** 옵션 전량 — 상품을 고르면 이 목록이 옵션 행이 된다. 옵션은 최소 물량만 입력한다 */
  options: Array<ContractProductVariant>
}

/** 상품 옵션(variant) — 옵션 없는 상품도 이름 없는 1행이 있다 */
export interface ContractProductVariant {
  variantId: number
  /** 옵션 없는 상품은 null */
  variantName: string | null
  /** 옵션 정가(옵션가 포함). 옵션가 = 이 값 − 상품 정가 */
  regularPrice: number
  /** 현재 재고 — 참고값. 서버는 최소 물량 ≤ 재고를 판정하지 않는다 */
  stock: number
  isRepresentative: boolean
}

/** 작성 폼 드롭다운 선택지 — 연결됨 상대 전량 + 진열 상품 전량 */
export interface ContractFormSourcesResponse {
  counterparties: Array<ContractCounterpartyOption>
  products: Array<ContractProductOption>
}

export interface ContractClause {
  code: string
  summaryTitle: string
  summaryDescription: string
  /** 문안 미확정 조항은 null — 전문 모달은 값이 있는 조항만 그린다 */
  fullTitle: string | null
  fullBody: string | null
}

export interface ContractClausesResponse {
  clauseVersionId: number
  versionNumber: string
  effectiveDate: string
  clauses: Array<ContractClause>
}

export interface ContractCounterparty {
  creatorId: number | null
  showroomName: string | null
  /** 「스레드 열기」 딥링크의 출처 — 연결이 끊겼으면 null */
  connectionId: number | null
  /** 스레드 경유로 고정된 상대 — true면 변경할 수 없다(§25-5-1) */
  fixed: boolean
}

export interface ContractPeriod {
  startAt: string | null
  endAt: string | null
  /** 일수 — 시작·종료 일자 양끝 포함 */
  days: number | null
}

export interface ContractItem {
  contractItemId: number
  productId: number | null
  /** 상품명(스냅샷) */
  productName: string | null
  /** 정가(스냅샷) */
  regularPrice: number | null
  groupBuyPrice: number | null
  /** 리워드율(%) — 소수점 첫째 자리까지 */
  rewardRate: number | null
  /** 1개당 예상 리워드(원) — 서버 파생값, 1원 단위 버림 */
  unitReward: number | null
  /** 옵션별 최소 물량의 합계(파생값) — 옵션 중 하나라도 비어 있으면 null */
  minQuantity: number | null
  /** 옵션별 최소 물량 — 상품의 옵션 전량이 행이다(variant 순서) */
  options: Array<ContractItemOption>
}

export interface ContractItemOption {
  contractItemOptionId: number
  /** 상품 관리에서 옵션이 지워졌으면 null */
  variantId: number | null
  /** 옵션명(스냅샷) — 옵션 없는 상품은 null */
  variantName: string | null
  /** 옵션 정가(스냅샷) */
  regularPrice: number | null
  /** 옵션가 = 옵션 정가 − 상품 정가 */
  optionExtraPrice: number | null
  /** 옵션 판매가 = 공구가 + 옵션가. 공구가가 없으면 null */
  salePrice: number | null
  minQuantity: number | null
}

export interface ContractFixedFee {
  amount: number | null
  trigger: FixedFeeTrigger | null
  triggerLabel: string | null
  noticeAgreedAt: string | null
  /** 지급 완료 기록 시각 — 브랜드가 [지급 완료 기록]을 누른 사실이지 입금 사실이 아니다 */
  paidAt: string | null
  /** 종결 3종이면 false → 화면이 「지급 의무 소멸」로 바뀐다 */
  obligationAlive: boolean
}

export interface ContractContent {
  feedCount: number | null
  reelsCount: number | null
  storyCount: number | null
  /** 게시 완료 기한(yyyy-MM-dd) */
  dueDate: string | null
  secondaryUseAllowed: boolean | null
  secondaryUsePeriodType: SecondaryUsePeriodType | null
  secondaryUseMonths: number | null
  brandPreReview: boolean | null
  note: string | null
}

export interface ContractReview {
  /** 검토 요청 일시 — 리드타임 D+7 판정의 기준일 */
  requestedAt: string | null
  approvedAt: string | null
  rejectedAt: string | null
  /** 반려 사유 2단(§28-4) */
  rejectReason: { code: string; detail: string | null } | null
}

/** 서명 — 값은 전부 어드민이 모두싸인에서 옮겨 적은 것이다(§25-3) */
export interface ContractSignature {
  requestedAt: string | null
  /** 서명 기한 — 만료 판단의 유일한 기준 */
  deadlineAt: string | null
  brandSignedAt: string | null
  creatorSignedAt: string | null
  /** 기준 시각 — 화면 「N 기준」 */
  asOf: string | null
  /** 상대가 계약서를 열람했는지 — B7 「계약서 열람 기록 없음」 */
  counterpartyViewed: boolean
}

export interface ContractSettlement {
  platformFeeRate: number
  /** 자문 회신 전이라 항상 null — 0과 다르다 */
  pgFeeRate: number | null
  withholdingType: WithholdingType | null
  withholdingLabel: string | null
}

/** 종결 — 거절·만료·취소 공통. 진행 중이면 전부 null */
export interface ContractClosure {
  closedAt: string | null
  actorType: ContractActorType | null
  /** 만료는 사유가 없어 null */
  reasonCode: string | null
  reasonLabel: string | null
  memo: string | null
}

export interface ContractGroupBuy {
  groupBuyId: number | null
  canCreate: boolean
}

export interface ContractDocument {
  type: ContractDocumentType
  typeLabel: string
  downloadUrl: string
}

/** 버튼 노출 판정 — 서버가 내려준다. FE는 이 값 외의 근거로 버튼을 그리지 않는다 */
export interface ContractPermissions {
  canEdit: boolean
  canDelete: boolean
  /** 상태상 허용 여부만 — 필수 미입력 비활성은 폼·validate가 판정한다 */
  canRequestReview: boolean
  canCancelRequest: boolean
  canRequestResend: boolean
  canRecordPayment: boolean
  canCreateGroupBuy: boolean
  canDuplicate: boolean
}

export interface ContractHistoryEntry {
  eventType: ContractEventType
  actorType: ContractActorType
  /** 브랜드명·쇼룸명 스냅샷 — 운영자 주체는 null(파트너센터는 「어드민」으로 익명 표기) */
  actorDisplayName: string | null
  detail: string | null
  occurredAt: string
}

/** 상세 — 화면 13종(B2a·B3c·B3d·B4·B4a·B4b·B4c·B5·B5a·B5b·B6·B7·B8)이 이 응답 하나를 쓴다 */
export interface ContractDetailResponse {
  contractId: number
  contractNumber: string | null
  title: string | null
  status: ContractStatus
  statusLabel: string
  statusTone: ContractStatusTone
  /** 낙관적 락 버전 — 임시저장(PUT)에 그대로 되돌려 보낸다 */
  version: number
  /** 재작성 출처 계약 ID */
  sourceContractId: number | null
  /** 브랜드의 마지막 임시저장 시각 — 한 번도 저장하지 않았으면 null */
  updatedAt: string | null
  /** 체결 시각 — 체결완료가 아니면 null(closure는 종결 3종 전용) */
  concludedAt: string | null
  counterparty: ContractCounterparty
  period: ContractPeriod
  items: Array<ContractItem>
  fixedFee: ContractFixedFee
  content: ContractContent
  review: ContractReview
  signature: ContractSignature
  settlement: ContractSettlement
  closure: ContractClosure
  groupBuy: ContractGroupBuy
  documents: Array<ContractDocument>
  permissions: ContractPermissions
  history: Array<ContractHistoryEntry>
}

export interface ContractCreateRequest {
  /** 스레드 경유 진입일 때만 — 보내면 상대가 고정된다 */
  creatorId?: number
  connectionId?: number
}

export interface ContractCreateResponse {
  contractId: number
  version: number
}

export interface ContractUpdateItemRequest {
  /** 기존 행은 상세로 받은 ID를 그대로 돌려보낸다. 새 행이면 null */
  contractItemId: number | null
  productId: number | null
  groupBuyPrice: number | null
  rewardRate: number | null
  /**
   * 옵션별 최소 물량 — 상품의 옵션 전량. 상품 단위 최소 물량은 받지 않는다(옵션 합계의 파생값).
   * 보내지 않은 옵션은 수량 null로 저장되고, 상품의 옵션이 아닌 variantId는 400이다.
   */
  options: Array<{ variantId: number; minQuantity: number | null }>
}

/** 임시저장 — 전체 교체(PUT). 형식만 검사되고 필수 판정은 검토 요청 시점에 한다 */
export interface ContractUpdateRequest {
  version: number
  creatorId: number | null
  title: string | null
  groupBuyStartAt: string | null
  groupBuyEndAt: string | null
  fixedFeeAmount: number | null
  fixedFeeTrigger: FixedFeeTrigger | null
  fixedFeeNoticeAgreed: boolean | null
  contentFeedCount: number | null
  contentReelsCount: number | null
  contentStoryCount: number | null
  contentDueDate: string | null
  secondaryUseAllowed: boolean | null
  secondaryUsePeriodType: SecondaryUsePeriodType | null
  secondaryUseMonths: number | null
  brandPreReview: boolean | null
  note: string | null
  items: Array<ContractUpdateItemRequest>
}

export interface ContractReviewRequestRequest {
  /** 모달에서 확인한 경고 코드 — 서버 판정과 다르면 409 */
  acknowledgedWarnings: Array<string>
}

export interface ContractValidationResponse {
  canSubmit: boolean
  hardViolations: Array<ContractViolation>
  warnings: Array<ContractWarning>
}

/** 검토 요청 400 — 기존 ErrorResponse(code·message)에 hardViolations만 더한 모양 */
export interface ContractValidationErrorBody {
  code: "CONTRACT_VALIDATION_FAILED"
  message: string
  hardViolations: Array<ContractViolation>
}

export interface ContractDuplicateResponse {
  contractId: number
  sourceContractId: number
  /** 복사 직후 재검증 결과 — 위반 행을 표시하는 데 쓴다 */
  validation: ContractValidationResponse
}

export interface ContractResendRequestResponse {
  resendRequestId: number
  requestedAt: string
  /** 이미 접수돼 있던 미처리 요청을 그대로 돌려준 것인지 */
  alreadyRequested: boolean
}

export interface ContractDocumentDownloadResponse {
  documentType: ContractDocumentType
  documentTypeLabel: string
  downloadUrl: string
  originalName: string | null
  sizeBytes: number | null
  contentType: string | null
  uploadedAt: string
}
