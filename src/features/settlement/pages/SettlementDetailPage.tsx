import NotReady from "@/common/components/NotReady/NotReady"
import Notice from "@/common/components/Notice/Notice"
import StatusBadge from "@/common/components/StatusBadge/StatusBadge"
import { DEV_MOCK_ENABLED } from "@/common/utils/devMock"
import Btn from "@/features/contracts/components/shared/Btn"
import { Grp } from "@/features/settlement/components/detail/DetailParts"
import {
  BreakdownCard,
  DistributionCard,
  FixedFeeCard,
  HoldCard,
  PayoutInfoCard,
  ShippingFeeCard,
  StatementCard,
  SummaryBar,
  TaxCard,
} from "@/features/settlement/components/detail/SettlementSections"
import { SettlementPageHeader } from "@/features/settlement/components/list/SettlementListParts"
import {
  OPERATOR_THREAD_PATH,
  PERFORMANCE_PATH,
  SETTLEMENT_LIST_PATH,
  SETTLEMENT_STATUS_LABEL,
  SETTLEMENT_STATUS_VARIANT,
} from "@/features/settlement/constants/params"
import { useGetSettlementDetail } from "@/features/settlement/hooks/useSettlementQueries"
import { formatPeriod } from "@/features/settlement/utils/format"
import { Loader2 } from "lucide-react"
import toast from "react-hot-toast"
import {
  useLocation,
  useNavigate,
  useParams as useRouteParams,
} from "react-router-dom"

const NAV_BTN_CLASS =
  "inline-flex h-8 items-center gap-[5px] whitespace-nowrap rounded-[6px] border border-sz-n-300 bg-white px-3 text-[12px] font-medium text-sz-n-700 hover:border-sz-n-400 hover:bg-sz-n-100 hover:text-sz-n-900"

/**
 * 정산 상세(ui-partner-13 D1 지급 완료·비사업자 · D2 정산 대기 · D3 지급 완료·사업자 · D4 정산 보류).
 *
 * 「금액이 어떻게 나왔는지」가 화면의 전부다. 조회·내보내기만 있고 금액을 바꾸는 액션은 없다.
 * 정산 대기는 미확정이라 분배·지급·증빙에 값을 주지 않고, 명세 다운로드도 막는다.
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

  const pending = detail.status === "PENDING"
  const handleDownloadMock = (label: string) =>
    toast(
      `개발용 목업이라 ${label} 파일이 없습니다. 정산 API가 연결되면 내려받을 수 있습니다.`
    )

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
            <button type="button" className={NAV_BTN_CLASS} onClick={goList}>
              목록으로
            </button>
            <span className="mx-0.5 h-[18px] w-px bg-sz-n-300" />
            <Btn variant="secondary" onClick={() => navigate(PERFORMANCE_PATH)}>
              성과 관리에서 보기
            </Btn>
          </div>
        }
      />

      {pending && detail.pendingClaimCount > 0 && (
        <Notice tone="neutral" className="mb-3">
          <b className="font-semibold">
            미처리 반품 {detail.pendingClaimCount}건이 남아 있습니다.
          </b>{" "}
          모든 주문 처리가 끝나면 정산 금액이 확정되며,{" "}
          <b className="font-semibold">
            마지막 구매확정일 +{detail.settlementLagDays}일
          </b>
          에 지급됩니다.
        </Notice>
      )}

      <SummaryBar detail={detail} />

      <HoldCard
        detail={detail}
        onContactOperator={() => navigate(OPERATOR_THREAD_PATH)}
      />

      <Grp title="금액" sub="어떻게 이 금액이 나왔나" first />
      <BreakdownCard detail={detail} />

      <Grp title="분배 · 지급" sub="누구에게 얼마가 갔고 언제 들어왔나" />
      <div className="mb-4 grid grid-cols-2 items-start gap-3">
        <DistributionCard detail={detail} />
        <PayoutInfoCard detail={detail} />
      </div>

      <Grp title="증빙" sub="세금 처리" />
      <TaxCard detail={detail} onDownload={handleDownloadMock} />
      <ShippingFeeCard detail={detail} />
      <FixedFeeCard detail={detail} />

      <Grp title="명세" sub="주문 단위로 확인" />
      <StatementCard
        detail={detail}
        onDownload={() => handleDownloadMock("정산 명세")}
      />
    </div>
  )
}
