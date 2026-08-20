import type { BaseParams, PageInfo } from "@/common/types/page"

/** 문의 유형 5종 — BE `ProductInquiryType`과 1:1 */
export type ProductInquiryTypeCode =
  | "OPTION"
  | "INGREDIENT_USAGE"
  | "RESTOCK"
  | "DELIVERY"
  | "ETC"

/** 공개여부 — BE `InquiryVisibility`와 1:1. 상태가 아니라 **분류**다 */
export type InquiryVisibility = "PUBLIC" | "SECRET"

/** 답변 축 — BE `InquiryStatus` */
export type InquiryAnswerStatus = "WAITING" | "ANSWERED"

/**
 * 노출 축 — BE `InquiryExposureStatus`.
 *
 * 답변 축과 분리돼 있는 게 핵심이다. 삭제 요청이 반려되면 노출 축만 `NORMAL`로
 * 돌아가고 답변 축은 그대로라, 요청 직전 상태(답변대기/답변완료)로 정확히 복귀한다.
 */
export type InquiryExposureStatus = "NORMAL" | "DELETE_REQUESTED" | "DELETED"

/** 상태 탭 — BE `SellerInquiryStatusFilter`와 1:1. 배타적 단일선택 */
export type InquiryStatusFilter =
  | "ALL"
  | "WAITING"
  | "ANSWERED"
  | "DELETE_REQUESTED"
  | "DELETED"

/** 정렬 — BE `SellerInquirySort`. 기본은 답변대기 우선 */
export type InquirySort = "WAITING_FIRST" | "CREATED_AT"

/** 삭제 요청 사유 — BE `ProductInquiryDeleteReason`와 1:1 */
export type InquiryDeleteReason =
  | "ABUSE"
  | "PRIVACY_EXPOSURE"
  | "ADVERTISEMENT"
  | "BRAND_COMPARISON"
  | "ETC"

/** 이력 행위 주체 — BE `InquiryActorType` */
export type InquiryActorType = "CONSUMER" | "BRAND" | "OPERATOR"

export interface ProductInquiryListItem {
  inquiryId: number
  type: ProductInquiryTypeCode
  typeName: string
  content: string
  productName: string
  secret: boolean
  visibilityName: string
  createdAt: string
  /** 미답변이면 null */
  answeredAt: string | null
  status: InquiryAnswerStatus
  exposureStatus: InquiryExposureStatus
  /** 두 축을 합친 표시 상태 — 문구는 서버가 정한다. 프론트에서 조합하지 말 것 */
  statusLabel: string
}

export interface InquiryStatusCounts {
  all: number
  waiting: number
  answered: number
  deleteRequested: number
  deleted: number
}

/** 필터 항목 1건 — 코드·라벨·건수를 함께 받아 체크박스 옆에 건수를 병기한다 */
export interface FilterCount {
  code: string
  label: string
  count: number
}

export interface ProductInquiryListResponse {
  /** 현재 탭·필터·검색 기준 총 건수 — 툴바의 `총 N건` */
  totalCount: number
  /** 마켓 전체 답변대기 건수 — 툴바의 `답변대기 N건` */
  waitingCount: number
  content: Array<ProductInquiryListItem>
  pageInfo: PageInfo
  /**
   * 탭·필터 건수는 전부 **마켓 전체 기준**이다(검색어·선택 필터와 무관).
   * 검색 결과가 0건이어도 이 숫자들은 그대로 남는 게 사양이니 맞추려 들지 말 것.
   */
  statusCounts: InquiryStatusCounts
  typeCounts: Array<FilterCount>
  visibilityCounts: Array<FilterCount>
}

export interface ProductInquiryListParams extends BaseParams {
  status: InquiryStatusFilter
  /** 다중선택. 빈 배열이 곧 전체라 필터 패널에 `전체` 항목이 없다 */
  types: Array<ProductInquiryTypeCode>
  /** 다중선택. 빈 배열이 곧 전체 */
  visibilities: Array<InquiryVisibility>
  /** 상품명·질문 통합 검색 */
  keyword: string
  sort: InquirySort
}

/** 상세의 이전/다음은 목록과 같은 조건 위에서 계산된다 — 페이지 정보는 넘기지 않는다 */
export type ProductInquiryDetailParams = Omit<
  ProductInquiryListParams,
  "page" | "size"
>

export interface InquiryDeleteRequestInfo {
  reason: InquiryDeleteReason
  reasonName: string
  detail: string | null
  requestedAt: string
  /** 운영자 처리 일시 — 검토 중이면 null */
  reviewedAt: string | null
  /** 운영자 반려 사유 — 반려된 경우에만 값이 있다 */
  rejectReason: string | null
  deletedAt: string | null
  underReview: boolean
  /** 반려됨 — 상태는 요청 직전 값으로 복귀했다 */
  rejected: boolean
}

export interface InquiryHistoryItem {
  /** 이벤트 코드 — 미리 정한 6종 외 값이 늘어도 화면이 죽지 않게 string으로 둔다 */
  event: string
  label: string
  /** 부가 문구 — 삭제 요청 사유 등 */
  detail: string | null
  occurredAt: string
  actorType: InquiryActorType
  actorLabel: string
}

export interface ProductInquiryDetail {
  inquiryId: number
  inquiryNumber: string
  type: ProductInquiryTypeCode
  typeName: string
  productId: number
  productName: string
  /**
   * 닉네임 마스킹 값. 브랜드는 실명·연락처를 볼 수 없고 회원 상세 링크도 없다.
   * 마스킹은 서버가 끝내므로 원본이 응답에 아예 담기지 않는다.
   */
  writerName: string
  secret: boolean
  visibilityName: string
  createdAt: string
  content: string
  imageUrls: Array<string>
  answerContent: string | null
  answeredAt: string | null
  /** 수정한 적 없으면 null. 등록 시각과 **병기**한다(대체하지 않는다) */
  answerModifiedAt: string | null
  /** 등록→답변까지 실제 걸린 시간. 서버 계산값을 그대로 쓴다 */
  answerElapsedText: string | null
  status: InquiryAnswerStatus
  exposureStatus: InquiryExposureStatus
  statusLabel: string
  /** 요청한 적 없으면 null */
  deleteRequest: InquiryDeleteRequestInfo | null
  /** 최신순 */
  history: Array<InquiryHistoryItem>
  /*
    버튼 노출은 전부 이 세 플래그가 정한다. 상태 조합으로 프론트에서 다시 계산하면
    서버 규칙이 바뀔 때 화면만 낡은 판단을 하게 된다.
  */
  canRegisterAnswer: boolean
  canModifyAnswer: boolean
  canRequestDelete: boolean
  prevInquiryId: number | null
  nextInquiryId: number | null
}

export interface InquiryAnswerRequest {
  answerContent: string
}

export interface InquiryDeleteRequestBody {
  reason: InquiryDeleteReason
  /** 사유가 `ETC`면 필수 */
  detail?: string
}
