import NotReady from "@/common/components/NotReady/NotReady"
import Notice from "@/common/components/Notice/Notice"
import StatusBadge from "@/common/components/StatusBadge/StatusBadge"
import { useMarketStore } from "@/common/stores/useMarketStore"
import { isApiNotReady } from "@/common/utils/devMock"
import Btn from "@/features/contracts/components/shared/Btn"
import { CONTRACT_LIST_PATH } from "@/features/contracts/constants/params"
import { B } from "@/features/performance/components/PerformanceParts"
import CostSection from "@/features/performance/components/detail/CostSection"
import {
  ConsumersSection,
  ContractBar,
  DeliverySection,
  DetailKpis,
  SalesSection,
  SettlementLinkSection,
  TrafficSection,
} from "@/features/performance/components/detail/PerformanceSections"
import {
  PERFORMANCE_LIST_PATH,
  PERFORMANCE_TONE_VARIANT,
} from "@/features/performance/constants/params"
import {
  useGetPerformanceDetail,
  useSavePerformanceCost,
} from "@/features/performance/hooks/usePerformanceQueries"
import type {
  PerformanceCostRequest,
  PerformanceDetail,
} from "@/features/performance/types"
import { formatPeriod } from "@/features/performance/utils/format"
import {
  SETTLEMENT_PAGE_CLASS,
  SettlementPageHeader,
} from "@/features/settlement/components/list/SettlementListParts"
import {
  CONNECTIONS_PATH,
  SETTLEMENT_LIST_PATH,
} from "@/features/settlement/constants/params"
import { isAxiosError } from "axios"
import { Loader2 } from "lucide-react"
import toast from "react-hot-toast"
import {
  useLocation,
  useNavigate,
  useParams as useRouteParams,
} from "react-router-dom"

const NAV_BTN_CLASS =
  "inline-flex h-8 items-center gap-[5px] whitespace-nowrap rounded-[6px] border border-sz-n-300 bg-white px-3 text-[12px] font-medium text-sz-n-700 hover:border-sz-n-400 hover:bg-sz-n-100 hover:text-sz-n-900"

/** 서버 실패 문구(집계 중 잠김 · 항목 불일치 · 금액 범위)를 그대로 띄운다 */
function toastSaveError(error: unknown) {
  const message =
    isAxiosError(error) && typeof error.response?.data?.message === "string"
      ? error.response.data.message
      : "원가를 저장하지 못했습니다. 잠시 뒤 다시 시도해 주세요."
  toast.error(message)
}

/**
 * 공구 성과 상세(ui-partner-12 D1 · D2 · D3 · D4 · D1-C · D1-D) — 공구 1개 리포트.
 * 섹션 순서 고정: 계약 바 → KPI → 유입 → 판매 → 배송 → 소비자 → 원가 → 정산 연결.
 * 수치의 상태(예정 · 정산 후 확정 · 협의 중 · 합의 반영)는 서버 `PerformanceFigure.state`가 정하고
 * 화면은 그대로 그린다. 조정 협의 응답은 이 화면에서 하지 않는다(이슈 스레드에서만).
 */
export default function PerformanceDetailPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { groupBuyId } = useRouteParams()
  const id = Number(groupBuyId)
  const {
    data: detail,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetPerformanceDetail(id)

  const goList = () => navigate(`${PERFORMANCE_LIST_PATH}${location.search}`)

  if (isLoading) {
    return (
      <div className="flex justify-center py-[120px]">
        <Loader2 className="size-5 animate-spin text-sz-n-400" />
      </div>
    )
  }

  if (isError || !detail) {
    const notReady = isApiNotReady(error)
    // 남의 공구 · 없는 공구는 404 — 배포 전(경로 자체가 없음)도 404라 「준비 중」이 먼저다
    const notFound =
      !Number.isFinite(id) ||
      (isAxiosError(error) && error.response?.status === 404)
    return (
      <div className="overflow-hidden rounded-[8px] border border-sz-n-200 bg-white">
        {notReady ? (
          <NotReady
            title="성과 관리 화면은 준비 중입니다"
            action={
              <Btn variant="secondary" onClick={goList}>
                목록으로
              </Btn>
            }
          >
            서버 반영이 끝나면 공구별 판매 성과를 이 화면에서 확인할 수
            있습니다.
          </NotReady>
        ) : notFound ? (
          <NotReady
            title="공구 성과를 찾을 수 없습니다"
            action={
              <Btn variant="secondary" onClick={goList}>
                목록으로
              </Btn>
            }
          >
            삭제되었거나 접근 권한이 없는 공구입니다.
          </NotReady>
        ) : (
          <NotReady
            title="공구 성과를 불러오지 못했습니다"
            action={
              <div className="flex gap-1.5">
                <Btn variant="secondary" onClick={goList}>
                  목록으로
                </Btn>
                <Btn variant="primary" onClick={() => refetch()}>
                  다시 시도
                </Btn>
              </div>
            }
          >
            네트워크 상태를 확인한 뒤 다시 시도해 주세요.
          </NotReady>
        )}
      </div>
    )
  }

  return <PerformanceDetailView detail={detail} onGoList={goList} />
}

function PerformanceDetailView(props: {
  detail: PerformanceDetail
  onGoList: () => void
}) {
  const { detail, onGoList } = props
  const navigate = useNavigate()
  const { market } = useMarketStore()
  const saveCost = useSavePerformanceCost(detail.groupBuyId)
  const aggregating = detail.aggregating

  const handleSave = (body: PerformanceCostRequest) =>
    saveCost.mutate(body, {
      onSuccess: () => toast.success("원가를 저장했습니다."),
      onError: toastSaveError,
    })

  return (
    <div className={SETTLEMENT_PAGE_CLASS}>
      <SettlementPageHeader
        title={detail.groupBuyTitle}
        description={
          <span className="inline-flex flex-wrap items-center gap-1.5">
            {detail.influencer.showroomName} ·{" "}
            {formatPeriod(detail.periodStart, detail.periodEnd, true)}
            <StatusBadge variant={PERFORMANCE_TONE_VARIANT[detail.statusTone]}>
              {detail.statusLabel}
            </StatusBadge>
          </span>
        }
        right={
          <div className="flex shrink-0 items-center gap-1.5">
            <button type="button" className={NAV_BTN_CLASS} onClick={onGoList}>
              목록으로
            </button>
            <span className="mx-0.5 h-[18px] w-px bg-sz-n-300" />
            {/* 연결·소통은 스레드 ID 대신 상대 쇼룸명으로도 1:1 스레드를 고른다 */}
            <Btn
              variant="secondary"
              onClick={() =>
                navigate(
                  `${CONNECTIONS_PATH}?counterpart=${encodeURIComponent(detail.influencer.showroomName)}`
                )
              }
            >
              이 인플루언서와 재협업 제안
            </Btn>
          </div>
        }
      />

      {aggregating && aggregating.openReturnCount > 0 && (
        <Notice tone="neutral" className="mb-3">
          <B>미처리 반품 {aggregating.openReturnCount}건이 남아 있습니다.</B>{" "}
          아래 <B>「예정」</B> 표시 값은 처리 결과에 따라 줄어들 수 있습니다.
        </Notice>
      )}

      <ContractBar
        detail={detail}
        onOpenContract={() =>
          navigate(`${CONTRACT_LIST_PATH}/${detail.contract.contractId}`)
        }
      />
      <DetailKpis detail={detail} />
      <TrafficSection detail={detail} />
      <SalesSection detail={detail} />
      <DeliverySection detail={detail} />
      <ConsumersSection detail={detail} />
      {/* 저장 응답으로 원가가 바뀌면 입력칸을 서버 값으로 다시 채운다 */}
      <CostSection
        key={`${detail.groupBuyId}:${detail.cost.updatedAt ?? ""}:${detail.cost.editable}`}
        cost={detail.cost}
        isSaving={saveCost.isPending}
        onSave={handleSave}
      />
      <SettlementLinkSection
        detail={detail}
        brandName={market?.marketName ?? "브랜드"}
        onOpenSettlement={settlementId =>
          navigate(`${SETTLEMENT_LIST_PATH}/${settlementId}`)
        }
        onOpenThread={threadId =>
          navigate(`${CONNECTIONS_PATH}?threadId=${threadId}`)
        }
      />
    </div>
  )
}
