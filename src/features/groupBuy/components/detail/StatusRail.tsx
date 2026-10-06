import DetailCard, { MetaRow } from "@/common/components/DetailCard/DetailCard"
import HistoryList from "@/common/components/HistoryList/HistoryList"
import { parseServerDateTime } from "@/common/utils/formatDate"
import Notice from "@/common/components/Notice/Notice"
import Btn from "@/features/contracts/components/shared/Btn"
import { FLINK_CLASS } from "@/features/contracts/components/shared/styles"
import { formatNumber } from "@/features/contracts/utils/format"
import { NoticeSummary } from "@/features/groupBuy/components/detail/ProgressSection"
import { B, GbBadge } from "@/features/groupBuy/components/shared/GbParts"
import { toGroupBuyHistoryItems } from "@/features/groupBuy/utils/history"
import {
  type Detail,
  type SellingSituation,
  d,
  dt,
  fixedFeeShort,
  lastEventAt,
} from "@/features/groupBuy/utils/view"
import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

export interface RailActions {
  onOpenThread: () => void
  onGoSales: () => void
  onGoSettlement: () => void
  onExtension: () => void
  onEarlyClose: () => void
  onSuspension: () => void
  onAppeal: () => void
  onOpenIssue: () => void
}

function Hint(props: { children: ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        "mt-2.5 text-[11px] leading-[1.55] text-sz-n-500",
        props.className
      )}
    >
      {props.children}
    </p>
  )
}

function Warn(props: { children: ReactNode }) {
  return (
    <span className="font-semibold text-sz-warning-text">{props.children}</span>
  )
}

/**
 * 실적 확정 → 이체 완료 사이 영업일(주말 제외) — 시안 B6 「확정 후 영업일 3일」.
 * 공휴일 달력은 서버에도 없어 주말만 뺀다. 둘 중 하나라도 없으면 null.
 */
function businessDaysBetween(
  from: string | null | undefined,
  to: string | null | undefined
): number | null {
  if (!from || !to) {
    return null
  }
  let cursor = parseServerDateTime(from).startOf("day")
  const end = parseServerDateTime(to).startOf("day")
  let days = 0
  while (cursor.isBefore(end)) {
    cursor = cursor.add(1, "day")
    if (cursor.day() !== 0 && cursor.day() !== 6) {
      days += 1
    }
  }
  return days
}

function unclosedLink(detail: Detail, onGoSales: () => void) {
  const unclosed = detail.orderClosure?.unclosedCount
  if (unclosed === undefined) {
    return "—"
  }
  return (
    <button type="button" className={FLINK_CLASS} onClick={onGoSales}>
      {formatNumber(unclosed)}건 처리하기 ↗
    </button>
  )
}

/** 남은 준비 조건 — 「3개」 / 「1개 · 운영자」 / 「1개 · 인플루언서 재등록」 */
function remainingGates(detail: Detail) {
  const gates = detail.readiness?.gates ?? []
  const left = gates.filter(gate => !gate.done)
  const alert = left.some(
    gate => gate.state === "ACTION_REQUIRED" || gate.state === "REJECTED"
  )
  let text = `${left.length}개`
  if (left.length === 1) {
    const gate = left[0]
    const who =
      gate.state === "REJECTED"
        ? "인플루언서 재등록"
        : gate.actorType === "ADMIN"
          ? "운영자"
          : gate.actorType === "CREATOR"
            ? "인플루언서"
            : "브랜드(나)"
    text = `1개 · ${who}`
  }
  return alert ? <Warn>{text}</Warn> : text
}

/**
 * 우측 레일 「상태」 — 현재 상태 · 메타 · 액션 · 힌트. 버튼 노출은 서버 permissions로만 고른다.
 */
export function StatusRailCard(props: {
  detail: Detail
  situation: SellingSituation | null
  actions: RailActions
}) {
  const { detail, situation, actions } = props
  const { groupBuy, timeline, post, permissions, afterEnd, orderClosure } =
    detail
  const postBadge = <GbBadge tone={post.statusTone}>{post.statusLabel}</GbBadge>

  const rows: Array<{ label: string; value: ReactNode }> = []
  const buttons: Array<ReactNode> = []
  let banner: ReactNode = null
  let hint: ReactNode = null

  switch (groupBuy.status) {
    case "PREPARING": {
      rows.push(
        { label: "남은 조건", value: remainingGates(detail) },
        { label: "시작 예정", value: dt(timeline.startAt) },
        { label: "게시물", value: postBadge },
        { label: "고정 지급비", value: fixedFeeShort(detail) }
      )
      if (permissions.canOpenPairThread) {
        buttons.push(
          <Btn
            key="thread"
            variant="secondary"
            className="w-full"
            onClick={actions.onOpenThread}
          >
            스레드 열기
          </Btn>
        )
      }
      const gates = detail.readiness?.gates ?? []
      if (gates.some(gate => gate.state === "ACTION_REQUIRED")) {
        hint = (
          <Hint>
            시작 전에는 기간을 바꿀 수 없습니다. 조건을 조정하려면{" "}
            <B>스레드에서 협의한 뒤 새 계약</B>을 체결해야 합니다.
          </Hint>
        )
      }
      break
    }
    case "READY": {
      rows.push(
        {
          label: "시작까지",
          value:
            timeline.daysUntilStart !== null
              ? `${timeline.daysUntilStart}일`
              : "—",
        },
        { label: "시작 예정", value: dt(timeline.startAt) },
        { label: "게시물", value: postBadge },
        { label: "고정 지급비", value: fixedFeeShort(detail) }
      )
      if (detail.activeRequest) {
        rows.push({
          label: "중단 요청",
          value: dt(detail.activeRequest.requestedAt),
        })
      }
      if (permissions.canRequestSuspension) {
        buttons.push(
          <Btn
            key="suspend"
            variant="danger"
            className="w-full"
            onClick={actions.onSuspension}
          >
            공구 중단 요청
          </Btn>
        )
      }
      hint = detail.activeRequest ? (
        <Hint>
          중단 요청은 <B>취소할 수 없습니다.</B> 운영자 판단이 나올 때까지 이
          화면에서 할 수 있는 조작은 없습니다.
        </Hint>
      ) : (
        <Hint>
          연장·조기 마감은 <B>진행중일 때만</B> 요청할 수 있습니다 — 아직
          시작하지 않아 여기서는 불가합니다. <B>중단은 시작 전에도</B> 요청할 수
          있고(운영자 검토), 이때는 <B>주문 환불이 없고</B>, 이미 지급된 고정
          지급비는 <B>플랫폼이 회수해 주지 않습니다.</B>
        </Hint>
      )
      break
    }
    case "IN_PROGRESS":
    case "SUSPENSION_SCHEDULED": {
      rows.push(
        {
          label: "종료까지",
          value:
            timeline.daysUntilEnd !== null ? `${timeline.daysUntilEnd}일` : "—",
        },
        { label: "종료 예정", value: dt(timeline.endAt) },
        { label: "게시물", value: postBadge }
      )
      const kind = situation?.kind ?? "none"
      if (kind === "extensionPending") {
        rows.push({ label: "연장 요청", value: "상대 수락 대기" })
      } else if (kind === "extensionAccepted") {
        rows.push({
          label: "연장",
          value: (
            <>
              1회 · {detail.extension.days}일{" "}
              <span className="font-normal text-sz-n-500">(소진)</span>
            </>
          ),
        })
      } else if (kind === "extensionRejected") {
        rows.push({
          label: "연장 요청",
          value: <span className="text-sz-danger-text">거절</span>,
        })
      } else if (kind === "myRequest" && detail.activeRequest) {
        rows.push({
          label:
            detail.activeRequest.type === "SUSPEND"
              ? "중단 요청"
              : "조기 마감 요청",
          value: dt(detail.activeRequest.requestedAt),
        })
      } else if (kind === "theirRequest" && detail.activeRequest) {
        rows.push(
          { label: "중단 요청", value: dt(detail.activeRequest.requestedAt) },
          { label: "요청자", value: "인플루언서" }
        )
      } else if (
        kind === "decisionRejected" &&
        situation?.kind === "decisionRejected"
      ) {
        rows.push({
          label:
            situation.type === "SUSPEND"
              ? "중단 요청 결과"
              : "조기 마감 요청 결과",
          value: <span className="text-sz-danger-text">반려</span>,
        })
      }
      rows.push({
        label: "미종결 주문",
        value: unclosedLink(detail, actions.onGoSales),
      })

      if (kind === "notice") {
        banner = <NoticeSummary detail={detail} />
        if (permissions.canSubmitAppeal) {
          buttons.push(
            <Btn
              key="appeal"
              variant="primary"
              className="w-full"
              onClick={actions.onAppeal}
            >
              소명 자료 제출
            </Btn>
          )
        }
        hint = (
          <Hint>
            <B>기한 내 미제출 시 기존 자료를 기준으로 최종 판정</B>
            됩니다(제17조④).{" "}
            <B>
              소명이 타당하다고 인정되면 직권 중단이 철회될 수 있습니다.
            </B>{" "}
            집행이 확정되면 게시물은 <B>즉시 노출 중지·판매 차단</B>되고{" "}
            <B>재개할 수 없습니다</B>(제17조⑤).{" "}
            <B>재고 소진은 중단이 아니라 조기 마감</B>
            입니다. 기간 단축은 요청할 수 없습니다.
          </Hint>
        )
        if (detail.adminSuspension?.appeal) {
          hint = (
            <Hint>
              소명을 <B>{dt(detail.adminSuspension.appeal.submittedAt)}</B>에
              제출했습니다 — 제출 후에는 수정할 수 없습니다. 운영자가 검토해{" "}
              <B>철회 또는 집행</B>을 결정합니다.
            </Hint>
          )
        }
        break
      }

      if (post.status === "HIDDEN") {
        banner = (
          <Notice tone="warn">
            <B>운영자가 게시물 노출을 중지했습니다.</B> 쇼룸에서 게시물이 보이지
            않아 <B>새 소비자 유입이 끊긴</B> 상태입니다
            {post.hiddenDays !== null && (
              <>
                {" "}
                — 숨김 <B>{post.hiddenDays}일 경과</B>
              </>
            )}
            . <B>공구는 진행중</B>이라 이미 접수된 주문의 <B>배송·CS는 계속</B>{" "}
            처리해야 합니다.
          </Notice>
        )
        if (permissions.canOpenPairThread) {
          buttons.push(
            <Btn
              key="thread"
              variant="secondary"
              className="w-full"
              onClick={actions.onOpenThread}
            >
              스레드에서 확인
            </Btn>
          )
        }
        hint = (
          <Hint>
            게시물을 고칠 권한은 <B>인플루언서</B>에게 있고{" "}
            <B>숨김 해제는 운영자</B>가 합니다(약관 제14조⑤ — 회사는 삭제·노출
            중지·수정 요청 권한을 가진다). 사유와 해제 조건은 <B>스레드</B>에서
            확인하세요. 기간 연장·조기 마감·중단 요청은 숨김이 풀린 뒤에 하세요.{" "}
            <B>재고 소진은 중단이 아니라 조기 마감</B>입니다. 기간 단축은 요청할
            수 없습니다.
          </Hint>
        )
        break
      }

      const isRejectedDecision = kind === "decisionRejected"
      const rejectedType =
        situation?.kind === "decisionRejected" ? situation.type : null
      if (permissions.canRequestExtension) {
        buttons.push(
          <Btn
            key="ext"
            variant="secondary"
            className="w-full"
            onClick={actions.onExtension}
          >
            기간 연장 요청
          </Btn>
        )
      }
      if (permissions.canRequestEarlyClose) {
        buttons.push(
          <Btn
            key="early"
            variant="secondary"
            className="w-full"
            onClick={actions.onEarlyClose}
          >
            {rejectedType === "EARLY_CLOSE"
              ? "조기 마감 재요청"
              : "조기 마감 요청"}
          </Btn>
        )
      }
      if (permissions.canRequestSuspension) {
        buttons.push(
          <Btn
            key="suspend"
            variant="danger"
            className="w-full"
            onClick={actions.onSuspension}
          >
            {rejectedType === "SUSPEND" ? "중단 재요청" : "공구 중단 요청"}
          </Btn>
        )
      }

      if (kind === "extensionPending") {
        hint = (
          <Hint>
            연장 요청이 진행 중이라 <B>추가 요청을 보낼 수 없습니다.</B> 상대가
            응답하거나 기한이 지나면 결과가 이력에 남습니다.
          </Hint>
        )
      } else if (kind === "extensionAccepted") {
        hint = (
          <Hint>
            연장은 <B>공구당 1회</B>라 이미 소진되었습니다. 기간을 더 늘리려면
            이 공구를 종료하고 <B>새 계약</B>을 체결해야 합니다.
          </Hint>
        )
      } else if (kind === "extensionRejected") {
        hint = (
          <Hint>
            연장 요청은 <B>공구당 1회</B>라 다시 보낼 수 없습니다. 이 공구는{" "}
            <B>{dt(timeline.endAt)}에 예정대로 종료</B>됩니다.
          </Hint>
        )
      } else if (kind === "myRequest") {
        hint =
          situation?.kind === "myRequest" &&
          situation.type === "EARLY_CLOSE" ? (
            <Hint>
              조기 마감 요청은 <B>취소할 수 없습니다.</B> 승인되면 상태가{" "}
              <B>종료</B>로 바뀌고 접수분은 정상 배송·정산됩니다 — 환불은
              발생하지 않습니다.
            </Hint>
          ) : (
            <Hint>
              중단 요청은 <B>취소할 수 없습니다.</B> 운영자 판단이 나올 때까지
              이 화면에서 할 수 있는 조작은 없습니다.
            </Hint>
          )
      } else if (kind === "theirRequest") {
        hint = (
          <Hint>
            상대가 보낸 요청은 <B>내가 취소할 수 없습니다.</B> 운영자 판단이
            나올 때까지 할 수 있는 조작은 없고, 미종결 주문은{" "}
            <B>판매 관리에서 계속 처리</B>해야 합니다.
          </Hint>
        )
      } else if (isRejectedDecision) {
        hint =
          rejectedType === "EARLY_CLOSE" ? (
            <Hint>
              반려된 조기 마감 요청은 <B>사유를 보완해 다시 제출</B>할 수
              있습니다. 조기 마감·중단은 운영자 검토,{" "}
              <B>연장은 인플루언서 수락</B>으로 처리됩니다.
            </Hint>
          ) : (
            <Hint>
              반려된 중단 요청은 <B>사유를 보완해 다시 제출</B>할 수 있습니다.
              중단은 운영자 검토, <B>연장은 인플루언서 수락</B>으로 처리됩니다.
            </Hint>
          )
      } else {
        hint = (
          <Hint>
            기간을 늘리려면 <B>연장</B>(인플루언서 수락), 예정보다 일찍 정상
            종결하려면 <B>조기 마감</B>(운영자 검토), 하자·분쟁으로 강제
            종결해야 하면 <B>중단</B>(운영자 검토)입니다.{" "}
            <B>재고 소진은 중단이 아니라 조기 마감</B>입니다. 기간 단축은 요청할
            수 없습니다.
          </Hint>
        )
      }
      break
    }
    case "ENDED": {
      if (groupBuy.closeType === "EARLY_CLOSED") {
        const earlyDays = groupBuy.endedAt
          ? Math.max(
              0,
              parseServerDateTime(timeline.endAt)
                .startOf("day")
                .diff(
                  parseServerDateTime(groupBuy.endedAt).startOf("day"),
                  "day"
                )
            )
          : 0
        rows.push(
          { label: "종료 예정일", value: dt(timeline.endAt) },
          {
            label: "실제 종료",
            value: (
              <>
                {dt(groupBuy.endedAt)}
                {earlyDays > 0 && (
                  <span className="font-normal text-sz-n-500">
                    {" "}
                    ({earlyDays}일 조기)
                  </span>
                )}
              </>
            ),
          }
        )
      } else {
        rows.push({
          label: "종료일시",
          value: dt(groupBuy.endedAt ?? timeline.endAt),
        })
      }
      if (afterEnd?.openIssue) {
        rows.push({ label: "이슈 스레드", value: <Warn>1건 진행 중</Warn> })
      }
      if (orderClosure) {
        rows.push(
          {
            label: "종결",
            value: `${formatNumber(orderClosure.closedCount)} / ${formatNumber(orderClosure.totalCount)}건`,
          },
          {
            label: "미종결",
            value: <Warn>{formatNumber(orderClosure.unclosedCount)}건</Warn>,
          }
        )
      }
      rows.push({ label: "게시물", value: postBadge })
      hint = (
        <Hint>
          구매확정이 끝나면 정산이 시작됩니다. 배송·콘텐츠 이행에 문제가 있으면{" "}
          <B>이슈 스레드</B>에서 논의해 주세요. 공구를 다시 열 수는 없습니다.
        </Hint>
      )
      break
    }
    case "SETTLED": {
      const finalizedAt = lastEventAt(detail, "SALES_FINALIZED")
      rows.push({
        label: "종료일시",
        value: dt(groupBuy.endedAt ?? timeline.endAt),
      })
      if (finalizedAt) {
        rows.push({ label: "실적 확정", value: d(finalizedAt) })
      }
      // 시안 B6 「구매확정 310 / 312건」 — 판매 모듈이 내역을 모르면 줄을 두지 않는다
      if (
        orderClosure &&
        orderClosure.purchaseConfirmedCount !== null &&
        orderClosure.purchaseConfirmedCount !== undefined
      ) {
        rows.push({
          label: "구매확정",
          value: `${formatNumber(orderClosure.purchaseConfirmedCount)} / ${formatNumber(orderClosure.totalCount)}건`,
        })
      }
      const transferDays = businessDaysBetween(finalizedAt, afterEnd?.settledAt)
      rows.push(
        {
          label: "이체 완료",
          value: (
            <>
              {d(afterEnd?.settledAt)}
              {transferDays !== null && (
                <span className="mt-[2px] block text-[11px] font-normal text-sz-n-500">
                  확정 후 영업일 {transferDays}일
                </span>
              )}
            </>
          ),
        },
        { label: "게시물", value: postBadge }
      )
      buttons.push(
        <Btn
          key="settle"
          variant="secondary"
          className="w-full"
          onClick={actions.onGoSettlement}
        >
          정산 내역 보기 ↗
        </Btn>
      )
      hint = (
        <Hint>
          플랫폼 수수료·원천징수를 포함한 <B>지급 명세는 정산 관리</B>에서
          확인합니다.
        </Hint>
      )
      break
    }
    case "SUSPENDED": {
      const closure = detail.closure
      const isAdmin =
        closure?.source === "ADMIN_NOTICE" ||
        closure?.source === "ADMIN_EMERGENCY"
      if (isAdmin) {
        rows.push({ label: "중단 유형", value: "운영자 직권" })
      } else if (closure?.requester) {
        rows.push({
          label: "중단 요청",
          value: dt(closure.requester.requestedAt),
        })
      }
      rows.push(
        { label: "중단 처리", value: dt(groupBuy.endedAt) },
        { label: "처리자", value: "운영자" },
        {
          label: "미종결 주문",
          value:
            detail.orderClosure === null ? (
              "—"
            ) : (
              <Warn>{unclosedLink(detail, actions.onGoSales)}</Warn>
            ),
        },
        { label: "게시물", value: postBadge }
      )
      if (isAdmin) {
        hint = (
          <Hint>
            직권 중단은 <B>브랜드가 되돌릴 수 없습니다.</B> 근거에 이견이 있으면
            아래 이슈 스레드로 제기하세요.
          </Hint>
        )
        if (permissions.canOpenIssue) {
          buttons.push(
            <Btn
              key="issue"
              variant="secondary"
              className="w-full"
              onClick={actions.onOpenIssue}
            >
              이슈 스레드 열기
            </Btn>
          )
        }
      } else {
        hint = (
          <Hint>
            중단된 공구는 되돌릴 수 없습니다. 다시 진행하려면{" "}
            <B>새 계약을 체결</B>해야 합니다.
          </Hint>
        )
      }
      break
    }
    default:
      break
  }

  // 직권 중단(B7a)은 힌트가 버튼 위에 온다 — 이의 제기 경로를 버튼 앞에서 설명한다
  const hintFirst =
    groupBuy.status === "SUSPENDED" &&
    (detail.closure?.source === "ADMIN_NOTICE" ||
      detail.closure?.source === "ADMIN_EMERGENCY")

  return (
    <DetailCard title="상태">
      <div>
        <div className="flex items-center justify-between gap-2.5 border-b border-sz-n-100 pb-3">
          <span className="shrink-0 text-[12px] text-sz-n-500">현재 상태</span>
          <GbBadge tone={groupBuy.statusTone}>{groupBuy.statusLabel}</GbBadge>
        </div>
        <div className="pt-2">
          {rows.map(row => (
            <MetaRow key={row.label} label={row.label} value={row.value} />
          ))}
        </div>
        {banner && <div className="mt-2">{banner}</div>}
        {hintFirst && hint}
        {buttons.length > 0 && (
          <div className="mt-4 flex flex-col gap-2">{buttons}</div>
        )}
        {!hintFirst && hint}
      </div>
    </DetailCard>
  )
}

export function HistoryCard(props: { detail: Detail }) {
  return (
    <DetailCard title="이력" flushBody>
      <HistoryList items={toGroupBuyHistoryItems(props.detail.history)} />
    </DetailCard>
  )
}
