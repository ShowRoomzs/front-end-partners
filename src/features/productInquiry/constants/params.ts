import type {
  InquiryDeleteReason,
  InquiryStatusCounts,
  InquiryStatusFilter,
  InquirySort,
  ProductInquiryListParams,
} from "@/features/productInquiry/types"

/** 상태 탭 5종 — 기본 진입은 전체다 */
export const INQUIRY_STATUS_TABS: Array<{
  label: string
  value: InquiryStatusFilter
  countKey: keyof InquiryStatusCounts
}> = [
  { label: "전체", value: "ALL", countKey: "all" },
  { label: "답변대기", value: "WAITING", countKey: "waiting" },
  { label: "답변완료", value: "ANSWERED", countKey: "answered" },
  {
    label: "삭제 요청",
    value: "DELETE_REQUESTED",
    countKey: "deleteRequested",
  },
  { label: "삭제", value: "DELETED", countKey: "deleted" },
]

export const INQUIRY_SORT_OPTIONS: Array<{
  label: string
  value: InquirySort
}> = [
  { label: "답변대기 우선", value: "WAITING_FIRST" },
  { label: "등록일순", value: "CREATED_AT" },
]

export const INQUIRY_PAGE_SIZES = [20, 50, 100]

export const INQUIRY_EMPTY_COUNTS: InquiryStatusCounts = {
  all: 0,
  waiting: 0,
  answered: 0,
  deleteRequested: 0,
  deleted: 0,
}

export const INQUIRY_INITIAL_PARAMS: ProductInquiryListParams = {
  status: "ALL",
  types: [],
  visibilities: [],
  keyword: "",
  sort: "WAITING_FIRST",
  page: 1,
  size: 20,
}

/**
 * 삭제 요청 사유 5종 — BE `ProductInquiryDeleteReason`과 1:1.
 *
 * 조회 엔드포인트가 없어 프론트 상수로 둔다. enum이 바뀌면 여기도 같이 고쳐야 한다.
 */
export const INQUIRY_DELETE_REASONS: Array<{
  code: InquiryDeleteReason
  label: string
}> = [
  { code: "ABUSE", label: "비방·욕설" },
  { code: "PRIVACY_EXPOSURE", label: "개인정보 노출" },
  { code: "ADVERTISEMENT", label: "광고·홍보" },
  { code: "BRAND_COMPARISON", label: "타 브랜드 비교·비방" },
  { code: "ETC", label: "기타(직접 입력)" },
]

/** 기타만 상세 설명이 필수다 */
export const DELETE_REASON_ETC: InquiryDeleteReason = "ETC"

/** 답변 상한 — 서버 `@Size(max = 2000)`와 같은 값. maxlength로 입력 자체를 막는다 */
export const ANSWER_MAX_LENGTH = 2000

/** 삭제 요청 상세 설명 상한 — 서버 `@Size(max = 500)` */
export const DELETE_DETAIL_MAX_LENGTH = 500

/** 시안 `.msel` — 모달 셀렉트는 선으로 그린 갈매기표를 쓴다(목록 툴바와 다르다) */
export const MODAL_SELECT_CHEVRON_STYLE = {
  backgroundImage:
    "url(\"data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6' fill='none'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%235B5F68' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")",
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 10px center",
}

/** 시안 `.sel-sm` — 목록 툴바 셀렉트는 채운 삼각형이다 */
export const SELECT_CHEVRON_STYLE = {
  backgroundImage:
    "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='9' height='5'><path d='M0 0L4.5 5L9 0Z' fill='%237B7F89'/></svg>\")",
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 8px center",
}
