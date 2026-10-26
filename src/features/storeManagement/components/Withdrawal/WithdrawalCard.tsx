import NotReady from "@/common/components/NotReady/NotReady"
import StatusBadge from "@/common/components/StatusBadge/StatusBadge"
import { formatDateTimeShort } from "@/common/utils/formatDate"
import { Button } from "@/components/ui/button"
import { WithdrawalModal } from "@/features/storeManagement/components/AccountModals/WithdrawalModal"
import RequestBanner from "@/features/storeManagement/components/RequestBanner/RequestBanner"
import {
  StoreButtonRow,
  StoreFormCard,
  StoreHint,
  STORE_BUTTON_CLASS,
} from "@/features/storeManagement/components/StoreFormLayout/StoreFormLayout"
import type {
  PendingWithdrawal,
  Withdrawal,
  WithdrawalAdjustmentItem,
  WithdrawalBreakdown,
  WithdrawalCondition,
  WithdrawalRequestBody,
  WithdrawalTarget,
} from "@/features/storeManagement/services/withdrawalService"
import { cn } from "@/lib/utils"
import dayjs from "dayjs"
import { useState, type ReactNode } from "react"
import { Link, useNavigate } from "react-router-dom"

/** 서버는 이동 대상 코드만 내린다 — 라우트는 FE가 만든다 */
const TARGET_LINK: Record<WithdrawalTarget, { label: string; to: string }> = {
  GROUP_BUYS: { label: "공구 관리", to: "/group-buy" },
  CONTRACTS: { label: "계약 관리", to: "/contract" },
  ORDERS: { label: "판매 관리", to: "/sales/orders" },
  SETTLEMENTS: { label: "정산 관리", to: "/settlement/history" },
  SETTLEMENT_ACCOUNT: {
    label: "정산 정보 수정하기",
    to: "/store/basic?tab=settlement",
  },
  BUSINESS_INFO: {
    label: "사업자 정보 수정하기",
    to: "/store/basic?tab=business",
  },
}

const OPERATOR_THREAD_PATH = "/connections?operator=1"

const formatCount = (count: number) => `${count.toLocaleString("ko-KR")}건`
const sumCount = (rows: Array<WithdrawalBreakdown>) =>
  rows.reduce((sum, row) => sum + row.count, 0)
/** 예상일 · 합의 기한 — 서버가 정한 KST 날짜/기한이라 시간대 변환 없이 읽는다 */
const formatMonthDay = (date: string) => dayjs(date).format("MM.DD")

function CardHeader(props: { children: ReactNode; pending?: boolean }) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 border-b px-5 py-4 text-[16px] font-semibold text-sz-n-900",
        props.pending
          ? "border-[#E9C9C9] bg-sz-danger-bg"
          : "border-sz-n-200 bg-white"
      )}
    >
      {props.children}
    </div>
  )
}

function HeaderNote({ children }: { children: ReactNode }) {
  return (
    <span className="text-[11px] font-normal text-sz-n-500">{children}</span>
  )
}

/** 시안 `.flink` — 내역 줄 안의 이동 링크 */
function InlineLink(props: { to: string; children: ReactNode }) {
  return (
    <Link
      to={props.to}
      className="whitespace-nowrap text-sz-accent-600 hover:underline"
    >
      {props.children} ↗
    </Link>
  )
}

function Strong({ children }: { children: ReactNode }) {
  return <b className="font-semibold text-sz-n-700">{children}</b>
}

/**
 * 계정 탭 하단 「브랜드 탈퇴」 카드(ui-partner-06 4-F · 4-G · 4-G2 · 4-I).
 *
 * 탈퇴는 **신청**이고 실행은 운영자다 — 서버 `withdrawal.state`가 AVAILABLE일 때만 [탈퇴 신청]이 열린다.
 * 미충족은 에러 문구 없이 버튼 비활성 + 조건별 잔여 건수 · 이동 링크 · 내역으로만 보여준다(전역 규칙).
 * 위험색은 버튼에만 쓴다(상태 표시는 중립) — 검토 중 카드 헤더만 시안대로 위험 배경.
 */
export default function WithdrawalCard(props: {
  /** null = 마켓이 없는 계정(서버가 블록을 내리지 않는다) — 카드를 두지 않는다 */
  withdrawal: Withdrawal | null | undefined
  /** 배포본에서 서버가 아직 탈퇴 블록을 모른다 */
  isNotReady: boolean
  isLoading: boolean
  isSubmitting: boolean
  isCanceling: boolean
  onRequest: (body: WithdrawalRequestBody) => Promise<boolean>
  onCancel: (requestId: number) => void
}) {
  const {
    withdrawal,
    isNotReady,
    isLoading,
    isSubmitting,
    isCanceling,
    onRequest,
    onCancel,
  } = props
  const navigate = useNavigate()
  const [isModalOpen, setIsModalOpen] = useState(false)

  if (isNotReady) {
    return (
      <div className="mt-4">
        <StoreFormCard>
          <CardHeader>브랜드 탈퇴</CardHeader>
          <NotReady
            title="탈퇴 신청 화면은 준비 중입니다"
            action={
              <Button
                type="button"
                variant="outline"
                size="sm"
                className={STORE_BUTTON_CLASS}
                onClick={() => navigate(OPERATOR_THREAD_PATH)}
              >
                운영자 문의
              </Button>
            }
          >
            탈퇴는 신청 후 운영자가 처리합니다. 지금은 운영자 문의로 접수해
            주세요.
          </NotReady>
        </StoreFormCard>
      </div>
    )
  }

  if (withdrawal === null) return null

  if (isLoading || !withdrawal) {
    return (
      <div className="mt-4">
        <StoreFormCard>
          <CardHeader>브랜드 탈퇴</CardHeader>
          <div className="p-5 text-[12px] text-sz-n-500">불러오는 중…</div>
        </StoreFormCard>
      </div>
    )
  }

  if (withdrawal.state === "PENDING" && withdrawal.pendingRequest) {
    return (
      <PendingCard
        request={withdrawal.pendingRequest}
        isCanceling={isCanceling}
        onCancel={onCancel}
      />
    )
  }

  const {
    conditions,
    satisfiedCount,
    totalCount,
    lastRejection,
    suspensionBlockedReason,
  } = withdrawal
  const allSatisfied = satisfiedCount === totalCount

  return (
    <div className="mt-4">
      <StoreFormCard>
        <CardHeader>
          브랜드 탈퇴
          <HeaderNote>
            {allSatisfied ? "신청 조건 충족" : "신청 조건 미충족"}
          </HeaderNote>
        </CardHeader>

        {/* 반려 결과는 확인 처리가 없어 다음 신청 전까지 서버가 계속 내린다 — 재신청은 바로 가능 */}
        {lastRejection && (
          <RequestBanner
            tone="danger"
            title="탈퇴 신청이 반려되었습니다"
            body={
              <>
                {formatDateTimeShort(lastRejection.rejectedAt)} 반려 · 조건을
                확인한 뒤 다시 신청할 수 있습니다.
              </>
            }
            rejectReason={lastRejection.reasonLabel}
            rejectReasonDetail={lastRejection.note}
          />
        )}

        <div className="px-5 pt-4">
          <div className="mb-0.5 flex items-baseline gap-2">
            <span className="text-[12px] font-semibold text-sz-n-900">
              신청 조건
            </span>
            <span className="text-[11px] text-sz-n-500">
              {allSatisfied
                ? `${totalCount}개 모두 충족했습니다`
                : "남은 항목을 먼저 정리해 주세요"}
            </span>
            <span className="ml-auto text-[11px] text-sz-n-500 tabular-nums">
              {satisfiedCount} / {totalCount}
            </span>
          </div>
          {conditions.map(condition => (
            <ConditionRow key={condition.code} condition={condition} />
          ))}
        </div>

        {suspensionBlockedReason && (
          <StoreHint className="mx-5 mt-4">
            {suspensionBlockedReason}{" "}
            <InlineLink to={OPERATOR_THREAD_PATH}>운영팀에 문의</InlineLink>
          </StoreHint>
        )}

        {withdrawal.draftContractCount > 0 && (
          <StoreHint className="mx-5 mt-4">
            작성 중인(임시저장) 계약은 조건에 포함되지 않으며 탈퇴 시 함께
            삭제됩니다.
          </StoreHint>
        )}

        <StoreButtonRow>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className={STORE_BUTTON_CLASS}
            disabled={withdrawal.state !== "AVAILABLE"}
            onClick={() => setIsModalOpen(true)}
          >
            탈퇴 신청
          </Button>
        </StoreButtonRow>
      </StoreFormCard>

      <WithdrawalModal
        isOpen={isModalOpen}
        isSubmitting={isSubmitting}
        reasonOptions={withdrawal.reasonOptions}
        draftContractCount={withdrawal.draftContractCount}
        onClose={() => setIsModalOpen(false)}
        onSubmit={async body => {
          if (await onRequest(body)) setIsModalOpen(false)
        }}
      />
    </div>
  )
}

/** 4-I — 신청 후에는 공이 운영자에게 넘어간다 */
function PendingCard(props: {
  request: PendingWithdrawal
  isCanceling: boolean
  onCancel: (requestId: number) => void
}) {
  const { request, isCanceling, onCancel } = props

  return (
    <div className="mt-4 overflow-hidden rounded-[8px] border border-[#E9C9C9] bg-white">
      <CardHeader pending>
        브랜드 탈퇴
        <span className="ml-auto">
          <StatusBadge variant="neutral">운영자 검토 중</StatusBadge>
        </span>
      </CardHeader>
      <div className="px-5 py-4">
        <div className="flex flex-wrap gap-7">
          <Meta label="신청일시">
            {/* 신청 시각은 서버 now() 이벤트(UTC 벽시계) — formatDateTimeShort가 KST로 바꾼다 */}
            <span className="tabular-nums">
              {formatDateTimeShort(request.requestedAt)}
            </span>
          </Meta>
          <Meta label="신청 사유">{request.reasonLabel}</Meta>
          <Meta label="신청자">{request.requesterEmail}</Meta>
        </div>
        <div className="mt-4 border-t border-sz-n-100 pt-4 text-[12px] leading-[1.7] text-sz-n-700">
          운영자 확인 후 처리되며 결과는{" "}
          <b className="font-semibold text-sz-n-900">이메일로 안내</b>됩니다.
          처리 전까지{" "}
          <b className="font-semibold text-sz-n-900">계정은 그대로 사용</b>할 수
          있지만 아래는 제한됩니다.
          <br />·{" "}
          <b className="font-semibold text-sz-n-900">
            새 공구를 시작할 수 없습니다
          </b>{" "}
          — 계약 체결과 공구 생성이 차단됩니다(이미 진행 중인 공구는 그대로
          끝까지 운영합니다)
          <br />·{" "}
          <b className="font-semibold text-sz-n-900">
            비밀번호·로그인 이메일 변경 불가
          </b>{" "}
          — 신원이 바뀌면 검토를 다시 시작해야 합니다
          <br />·{" "}
          <b className="font-semibold text-sz-n-900">탈퇴 재신청 불가</b> —
          접수된 신청이 처리될 때까지 새로 신청할 수 없습니다
        </div>
        <div className="mt-4 flex justify-end border-t border-sz-n-100 pt-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={STORE_BUTTON_CLASS}
            isLoading={isCanceling}
            onClick={() => onCancel(request.requestId)}
          >
            탈퇴 신청 취소
          </Button>
        </div>
      </div>
    </div>
  )
}

function ConditionRow({ condition }: { condition: WithdrawalCondition }) {
  const link = TARGET_LINK[condition.target] as
    | (typeof TARGET_LINK)[WithdrawalTarget]
    | undefined
  const lines = condition.satisfied ? [] : breakdownLines(condition)

  return (
    <>
      <div className="flex items-center gap-2.5 border-t border-sz-n-100 py-[11px]">
        <span
          className={cn(
            "flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full text-[10px] font-semibold",
            condition.satisfied
              ? "bg-sz-success-bg text-sz-success-text"
              : "bg-sz-danger-bg text-sz-danger-text"
          )}
          aria-label={condition.satisfied ? "충족" : "미충족"}
        >
          {condition.satisfied ? "✓" : "!"}
        </span>
        <span className="flex-1 text-[12px] text-sz-n-900">
          {condition.label}
        </span>
        {condition.satisfied ? (
          <span className="w-16 shrink-0" />
        ) : (
          <>
            <span className="text-[12px] text-sz-danger-text tabular-nums">
              {formatCount(condition.count)}
            </span>
            {link && (
              <span className="shrink-0 text-[11px]">
                <InlineLink to={link.to}>{link.label}</InlineLink>
              </span>
            )}
          </>
        )}
      </div>
      {lines.length > 0 && (
        <div className="pb-2.5 pl-7 text-[11px] leading-[1.7] text-sz-n-500">
          {lines.map((line, index) => (
            <div key={index}>{line}</div>
          ))}
        </div>
      )}
    </>
  )
}

/**
 * 조건 행 아래 내역 — 시안은 계약 · 정산만 그린다(공구 · 주문은 건수와 이동 링크 한 줄).
 * 서버 내역 행의 `group` · `action`으로 문구를 고른다.
 */
function breakdownLines(condition: WithdrawalCondition): Array<ReactNode> {
  if (condition.target === "CONTRACTS") return contractLines(condition)
  if (condition.target === "SETTLEMENTS") return settlementLines(condition)
  return []
}

function contractLines({ breakdown }: WithdrawalCondition): Array<ReactNode> {
  const selfRows = breakdown.filter(
    row => row.action === "CANCEL_REVIEW" || row.action === "DELETE"
  )
  const operatorRows = breakdown.filter(
    row =>
      row.action === "CONTACT_OPERATOR" ||
      (!row.action && row.group === "OPERATOR")
  )
  const otherRows = breakdown.filter(
    row => !selfRows.includes(row) && !operatorRows.includes(row)
  )
  const head = (rows: Array<WithdrawalBreakdown>) =>
    `${rows.map(row => row.label).join("·")} ${formatCount(sumCount(rows))}`
  const lines: Array<ReactNode> = []

  if (selfRows.length > 0) {
    // 검토 대기는 삭제가 아니라 검토 요청 취소로 풀린다(작성중으로 돌아가 조건에서 빠진다 · BE 51 설계서 D-5)
    const canCancel = selfRows.some(row => row.action === "CANCEL_REVIEW")
    const canDelete = selfRows.some(row => row.action === "DELETE")
    lines.push(
      <>
        {head(selfRows)} — 계약 관리에서{" "}
        {canCancel && canDelete ? (
          <>
            <Strong>검토 요청을 취소하거나 삭제</Strong>할 수 있습니다
          </>
        ) : canDelete ? (
          <>
            직접 <Strong>삭제</Strong>할 수 있습니다
          </>
        ) : (
          <>
            <Strong>검토 요청을 취소</Strong>할 수 있습니다
          </>
        )}
      </>
    )
  }
  if (operatorRows.length > 0) {
    lines.push(
      <>
        {head(operatorRows)} — 검토 통과 후라 브랜드가 취소할 수 없습니다 ·{" "}
        <InlineLink to={OPERATOR_THREAD_PATH}>운영팀에 문의</InlineLink>
      </>
    )
  }
  otherRows.forEach(row => lines.push(head([row])))
  return lines
}

function settlementLines({ breakdown }: WithdrawalCondition): Array<ReactNode> {
  // 갈래가 둘 이상일 때만 「기다리면 풀림 · 」 머리를 붙인다(시안 4-G) — 한 줄뿐이면 붙이지 않는다(4-G2)
  const showGroup = new Set(breakdown.map(row => row.group)).size > 1
  return breakdown.flatMap(row => settlementRowLines(row, showGroup))
}

function settlementRowLines(
  row: WithdrawalBreakdown,
  showGroup: boolean
): Array<ReactNode> {
  const head = (
    <>
      {showGroup && (
        <>
          <Strong>{row.groupLabel}</Strong> ·{" "}
        </>
      )}
      {row.label} {formatCount(row.count)}
    </>
  )
  const expected = (prefix: string) =>
    row.expectedDate ? ` · ${prefix} ${formatMonthDay(row.expectedDate)}` : ""

  switch (row.key) {
    case "REVIEWING":
      return [
        <>
          {head} — 확인 기간이 끝나면 자동으로 확정됩니다{expected("확인 기한")}
        </>,
      ]
    case "PAYOUT_SCHEDULED":
      return [
        <>
          {head} — 지급이 끝나면 자동으로 풀립니다{expected("예상")}
        </>,
      ]
    case "ADJUSTING": {
      const items = row.items ?? []
      const base = <>{head} — 이슈 스레드에서 응답이 필요합니다</>
      if (items.length <= 1) {
        return [
          <>
            {base}
            {items[0] && <AdjustmentTail item={items[0]} />}
          </>,
        ]
      }
      return [
        base,
        ...items.map(item => (
          <>
            · {item.settlementNumber ?? "정산"}
            <AdjustmentTail item={item} />
          </>
        )),
      ]
    }
    case "BLOCKED":
      return [<BlockedLine row={row} head={head} />]
  }

  if (row.group === "OPERATOR") {
    return [
      <>
        {head} — 운영팀 확인이 필요합니다 ·{" "}
        <InlineLink to={OPERATOR_THREAD_PATH}>운영팀에 문의</InlineLink>
      </>,
    ]
  }
  return [
    <>
      {head}
      {expected("예상")}
    </>,
  ]
}

/** 조정 협의 1건 — 합의 기한 · 이슈 스레드 */
function AdjustmentTail({ item }: { item: WithdrawalAdjustmentItem }) {
  return (
    <>
      {item.deadlineAt && ` · 합의 기한 ${formatMonthDay(item.deadlineAt)}`}
      {item.threadId !== null && (
        <>
          {" · "}
          <InlineLink to={`/connections?threadId=${item.threadId}`}>
            이슈 스레드 열기
          </InlineLink>
        </>
      )}
    </>
  )
}

/**
 * 지급 보류 — 사유별로 해소 경로가 다르다. 4-G2(계정 이용 정지)는 정지가 풀려야 지급되므로
 * 이유를 위험색으로 밝히고 정지를 푸는 화면(정산 정보 · 사업자 정보)으로 보낸다.
 */
function BlockedLine(props: { row: WithdrawalBreakdown; head: ReactNode }) {
  const { row, head } = props
  const target = row.target ? TARGET_LINK[row.target] : null
  const link = target ? (
    <InlineLink to={target.to}>{target.label}</InlineLink>
  ) : row.group === "OPERATOR" ? (
    <InlineLink to={OPERATOR_THREAD_PATH}>운영팀에 문의</InlineLink>
  ) : null

  if (row.reasonCode === "BRAND_SUSPENDED") {
    const fix =
      row.target === "SETTLEMENT_ACCOUNT"
        ? "정산 계좌를 고쳐 정지가 풀리면 다음 영업일에 지급되고 이 조건이 풀립니다"
        : row.target === "BUSINESS_INFO"
          ? "사업자 정보를 고쳐 정지가 풀리면 다음 영업일에 지급되고 이 조건이 풀립니다"
          : row.dueNote
    return (
      <>
        {head} —{" "}
        <b className="font-semibold text-sz-danger-text">
          {row.reasonLabel ?? "계정 이용 정지"}로 브랜드 몫 지급이 멈춰 있습니다
        </b>
        {fix && ` · ${fix}`}
        {link && <> · {link}</>}
      </>
    )
  }

  return (
    <>
      {head}
      {row.reasonLabel && ` — ${row.reasonLabel}`}
      {row.dueNote && ` · ${row.dueNote}`}
      {link && <> · {link}</>}
    </>
  )
}

function Meta(props: { label: string; children: ReactNode }) {
  return (
    <div>
      <div className="mb-[3px] text-[11px] text-sz-n-500">{props.label}</div>
      <div className="text-[12px] text-sz-n-900">{props.children}</div>
    </div>
  )
}
