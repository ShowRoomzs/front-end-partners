import { CONTRACT_INITIAL_PARAMS } from "@/features/contracts/constants/params"
import { useGetContractList } from "@/features/contracts/hooks/useContractQueries"
import type {
  ContractListParams,
  ContractSortType,
  ContractTab,
} from "@/features/contracts/types"
import { useMemo } from "react"

/**
 * 시안 `.page-h` [‹ 이전] [다음 ›] — 셀러 상세 응답엔 이웃 계약 ID가 없어서
 * 목록에서 들고 온 조건(탭·검색어·정렬·페이지)으로 같은 목록을 다시 보고 앞뒤 건을 고른다.
 * 목록과 쿼리 키가 같아 대개 캐시에서 바로 나온다. 페이지 경계 너머는 잇지 않는다.
 */
export function useContractNeighbors(contractId: number, search: string) {
  const params = useMemo<ContractListParams>(() => {
    const query = new URLSearchParams(search)
    return {
      ...CONTRACT_INITIAL_PARAMS,
      tab:
        (query.get("tab") as ContractTab | null) ?? CONTRACT_INITIAL_PARAMS.tab,
      keyword: query.get("keyword") ?? "",
      sort:
        (query.get("sort") as ContractSortType | null) ??
        CONTRACT_INITIAL_PARAMS.sort,
      page: Number(query.get("page") ?? CONTRACT_INITIAL_PARAMS.page),
      size: Number(query.get("size") ?? CONTRACT_INITIAL_PARAMS.size),
    }
  }, [search])

  const { data } = useGetContractList(params)

  return useMemo(() => {
    const rows = data?.content ?? []
    const index = rows.findIndex(row => row.contractId === contractId)
    if (index < 0) {
      return { prevId: null, nextId: null }
    }
    return {
      prevId: rows[index - 1]?.contractId ?? null,
      nextId: rows[index + 1]?.contractId ?? null,
    }
  }, [data, contractId])
}
