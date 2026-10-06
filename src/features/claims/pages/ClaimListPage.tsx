import ListViewWrapper from "@/common/components/ListViewWrapper/ListViewWrapper"
import Notice from "@/common/components/Notice/Notice"
import Pagination from "@/common/components/Pagination/Pagination"
import { usePaginationInfo } from "@/common/hooks/usePaginationInfo"
import { useParams } from "@/common/hooks/useParams"
import Btn from "@/features/contracts/components/shared/Btn"
import { SELECT_CHEVRON_STYLE } from "@/features/contracts/constants/params"
import ClaimDetailModal from "@/features/claims/components/detail/ClaimDetailModal"
import {
  ClaimEmptyState,
  ClaimFilters,
  ClaimsHeader,
  ClaimStatusTabs,
  SELECT_SM_CLASS,
} from "@/features/claims/components/list/ClaimListParts"
import ClaimTable from "@/features/claims/components/list/ClaimTable"
import {
  isDraftFilled,
  type ReshipDraft,
} from "@/features/claims/utils/reshipDraft"
import ReshipExportModal from "@/features/claims/components/modals/ReshipExportModal"
import ReshipUploadModal from "@/features/claims/components/modals/ReshipUploadModal"
import {
  CLAIM_INITIAL_PARAMS,
  CLAIM_PAGE_SIZES,
  CLAIM_TAB_LABEL,
} from "@/features/claims/constants/params"
import {
  useClaimMutations,
  useGetClaimList,
  useGetClaimSummary,
} from "@/features/claims/hooks/useClaimQueries"
import type {
  ClaimListItem,
  ClaimListParams,
  ClaimTab,
  DeliveryCarrier,
  ReshipItem,
} from "@/features/claims/types"
import { digitsOnly } from "@/features/claims/utils/format"
import { ORDER_LIST_PATH } from "@/features/orders/constants/params"
import { useGetOrderSummary } from "@/features/orders/hooks/useOrderQueries"
import dayjs from "dayjs"
import { useCallback, useMemo, useState } from "react"
import type { ReactNode } from "react"
import toast from "react-hot-toast"
import { useNavigate } from "react-router-dom"

/** 탭이 정렬을 소유한다(서버에 정렬 파라미터가 없다) — 셀렉트는 현재 순서를 밝히기만 한다 */
const TAB_ORDER_LABEL: Record<ClaimTab, string> = {
  ALL: "최신순",
  COLLECT_WAIT: "신청일시 오래된순",
  COLLECTING: "회수 접수 오래된순",
  INSPECTION: "도착 오래된순",
  RESHIP: "확정 오래된순",
  REJECT_HOLD: "반려 오래된순",
  DONE: "최신순",
}

/**
 * 판매 관리 › 반품·교환 관리(ui-partner-11-claims) — A0~A8x · B1~B2 · D1~D3 · E1 · E2 · M1.
 *
 * 신청은 브랜드 승인 없이 자동 수락된다 — [승인]·[신청 거절] 버튼이 없는 것은 정책이다.
 * 브랜드 일은 입고 확인 → 검수 판정 → (교환·반려 반송) 재발송 송장이고, 환불은 PG가 자동으로 한다.
 */
export default function ClaimListPage() {
  const navigate = useNavigate()
  const {
    params,
    localParams,
    update,
    updateParam,
    updateParams,
    updateLocalParam,
    reset,
  } = useParams<ClaimListParams>(CLAIM_INITIAL_PARAMS)

  const overYear =
    dayjs(params.to).diff(dayjs(params.from), "day") > 365 ||
    dayjs(params.from).isAfter(dayjs(params.to))
  const { data: list, isLoading } = useGetClaimList(params)
  const { data: summary } = useGetClaimSummary()
  const { data: orderSummary } = useGetOrderSummary(true)
  const mutations = useClaimMutations()

  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [drafts, setDrafts] = useState<Record<number, ReshipDraft>>({})
  const [busyIds, setBusyIds] = useState<Set<number>>(new Set())
  const [detailId, setDetailId] = useState<number | null>(null)
  const [exportOpen, setExportOpen] = useState(false)
  const [uploadOpen, setUploadOpen] = useState(false)

  const rows = useMemo(() => list?.content ?? [], [list])

  const pageInfo = usePaginationInfo({
    data: list?.pageInfo,
    onPageChange: page => updateParam("page", page),
  })

  const changeParams = useCallback(
    (next: Partial<ClaimListParams>) => {
      setSelected(new Set())
      updateParams(next)
    },
    [updateParams]
  )

  const handleTab = (tab: ClaimTab) => {
    setDrafts({})
    changeParams({ tab, page: 1 })
  }

  const toggleSelect = (ids: Array<number>, checked: boolean) =>
    setSelected(prev => {
      const next = new Set(prev)
      ids.forEach(id => (checked ? next.add(id) : next.delete(id)))
      return next
    })

  const markBusy = (ids: Array<number>, busy: boolean) =>
    setBusyIds(prev => {
      const next = new Set(prev)
      ids.forEach(id => (busy ? next.add(id) : next.delete(id)))
      return next
    })

  const handleConfirmReceipt = async (row: ClaimListItem) => {
    markBusy([row.claimId], true)
    try {
      const result = await mutations.receive.mutateAsync([row.claimId])
      if (result.skipped.length > 0) {
        toast.error(result.skipped[0].message)
      } else {
        toast.success(
          `${row.claimNumber} 입고 확인했습니다. 2영업일 안에 검수를 완료해 주세요.`
        )
      }
    } catch {
      // 토스트는 apiInstance가 띄운다
    } finally {
      markBusy([row.claimId], false)
    }
  }

  const handleDraftChange = (claimId: number, draft: ReshipDraft) => {
    setDrafts(prev => ({ ...prev, [claimId]: { ...draft, error: undefined } }))
    // 입력이 다 차면 등록 대상으로 고른다 — 버튼의 건수가 곧 확정될 건수다
    if (isDraftFilled(draft)) toggleSelect([claimId], true)
  }

  const registerRows = async (targets: Array<ClaimListItem>) => {
    const items: Array<ReshipItem> = targets.map(row => ({
      claimId: row.claimId,
      carrier: drafts[row.claimId].carrier as DeliveryCarrier,
      trackingNumber: digitsOnly(drafts[row.claimId].trackingNumber),
    }))
    const ids = items.map(item => item.claimId)
    markBusy(ids, true)
    try {
      const result = await mutations.registerReshipments.mutateAsync(items)
      const skippedById = new Map(
        result.skipped.map(skip => [skip.claimId, skip.message])
      )
      setDrafts(prev => {
        const next = { ...prev }
        ids.forEach(id => {
          const message = skippedById.get(id)
          if (message) next[id] = { ...next[id], error: message }
          else delete next[id]
        })
        return next
      })
      setSelected(prev => {
        const next = new Set(prev)
        ids.forEach(id => {
          if (!skippedById.has(id)) next.delete(id)
        })
        return next
      })
      if (result.succeeded > 0) {
        toast.success(
          `${result.succeeded}건의 재발송 송장을 등록했습니다${
            result.skipped.length > 0
              ? ` · 오류 ${result.skipped.length}건 제외`
              : ""
          }.`
        )
      } else if (result.skipped.length > 0) {
        toast.error(`등록하지 못했습니다 · 오류 ${result.skipped.length}건`)
      }
    } catch {
      // 토스트는 apiInstance가 띄운다
    } finally {
      markBusy(ids, false)
    }
  }

  const registerTargets = rows.filter(
    row =>
      selected.has(row.claimId) &&
      row.actions.canRegisterReshipment &&
      isDraftFilled(drafts[row.claimId])
  )
  const errorCount = rows.filter(row => drafts[row.claimId]?.error).length

  const detailIndex = rows.findIndex(row => row.claimId === detailId)

  const hasCondition =
    params.keyword !== "" ||
    params.reason !== "" ||
    params.types.length !== 2 ||
    params.period !== CLAIM_INITIAL_PARAMS.period
  const isEmpty = !isLoading && rows.length === 0
  const neverHadClaims = (summary?.tabCounts.ALL ?? 0) === 0 && !hasCondition

  const emptyState = (
    <ClaimEmptyState
      hasCondition={!neverHadClaims}
      tab={params.tab}
      keyword={params.keyword}
      onReset={reset}
      onGoOrders={() => navigate(ORDER_LIST_PATH)}
    />
  )

  const groupCount = new Set(
    rows
      .filter(row => (row.collection?.size ?? 0) > 1)
      .map(row => row.collection?.collectionId)
  ).size

  return (
    <ListViewWrapper>
      <ClaimsHeader
        tab={params.tab}
        summary={summary}
        orderTotal={orderSummary?.tabCounts.ALL}
        onSelectTab={handleTab}
      />

      <ClaimStatusTabs
        tab={params.tab}
        counts={summary?.tabCounts}
        onChange={handleTab}
      />

      <ClaimFilters
        params={params}
        keyword={localParams.keyword}
        typeCounts={summary?.typeCounts}
        onChange={changeParams}
        onKeywordChange={keyword => updateLocalParam("keyword", keyword)}
        onSearch={update}
        onReset={reset}
      />

      {overYear && (
        <Notice tone="danger" className="mb-3">
          조회 기간은 최대 1년이고 시작일이 종료일보다 늦을 수 없습니다. 기간을
          다시 선택해 주세요.
        </Notice>
      )}

      {!neverHadClaims && <TabNotices tab={params.tab} />}

      {params.tab === "RESHIP" && !neverHadClaims && (
        <>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Btn
              variant="primary"
              disabled={registerTargets.length === 0}
              isLoading={mutations.registerReshipments.isPending}
              onClick={() => registerRows(registerTargets)}
            >
              {registerTargets.length}건 송장 등록
            </Btn>
            <Btn
              variant="secondary"
              disabled={selected.size === 0}
              onClick={() => setSelected(new Set())}
            >
              선택 해제
            </Btn>
            <span className="ml-1 text-[12px] text-sz-n-500">
              {errorCount > 0 ? (
                <span className="text-sz-danger-text">
                  오류 {errorCount}건 제외
                </span>
              ) : (
                `입력된 ${registerTargets.length}건만 등록됩니다`
              )}
            </span>
            <span className="ml-auto flex gap-2">
              <Btn variant="secondary" onClick={() => setExportOpen(true)}>
                재발송 목록 다운로드
              </Btn>
              <Btn variant="secondary" onClick={() => setUploadOpen(true)}>
                송장 일괄 업로드
              </Btn>
            </span>
          </div>
          <Notice tone="neutral" className="mb-3">
            <b className="font-semibold">
              재발송비는 브랜드 수취액에 더해집니다.
            </b>{" "}
            리워드 기준 판매금액에는 포함되지 않습니다. 반려 건은{" "}
            <b className="font-semibold">소비자가 재발송비를 결제한 뒤</b> 이
            탭에 나타납니다(결제 전은 반려 보류).
          </Notice>
        </>
      )}

      <div className="overflow-hidden rounded-[8px] border border-sz-n-200 bg-white">
        {!(isEmpty && neverHadClaims) && (
          <div className="flex shrink-0 items-center justify-between border-b border-sz-n-200 px-4 py-2.5">
            <span className="text-[12px] text-sz-n-600">
              {params.tab === "ALL" || params.tab === "DONE" ? (
                <>
                  {params.tab === "ALL" ? "총" : "완료"}{" "}
                  <b className="text-sz-n-900">{pageInfo.totalResults}</b>건 ·{" "}
                  <span className="text-sz-n-500">
                    조회기간 {dayjs(params.from).format("YYYY.MM.DD")}~
                    {dayjs(params.to).format("MM.DD")}
                  </span>
                </>
              ) : (
                <>
                  {CLAIM_TAB_LABEL[params.tab]}{" "}
                  <b className="text-sz-n-900">{pageInfo.totalResults}</b>건
                  {groupCount > 0 && (
                    <span className="text-sz-n-500">
                      {" "}
                      · 회수 그룹 {groupCount}건 포함
                    </span>
                  )}
                  {params.tab === "COLLECT_WAIT" && (
                    <span className="text-sz-n-500"> · 오래된 건부터</span>
                  )}
                </>
              )}
            </span>
            <div className="flex items-center gap-2">
              <select
                aria-label="정렬"
                value={params.tab}
                disabled
                style={SELECT_CHEVRON_STYLE}
                className={SELECT_SM_CLASS}
                title="탭마다 정렬이 정해져 있습니다"
              >
                <option value={params.tab}>
                  {TAB_ORDER_LABEL[params.tab]}
                </option>
              </select>
              <select
                aria-label="표시 건수"
                value={params.size}
                onChange={event =>
                  changeParams({ size: Number(event.target.value), page: 1 })
                }
                style={SELECT_CHEVRON_STYLE}
                className={SELECT_SM_CLASS}
              >
                {CLAIM_PAGE_SIZES.map(size => (
                  <option key={size} value={size}>
                    {size}건씩
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {isEmpty && neverHadClaims ? (
          emptyState
        ) : (
          <ClaimTable
            tab={params.tab}
            rows={rows}
            selected={selected}
            onToggleSelect={toggleSelect}
            onRowClick={row => setDetailId(row.claimId)}
            onConfirmReceipt={handleConfirmReceipt}
            onInspect={row => setDetailId(row.claimId)}
            drafts={drafts}
            onDraftChange={handleDraftChange}
            onRegisterOne={row => registerRows([row])}
            busyIds={busyIds}
            emptyState={emptyState}
          />
        )}

        {pageInfo.totalPages > 0 && rows.length > 0 && (
          <div className="flex justify-center border-t border-sz-n-200 p-3">
            <Pagination {...pageInfo} />
          </div>
        )}
      </div>

      {detailId !== null && (
        <ClaimDetailModal
          claimId={detailId}
          onClose={() => setDetailId(null)}
          onPrev={
            detailIndex > 0
              ? () => setDetailId(rows[detailIndex - 1].claimId)
              : undefined
          }
          onNext={
            detailIndex >= 0 && detailIndex < rows.length - 1
              ? () => setDetailId(rows[detailIndex + 1].claimId)
              : undefined
          }
        />
      )}

      <ReshipExportModal
        isOpen={exportOpen}
        claimIds={Array.from(selected)}
        totalCount={summary?.tabCounts.RESHIP ?? 0}
        onClose={() => setExportOpen(false)}
      />

      <ReshipUploadModal
        isOpen={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onFill={parsed => {
          const onPage = new Set(rows.map(row => row.claimId))
          const filled = parsed.filter(
            row => row.claimId !== null && onPage.has(row.claimId)
          )
          setDrafts(prev => {
            const next = { ...prev }
            filled.forEach(row => {
              next[row.claimId as number] = {
                carrier: row.carrier ?? "",
                trackingNumber: row.trackingNumber,
              }
            })
            return next
          })
          toggleSelect(
            filled.map(row => row.claimId as number),
            true
          )
          const outside = parsed.length - filled.length
          toast.success(
            `${filled.length}건을 목록에 채웠습니다${
              outside > 0 ? ` · 이 페이지에 없는 ${outside}건 제외` : ""
            }. 확인한 뒤 [송장 등록]으로 확정하세요.`
          )
        }}
      />
    </ListViewWrapper>
  )
}

/** 탭별 상단 안내 — 시안 각 탭의 `.notice.neutral` 문구 그대로 */
function TabNotices(props: { tab: ClaimTab }) {
  const text: Partial<Record<ClaimTab, ReactNode>> = {
    COLLECTING: (
      <>
        <b className="font-semibold">회수 추적은 자동으로 갱신됩니다.</b> 물건이
        도착하면 <b className="font-semibold">입고·검수</b> 탭에서 처리해
        주세요.
      </>
    ),
    INSPECTION: (
      <>
        <b className="font-semibold">입고 확인 후 2영업일 안에 검수를 완료</b>해
        주세요. 검수 판정은 상세에서 진행합니다.
      </>
    ),
    RESHIP: (
      <>
        <b className="font-semibold">재발송 송장을 등록하면 완료 처리</b>됩니다.{" "}
        <b className="font-semibold">반려 반송</b>은 교환 옵션이 아니라{" "}
        <b className="font-semibold">회수한 원래 상품</b>을 그대로 보내야
        합니다.
      </>
    ),
    REJECT_HOLD: (
      <>
        <b className="font-semibold">
          소비자가 재배송비를 결제하면 재발송 탭으로 이동
        </b>
        합니다. 결제가 없으면 플랫폼이 소비자에게{" "}
        <b className="font-semibold">2회 이상 고지</b>하고,{" "}
        <b className="font-semibold">최종 고지일로부터 3개월간</b> 상품을
        보관합니다. 보관 기한까지 반환 요청을 기다립니다.
      </>
    ),
    DONE: (
      <>
        <b className="font-semibold">종결된 건입니다.</b> 환불 금액은{" "}
        <b className="font-semibold">PG가 자동으로 처리한 결과</b>이며 정산에
        반영됩니다 — 이 화면에서 수정할 수 없습니다.
      </>
    ),
  }
  const content = text[props.tab]
  if (!content) return null
  return (
    <Notice tone="neutral" className="mb-3">
      {content}
    </Notice>
  )
}
