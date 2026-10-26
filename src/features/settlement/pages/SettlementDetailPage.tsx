import NotReady from "@/common/components/NotReady/NotReady"
import Notice from "@/common/components/Notice/Notice"
import StatusBadge from "@/common/components/StatusBadge/StatusBadge"
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
import {
  SETTLEMENT_PAGE_CLASS,
  SettlementPageHeader,
} from "@/features/settlement/components/list/SettlementListParts"
import AdjustmentRequestModal from "@/features/settlement/components/modals/AdjustmentRequestModal"
import {
  CONNECTIONS_PATH,
  PERFORMANCE_PATH,
  SETTLEMENT_LIST_PATH,
  SETTLEMENT_TONE_VARIANT,
} from "@/features/settlement/constants/params"
import { useGetSettlementDetail } from "@/features/settlement/hooks/useSettlementQueries"
import { settlementService } from "@/features/settlement/services/settlementService"
import type {
  SettlementDetail,
  SettlementTaxDocument,
} from "@/features/settlement/types"
import {
  formatMonthDayTime,
  formatPeriod,
  formatWon,
} from "@/features/settlement/utils/format"
import { isAxiosError } from "axios"
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
 * 버튼 열림은 서버 `actions`가 정한다(화면이 조건식을 들지 않는다).
 */
export default function SettlementDetailPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { settlementId } = useRouteParams()
  const id = Number(settlementId)
  const {
    data: detail,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetSettlementDetail(id)

  const goList = () => navigate(`${SETTLEMENT_LIST_PATH}${location.search}`)

  if (isLoading) {
    return (
      <div className="flex justify-center py-[120px]">
        <Loader2 className="size-5 animate-spin text-sz-n-400" />
      </div>
    )
  }

  if (isError || !detail) {
    // 남의 정산 · 없는 정산은 서버가 404로 존재를 알리지 않는다 — 그 밖의 실패는 다시 시도할 수 있게
    const notFound =
      !Number.isFinite(id) ||
      (isAxiosError(error) && error.response?.status === 404)
    return (
      <div className="overflow-hidden rounded-[8px] border border-sz-n-200 bg-white">
        {notFound ? (
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
        ) : (
          <NotReady
            title="정산 내역을 불러오지 못했습니다"
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

  return (
    <SettlementDetailView
      detail={detail}
      onGoList={goList}
      onGoPerformance={() =>
        navigate(`${PERFORMANCE_PATH}/${detail.groupBuy.groupBuyId}`)
      }
      onOpenThread={threadId =>
        navigate(`${CONNECTIONS_PATH}?threadId=${threadId}`)
      }
    />
  )
}

function SettlementDetailView(props: {
  detail: SettlementDetail
  onGoList: () => void
  onGoPerformance: () => void
  /** 이슈 스레드(ui-partner-14) — 연결·소통에서 그 스레드를 연다 */
  onOpenThread: (threadId: number) => void
}) {
  const { detail, onGoList, onGoPerformance, onOpenThread } = props
  const [adjustOpen, setAdjustOpen] = useState(false)
  const [statementDownloading, setStatementDownloading] = useState(false)
  const [taxDownloadingId, setTaxDownloadingId] = useState<number | null>(null)

  // 확인 기간이 지나거나 협의가 이미 있으면 버튼만 비활성 — 에러 문구 없음(§41-3)
  const canRequestAdjustment = detail.actions.canRequestAdjustment

  const handleOpenThread = () => {
    if (detail.adjustment) onOpenThread(detail.adjustment.threadId)
  }

  // 실패 문구는 서비스가 서버 메시지로 띄운다(파일 응답이라 공용 인터셉터는 끈다)
  const handleDownloadStatement = async () => {
    setStatementDownloading(true)
    try {
      await settlementService.downloadStatement(
        detail.settlementId,
        detail.settlementNumber
      )
    } catch {
      // 토스트 처리됨
    } finally {
      setStatementDownloading(false)
    }
  }

  const handleDownloadTaxDocument = async (document: SettlementTaxDocument) => {
    setTaxDownloadingId(document.documentId)
    try {
      await settlementService.downloadTaxDocument(
        detail.settlementId,
        document.documentId,
        detail.settlementNumber
      )
    } catch {
      // 토스트 처리됨
    } finally {
      setTaxDownloadingId(null)
    }
  }

  return (
    <div className={SETTLEMENT_PAGE_CLASS}>
      <SettlementPageHeader
        title={detail.groupBuy.title}
        description={
          <span className="inline-flex flex-wrap items-center gap-1.5">
            {detail.influencer.showroomName} · 정산 대상 기간{" "}
            {formatPeriod(detail.periodStartAt, detail.periodEndAt, true)}
            <StatusBadge variant={SETTLEMENT_TONE_VARIANT[detail.statusTone]}>
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
            <Btn variant="secondary" onClick={onGoPerformance}>
              성과 관리에서 보기
            </Btn>
          </div>
        }
      />

      {/* 시안 15 S5 — 내 지급 행이 보류됐으면 금액 위에 알린다(배포 전 서버는 payoutHold가 없다) */}
      {detail.payoutHold && (
        <div className="mb-3 flex gap-2.5 rounded-[8px] bg-sz-danger-bg px-3.5 py-2.5 text-[12px] leading-[1.6] text-sz-danger-text [&_b]:font-semibold">
          {detail.payoutHold.sanction ? (
            <div>
              <b>지급 정지 · 계정 이용 정지 중</b> — 확정된 금액{" "}
              <b>{formatWon(detail.breakdown.brandPayoutAmount)}</b>은 정지가
              풀리면 다음 영업일에 지급됩니다. 인플루언서 몫은 예정대로
              지급됩니다.
            </div>
          ) : (
            <div>
              <b>{detail.payoutHold.label}</b> —{" "}
              {detail.payoutHold.scheduleLabel}
            </div>
          )}
        </div>
      )}

      {detail.status === "REVIEWING" && (
        <Notice tone="info" className="mb-3 flex items-center gap-2">
          <div className="flex-1">
            <b className="font-semibold">
              {formatMonthDayTime(detail.dates.reviewDueAt)}까지 금액을 확인하고
              필요하면 정산 조정을 요청할 수 있습니다.
            </b>{" "}
            요청이 없으면 다음 날 자동 확정됩니다. 확인 기간은{" "}
            <b className="font-semibold">주문 종결 후 3영업일</b>(주말·공휴일
            제외)입니다. 확인 기간 중에 환불이 생기면 정산이 재계산되고 확인
            기간이 다시 시작됩니다.
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

      <Grp title="금액" sub="어떻게 이 금액이 나왔나" />
      <BreakdownCard detail={detail} />

      <Grp title="분배 · 지급" sub="누구에게 얼마가 갔고 언제 들어왔나" />
      <div className="mb-4 grid grid-cols-2 items-start gap-3">
        <DistributionCard detail={detail} />
        <PayoutInfoCard detail={detail} />
      </div>

      <Grp title="증빙" sub="세금 처리" />
      <TaxInvoiceCard
        detail={detail}
        downloadingId={taxDownloadingId}
        onDownload={handleDownloadTaxDocument}
      />
      <ShippingFeeCard detail={detail} />

      <Grp title="명세" sub="주문 단위로 확인" />
      <StatementCard
        detail={detail}
        isDownloading={statementDownloading}
        onDownload={handleDownloadStatement}
      />

      {adjustOpen && canRequestAdjustment && (
        <AdjustmentRequestModal
          detail={detail}
          onClose={() => setAdjustOpen(false)}
          onRequested={() => {
            setAdjustOpen(false)
            toast.success(
              "정산 조정을 요청했습니다. 이 공구 정산이 전액 보류되고 이슈 스레드가 열렸습니다."
            )
          }}
        />
      )}
    </div>
  )
}
