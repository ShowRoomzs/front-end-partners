import NotReady from "@/common/components/NotReady/NotReady"
import Notice from "@/common/components/Notice/Notice"
import StatusBadge from "@/common/components/StatusBadge/StatusBadge"
import { DEV_MOCK_ENABLED } from "@/common/utils/devMock"
import Btn from "@/features/contracts/components/shared/Btn"
import { Grp } from "@/features/settlement/components/detail/DetailParts"
import {
  AdjustmentCard,
  BreakdownCard,
  DistributionCard,
  PayoutInfoCard,
  ShippingFeeCard,
  StatementCard,
  SummaryBar,
  TaxInvoiceCard,
} from "@/features/settlement/components/detail/SettlementSections"
import { SettlementPageHeader } from "@/features/settlement/components/list/SettlementListParts"
import AdjustmentRequestModal from "@/features/settlement/components/modals/AdjustmentRequestModal"
import {
  PERFORMANCE_PATH,
  SETTLEMENT_LIST_PATH,
  SETTLEMENT_STATUS_LABEL,
  SETTLEMENT_STATUS_VARIANT,
} from "@/features/settlement/constants/params"
import {
  useGetSettlementDetail,
  useRequestSettlementAdjustment,
} from "@/features/settlement/hooks/useSettlementQueries"
import type {
  SettlementAdjustmentRequest,
  SettlementDetail,
} from "@/features/settlement/types"
import {
  formatMonthDayTime,
  formatPeriod,
} from "@/features/settlement/utils/format"
import dayjs from "dayjs"
import { Loader2 } from "lucide-react"
import { useState } from "react"
import toast from "react-hot-toast"
import {
  useLocation,
  useNavigate,
  useParams as useRouteParams,
} from "react-router-dom"

const NAV_BTN_CLASS =
  "inline-flex h-8 items-center gap-[5px] whitespace-nowrap rounded-[6px] border border-sz-n-300 bg-white px-3 text-[12px] font-medium text-sz-n-700 hover:border-sz-n-400 hover:bg-sz-n-100 hover:text-sz-n-900"

/**
 * 정산 상세(ui-partner-13 rev.4 — D2 정산 확인 중 · D4 조정 협의 · D5 지급 예정 · D1/D3 지급 완료).
 *
 * 「금액이 어떻게 나왔는지」가 화면의 전부다. 금액을 바꾸는 경로는 정산 확인 기간의
 * [정산 조정 요청](C1) 하나뿐이고, 협의 응답은 이슈 스레드에서만 한다.
 */
export default function SettlementDetailPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { settlementId } = useRouteParams()
  const id = Number(settlementId)
  const { data: detail, isLoading, isError } = useGetSettlementDetail(id)

  const goList = () => navigate(`${SETTLEMENT_LIST_PATH}${location.search}`)

  if (!DEV_MOCK_ENABLED) {
    return (
      <div>
        <SettlementPageHeader
          title="정산 상세"
          description="공구별 정산 금액과 지급 내역을 확인합니다."
          right={
            <button type="button" className={NAV_BTN_CLASS} onClick={goList}>
              목록으로
            </button>
          }
        />
        <div className="overflow-hidden rounded-[8px] border border-sz-n-200 bg-white">
          <NotReady title="정산 상세 화면은 준비 중입니다" />
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-[120px]">
        <Loader2 className="size-5 animate-spin text-sz-n-400" />
      </div>
    )
  }

  if (isError || !detail) {
    return (
      <div className="overflow-hidden rounded-[8px] border border-sz-n-200 bg-white">
        <NotReady
          title="정산 내역을 찾을 수 없습니다"
          action={
            <Btn variant="secondary" onClick={goList}>
              목록으로
            </Btn>
          }
        >
          삭제되었거나 접근 권한이 없는 정산입니다.
        </NotReady>
      </div>
    )
  }

  return (
    <SettlementDetailView
      detail={detail}
      onGoList={goList}
      onGoPerformance={() => navigate(PERFORMANCE_PATH)}
    />
  )
}

function SettlementDetailView(props: {
  detail: SettlementDetail
  onGoList: () => void
  onGoPerformance: () => void
}) {
  const { detail, onGoList, onGoPerformance } = props
  const [adjustOpen, setAdjustOpen] = useState(false)
  const adjustMutation = useRequestSettlementAdjustment(detail.settlementId)

  // 확인 기간(3영업일째 23:59)이 지나면 버튼만 비활성 — 에러 문구 없음(§41-3)
  const canRequestAdjustment =
    detail.status === "REVIEWING" &&
    !dayjs().isAfter(dayjs(detail.reviewDeadlineAt))

  const handleDownloadMock = (label: string) =>
    toast(
      `개발용 목업이라 ${label} 파일이 없습니다. 정산 API가 연결되면 내려받을 수 있습니다.`
    )

  // 이슈 스레드(ui-partner-14) 화면이 아직 없다 — 생기면 adjustment.threadId로 보낸다
  const handleOpenThread = () =>
    toast(
      "이슈 스레드 화면은 준비 중입니다. 화면이 열리면 이곳에서 조정 협의를 이어갈 수 있습니다."
    )

  const handleSubmitAdjustment = (body: SettlementAdjustmentRequest) =>
    adjustMutation.mutate(body, {
      onSuccess: () => {
        setAdjustOpen(false)
        toast.success(
          "정산 조정을 요청했습니다. 이 공구 정산이 전액 보류되고 이슈 스레드가 열렸습니다."
        )
      },
      onError: error => {
        if (error instanceof Error && error.message === "REVIEW_CLOSED") {
          setAdjustOpen(false)
          toast.error(
            "정산 확인 기간이 지나 조정을 요청할 수 없습니다. 화면을 새로 고쳐 주세요."
          )
          return
        }
        toast.error("정산 조정을 요청하지 못했습니다. 다시 시도해 주세요.")
      },
    })

  return (
    <div>
      <SettlementPageHeader
        title={detail.groupBuyTitle}
        description={
          <span className="inline-flex flex-wrap items-center gap-1.5">
            {detail.creatorShowroomName} · 정산 대상 기간{" "}
            {formatPeriod(detail.periodStart, detail.periodEnd, true)}
            <StatusBadge variant={SETTLEMENT_STATUS_VARIANT[detail.status]}>
              {SETTLEMENT_STATUS_LABEL[detail.status]}
            </StatusBadge>
          </span>
        }
        right={
          <div className="flex shrink-0 items-center gap-1.5">
            <button type="button" className={NAV_BTN_CLASS} onClick={onGoList}>
              목록으로
            </button>
            <span className="mx-0.5 h-[18px] w-px bg-sz-n-300" />
            <Btn variant="secondary" onClick={onGoPerformance}>
              성과 관리에서 보기
            </Btn>
          </div>
        }
      />

      {detail.status === "REVIEWING" && (
        <Notice tone="info" className="mb-3 flex items-center gap-2">
          <div className="flex-1">
            <b className="font-semibold">
              {formatMonthDayTime(detail.reviewDeadlineAt)}까지 금액을 확인하고
              필요하면 정산 조정을 요청할 수 있습니다.
            </b>{" "}
            요청이 없으면 다음 날 자동 확정됩니다. 확인 기간은{" "}
            <b className="font-semibold">주문 종결 후 3영업일</b>(주말·공휴일
            제외)입니다.
          </div>
          <Btn
            variant="secondary"
            className="shrink-0"
            disabled={!canRequestAdjustment}
            onClick={() => setAdjustOpen(true)}
          >
            정산 조정 요청
          </Btn>
        </Notice>
      )}

      <SummaryBar detail={detail} />

      <AdjustmentCard detail={detail} onOpenThread={handleOpenThread} />

      <Grp title="금액" sub="어떻게 이 금액이 나왔나" first />
      <BreakdownCard detail={detail} />

      <Grp title="분배 · 지급" sub="누구에게 얼마가 갔고 언제 들어왔나" />
      <div className="mb-4 grid grid-cols-2 items-start gap-3">
        <DistributionCard detail={detail} />
        <PayoutInfoCard detail={detail} />
      </div>

      <Grp title="증빙" sub="세금 처리" />
      <TaxInvoiceCard detail={detail} onDownload={handleDownloadMock} />
      <ShippingFeeCard detail={detail} />

      <Grp title="명세" sub="주문 단위로 확인" />
      <StatementCard
        detail={detail}
        onDownload={() => handleDownloadMock("정산 명세")}
      />

      {adjustOpen && canRequestAdjustment && (
        <AdjustmentRequestModal
          detail={detail}
          isPending={adjustMutation.isPending}
          onClose={() => setAdjustOpen(false)}
          onSubmit={handleSubmitAdjustment}
        />
      )}
    </div>
  )
}
