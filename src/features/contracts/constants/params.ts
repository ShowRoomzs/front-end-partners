import type {
  ContractListParams,
  ContractSortType,
  ContractTab,
} from "@/features/contracts/types"

/**
 * 상태 탭 6종 — 9개 상태를 묶는다(§26-1). 종료(성공)인 체결완료는 실패군과 다른 서랍이다.
 * 건수 키는 서버 `summary.tabCounts`의 키와 같다.
 */
export const CONTRACT_TABS: Array<{ label: string; value: ContractTab }> = [
  { label: "전체", value: "ALL" },
  { label: "작성중", value: "DRAFT" },
  { label: "검토", value: "REVIEW" },
  { label: "서명", value: "SIGNING" },
  { label: "체결완료", value: "CONCLUDED" },
  { label: "종료", value: "CLOSED" },
]

export const CONTRACT_SORT_OPTIONS: Array<{
  label: string
  value: ContractSortType
}> = [
  { label: "최근 생성순", value: "CREATED_DESC" },
  { label: "공구 시작일순", value: "START_AT_ASC" },
]

export const CONTRACT_PAGE_SIZES = [20, 50]

export const CONTRACT_INITIAL_PARAMS: ContractListParams = {
  tab: "ALL",
  keyword: "",
  startDate: "",
  endDate: "",
  sort: "CREATED_DESC",
  page: 1,
  size: 20,
}

/**
 * GNB 배지·탭 카운트 폴링 간격(ms). 서명·검토는 어드민이 손으로 옮겨 적는 값이라
 * 실시간이 아니고, 연결·소통 요약과 같은 주기면 충분하다.
 */
export const CONTRACT_SUMMARY_POLL_INTERVAL = 30_000

export const CONTRACT_LIST_PATH = "/contract"

/** 시안 `.sel-sm` — 목록 툴바 셀렉트는 채운 삼각형이다 */
export const SELECT_CHEVRON_STYLE = {
  backgroundImage:
    "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='9' height='5'><path d='M0 0L4.5 5L9 0Z' fill='%237B7F89'/></svg>\")",
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 8px center",
}

/** 시안 `.sel`/`.msel` — 폼·모달 셀렉트는 선으로 그린 갈매기표다 */
export const FORM_SELECT_CHEVRON_STYLE = {
  backgroundImage:
    "url(\"data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6' fill='none'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%235B5F68' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")",
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 10px center",
}
