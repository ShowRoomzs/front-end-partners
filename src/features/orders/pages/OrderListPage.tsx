import { confirm } from "@/common/components/ConfirmModal/confirm"
import ListViewWrapper from "@/common/components/ListViewWrapper/ListViewWrapper"
import Notice, { type NoticeTone } from "@/common/components/Notice/Notice"
import Pagination from "@/common/components/Pagination/Pagination"
import { usePaginationInfo } from "@/common/hooks/usePaginationInfo"
import { useParams } from "@/common/hooks/useParams"
import Btn from "@/features/contracts/components/shared/Btn"
import { B } from "@/features/groupBuy/components/shared/GbParts"
import OrderDetailModal from "@/features/orders/components/detail/OrderDetailModal"
import {
  OrderEmptyState,
  OrderQueryForm,
  OrderStatusTabs,
} from "@/features/orders/components/list/OrderListParts"
import OrderTable, {
  type InvoiceDraft,
  type OrderTableContext,
} from "@/features/orders/components/list/OrderTable"
import SalesHeader from "@/features/orders/components/list/SalesHeader"
import {
  DirectCancelModal,
  PrepareStartModal,
  type DirectCancelTarget,
} from "@/features/orders/components/modals/OrderActionModals"
import PurchaseOrderModal, {
  type PurchaseOrderTarget,
} from "@/features/orders/components/modals/PurchaseOrderModal"
import ShipmentUploadModal from "@/features/orders/components/modals/ShipmentUploadModal"
import {
  ActBtn,
  SelectSm,
} from "@/features/orders/components/shared/OrderParts"
import {
  CARRIERS,
  defaultSortOf,
  hasShipDueSort,
  ORDER_INITIAL_PARAMS,
  ORDER_PAGE_SIZES,
  SORT_LABELS,
} from "@/features/orders/constants/params"
import {
  useDirectCancel,
  useDownloadPurchaseOrder,
  usePrepareStart,
  useRegisterShipments,
  useUpdateShipment,
} from "@/features/orders/hooks/useOrderMutations"
import {
  useGetClaimSummary,
  useGetOrderList,
  useGetOrderSummary,
} from "@/features/orders/hooks/useOrderQueries"
import {
  errorMessageOf,
  saveFile,
} from "@/features/orders/services/orderService"
import type {
  BatchActionResponse,
  DeliveryCarrier,
  OrderListItem,
  OrderListParams,
  OrderSortType,
  OrderTab,
  ShipmentParseResponse,
  ShipmentRow,
} from "@/features/orders/types"
import { formatRangeCompact, toQueryParams } from "@/features/orders/utils/view"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react"
import toast from "react-hot-toast"
import { useNavigate } from "react-router-dom"

interface ResultBanner {
  tone: NoticeTone
  content: ReactNode
  /** 결과를 확인하러 갈 탭 — 「배송중 탭에서 확인」 */
  goTo?: { tab: OrderTab; label: string }
}

/** 목록 행 → 직권 취소 대상 요약(한 건일 때만 주문을 짚는다) */
function toCancelTarget(rows: Array<OrderListItem>): DirectCancelTarget {
  const [only] = rows
  return {
    ids: rows.map(row => row.deliveryGroupId),
    single:
      rows.length === 1
        ? {
            orderNumber: only.orderNumber,
            recipientName: only.recipientName,
            productSummary: only.productSummary ?? "—",
            totalQuantity: only.totalQuantity,
            refundAmount: only.paidAmount,
          }
        : undefined,
  }
}

/** 제외 사유 줄 — 같은 사유는 묶어서 건수로 */
function skippedSummary(skipped: BatchActionResponse["skipped"]) {
  const counts = new Map<string, number>()
  skipped.forEach(item =>
    counts.set(item.message, (counts.get(item.message) ?? 0) + 1)
  )
  return [...counts.entries()]
    .map(([message, count]) => `${message}(${count}건)`)
    .join(" · ")
}

/**
 * 판매 관리 · 주문 관리(시안 10a~10e) — 조회용 대시보드가 아니라 **매일 여는 작업 큐**다.
 * 조회 조건 → 상태 탭 → 일괄 액션 바 → 표 순서로 범위를 좁히고 · 분류를 고르고 · 골라 실행한다.
 *
 * 탭마다 쓸 수 있는 액션만 남긴다(rev.7) — 신규는 [준비 시작]·[판매 취소] + 발주서, 상품준비중은
 * [N건 송장 등록]·[판매 취소] + 발주서·송장 업로드, 나머지 탭은 일괄 바가 없다.
 */
export default function OrderListPage() {
  const navigate = useNavigate()
  const {
    params,
    localParams,
    updateParam,
    updateParams,
    updateLocalParam,
    update,
  } = useParams<OrderListParams>(ORDER_INITIAL_PARAMS)

  const queryParams = useMemo(() => toQueryParams(params), [params])
  const { data: list, isLoading, isFetching } = useGetOrderList(queryParams)
  const { data: summary } = useGetOrderSummary(true)
  const { data: claimSummary } = useGetClaimSummary(true)

  const tab = params.tab
  const rows = useMemo(() => list?.content ?? [], [list])
  const pageInfo = usePaginationInfo({
    data: list?.pageInfo,
    onPageChange: page => updateParam("page", page),
  })

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set())
  const [drafts, setDrafts] = useState<Map<number, InvoiceDraft>>(new Map())
  const [shipEdits, setShipEdits] = useState<
    Map<number, { value: string; error: string | null }>
  >(new Map())
  const [bulkCarrier, setBulkCarrier] = useState<DeliveryCarrier | "">("")
  const [banner, setBanner] = useState<ResultBanner | null>(null)
  const [registeringIds, setRegisteringIds] = useState<Set<number>>(new Set())
  const [updatingIds, setUpdatingIds] = useState<Set<number>>(new Set())
  const [detail, setDetail] = useState<{
    id: number
    navigationIds: Array<number>
  } | null>(null)
  const [prepareIds, setPrepareIds] = useState<Array<number> | null>(null)
  const [cancelTarget, setCancelTarget] = useState<DirectCancelTarget | null>(
    null
  )
  const [purchaseTarget, setPurchaseTarget] =
    useState<PurchaseOrderTarget | null>(null)
  const [isUploadOpen, setIsUploadOpen] = useState(false)

  const prepareStart = usePrepareStart()
  const directCancel = useDirectCancel()
  const downloadPurchaseOrder = useDownloadPurchaseOrder()
  const registerShipments = useRegisterShipments()
  const updateShipment = useUpdateShipment()

  // 조회 조건이 바뀌면 선택·펼침을 비운다 — 보이지 않는 행이 일괄 처리에 섞이지 않게
  const conditionKey = JSON.stringify({ ...queryParams, page: undefined })
  useEffect(() => {
    setSelectedIds(new Set())
    setExpandedIds(new Set())
  }, [conditionKey])

  // ── 탭 · 조건 ────────────────────────────────────

  const changeTab = useCallback(
    async (nextTab: OrderTab) => {
      if (nextTab === tab) {
        return
      }
      if (drafts.size > 0) {
        const ok = await confirm({
          title: "입력한 송장이 등록되지 않았습니다",
          content: `셀에 입력한 ${drafts.size}건은 아직 저장되지 않았습니다. 탭을 옮기면 입력이 사라집니다.`,
          confirmText: "이동",
        })
        if (!ok) {
          return
        }
      }
      setDrafts(new Map())
      setShipEdits(new Map())
      setBanner(null)
      // 탭이 기본 기간·정렬을 소유한다(rev.6) — 기간·정렬은 그 탭의 기본으로 되돌린다
      updateParams({
        tab: nextTab,
        period: "",
        from: "",
        to: "",
        sort: "",
        page: 1,
      })
    },
    [tab, drafts.size, updateParams]
  )

  const resetConditions = useCallback(() => {
    updateParams({ ...ORDER_INITIAL_PARAMS, tab })
  }, [tab, updateParams])

  const currentSort: OrderSortType = params.sort || defaultSortOf(tab)
  const sortOptions: Array<OrderSortType> = hasShipDueSort(tab)
    ? ["OLDEST_FIRST", "LATEST_FIRST", "SHIP_DUE_ASC"]
    : ["OLDEST_FIRST", "LATEST_FIRST"]

  // ── 상품준비중 셀 입력 ────────────────────────────

  /** 화면 내 중복(검사 ②) — 같은 택배사·송장번호를 두 행에 넣은 복붙 사고 */
  const duplicateOf = useMemo(() => {
    const owners = new Map<string, Array<number>>()
    drafts.forEach((draft, id) => {
      if (draft.carrier && draft.trackingNumber) {
        const key = `${draft.carrier}:${draft.trackingNumber}`
        owners.set(key, [...(owners.get(key) ?? []), id])
      }
    })
    const result = new Map<number, string>()
    owners.forEach(ids => {
      if (ids.length < 2) {
        return
      }
      ids.forEach(id => {
        const other = ids.find(otherId => otherId !== id) as number
        result.set(
          id,
          `${drafts.get(other)?.orderNumber} 행과 같은 송장번호입니다`
        )
      })
    })
    return result
  }, [drafts])

  const invoiceStateOf = useCallback(
    (id: number) => {
      const draft = drafts.get(id)
      const filled = Boolean(draft?.carrier && draft?.trackingNumber)
      const duplicate = draft?.touched ? duplicateOf.get(id) : undefined
      const error = draft?.serverError ?? duplicate ?? null
      return { draft, filled, error }
    },
    [drafts, duplicateOf]
  )

  const changeDraft = useCallback(
    (
      row: Pick<OrderListItem, "deliveryGroupId" | "orderNumber">,
      patch: Partial<Pick<InvoiceDraft, "carrier" | "trackingNumber">>
    ) => {
      const current = drafts.get(row.deliveryGroupId) ?? {
        orderNumber: row.orderNumber,
        carrier: "",
        trackingNumber: "",
        touched: false,
        serverError: null,
      }
      const updated: InvoiceDraft = { ...current, ...patch, serverError: null }
      setDrafts(previous => {
        const next = new Map(previous)
        if (!updated.carrier && !updated.trackingNumber) {
          next.delete(row.deliveryGroupId)
        } else {
          next.set(row.deliveryGroupId, {
            ...next.get(row.deliveryGroupId),
            ...updated,
          })
        }
        return next
      })
      // 택배사·송장번호가 다 채워진 행은 자동으로 선택된다 — 버튼 건수가 곧 확정될 건수다(A2b)
      if (updated.carrier && updated.trackingNumber) {
        setSelectedIds(previous => new Set(previous).add(row.deliveryGroupId))
      }
    },
    [drafts]
  )

  const registrable = useMemo(() => {
    const rowsToSend: Array<ShipmentRow> = []
    let errorCount = 0
    drafts.forEach((draft, id) => {
      if (!selectedIds.has(id)) {
        return
      }
      const state = invoiceStateOf(id)
      if (!state.filled) {
        return
      }
      if (state.error) {
        errorCount += 1
        return
      }
      rowsToSend.push({
        deliveryGroupId: id,
        carrier: draft.carrier as DeliveryCarrier,
        trackingNumber: draft.trackingNumber,
      })
    })
    return { rows: rowsToSend, errorCount }
  }, [drafts, selectedIds, invoiceStateOf])

  const offPageDraftCount = useMemo(() => {
    const visible = new Set(rows.map(row => row.deliveryGroupId))
    return [...drafts.keys()].filter(id => !visible.has(id)).length
  }, [drafts, rows])

  const submitShipments = useCallback(
    (shipmentRows: Array<ShipmentRow>) => {
      const ids = shipmentRows.map(row => row.deliveryGroupId)
      setRegisteringIds(new Set(ids))
      registerShipments.mutate(shipmentRows, {
        onSuccess: result => {
          const skippedIds = new Set(
            result.skipped.map(item => item.deliveryGroupId)
          )
          const succeededIds = ids.filter(id => !skippedIds.has(id))
          setDrafts(previous => {
            const next = new Map(previous)
            succeededIds.forEach(id => next.delete(id))
            result.skipped.forEach(item => {
              const draft = next.get(item.deliveryGroupId)
              if (draft) {
                next.set(item.deliveryGroupId, {
                  ...draft,
                  serverError: item.message,
                })
              }
            })
            return next
          })
          setSelectedIds(previous => {
            const next = new Set(previous)
            succeededIds.forEach(id => next.delete(id))
            return next
          })
          if (result.succeeded > 0) {
            setBanner({
              tone: "success",
              content: (
                <>
                  <B>{result.succeeded}건이 배송중으로 전환되었습니다.</B>{" "}
                  소비자에게 송장번호가 전달되었고, 이후 배송 추적과 배송완료
                  전환은 <B>자동</B>으로 진행됩니다. 등록 후 24시간이 지나도
                  추적이 잡히지 않으면 요약 바의 <B>「배송 이상」</B>에
                  표시됩니다.
                  {result.skipped.length > 0 && (
                    <>
                      {" "}
                      <B>제외 {result.skipped.length}건</B>은 송장번호 칸의
                      사유를 확인해 주세요.
                    </>
                  )}
                </>
              ),
              goTo: { tab: "SHIPPING", label: "배송중 탭에서 확인" },
            })
          } else if (result.skipped.length > 0) {
            toast.error(
              `송장을 등록하지 못했습니다 — ${skippedSummary(result.skipped)}`
            )
          }
        },
        onSettled: () => setRegisteringIds(new Set()),
      })
    },
    [registerShipments]
  )

  const applyCarrierToAll = useCallback(() => {
    if (!bulkCarrier) {
      return
    }
    // 한 번에 보내는 건들은 택배사가 거의 같다 — 행마다 고르는 반복 노동을 없앤다
    rows.forEach(row => changeDraft(row, { carrier: bulkCarrier }))
    setDrafts(previous => {
      const next = new Map(previous)
      next.forEach((draft, id) =>
        next.set(id, { ...draft, carrier: bulkCarrier, serverError: null })
      )
      return next
    })
  }, [bulkCarrier, rows, changeDraft])

  const fillFromUpload = useCallback(
    (parsed: ShipmentParseResponse["rows"]) => {
      const visible = new Set(rows.map(row => row.deliveryGroupId))
      let missingCarrier = 0
      let offPage = 0
      setDrafts(previous => {
        const next = new Map(previous)
        parsed.forEach(row => {
          if (row.deliveryGroupId === null) {
            return
          }
          const current = next.get(row.deliveryGroupId)
          const carrier = row.carrier ?? current?.carrier ?? ""
          if (!carrier) {
            missingCarrier += 1
          }
          if (!visible.has(row.deliveryGroupId)) {
            offPage += 1
          }
          next.set(row.deliveryGroupId, {
            orderNumber: row.orderNumber,
            carrier,
            trackingNumber: row.trackingNumber,
            touched: true,
            serverError: null,
          })
        })
        return next
      })
      setSelectedIds(previous => {
        const next = new Set(previous)
        parsed.forEach(row => {
          if (row.deliveryGroupId !== null) {
            next.add(row.deliveryGroupId)
          }
        })
        return next
      })
      setIsUploadOpen(false)
      setBanner({
        tone: "info",
        content: (
          <>
            <B>엑셀에서 {parsed.length}건을 목록에 채웠습니다.</B> 아직 상태는
            바뀌지 않았습니다 — 값을 확인한 뒤 <B>[송장 등록]</B>을 눌러야
            배송중으로 확정됩니다.
            {offPage > 0 &&
              ` 그중 ${offPage}건은 지금 목록(조회 기간·페이지) 밖에 있어 보이지 않지만 함께 등록됩니다.`}
            {missingCarrier > 0 &&
              ` 택배사 칸이 빈 ${missingCarrier}건은 택배사를 고른 뒤 등록하세요.`}
          </>
        ),
      })
    },
    [rows]
  )

  // ── 배송중 「집화 확인 필요」 셀 수정 ──────────────

  const updateRowShipment = useCallback(
    (row: OrderListItem) => {
      const edit = shipEdits.get(row.deliveryGroupId)
      if (!edit?.value || !row.carrier) {
        return
      }
      setUpdatingIds(previous => new Set(previous).add(row.deliveryGroupId))
      updateShipment.mutate(
        {
          deliveryGroupId: row.deliveryGroupId,
          carrier: row.carrier,
          trackingNumber: edit.value,
        },
        {
          onSuccess: () => {
            setShipEdits(previous => {
              const next = new Map(previous)
              next.delete(row.deliveryGroupId)
              return next
            })
            toast.success(`${row.orderNumber} 송장을 수정했습니다.`)
          },
          onError: error =>
            setShipEdits(previous =>
              new Map(previous).set(row.deliveryGroupId, {
                value: edit.value,
                error: errorMessageOf(error, "송장을 수정하지 못했습니다."),
              })
            ),
          onSettled: () =>
            setUpdatingIds(previous => {
              const next = new Set(previous)
              next.delete(row.deliveryGroupId)
              return next
            }),
        }
      )
    },
    [shipEdits, updateShipment]
  )

  // ── 표 컨텍스트 ──────────────────────────────────

  const tableContext: OrderTableContext = {
    tab,
    selectedIds,
    onToggleSelect: (id, checked) =>
      setSelectedIds(previous => {
        const next = new Set(previous)
        if (checked) {
          next.add(id)
        } else {
          next.delete(id)
        }
        return next
      }),
    onToggleSelectAll: checked =>
      setSelectedIds(previous => {
        const next = new Set(previous)
        rows.forEach(row =>
          checked
            ? next.add(row.deliveryGroupId)
            : next.delete(row.deliveryGroupId)
        )
        return next
      }),
    expandedIds,
    onToggleExpand: id =>
      setExpandedIds(previous => {
        const next = new Set(previous)
        if (next.has(id)) {
          next.delete(id)
        } else {
          next.add(id)
        }
        return next
      }),
    onOpenDetail: row =>
      setDetail({
        id: row.deliveryGroupId,
        navigationIds: rows.map(item => item.deliveryGroupId),
      }),
    onPrepareStart: row => setPrepareIds([row.deliveryGroupId]),
    shipDueSortActive: currentSort === "SHIP_DUE_ASC",
    onToggleShipDueSort: () =>
      updateParams({
        sort: currentSort === "SHIP_DUE_ASC" ? "" : "SHIP_DUE_ASC",
        page: 1,
      }),
    invoiceOf: row => invoiceStateOf(row.deliveryGroupId),
    onInvoiceChange: changeDraft,
    onInvoiceBlur: row =>
      setDrafts(previous => {
        const draft = previous.get(row.deliveryGroupId)
        if (!draft || draft.touched) {
          return previous
        }
        return new Map(previous).set(row.deliveryGroupId, {
          ...draft,
          touched: true,
        })
      }),
    onRegisterRow: row => {
      const { draft, filled, error } = invoiceStateOf(row.deliveryGroupId)
      if (!draft || !filled || error) {
        return
      }
      submitShipments([
        {
          deliveryGroupId: row.deliveryGroupId,
          carrier: draft.carrier as DeliveryCarrier,
          trackingNumber: draft.trackingNumber,
        },
      ])
    },
    registeringIds,
    shipEditOf: row => {
      const edit = shipEdits.get(row.deliveryGroupId)
      return {
        value: edit?.value ?? row.trackingNumber ?? "",
        error: edit?.error ?? null,
      }
    },
    onShipEditChange: (row, value) =>
      setShipEdits(previous =>
        new Map(previous).set(row.deliveryGroupId, { value, error: null })
      ),
    onUpdateShipment: updateRowShipment,
    updatingIds,
  }

  // ── 일괄 액션 ────────────────────────────────────

  const selectedRows = rows.filter(row => selectedIds.has(row.deliveryGroupId))

  const openPurchaseOrder = () => {
    const groupCounts = new Map<string, number>()
    selectedRows.forEach(row => {
      const name = row.groupBuyName ?? "공구 없음"
      groupCounts.set(name, (groupCounts.get(name) ?? 0) + 1)
    })
    setPurchaseTarget({
      ids: selectedRows.map(row => row.deliveryGroupId),
      count: selectedRows.length || pageInfo.totalResults,
      groupBuys: [...groupCounts.entries()].map(([name, count]) => ({
        name,
        count,
      })),
      startsPreparation:
        selectedRows.length > 0
          ? selectedRows.some(row => row.status === "NEW")
          : tab === "NEW",
    })
  }

  const handlePurchaseOrder = (
    columns: Parameters<
      ComponentProps<typeof PurchaseOrderModal>["onConfirm"]
    >[0],
    saveAsDefault: boolean
  ) => {
    if (!purchaseTarget) {
      return
    }
    const filters =
      purchaseTarget.ids.length > 0
        ? { deliveryGroupIds: purchaseTarget.ids }
        : {
            tab,
            dateBasis: queryParams.dateBasis,
            from: queryParams.from,
            to: queryParams.to,
            searchType: queryParams.searchType,
            keyword: queryParams.keyword,
          }
    downloadPurchaseOrder.mutate(
      { ...filters, columns, saveAsDefault },
      {
        onSuccess: file => {
          saveFile(file)
          const startsPreparation = purchaseTarget.startsPreparation
          setPurchaseTarget(null)
          setSelectedIds(new Set())
          setBanner({
            tone: "success",
            content: startsPreparation ? (
              <>
                <B>발주서를 내려받았습니다.</B> 대상 신규 주문은{" "}
                <B>상품준비중</B>으로 넘어갔습니다 — 소비자 단순 취소와 배송지
                변경이 닫혔습니다. 택배사에서 송장을 발급받으면 상품준비중
                탭에서 등록하세요.
              </>
            ) : (
              <>
                <B>발주서를 내려받았습니다.</B> 택배사에서 송장을 발급받으면
                목록에 입력하거나 [송장 일괄 업로드]로 올리세요.
              </>
            ),
            goTo: startsPreparation
              ? { tab: "PREPARING", label: "상품준비중 탭에서 확인" }
              : undefined,
          })
        },
      }
    )
  }

  const handlePrepareStart = () => {
    if (!prepareIds) {
      return
    }
    prepareStart.mutate(prepareIds, {
      onSuccess: result => {
        setPrepareIds(null)
        setSelectedIds(new Set())
        if (result.succeeded > 0) {
          setBanner({
            tone: "success",
            content: (
              <>
                <B>{result.succeeded}건 준비를 시작했습니다.</B> 소비자 단순
                취소가 닫혔고, 상품준비중 탭에서 송장을 등록하면 배송중으로
                넘어갑니다.
                {result.skipped.length > 0 &&
                  ` 제외 ${result.skipped.length}건 — ${skippedSummary(result.skipped)}`}
              </>
            ),
            goTo: { tab: "PREPARING", label: "상품준비중 탭에서 확인" },
          })
        } else {
          toast.error(
            `준비를 시작하지 못했습니다 — ${skippedSummary(result.skipped)}`
          )
        }
      },
    })
  }

  const handleDirectCancel = (
    reasonCode: Parameters<
      ComponentProps<typeof DirectCancelModal>["onConfirm"]
    >[0],
    consumerMessage: string
  ) => {
    if (!cancelTarget) {
      return
    }
    directCancel.mutate(
      { deliveryGroupIds: cancelTarget.ids, reasonCode, consumerMessage },
      {
        onSuccess: result => {
          setCancelTarget(null)
          setSelectedIds(new Set())
          setDrafts(previous => {
            const next = new Map(previous)
            cancelTarget.ids.forEach(id => next.delete(id))
            return next
          })
          if (result.succeeded > 0) {
            setBanner({
              tone: "neutral",
              content: (
                <>
                  <B>{result.succeeded}건을 취소했습니다.</B> 사유가 소비자에게
                  전달되고 <B>환불은 운영자가 실행</B>합니다.
                  {result.skipped.length > 0 &&
                    ` 제외 ${result.skipped.length}건 — ${skippedSummary(result.skipped)}`}
                </>
              ),
              goTo: { tab: "CANCELLED", label: "취소 탭에서 확인" },
            })
          } else {
            toast.error(
              `주문을 취소하지 못했습니다 — ${skippedSummary(result.skipped)}`
            )
          }
        },
      }
    )
  }

  // ── 렌더 ─────────────────────────────────────────

  const noOrdersAtAll = summary?.tabCounts.ALL === 0
  const hasActionBar = tab === "NEW" || tab === "PREPARING"
  const isEmpty = !isLoading && rows.length === 0
  const selectedCount = selectedRows.length

  const emptyState = (
    <OrderEmptyState
      noOrdersAtAll={noOrdersAtAll}
      tab={tab}
      keyword={params.keyword}
      onReset={resetConditions}
      onGoGroupBuys={() => navigate("/group-buy")}
    />
  )

  const actionBar = hasActionBar && (
    <div className="flex flex-wrap items-center gap-2 border-b border-sz-n-200 bg-sz-n-50 px-4 py-2.5">
      {tab === "NEW" ? (
        <>
          <Btn
            variant={selectedCount > 0 ? "primary" : "secondary"}
            disabled={selectedCount === 0}
            onClick={() =>
              setPrepareIds(selectedRows.map(row => row.deliveryGroupId))
            }
          >
            준비 시작
          </Btn>
          <Btn
            variant="secondary"
            disabled={selectedCount === 0}
            onClick={() => setCancelTarget(toCancelTarget(selectedRows))}
          >
            판매 취소
          </Btn>
          <span
            className={cn(
              "ml-1 text-[12px]",
              selectedCount > 0 ? "text-sz-n-600" : "text-sz-n-400"
            )}
          >
            {selectedCount > 0 ? (
              <>
                <b className="font-semibold text-sz-accent-600">
                  {selectedCount}건
                </b>{" "}
                선택됨
              </>
            ) : (
              "주문을 선택하면 일괄 처리할 수 있습니다"
            )}
          </span>
        </>
      ) : (
        <>
          <Btn
            variant={registrable.rows.length > 0 ? "primary" : "secondary"}
            disabled={registrable.rows.length === 0}
            isLoading={registerShipments.isPending}
            onClick={() => submitShipments(registrable.rows)}
          >
            {registrable.rows.length > 0
              ? `${registrable.rows.length}건 송장 등록`
              : "송장 등록"}
          </Btn>
          <Btn
            variant="secondary"
            disabled={selectedCount === 0}
            onClick={() => setCancelTarget(toCancelTarget(selectedRows))}
          >
            판매 취소
          </Btn>
          {registrable.errorCount > 0 ? (
            <span className="ml-1 text-[12px] text-sz-danger-text">
              오류 {registrable.errorCount}건 제외
            </span>
          ) : (
            offPageDraftCount > 0 && (
              <span className="ml-1 text-[12px] text-sz-n-600">
                목록 밖 {offPageDraftCount}건 포함
              </span>
            )
          )}
          <span className="ml-2.5 text-[11px] font-semibold text-sz-n-600">
            택배사 일괄 적용
          </span>
          <SelectSm
            tall
            aria-label="택배사 일괄 적용"
            value={bulkCarrier}
            onChange={event =>
              setBulkCarrier(event.target.value as DeliveryCarrier | "")
            }
          >
            <option value="">선택하세요</option>
            {CARRIERS.map(carrier => (
              <option key={carrier.value} value={carrier.value}>
                {carrier.label}
              </option>
            ))}
          </SelectSm>
          <ActBtn disabled={!bulkCarrier} onClick={applyCarrierToAll}>
            전 행에 적용
          </ActBtn>
        </>
      )}
      <span className="ml-auto flex gap-2">
        <Btn variant="secondary" onClick={openPurchaseOrder}>
          발주서 다운로드
        </Btn>
        {tab === "PREPARING" && (
          <Btn variant="secondary" onClick={() => setIsUploadOpen(true)}>
            송장 일괄 업로드
          </Btn>
        )}
      </span>
    </div>
  )

  return (
    <ListViewWrapper>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <SalesHeader
          view="orders"
          summary={summary}
          claimTotal={claimSummary?.tabCounts.ALL}
          onSelectTab={changeTab}
        />

        <OrderStatusTabs
          tab={tab}
          onTabChange={changeTab}
          counts={summary?.tabCounts}
        />

        <OrderQueryForm
          params={params}
          localParams={localParams}
          onLocalChange={updateLocalParam}
          onApply={updateParams}
          onSearch={update}
          onReset={resetConditions}
        />

        {banner && (
          <Notice
            tone={banner.tone}
            className="mb-3 flex items-center gap-3 text-[11px]"
          >
            <div className="flex-1 [&_b]:font-semibold">{banner.content}</div>
            {banner.goTo && (
              <Btn
                variant="secondary"
                className="shrink-0"
                onClick={() => {
                  const target = banner.goTo!.tab
                  setBanner(null)
                  void changeTab(target)
                }}
              >
                {banner.goTo.label}
              </Btn>
            )}
            <button
              type="button"
              aria-label="안내 닫기"
              onClick={() => setBanner(null)}
              className="shrink-0 cursor-pointer opacity-60 hover:opacity-100"
            >
              <X className="size-3.5" aria-hidden />
            </button>
          </Notice>
        )}

        <div className="overflow-hidden rounded-[8px] border border-sz-n-200 bg-white">
          {noOrdersAtAll ? (
            <>
              {actionBar}
              {emptyState}
            </>
          ) : (
            <>
              {!isEmpty && (
                <div className="flex items-center justify-between border-b border-sz-n-200 px-4 py-2.5">
                  <span className="text-[12px] text-sz-n-600">
                    총 <b className="text-sz-n-900">{pageInfo.totalResults}</b>
                    건
                    {pageInfo.totalResults > rows.length && (
                      <span className="text-sz-n-500">
                        {" "}
                        · {rows.length}건 표시
                      </span>
                    )}{" "}
                    ·{" "}
                    <span className="text-sz-n-500">
                      조회기간{" "}
                      {formatRangeCompact(queryParams.from, queryParams.to)}
                    </span>
                  </span>
                  <div className="flex items-center gap-2">
                    <SelectSm
                      aria-label="정렬"
                      value={currentSort}
                      onChange={event =>
                        updateParams({
                          sort: event.target.value as OrderSortType,
                          page: 1,
                        })
                      }
                    >
                      {sortOptions.map(option => (
                        <option key={option} value={option}>
                          {SORT_LABELS[option]}
                        </option>
                      ))}
                    </SelectSm>
                    <SelectSm
                      aria-label="표시 건수"
                      value={String(params.size)}
                      onChange={event =>
                        updateParams({
                          size: Number(event.target.value),
                          page: 1,
                        })
                      }
                    >
                      {ORDER_PAGE_SIZES.map(size => (
                        <option key={size} value={size}>
                          {size}건씩
                        </option>
                      ))}
                    </SelectSm>
                  </div>
                </div>
              )}

              {actionBar}

              <OrderTable
                ctx={tableContext}
                rows={rows}
                emptyState={emptyState}
                isLoading={isLoading || (isFetching && rows.length === 0)}
              />

              {!isEmpty && pageInfo.totalPages > 0 && (
                <div className="flex justify-center border-t border-sz-n-200 p-3">
                  <Pagination {...pageInfo} />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {detail && (
        <OrderDetailModal
          deliveryGroupId={detail.id}
          navigationIds={detail.navigationIds}
          onNavigate={id =>
            setDetail(previous => (previous ? { ...previous, id } : previous))
          }
          onClose={() => setDetail(null)}
        />
      )}

      {prepareIds && (
        <PrepareStartModal
          count={prepareIds.length}
          isLoading={prepareStart.isPending}
          onClose={() => setPrepareIds(null)}
          onConfirm={handlePrepareStart}
        />
      )}

      {cancelTarget && (
        <DirectCancelModal
          target={cancelTarget}
          isLoading={directCancel.isPending}
          onClose={() => setCancelTarget(null)}
          onConfirm={handleDirectCancel}
        />
      )}

      {purchaseTarget && (
        <PurchaseOrderModal
          target={purchaseTarget}
          isLoading={downloadPurchaseOrder.isPending}
          onClose={() => setPurchaseTarget(null)}
          onConfirm={handlePurchaseOrder}
        />
      )}

      {isUploadOpen && (
        <ShipmentUploadModal
          onClose={() => setIsUploadOpen(false)}
          onFill={fillFromUpload}
        />
      )}
    </ListViewWrapper>
  )
}
