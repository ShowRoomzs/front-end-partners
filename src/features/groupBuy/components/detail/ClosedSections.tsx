import DetailCard from "@/common/components/DetailCard/DetailCard"
import Notice from "@/common/components/Notice/Notice"
import Btn from "@/features/contracts/components/shared/Btn"
import { formatNumber } from "@/features/contracts/utils/format"
import {
  B,
  DutyList,
  DutyRow,
  FRow,
  FSub,
} from "@/features/groupBuy/components/shared/GbParts"
import {
  EMERGENCY_REASON_LABEL,
  ISSUE_TYPE_LABEL,
  SUSPENSION_CLAUSE_TEXT,
} from "@/features/groupBuy/constants/params"
import type { FulfillmentCheck } from "@/features/groupBuy/types"
import {
  BRAND_DUTY_TEXT,
  type Detail,
  contentDutyText,
  d,
  dt,
} from "@/features/groupBuy/utils/view"

/**
 * B5 「종료 후 남은 일」 — 정산까지 남은 일 두 개(주문 처리 · 인플루언서 분쟁)를
 * 같은 규격의 한 줄씩으로 놓고 각 줄 오른쪽에 그 줄이 여는 버튼을 붙인다.
 */
export function AfterEndTasksCard(props: {
  detail: Detail
  onGoSales: () => void
  onOpenIssue: () => void
  onOpenThread: (threadId: number) => void
}) {
  const { detail, onGoSales, onOpenIssue, onOpenThread } = props
  const { orderClosure, afterEnd, groupBuy, permissions } = detail
  const openIssue = afterEnd?.openIssue

  return (
    <DetailCard
      title="종료 후 남은 일"
      note={`공구 ${groupBuy.groupBuyNumber}`}
    >
      {openIssue && (
        <Notice tone="warn" className="mb-4">
          <B>이슈 스레드가 진행 중입니다.</B> 인플루언서·운영자와의 논의는{" "}
          <B>연결·소통</B>에서 이어가세요 — 이슈가 열려 있어도{" "}
          <B>공구는 종료 상태 그대로</B>이고 정산도 예정대로 진행됩니다. 정산
          보류가 필요한 사안이면 운영자가 별도로 처리합니다.
        </Notice>
      )}
      <FRow label="미종결 주문" alignCenter>
        <div className="flex items-center gap-3">
          {orderClosure ? (
            <span className="tabular-nums">
              <B className="text-sz-warning-text">
                {formatNumber(orderClosure.unclosedCount)}건
              </B>{" "}
              <span className="text-sz-n-500">
                / 전체 {formatNumber(orderClosure.totalCount)}건
              </span>
            </span>
          ) : (
            <span className="text-sz-n-500">집계 전</span>
          )}
          <Btn
            variant="primary"
            className="ml-auto shrink-0"
            onClick={onGoSales}
          >
            판매 관리에서 처리 ↗
          </Btn>
        </div>
      </FRow>
      <FRow label="인플루언서와 분쟁" alignCenter>
        <div className="flex items-center gap-3">
          {openIssue ? (
            <span className="flex flex-col gap-[3px]">
              <B className="text-sz-n-900">
                {ISSUE_TYPE_LABEL[openIssue.type]}
              </B>
              <span className="text-[11px] tabular-nums text-sz-n-500">
                {dt(openIssue.openedAt)} 등록 · 운영자 참여
              </span>
            </span>
          ) : (
            <>
              <span>콘텐츠를 안 올렸거나 리워드 금액이 다를 때</span>
              <span className="text-[11px] text-sz-n-500">
                운영자가 중재합니다
              </span>
            </>
          )}
          {openIssue
            ? openIssue.threadId !== null && (
                <Btn
                  variant="secondary"
                  className="ml-auto shrink-0"
                  onClick={() => onOpenThread(openIssue.threadId!)}
                >
                  스레드로 이동 ↗
                </Btn>
              )
            : permissions.canOpenIssue && (
                <Btn
                  variant="secondary"
                  className="ml-auto shrink-0"
                  onClick={onOpenIssue}
                >
                  이슈 스레드 열기
                </Btn>
              )}
        </div>
      </FRow>
    </DetailCard>
  )
}

function checkValue(check: FulfillmentCheck | null) {
  if (!check) {
    return { value: "확인 전", tone: "none" as const }
  }
  return check.result === "FULFILLED"
    ? { value: "이행", tone: "ok" as const }
    : { value: "미이행", tone: "bad" as const }
}

/**
 * B5 · B5a · B5f 「계약 이행 확인」 — 확인 대상은 내 의무가 아니라 상대(인플루언서)의 의무다.
 * 판단은 계약 전체에 한 번이고 되돌릴 수 없다. 미이행이면 연결·소통 3자 스레드로 넘긴다.
 */
export function FulfillmentCard(props: {
  detail: Detail
  onCheck: () => void
  onGoSettlement: () => void
  onOpenThread: (threadId: number) => void
}) {
  const { detail, onCheck, onGoSettlement, onOpenThread } = props
  const fulfillment = detail.afterEnd?.fulfillment
  if (!fulfillment) {
    return null
  }
  const { mine, theirs, dueAt, threadId, resolvedAt } = fulfillment
  const name = detail.counterparty.name
  const mineValue = checkValue(mine)
  const theirsValue = checkValue(theirs)
  const disputed =
    mine?.result === "UNFULFILLED" || theirs?.result === "UNFULFILLED"
  const bothFulfilled =
    mine?.result === "FULFILLED" && theirs?.result === "FULFILLED"

  const note = !mine
    ? "양측이 서로의 이행을 확인해야 정산이 시작됩니다"
    : mine.result === "UNFULFILLED"
      ? `미이행 제출 · ${dt(mine.checkedAt)}`
      : `확인 완료 · ${dt(mine.checkedAt)}`

  let banner
  if (!mine) {
    banner = (
      <Notice tone="warn">
        <B>인플루언서가 계약을 이행했는지 확인해 주세요.</B> 내 이행 여부는
        인플루언서가 같은 방식으로 확인합니다. 판단은{" "}
        <B>항목별이 아니라 계약 전체에 대해 한 번</B>입니다.{" "}
        <B>양측이 모두 «이행»으로 확인하면 정산이 시작</B>되고, 한쪽이라도
        «미이행»을 선택하면 <B>연결·소통에 3자 스레드</B>가 열려 인플루언서 ·
        운영자와 함께 합의하게 됩니다.
      </Notice>
    )
  } else if (disputed && resolvedAt) {
    banner = (
      <Notice tone="success">
        <B>3자 스레드에서 합의가 끝나 정산 보류가 해제되었습니다.</B> 실적이
        확정되는 대로 정산이 진행됩니다.
      </Notice>
    )
  } else if (mine.result === "UNFULFILLED") {
    banner = (
      <Notice tone="danger">
        <B>인플루언서 이행을 «미이행»으로 제출했습니다.</B> <B>연결·소통</B>에
        나 · {name} · 운영자가 참여하는 스레드가 열렸고, 제출한 내용이 첫 글로
        등록되었습니다.
        <br />
        <B>합의가 끝날 때까지 정산은 보류</B>되며 리워드 지급도 미뤄집니다.
      </Notice>
    )
  } else if (theirs?.result === "UNFULFILLED") {
    banner = (
      <Notice tone="danger">
        <B>인플루언서가 내 이행을 «미이행»으로 제출했습니다.</B>{" "}
        <B>연결·소통</B>의 3자 스레드에서 합의가 끝날 때까지 <B>정산은 보류</B>
        됩니다.
      </Notice>
    )
  } else if (bothFulfilled) {
    banner = (
      <Notice tone="success">
        <B>인플루언서 이행을 «이행»으로 확인했습니다.</B> 인플루언서도 내 이행을
        «이행»으로 확인해 <B>양측 확인이 끝났습니다</B> — 실적이 확정되는 대로
        정산이 진행됩니다.
      </Notice>
    )
  } else {
    banner = (
      <Notice tone="info">
        <B>인플루언서 이행을 «이행»으로 확인했습니다.</B> 인플루언서가 내 이행을
        확인하면 정산이 시작됩니다.
      </Notice>
    )
  }

  return (
    <DetailCard title="계약 이행 확인" note={note}>
      {banner}
      <DutyList className="mt-4">
        <DutyRow
          label={mine ? "내가 확인한 대상" : "내가 확인할 대상"}
          sub={`${name}의 의무 — ${contentDutyText(detail)}`}
          value={mineValue.value}
          valueTone={mineValue.tone}
        />
        <DutyRow
          readOnly
          label={
            theirs ? "인플루언서가 확인한 대상" : "인플루언서가 확인할 대상"
          }
          sub={`내 의무 — ${BRAND_DUTY_TEXT}`}
          value={theirsValue.value}
          valueTone={theirsValue.tone}
        />
      </DutyList>

      {!mine ? (
        <>
          {/* 시안 B5 「기한까지 답하지 않으면 이행으로 처리」는 서버 스위치가 켜졌을 때만 —
              꺼진 채 이 문구가 나가면 확인을 미뤄도 된다고 읽힌다 */}
          <Notice tone="neutral" className="mt-3">
            확인 기한은 <B>{d(dueAt)}</B>입니다.{" "}
            {fulfillment.autoConfirmOnTimeout ? (
              <>
                기한까지 답하지 않으면 <B>이행으로 처리</B>되어 정산이 자동으로
                진행됩니다 — 문제가 있다면 기한 전에 «미이행»을 선택해 주세요.
              </>
            ) : (
              "문제가 있다면 기한 전에 «미이행»을 선택해 주세요."
            )}
          </Notice>
          {detail.permissions.canCheckFulfillment && (
            <div className="mt-4 flex justify-end">
              <Btn variant="primary" onClick={onCheck}>
                계약 이행 확인
              </Btn>
            </div>
          )}
        </>
      ) : mine.result === "UNFULFILLED" ? (
        <>
          {mine.reason && (
            <Notice tone="neutral" className="mt-3">
              내가 제출한 내용 — "{mine.reason}"
            </Notice>
          )}
          {threadId !== null && (
            <div className="mt-4 flex justify-end">
              <Btn variant="secondary" onClick={() => onOpenThread(threadId)}>
                스레드로 이동 ↗
              </Btn>
            </div>
          )}
        </>
      ) : (
        <>
          <Notice tone="neutral" className="mt-3">
            이행 확인은 <B>되돌릴 수 없습니다</B>. 확인 이후 문제가 발견되면{" "}
            <B>연결·소통</B>에서 인플루언서 · 운영자와 별도로 논의해야 합니다.
          </Notice>
          <div className="mt-4 flex justify-end gap-2">
            {theirs?.result === "UNFULFILLED" && threadId !== null && (
              <Btn variant="secondary" onClick={() => onOpenThread(threadId)}>
                스레드로 이동 ↗
              </Btn>
            )}
            <Btn variant="secondary" onClick={onGoSettlement}>
              정산 관리 열기
            </Btn>
          </div>
        </>
      )}
    </DetailCard>
  )
}

/**
 * B7 · B7a 중단 사유 — 출처로 갈린다. 요청 승인(B7)이면 요청 사유와 운영자 판단,
 * 직권(B7a)이면 요청자가 없음을 먼저 밝히고 운영자의 근거를 상세히 적는다.
 */
export function ClosureReasonCard(props: { detail: Detail }) {
  const { detail } = props
  const { closure, adminSuspension, groupBuy } = detail
  if (!closure || groupBuy.status !== "SUSPENDED") {
    return null
  }

  if (closure.source === "REQUEST" && closure.requester) {
    const requester = closure.requester
    return (
      <DetailCard
        title="중단 사유"
        note={`운영자 · ${dt(closure.endedAt)} 처리`}
      >
        <FRow label="요청자">
          {requester.name}
          {requester.type === "CREATOR" && (
            <span className="text-sz-n-500"> (인플루언서)</span>
          )}
          <FSub>{dt(requester.requestedAt)} 중단 요청</FSub>
        </FRow>
        <FRow label="요청 사유">
          {requester.reasonLabel ?? requester.reasonCode}
          {requester.memo && <FSub>{requester.memo}</FSub>}
        </FRow>
        <FRow label="운영자 판단">
          승인
          {closure.decisionReason && <FSub>{closure.decisionReason}</FSub>}
        </FRow>
      </DetailCard>
    )
  }

  const clause = adminSuspension?.reasonClause
    ? SUSPENSION_CLAUSE_TEXT[adminSuspension.reasonClause]
    : null
  const basis = clause
    ? `${clause.label}(${clause.clause})`
    : adminSuspension?.emergencyReason
      ? `${EMERGENCY_REASON_LABEL[adminSuspension.emergencyReason]}(제17조③ 긴급)`
      : "—"

  return (
    <DetailCard
      title="직권 중단 사유"
      note={`운영자 · ${dt(closure.endedAt)} 처리 · 요청자 없음`}
    >
      <FRow label="처리 주체">
        운영자 직권
        <FSub>브랜드·인플루언서 요청 없이 플랫폼이 판단해 중단</FSub>
      </FRow>
      <FRow label="중단 근거">{basis}</FRow>
      <FRow label="상세 사유">{adminSuspension?.noticeBody ?? "—"}</FRow>
      <FRow label="이의 제기">
        이슈 스레드에서 가능
        <FSub>
          운영자가 참여해 답변합니다 · 재개는 새 계약 체결이 필요합니다
        </FSub>
      </FRow>
      <Notice tone="danger" className="mt-3">
        <B>직권 중단은 브랜드가 되돌릴 수 없습니다.</B> 근거에 이견이 있으면
        이슈 스레드로 제기하고, 표현을 고쳐 다시 진행하려면{" "}
        <B>새 계약을 체결</B>해야 합니다.
      </Notice>
    </DetailCard>
  )
}
