import DetailCard from "@/common/components/DetailCard/DetailCard"
import Notice from "@/common/components/Notice/Notice"
import Btn from "@/features/contracts/components/shared/Btn"
import { formatNumber } from "@/features/contracts/utils/format"
import {
  B,
  Checklist,
  FRow,
  FSub,
  GbBadge,
  GbStepper,
  PeriodProgress,
  type CheckRow,
  type GbStep,
} from "@/features/groupBuy/components/shared/GbParts"
import {
  EMERGENCY_REASON_LABEL,
  PLATFORM_FEE_RATE,
  SUSPENSION_CLAUSE_TEXT,
} from "@/features/groupBuy/constants/params"
import {
  type Detail,
  type SellingSituation,
  d,
  dDay,
  dt,
  md,
  mdDate,
  minQuantityText,
} from "@/features/groupBuy/utils/view"
import type { ReactNode } from "react"

/*
  좌측 맨 위 카드 — 준비중·준비완료는 「준비 상황」(체크리스트), 진행중은 「진행 상황」(기간 막대),
  종결 후에는 「진행 상황」(정산까지 무엇이 남았나). 같은 자리에서 성격이 바뀌는 게 이 화면의 핵심이다.
*/

const LIFECYCLE = ["준비중", "준비완료", "진행중", "종료", "정산완료"] as const

function lifecycleSteps(detail: Detail): Array<GbStep> {
  const { groupBuy, timeline, contract } = detail
  const whos = [
    `계약 체결 · ${mdDate(contract.concludedAt)}`,
    "3개 조건 충족",
    `${md(timeline.startAt)} 시작`,
    md(timeline.endAt),
    "판매 관리 확정 후",
  ]
  const current = {
    PREPARING: 0,
    READY: 1,
    IN_PROGRESS: 2,
    SUSPENSION_SCHEDULED: 2,
    ENDED: 3,
    SETTLED: 4,
    SUSPENDED: 2,
  }[groupBuy.status]

  return LIFECYCLE.map((label, index) => ({
    label,
    who: whos[index],
    tone: index < current ? "done" : index === current ? "cur" : "todo",
  }))
}

// ── 준비 상황(B1 · B2 · B2a · B3) ────────────────────

function gateRows(
  detail: Detail,
  onConfirmStock: () => void,
  isConfirming: boolean
) {
  const gates = detail.readiness?.gates ?? []
  const isReady = detail.groupBuy.status === "READY"
  const postNotSubmitted =
    detail.post.status === "NOT_WRITTEN" || detail.post.status === "WRITING"

  return gates.map<CheckRow>(gate => {
    const tone =
      gate.state === "DONE"
        ? "done"
        : gate.state === "ACTION_REQUIRED" || gate.state === "REJECTED"
          ? "wait"
          : "todo"
    const doneAt = gate.done ? md(gate.doneAt) : undefined

    switch (gate.key) {
      case "STOCK_CONFIRMED": {
        const quantities = minQuantityText(detail)
        const who =
          isReady || !quantities ? "브랜드(나)" : `브랜드(나) · ${quantities}`
        return {
          key: gate.key,
          tone,
          label: "최소 준비 물량 확보",
          sub:
            gate.state === "ACTION_REQUIRED"
              ? `${who} · 누르면 이력에 기록됩니다`
              : who,
          right:
            gate.state === "ACTION_REQUIRED" &&
            detail.permissions.canConfirmStock ? (
              <Btn
                variant="primary"
                className="h-7 shrink-0"
                isLoading={isConfirming}
                onClick={onConfirmStock}
              >
                확보 완료
              </Btn>
            ) : (
              (doneAt ?? "대기")
            ),
        }
      }
      case "POST_SUBMITTED":
        return {
          key: gate.key,
          tone,
          label: "인플루언서 게시물 등록",
          sub: gate.done
            ? detail.counterparty.name
            : detail.post.status === "WRITING"
              ? `${detail.counterparty.name} · 작성 중`
              : `${detail.counterparty.name} · 아직 작성을 시작하지 않음`,
          right: doneAt ?? "대기",
        }
      case "OPEN_APPROVED":
      default:
        if (gate.state === "REJECTED") {
          return {
            key: gate.key,
            tone,
            label: "운영자 오픈 승인",
            sub: "반려 · 인플루언서 재등록 후 재검토",
            right: "반려",
          }
        }
        return {
          key: gate.key,
          tone,
          label: "운영자 오픈 승인",
          sub: gate.done
            ? "운영자"
            : postNotSubmitted
              ? "게시물 등록 후 검토 · 영업일 3일"
              : "운영자 검토 중 · 영업일 3일 이내",
          right: doneAt ?? (postNotSubmitted ? "대기" : "진행 중"),
        }
    }
  })
}

export function ReadinessCard(props: {
  detail: Detail
  onConfirmStock: () => void
  isConfirming: boolean
}) {
  const { detail, onConfirmStock, isConfirming } = props
  const gates = detail.readiness?.gates ?? []
  const isReady = detail.groupBuy.status === "READY"
  const rejected = gates.some(gate => gate.state === "REJECTED")
  const waitingAdmin =
    !rejected &&
    gates.every(gate => gate.key === "OPEN_APPROVED" || gate.done) &&
    !gates.find(gate => gate.key === "OPEN_APPROVED")?.done

  const note = isReady
    ? "모든 조건 충족 · 시작일에 자동으로 열립니다"
    : rejected
      ? "게시물 반려로 진행 중단 — 재등록이 필요합니다"
      : "3개 조건이 모두 충족되면 준비완료"

  const daysLeft = detail.timeline.daysUntilStart

  return (
    <DetailCard title="준비 상황" note={note}>
      {rejected && (
        <Notice tone="warn" className="mb-4">
          <B>운영자가 인플루언서의 게시물을 반려했습니다.</B>{" "}
          <B>인플루언서가 수정 후 재등록해야 진행됩니다</B> — 게시물을 고칠
          권한은 인플루언서에게 있어 브랜드가 직접 수정할 수 없습니다. 시작일이
          가까우면 <B>스레드에서 재등록을 요청</B>해 주세요.
        </Notice>
      )}
      <GbStepper steps={lifecycleSteps(detail)} />
      <Checklist
        className="mt-4"
        rows={gateRows(detail, onConfirmStock, isConfirming)}
      />
      {isReady ? (
        <Notice tone="info" className="mt-4">
          <B>{dt(detail.timeline.startAt)}에 자동으로 시작됩니다.</B> 별도
          조작은 필요 없습니다. 기간은 <B>시작 전에 바꿀 수 없고</B>, 시작한
          뒤에야 <B>연장만</B> 요청할 수 있습니다(인플루언서 수락 필요). 단축과
          조건 변경은 어느 시점에도 불가합니다.
        </Notice>
      ) : rejected ? null : waitingAdmin ? (
        <Notice tone="info" className="mt-4">
          <B>운영자 검토 중입니다.</B> 브랜드가 할 일은 없습니다 — 승인되면
          준비완료로 바뀌고 알림을 받습니다. 반려되면 사유와 함께 게시물 수정
          요청이 인플루언서에게 전달됩니다.
        </Notice>
      ) : (
        <Notice tone="warn" className="mt-4">
          <B>
            {daysLeft !== null
              ? `시작일까지 ${daysLeft}일 남았습니다.`
              : "시작 시각이 지났습니다."}
          </B>{" "}
          세 조건이 시작일 전에 모두 끝나지 않으면 공구가 열리지 않습니다 —
          게시물이 늦어지거나 <B>운영자 승인이 반려</B>되면 스레드에서
          인플루언서에게 확인해 주세요.
        </Notice>
      )}
    </DetailCard>
  )
}

// ── 진행 상황(B4 계열) ───────────────────────────────

/** 중단 예정 스텝퍼 — 진행중 뒤에 「중단 예정」이 끼고 종료는 「집행 시 중단」 */
function scheduledSteps(detail: Detail): Array<GbStep> {
  const { contract, timeline, adminSuspension } = detail
  return [
    {
      label: "준비중",
      who: `계약 체결 · ${mdDate(contract.concludedAt)}`,
      tone: "done",
    },
    { label: "준비완료", who: "3개 조건 충족", tone: "done" },
    { label: "진행중", who: `${md(timeline.startAt)} 시작`, tone: "done" },
    {
      label: "중단 예정",
      who: `${md(adminSuspension?.executeScheduledAt)} 집행 예정`,
      tone: "warn",
    },
    { label: "종료", who: "집행 시 중단", tone: "todo" },
  ]
}

export function SellingProgressCard(props: {
  detail: Detail
  situation: SellingSituation
}) {
  const { detail, situation } = props
  const { timeline, extension, adminSuspension } = detail

  let note = `${dt(timeline.endAt)} 종료 예정`
  let banner: ReactNode = null

  switch (situation.kind) {
    case "notice":
      note = `직권 중단 사전통지 수신 · ${dt(adminSuspension?.executeScheduledAt)} 집행 예정`
      break
    case "extensionPending":
      note = "연장 요청 발송 · 상대 수락 대기"
      banner = (
        <Notice tone="info" className="mb-4">
          <B>
            연장 요청을 보냈습니다. 인플루언서가 수락하면 종료일이 즉시
            바뀝니다.
          </B>{" "}
          수락은 <B>{dt(timeline.endAt)}(현재 종료 시각) 전까지만</B> 가능하며,
          그때까지 응답이 없으면 <B>변경 없이</B> 원래 일정대로 종료됩니다 —
          연장을 전제로 재고를 준비하지 마세요.
        </Notice>
      )
      break
    case "extensionAccepted":
      note = `연장 수락 · ${dt(timeline.endAt)} 종료 예정`
      banner = (
        <Notice tone="info" className="mb-4">
          <B>
            인플루언서가 연장을 수락해 종료일이 {dt(timeline.endAt)}로
            변경되었습니다.
          </B>{" "}
          소비자 화면에도 반영되었습니다 — 늘어난 {extension.days ?? "—"}일치{" "}
          <B>재고와 배송 여력</B>을 확인해 주세요. 연장은 <B>공구당 1회</B>라
          추가 연장은 할 수 없습니다.
        </Notice>
      )
      break
    case "extensionRejected":
      note = "연장 거절 · 원래 일정대로 진행"
      banner = (
        <Notice tone="danger" className="mb-4">
          <B>
            {extension.status === "EXPIRED"
              ? "인플루언서가 기한까지 응답하지 않아 연장 요청이 자동 거절되었습니다."
              : "인플루언서가 연장을 거절했습니다."}
          </B>{" "}
          공구는 <B>{dt(timeline.endAt)}에 예정대로 종료</B>됩니다. 연장 요청은
          공구당 <B>한 번만</B> 보낼 수 있어 <B>다시 요청할 수 없습니다.</B> 더
          팔아야 한다면 이 공구를 정상 종료한 뒤 <B>새 계약</B>을 체결하세요.
        </Notice>
      )
      break
    case "myRequest":
      if (situation.type === "SUSPEND") {
        note = "중단 요청 검토 중 · 공구는 계속 진행"
        banner = (
          <Notice tone="warn" className="mb-4">
            <B>중단 요청을 검토하고 있습니다. 공구는 그동안 계속 진행됩니다.</B>{" "}
            승인 전까지 신규 주문이 계속 들어오므로 <B>배송을 멈추지 마세요.</B>{" "}
            결과는 알림으로 전달되며, 반려되면 공구는 원래 일정대로 종료됩니다.
          </Notice>
        )
      } else {
        note = "조기 마감 요청 검토 중 · 공구는 계속 진행"
        banner = (
          <Notice tone="info" className="mb-4">
            <B>
              조기 마감 요청을 검토하고 있습니다. 승인될 때까지 공구는 계속
              진행됩니다.
            </B>{" "}
            <B>조기 마감은 정상 종결</B>이라 승인되면 상태가 <B>종료</B>가 되고,{" "}
            <B>접수된 주문은 그대로 배송·정산</B>됩니다 — 환불은 발생하지
            않습니다. 반려되면 원래 종료일까지 진행됩니다.
          </Notice>
        )
      }
      break
    case "theirRequest":
      note = "중단 요청 검토 중 · 공구는 계속 진행"
      banner = (
        <Notice tone="warn" className="mb-4">
          <B>
            인플루언서가 공구 중단을 요청해 운영자가 검토하고 있습니다. 공구는
            그동안 계속 진행됩니다.
          </B>{" "}
          승인 전까지 신규 주문이 계속 들어오므로 <B>배송을 멈추지 마세요.</B>{" "}
          <B>운영자 판단이 나올 때까지 이 화면에서 조작할 수 없습니다</B> —
          이견이 있으면 스레드에서 인플루언서·운영자와 논의해 주세요.
        </Notice>
      )
      break
    case "decisionRejected": {
      const label = situation.type === "SUSPEND" ? "중단" : "조기 마감"
      note = `${label} 요청 반려 · 원래 일정대로 진행`
      banner = (
        <Notice tone="danger" className="mb-4">
          <B>{label} 요청이 반려되었습니다.</B> 공구는{" "}
          <B>{dt(timeline.endAt)}까지 그대로 진행</B>되며 신규 주문도 계속
          받습니다. 사유를 보완해 다시 요청할 수 있습니다.
        </Notice>
      )
      break
    }
    default:
      break
  }

  // 검토 중 요청이 시작 전에 걸린 경우(READY)엔 진행 막대가 의미 없다
  const showProgress =
    detail.groupBuy.status === "IN_PROGRESS" ||
    detail.groupBuy.status === "SUSPENSION_SCHEDULED"
  const steps =
    situation.kind === "notice"
      ? scheduledSteps(detail)
      : lifecycleSteps(detail)

  return (
    <DetailCard title="진행 상황" note={note}>
      {banner}
      <GbStepper steps={steps} />
      {showProgress && (
        <PeriodProgress
          elapsedDays={timeline.elapsedDays}
          totalDays={timeline.totalDays}
          endText={dt(timeline.endAt)}
        />
      )}
    </DetailCard>
  )
}

/** 진행중에 걸린 요청·결과를 따로 한 장으로 — 연장(B4c·d·e) · 중단/조기 마감(B4a·b·f·g·h) */
export function SituationCard(props: {
  detail: Detail
  situation: SellingSituation
  brandName: string
}) {
  const { detail, situation, brandName } = props
  const { extension, activeRequest, lastDecision, timeline, counterparty } =
    detail

  switch (situation.kind) {
    case "extensionPending":
      return (
        <DetailCard
          title="연장 요청"
          note={`${brandName} · ${dt(extension.requestedAt)} 발송`}
        >
          <FRow label="요청 내용">
            <span className="tabular-nums">{extension.days}일 연장</span>
            <FSub>
              {dt(extension.beforeEndAt)} → <B>{dt(extension.afterEndAt)}</B>
              {extension.days !== null &&
                ` · 총 ${timeline.totalDays + extension.days}일`}
            </FSub>
          </FRow>
          <FRow label="사유">{extension.reason || "—"}</FRow>
          <FRow label="수락 필요">
            {counterparty.name}{" "}
            <span className="text-sz-n-500">(인플루언서)</span>
          </FRow>
          <FRow label="수락 기한">
            <span className="tabular-nums">{dt(timeline.endAt)}</span>
            <FSub>현재 종료 시각 · 이후에는 수락할 수 없습니다</FSub>
          </FRow>
          <FRow label="처리 상태">
            <GbBadge tone="INFO">상대 수락 대기</GbBadge>
          </FRow>
        </DetailCard>
      )
    case "extensionAccepted":
      return (
        <DetailCard
          title="연장 이력"
          note={`1회 연장 · 총 ${timeline.totalDays}일 · 추가 연장 불가`}
        >
          <FRow label="요청">
            <span className="tabular-nums">{extension.days}일 연장</span>
            <FSub>
              {[dt(extension.requestedAt), brandName, extension.reason]
                .filter(Boolean)
                .join(" · ")}
            </FSub>
          </FRow>
          <FRow label="수락">
            <span className="tabular-nums">{dt(extension.respondedAt)}</span>
            <FSub>{counterparty.name} · 종료일 즉시 변경 · 소비자 반영</FSub>
          </FRow>
          <FRow label="변경 내역">
            <span className="tabular-nums">
              {dt(extension.beforeEndAt)} → <B>{dt(extension.afterEndAt)}</B>
            </span>
            <FSub>
              {extension.days !== null
                ? `${timeline.totalDays - extension.days}일 → ${timeline.totalDays}일 · 연장 1회 소진`
                : "연장 1회 소진"}
            </FSub>
          </FRow>
        </DetailCard>
      )
    case "extensionRejected": {
      const expired = extension.status === "EXPIRED"
      return (
        <DetailCard
          title="연장 요청 결과"
          note={`${expired ? "시스템" : counterparty.name} · ${dt(extension.respondedAt)} 처리`}
        >
          <FRow label="요청 내용">
            <span className="tabular-nums">{extension.days}일 연장</span>
            <FSub>
              {dt(extension.beforeEndAt)} → <B>{dt(extension.afterEndAt)}</B>
              {extension.days !== null &&
                ` · 총 ${timeline.totalDays + extension.days}일`}
            </FSub>
          </FRow>
          <FRow label="사유">{extension.reason || "—"}</FRow>
          <FRow label="처리 결과">
            <GbBadge tone="DANGER">
              {expired ? "기간 만료 자동 거절" : "거절"}
            </GbBadge>
          </FRow>
          {!expired && (
            <FRow label="거절 사유">{extension.rejectMemo || "—"}</FRow>
          )}
          <FRow label="재요청">
            불가
            <FSub>연장 요청은 공구당 1회로 제한됩니다</FSub>
          </FRow>
          <Notice tone="neutral" className="mt-3">
            <B>거절은 두 경로로 옵니다.</B> {expired ? "" : "위처럼 "}
            인플루언서가 <B>명시적으로 거절</B>
            하면 처리자·사유가 남습니다. 반면{" "}
            <B>공구 기간이 끝날 때까지 응답이 없으면 «기간 만료 자동 거절»</B>로
            처리되며, 이때는 처리자가 <B>시스템</B>이고 거절 사유가 없습니다 —
            두 경우 모두 <B>원래 종료일로 정상 진행</B>되고 재요청은 불가합니다.
          </Notice>
        </DetailCard>
      )
    }
    case "myRequest":
    case "theirRequest": {
      if (!activeRequest) {
        return null
      }
      const isEarly = activeRequest.type === "EARLY_CLOSE"
      const isTheirs = situation.kind === "theirRequest"
      return (
        <DetailCard
          title={isEarly ? "조기 마감 요청" : "중단 요청"}
          note={`${activeRequest.requesterName} · ${dt(activeRequest.requestedAt)} 요청`}
        >
          {isTheirs && (
            <FRow label="요청자">
              {activeRequest.requesterName}{" "}
              <span className="text-sz-n-500">(인플루언서)</span>
            </FRow>
          )}
          <FRow label="요청 사유">
            {activeRequest.reasonLabel ?? activeRequest.reasonCode}
          </FRow>
          {activeRequest.memo && <FRow label="메모">{activeRequest.memo}</FRow>}
          <FRow label="처리 상태">
            <GbBadge tone="INFO">운영자 검토 중</GbBadge>
          </FRow>
        </DetailCard>
      )
    }
    case "decisionRejected": {
      if (!lastDecision) {
        return null
      }
      const isEarly = situation.type === "EARLY_CLOSE"
      const requestedAt = detail.history.find(
        entry =>
          entry.eventType ===
          (isEarly ? "EARLY_CLOSE_REQUESTED" : "SUSPENSION_REQUESTED")
      )
      return (
        <DetailCard
          title={isEarly ? "조기 마감 요청 결과" : "중단 요청 결과"}
          note={`운영자 · ${dt(lastDecision.decidedAt)} 처리`}
        >
          <FRow label="내 요청 사유">
            {requestedAt?.detail ?? "—"}
            {requestedAt && <FSub>{dt(requestedAt.occurredAt)} 요청</FSub>}
          </FRow>
          <FRow label="운영자 반려 사유">
            {lastDecision.decisionReason || "—"}
          </FRow>
        </DetailCard>
      )
    }
    default:
      return null
  }
}

// ── 종결 후 진행 상황(B5 계열 · B6 · B7) ─────────────

export function ClosedProgressCard(props: { detail: Detail }) {
  const { detail } = props
  const { groupBuy, timeline, orderClosure, closure } = detail
  const unclosed = orderClosure?.unclosedCount

  if (groupBuy.status === "SUSPENDED") {
    const isAdmin =
      closure?.source === "ADMIN_NOTICE" ||
      closure?.source === "ADMIN_EMERGENCY"
    const acceptedOrders = detail.sales?.orderCount
    return (
      <DetailCard
        title="진행 상황"
        note={`진행 ${timeline.elapsedDays}일차 ${isAdmin ? "직권 중단" : "중단"} · ${d(groupBuy.endedAt)}`}
      >
        {/* 시안 B7·B7a — 5단계 중 종료 자리에 「중단」이 들어간다 */}
        <GbStepper
          steps={[
            ...lifecycleSteps(detail).slice(0, 2),
            {
              label: "진행중",
              who: groupBuy.openedAt
                ? `${md(timeline.startAt)} 시작`
                : "시작 전",
              tone: groupBuy.openedAt ? "done" : "todo",
            },
            {
              label: "중단",
              who: `${md(groupBuy.endedAt)} · ${isAdmin ? "운영자 직권" : "운영자"}`,
              tone: "halt",
            },
            { label: "정산완료", who: "진행되지 않음", tone: "todo" },
          ]}
        />
        <Notice tone="neutral" className="mt-4">
          {isAdmin ? (
            <>
              <B>
                운영자가 직권으로 공구를 중단했습니다 — 브랜드·인플루언서의
                요청은 없었습니다.
              </B>{" "}
              게시물도 함께 내려가 신규 주문을 받지 않습니다.{" "}
              <B>
                이미 접수된 주문
                {acceptedOrders !== undefined
                  ? ` ${formatNumber(acceptedOrders)}건`
                  : ""}
                은 취소되지 않으며
              </B>{" "}
              배송·환불은 판매 관리에서 개별 처리해야 합니다. 판단에 이의가
              있으면 <B>이슈 스레드</B>에서 운영자에게 제기하세요.
            </>
          ) : (
            <>
              <B>운영자가 공구를 중단했습니다.</B> <B>게시물도 함께 내려가</B>{" "}
              쇼룸에서 보이지 않으며 신규 주문을 받지 않습니다.{" "}
              <B>
                이미 접수된 주문
                {acceptedOrders !== undefined
                  ? ` ${formatNumber(acceptedOrders)}건`
                  : ""}
                은 취소되지 않으며
              </B>{" "}
              배송·환불은 판매 관리에서 개별 처리해야 합니다.
            </>
          )}
        </Notice>
      </DetailCard>
    )
  }

  const isSettled = groupBuy.status === "SETTLED"
  const isEarly = groupBuy.closeType === "EARLY_CLOSED"
  // 시안 B5~B6 — 준비중부터 다섯 단계 그대로(조기 마감도 종료 칸은 계약 종료 시각)
  const steps = lifecycleSteps(detail)

  if (isSettled) {
    return (
      <DetailCard title="진행 상황" note="모든 처리 완료">
        <GbStepper steps={steps} />
        <Notice tone="neutral" className="mt-4">
          공구가 종결되었습니다. 정산 상태는{" "}
          <B>정산대기 → 운영자확인 → 이체완료</B>를 거쳤고,{" "}
          <B>이체완료 시점에 공구가 정산완료</B>가 됩니다. 플랫폼 수수료{" "}
          {PLATFORM_FEE_RATE}%·원천징수를 포함한 <B>지급 명세는 정산 관리</B>
          에서 확인하세요.
        </Notice>
      </DetailCard>
    )
  }

  const unclosedText =
    unclosed === undefined
      ? "남은 주문"
      : `남은 주문 ${formatNumber(unclosed)}건`

  return (
    <DetailCard
      title="진행 상황"
      note={
        isEarly
          ? `조기 마감 · ${d(groupBuy.endedAt)} 종결`
          : "판매 종료 · 실적 확정 대기"
      }
    >
      {isEarly && (
        <Notice tone="neutral" className="mb-4">
          <B>조기 마감 요청이 승인되어 예정보다 일찍 종료되었습니다.</B>{" "}
          <B>정상 종결</B>이므로 접수된 주문은 <B>그대로 배송·정산</B>되고
          환불은 발생하지 않습니다 — 남은 배송을 마치면 실적이 확정됩니다.
        </Notice>
      )}
      <GbStepper steps={steps} />
      <Notice tone="info" className="mt-4">
        {isEarly ? (
          <>
            <B>
              {unclosedText}의 배송·반품·교환이 모두 끝나면 정산이 시작됩니다.
            </B>{" "}
            조기 마감이라 판매 기간만 짧아졌을 뿐 정산 절차는 정상 종료와
            같습니다 — 끝나면 <B>영업일 5일 안에 이체</B>됩니다.
          </>
        ) : (
          <>
            <B>
              {unclosedText}의 배송·반품·교환이 모두 끝나면 정산이 시작됩니다.
            </B>{" "}
            판매 금액이 자동으로 확정되고 <B>영업일 5일 안에 이체</B>됩니다.
            종료 후 <B>30일이 지나도 남아 있으면</B> 운영자가 확인합니다.
          </>
        )}
      </Notice>
    </DetailCard>
  )
}

/** 직권 중단 사전통지를 받은 진행중(B4i) — 상태 카드 안 경고 배너 */
export function NoticeSummary(props: { detail: Detail }) {
  const { adminSuspension } = props.detail
  if (!adminSuspension) {
    return null
  }
  const clause = adminSuspension.reasonClause
    ? SUSPENSION_CLAUSE_TEXT[adminSuspension.reasonClause]
    : null
  const dday = dDay(adminSuspension.appealDeadlineAt)
  return (
    <Notice tone="warn">
      <B>운영자가 직권 중단을 통지했습니다.</B> 아래 기한까지 <B>소명 자료</B>를
      제출할 수 있습니다.
      <br />· <B>중단 사유</B> —{" "}
      {clause
        ? `${clause.label}(${clause.clause})`
        : adminSuspension.emergencyReason
          ? EMERGENCY_REASON_LABEL[adminSuspension.emergencyReason]
          : "—"}
      <br />· <B>집행 예정</B> {dt(adminSuspension.executeScheduledAt)}
      <br />· <B>소명 제출 기한</B> {dt(adminSuspension.appealDeadlineAt)}
      {dday && <B> ({dday})</B>}
      <br />
      <B>집행 전까지 공구는 계속 팔립니다 — 배송을 멈추지 마세요.</B>
    </Notice>
  )
}
