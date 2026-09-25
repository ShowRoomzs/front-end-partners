import { usePageSubtitle } from "@/common/components/MainLayout/usePageSubtitle"
import { useMarketStore } from "@/common/stores/useMarketStore"
import ContractReadView from "@/features/contracts/components/detail/ContractReadView"
import ContractForm from "@/features/contracts/components/form/ContractForm"
import Btn from "@/features/contracts/components/shared/Btn"
import { CONTRACT_LIST_PATH } from "@/features/contracts/constants/params"
import {
  useGetContractClauses,
  useGetContractDetail,
  useGetContractFormSources,
} from "@/features/contracts/hooks/useContractQueries"
import { deriveContractView } from "@/features/contracts/utils/contractView"
import { useCallback, useEffect } from "react"
import {
  useNavigate,
  useParams as useRouteParams,
  useSearchParams,
} from "react-router-dom"

/**
 * `/contract/:contractId` — 작성 모드와 계약서 모드가 **같은 라우트**다(§26 rev.2→5).
 *
 * 작성중은 폼, 검토 반려는 계약서 모드(B3d)에서 [수정하고 다시 요청]으로 `?mode=edit`를 붙여
 * 폼으로 바뀐다. 그 밖의 11종은 전부 계약서 모드이고 화면 분기는 응답 값으로 고른다.
 */
export default function ContractDetailPage() {
  const navigate = useNavigate()
  const { contractId: contractIdParam } = useRouteParams<{
    contractId: string
  }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const { market } = useMarketStore()
  const contractId = Number(contractIdParam)

  const {
    data: detail,
    isLoading,
    isError,
    refetch,
  } = useGetContractDetail(contractId)

  const view = detail ? deriveContractView(detail) : null
  const isEditMode =
    view === "draft" ||
    (view === "reviewRejected" && searchParams.get("mode") === "edit")

  // 반려 편집에서 다시 요청하면 상태가 바뀐다 — 남은 `?mode=edit`이 다음 반려 때 폼을 바로 열지 않게 걷는다
  const staleEditMode =
    !!view && view !== "reviewRejected" && searchParams.get("mode") === "edit"
  useEffect(() => {
    if (staleEditMode) {
      const next = new URLSearchParams(searchParams)
      next.delete("mode")
      setSearchParams(next, { replace: true })
    }
  }, [staleEditMode, searchParams, setSearchParams])

  // 탑바 crumb — 시안 B1~B3 「계약 작성」, 계약서 모드 「계약서」
  usePageSubtitle(isEditMode ? "계약 작성" : "계약서")

  const { data: sources } = useGetContractFormSources(isEditMode)
  const { data: clauses } = useGetContractClauses(isEditMode)

  const handleRefetch = useCallback(async () => {
    const result = await refetch()
    return result.data
  }, [refetch])

  const enterEdit = useCallback(() => {
    const next = new URLSearchParams(searchParams)
    next.set("mode", "edit")
    setSearchParams(next, { replace: true })
  }, [searchParams, setSearchParams])

  if (isLoading) {
    return (
      <div className="rounded-[8px] border border-sz-n-200 bg-white px-5 py-10 text-center text-[12px] text-sz-n-500">
        불러오는 중…
      </div>
    )
  }

  if (isError || !detail || !view) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-[8px] border border-sz-n-200 bg-white px-5 py-10 text-center">
        <div className="text-[13px] font-semibold text-sz-n-700">
          계약을 찾을 수 없습니다
        </div>
        <div className="text-[12px] text-sz-n-500">
          삭제되었거나 이 브랜드의 계약이 아닙니다.
        </div>
        <Btn variant="secondary" onClick={() => navigate(CONTRACT_LIST_PATH)}>
          목록
        </Btn>
      </div>
    )
  }

  if (isEditMode) {
    if (!sources) {
      return (
        <div className="rounded-[8px] border border-sz-n-200 bg-white px-5 py-10 text-center text-[12px] text-sz-n-500">
          작성 폼을 준비하는 중…
        </div>
      )
    }
    return (
      <ContractForm
        // 상태가 바뀌거나 서버 값으로 되돌리면 폼을 처음부터 다시 만든다
        key={`${detail.contractId}-${detail.status}`}
        detail={detail}
        sources={sources}
        clauses={clauses}
        onRefetch={handleRefetch}
      />
    )
  }

  return (
    <ContractReadView
      detail={detail}
      view={view}
      brandName={market?.marketName ?? "브랜드"}
      onEditAfterReject={enterEdit}
    />
  )
}
