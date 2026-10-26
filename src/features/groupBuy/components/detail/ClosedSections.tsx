import DetailCard from "@/common/components/DetailCard/DetailCard"
import Notice from "@/common/components/Notice/Notice"
import Btn from "@/features/contracts/components/shared/Btn"
import { formatNumber } from "@/features/contracts/utils/format"
import { B, FRow, FSub } from "@/features/groupBuy/components/shared/GbParts"
import {
  EMERGENCY_REASON_LABEL,
  ISSUE_TYPE_LABEL,
  SUSPENSION_CLAUSE_TEXT,
} from "@/features/groupBuy/constants/params"
import { type Detail, dt } from "@/features/groupBuy/utils/view"

/**
 * B5 「종료 후 남은 일」 — 정산까지 남은 일 두 개(주문 처리 · 인플루언서 분쟁)를
 * 같은 규격의 한 줄씩으로 놓는다. rev.5에서 [이슈 스레드 열기]는 폐기됐다(분쟁 줄은 안내만) —
 * 폐기 전에 열린 이슈가 있으면 그 스레드로만 보낸다.
 */
export function AfterEndTasksCard(props: {
  detail: Detail
  onGoSales: () => void
  onOpenThread: (threadId: number) => void
}) {
  const { detail, onGoSales, onOpenThread } = props
  const { orderClosure, afterEnd, groupBuy } = detail
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
          {openIssue && openIssue.threadId !== null && (
            <Btn
              variant="secondary"
              className="ml-auto shrink-0"
              onClick={() => onOpenThread(openIssue.threadId!)}
            >
              스레드로 이동 ↗
            </Btn>
          )}
        </div>
      </FRow>
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
        <B>새 계약을 체결</B>해야 합니다. 일반 직권 중단은 집행 전에 양측에 사전
        통지됩니다.
      </Notice>
    </DetailCard>
  )
}
