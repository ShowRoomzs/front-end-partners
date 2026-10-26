import StatusBadge, {
  type StatusBadgeVariant,
} from "@/common/components/StatusBadge/StatusBadge"
import Btn from "@/features/contracts/components/shared/Btn"
import { CONTRACT_LIST_PATH } from "@/features/contracts/constants/params"
import { useCreateContract } from "@/features/contracts/hooks/useContractMutations"
import { HomeCard, HomeEmpty } from "@/features/home/components/HomeCard"
import {
  HOME_LINKS,
  contractDetailPath,
  groupBuyDetailPath,
} from "@/features/home/constants/links"
import type {
  HomeContractRow,
  HomeSettlement,
  HomeUpcomingRow,
} from "@/features/home/types"
import { formatNumber } from "@/features/home/utils/format"
import { SanctionHoldBadge, SUSPENSION_COPY } from "@/features/suspension"
import dayjs from "dayjs"
import { useNavigate } from "react-router-dom"

/** 체결 전 4상태 배지 색 — 서버 `ContractStatusTone`과 같다 */
const CONTRACT_TONE: Record<string, StatusBadgeVariant> = {
  REVIEW_PENDING: "info",
  REVIEW_REJECTED: "warning",
  SIGNING: "info",
  CONCLUSION_PENDING: "info",
}

/** 개발 서버 옛 라벨 「체결 처리 대기」 → 기-05 「공구 생성 대기」(main은 이미 바뀌었다 · 배포 대기) */
const contractLabel = (row: HomeContractRow) =>
  row.status === "CONCLUSION_PENDING" ? "공구 생성 대기" : row.statusLabel

/** 공구 · 게시물 배지 색 — 서버 `GroupBuyTone`과 같다 */
const GROUP_BUY_TONE: Record<string, StatusBadgeVariant> = {
  PREPARING: "neutral",
  READY: "info",
}
const POST_TONE: Record<string, StatusBadgeVariant> = {
  NOT_WRITTEN: "neutral",
  WRITING: "neutral",
  PENDING_APPROVAL: "info",
  REJECTED: "warning",
  SCHEDULED: "info",
  EXPOSED: "success",
  EXPOSURE_SUSPENDED: "danger",
  HIDDEN: "danger",
  CLOSED: "neutral",
}
/** 개발 서버 옛 값 HIDDEN(「숨김」) → 기-08 「노출 중지」 */
const postLabel = (row: HomeUpcomingRow) =>
  row.postStatus === "HIDDEN" ? "노출 중지" : row.postStatusLabel

// ─────────────────────────────────────────── 계약 진행

/**
 * 계약 진행 — 체결 전 계약만(검토 대기 · 검토 반려 · 서명 진행중 · 공구 생성 대기).
 * 정지 중이면 보류 배지(서버 hold)를 붙이고 [+ 계약 작성]만 비활성.
 */
export function ContractsCard(props: {
  count: number
  items: Array<HomeContractRow>
  connectedCreatorCount: number
  suspended: boolean
}) {
  const { count, items, connectedCreatorCount, suspended } = props
  const navigate = useNavigate()
  const { mutateAsync: createContract, isPending } = useCreateContract()

  // 계약 목록의 [+ 계약 작성]과 같다 — 빈 초안을 먼저 만들고 작성 화면으로 간다
  const handleCreate = async () => {
    if (isPending) return
    const created = await createContract({})
    navigate(`${CONTRACT_LIST_PATH}/${created.contractId}`)
  }

  return (
    <HomeCard
      title="계약 진행"
      count={
        count > 0
          ? `체결 전 ${count}건`
          : connectedCreatorCount > 0
            ? `연결 ${connectedCreatorCount}명`
            : undefined
      }
      link={{ label: "계약 관리 ›", to: HOME_LINKS.contracts }}
    >
      {items.length > 0 ? (
        <div className="flex-1">
          {items.map(row => (
            <button
              key={row.contractId}
              type="button"
              onClick={() => navigate(contractDetailPath(row.contractId))}
              className="flex w-full cursor-pointer items-center gap-2.5 border-t border-sz-n-100 px-4 py-2.5 text-left text-[12px] first:border-t-0 hover:bg-sz-accent-50"
            >
              <span className="min-w-0 flex-1 truncate text-sz-n-900">
                {row.groupBuyName}
                <span className="text-[11px] text-sz-n-500">
                  {" "}
                  · {row.creatorName}
                </span>
              </span>
              <span className="inline-flex shrink-0 gap-1">
                <StatusBadge variant={CONTRACT_TONE[row.status] ?? "neutral"}>
                  {contractLabel(row)}
                </StatusBadge>
                <SanctionHoldBadge hold={row.hold} />
              </span>
            </button>
          ))}
        </div>
      ) : (
        <HomeEmpty>
          {connectedCreatorCount > 0
            ? `작성 중이거나 진행 중인 계약이 없습니다. 연결된 인플루언서 ${connectedCreatorCount}명과 계약을 작성할 수 있습니다.`
            : "작성 중이거나 진행 중인 계약이 없습니다. 인플루언서와 연결되면 계약을 작성할 수 있습니다."}
        </HomeEmpty>
      )}
      <div className="border-t border-sz-n-100 px-4 py-2.5">
        <Btn
          className="w-full"
          onClick={handleCreate}
          isLoading={isPending}
          disabled={suspended}
          title={suspended ? SUSPENSION_COPY.blockedTooltip : undefined}
        >
          + 계약 작성
        </Btn>
      </div>
    </HomeCard>
  )
}

// ─────────────────────────────────────────── 오픈 예정

/** 오픈 예정 — 한 줄 목록(공구명 · 오픈일 · 공구 · 게시물 상태 · 막힌 이유 · 승인 보류) */
export function UpcomingCard(props: {
  count: number
  items: Array<HomeUpcomingRow>
}) {
  const { count, items } = props
  const navigate = useNavigate()

  return (
    <HomeCard
      title="오픈 예정"
      count={count > 0 ? `${count}건` : undefined}
      link={{ label: "공구 관리 ›", to: HOME_LINKS.groupBuys }}
    >
      {items.length > 0 ? (
        <div className="flex-1">
          {items.map(row => (
            <button
              key={row.groupBuyId}
              type="button"
              onClick={() => navigate(groupBuyDetailPath(row.groupBuyId))}
              className="block w-full cursor-pointer border-t border-sz-n-100 px-4 py-[11px] text-left first:border-t-0 hover:bg-sz-accent-50"
            >
              <span className="flex items-baseline gap-2">
                <span className="min-w-0 flex-1 truncate text-[12px] font-medium text-sz-n-900">
                  {row.name}
                </span>
                {/* 공구 시작은 입력값이라 KST 벽시계 그대로 */}
                <span className="shrink-0 text-[11px] text-sz-n-700 tabular-nums">
                  {dayjs(row.startAt).format("MM.DD")} 오픈
                </span>
              </span>
              <span className="mt-1 block text-[11px] text-sz-n-500">
                {row.creatorName}
                {row.blockedReason && ` · ${row.blockedReason}`}
              </span>
              <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <StatusBadge variant={GROUP_BUY_TONE[row.status] ?? "neutral"}>
                  {row.statusLabel}
                </StatusBadge>
                <StatusBadge variant={POST_TONE[row.postStatus] ?? "neutral"}>
                  게시물 {postLabel(row)}
                </StatusBadge>
                <SanctionHoldBadge hold={row.hold} />
              </span>
            </button>
          ))}
        </div>
      ) : (
        <HomeEmpty>계약이 체결되면 오픈 예정 공구가 표시됩니다.</HomeEmpty>
      )}
    </HomeCard>
  )
}

// ─────────────────────────────────────────── 정산

/** 정산 — 다음 지급 예정 금액을 크게 + 정산 확인 중 · 조정 협의 건수(금액 분해는 정산 관리 몫) */
export function SettlementCard(props: { settlement: HomeSettlement }) {
  const { nextPayoutAmount, nextPayoutDate, reviewingCount, adjustmentMyTurn } =
    props.settlement
  const isEmpty =
    nextPayoutAmount == null && reviewingCount === 0 && adjustmentMyTurn === 0

  return (
    <HomeCard
      title="정산"
      link={{ label: "정산 관리 ›", to: HOME_LINKS.settlements }}
    >
      {isEmpty ? (
        <HomeEmpty>첫 공구가 끝나고 주문이 모두 처리되면 표시됩니다.</HomeEmpty>
      ) : (
        <div className="flex-1">
          <div className="p-4">
            <div className="text-[11px] text-sz-n-500">
              다음 지급 예정
              {nextPayoutDate && ` · ${dayjs(nextPayoutDate).format("MM.DD")}`}
            </div>
            <div className="mt-1 text-[22px] font-bold text-sz-n-900 tabular-nums">
              {nextPayoutAmount != null
                ? `${formatNumber(nextPayoutAmount)}원`
                : "—"}
            </div>
          </div>
          <div className="flex justify-between border-t border-sz-n-100 px-4 py-[9px] text-[12px] text-sz-n-700">
            <span>정산 확인 중</span>
            <b className="text-sz-n-900 tabular-nums">{reviewingCount}건</b>
          </div>
          <div className="flex justify-between border-t border-sz-n-100 px-4 py-[9px] text-[12px] text-sz-n-700">
            <span>
              {adjustmentMyTurn > 0 ? "조정 협의 · 내 응답 필요" : "조정 협의"}
            </span>
            <b className="text-sz-n-900 tabular-nums">{adjustmentMyTurn}건</b>
          </div>
        </div>
      )}
    </HomeCard>
  )
}
