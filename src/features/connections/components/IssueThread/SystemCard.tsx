import StatusBadge, {
  type StatusBadgeVariant,
} from "@/common/components/StatusBadge/StatusBadge"
import {
  COUNTERPART_LABEL,
  otherParty,
  proposalNoun,
} from "@/features/connections/components/IssueThread/issueView"
import {
  PARTY_LABEL,
  VIEWER_PARTY,
} from "@/features/connections/constants/params"
import type { AdjustmentView } from "@/features/connections/services/adjustmentService"
import type { MessageItem } from "@/features/connections/services/threadService"
import {
  formatDateTime,
  formatDeadline,
  formatDeadlineTime,
  formatDelta,
  formatWon,
} from "@/features/connections/utils/format"
import Btn from "@/features/contracts/components/shared/Btn"
import { FLINK_CLASS } from "@/features/contracts/components/shared/styles"
import type { ReactNode } from "react"
import { Link } from "react-router-dom"

/** 카드의 응답 버튼 — 어느 제안에 답하는지 함께 올린다. WITHDRAW는 요청한 쪽의 [요청 철회](기-14) */
export type AdjustmentResponse = "ACCEPT" | "COUNTER" | "REJECT" | "WITHDRAW"

/** 시안 `.sysbar` — 가운데 회색 띠(개설 · 종결 안내) */
export function SysBar(props: { children: ReactNode }) {
  return (
    <div className="self-stretch rounded-[6px] bg-sz-n-100 px-3 py-2 text-center text-[11px] leading-[1.6] text-sz-n-500 [&_b]:text-sz-n-700">
      {props.children}
    </div>
  )
}

/** 시안 `.res` — 절차 카드(머리 배지 + 행 + 버튼 줄) */
function ResCard(props: {
  badge: string
  badgeVariant?: StatusBadgeVariant
  head: ReactNode
  children?: ReactNode
  footer?: ReactNode
}) {
  return (
    <div className="self-stretch rounded-[8px] border border-sz-n-200 bg-white px-4 py-3.5">
      <div className="mb-[9px] flex items-center gap-2 text-[12px] font-semibold text-sz-n-900">
        <StatusBadge variant={props.badgeVariant ?? "neutral"}>
          {props.badge}
        </StatusBadge>
        <span className="min-w-0">{props.head}</span>
      </div>
      {props.children}
      {props.footer && (
        <div className="mt-2.5 flex items-center justify-end gap-2 border-t border-sz-n-100 pt-2.5">
          {props.footer}
        </div>
      )}
    </div>
  )
}

function ResRow(props: { label: string; children: ReactNode }) {
  return (
    <div className="flex gap-2.5 py-[5px] text-[12px]">
      <span className="w-[84px] shrink-0 text-sz-n-600">{props.label}</span>
      <span className="flex-1 leading-[1.6] text-sz-n-900">
        {props.children}
      </span>
    </div>
  )
}

function Sub(props: { children: ReactNode }) {
  return (
    <span className="mt-[3px] block text-[11px] text-sz-n-500">
      {props.children}
    </span>
  )
}

/**
 * 시스템 카드 — 절차의 기록. 정산 조정 카드 8종은 시안 ui-partner-14 그대로 그리고,
 * 계약 카드(재발송 요청 · 직권 취소)는 1:1 스레드에 한 줄 띠로 남긴다.
 *
 * 응답 버튼은 **가장 최근 요청 카드에만** 있다 — 서버 `action.respondable`과 고정 카드의
 * `permissions`(동의 · 다른 금액 제안 · 반대 중 무엇이 되는지)를 함께 본다. 이전 카드는 응답 결과로 굳는다.
 */
export default function SystemCard(props: {
  message: MessageItem
  view: AdjustmentView | null
  pendingResponse: boolean
  onRespond: (response: AdjustmentResponse, proposalId: number) => void
}) {
  const { message, view, pendingResponse, onRespond } = props
  const card = message.card

  if (!card) {
    return message.content ? <SysBar>{message.content}</SysBar> : null
  }

  const adjustment = card.detail?.adjustment ?? {}
  const original =
    adjustment.originalRewardAmount ?? view?.originalRewardAmount ?? null

  switch (card.cardType) {
    case "SETTLEMENT_ADJUSTMENT_OPENED": {
      const requester = view?.requesterType ?? adjustment.proposerType
      const deadline = adjustment.deadlineAt ?? view?.deadlineAt
      return (
        <SysBar>
          <b>
            {requester && requester !== VIEWER_PARTY
              ? `${PARTY_LABEL[requester]}의 정산 조정 요청으로 이슈 스레드가 열렸습니다.`
              : "정산 조정 요청으로 이슈 스레드가 열렸습니다."}
          </b>{" "}
          이 공구 정산이 전액 보류됩니다
          {deadline && (
            <>
              {" "}
              · 합의 기한 <b>{formatDeadline(deadline)}</b>(10영업일)까지 합의가
              없으면 <b>원래 금액</b>으로 확정됩니다
            </>
          )}
        </SysBar>
      )
    }

    case "SETTLEMENT_ADJUSTMENT_REQUEST":
    case "SETTLEMENT_ADJUSTMENT_COUNTER": {
      const isCounter = card.cardType === "SETTLEMENT_ADJUSTMENT_COUNTER"
      const noun = isCounter ? "제안" : "요청"
      const proposerName =
        adjustment.proposerName ??
        (adjustment.proposerType ? PARTY_LABEL[adjustment.proposerType] : "")
      const isLatest =
        view !== null &&
        adjustment.proposalId !== undefined &&
        view.latestProposal.proposalId === adjustment.proposalId
      const canRespond =
        card.action?.respondable === true && isLatest && view !== null

      let footer: ReactNode = null
      if (canRespond && adjustment.proposalId !== undefined) {
        const proposalId = adjustment.proposalId
        const { canAccept, canCounter, canReject } = view.permissions
        footer = (
          <>
            {canReject && (
              <Btn
                variant="secondary"
                disabled={pendingResponse}
                onClick={() => onRespond("REJECT", proposalId)}
              >
                반대
              </Btn>
            )}
            {canCounter && (
              <Btn
                variant="secondary"
                disabled={pendingResponse}
                onClick={() => onRespond("COUNTER", proposalId)}
              >
                다른 금액 제안
              </Btn>
            )}
            {canAccept && (
              <Btn
                variant="primary"
                disabled={pendingResponse}
                onClick={() => onRespond("ACCEPT", proposalId)}
              >
                동의
              </Btn>
            )}
          </>
        )
      } else if (card.action?.state === "PENDING") {
        // 시안 T1 — 철회 가능 여부는 서버 판정(처음 요청한 쪽 ∧ 최신 제안이 내 것 ∧ 응답 대기)
        const canWithdraw = isLatest && view?.permissions.canWithdraw === true
        footer =
          adjustment.proposerType === VIEWER_PARTY ? (
            <div className="flex flex-1 items-center justify-between gap-2">
              <span className="text-[11px] text-sz-n-500 [&_b]:text-sz-n-700">
                {COUNTERPART_LABEL} 응답을 기다리고 있습니다
                {canWithdraw && (
                  <>
                    {" "}
                    · 철회하면 <b>원래 금액으로 바로 확정</b>됩니다
                  </>
                )}
              </span>
              <span className="flex shrink-0 items-center gap-2">
                <StatusBadge variant="info">응답 대기</StatusBadge>
                {canWithdraw && adjustment.proposalId !== undefined && (
                  <Btn
                    variant="secondary"
                    disabled={pendingResponse}
                    onClick={() =>
                      adjustment.proposalId !== undefined &&
                      onRespond("WITHDRAW", adjustment.proposalId)
                    }
                  >
                    요청 철회
                  </Btn>
                )}
              </span>
            </div>
          ) : (
            <StatusBadge variant="info">응답 대기</StatusBadge>
          )
      } else if (card.action?.resultLabel) {
        footer = (
          <StatusBadge variant="neutral">{card.action.resultLabel}</StatusBadge>
        )
      }

      return (
        <ResCard
          badge={isCounter ? "다른 금액 제안" : "조정 요청"}
          head={`${proposerName} ${noun} · ${formatDateTime(message.createdAt)}`}
          footer={footer}
        >
          {adjustment.rewardAmount !== undefined && (
            <ResRow label={`${noun} 금액`}>
              리워드{" "}
              <b className="tabular-nums">
                {original !== null && `${formatWon(original)} → `}
                {formatWon(adjustment.rewardAmount)}
              </b>
              {original !== null && (
                <Sub>{formatDelta(adjustment.rewardAmount - original)}</Sub>
              )}
            </ResRow>
          )}
          {adjustment.reason && (
            <ResRow label="사유">{adjustment.reason}</ResRow>
          )}
        </ResCard>
      )
    }

    case "SETTLEMENT_ADJUSTMENT_ACCEPTED":
    case "SETTLEMENT_ADJUSTMENT_REJECTED": {
      const isAccepted = card.cardType === "SETTLEMENT_ADJUSTMENT_ACCEPTED"
      const verb = isAccepted ? "동의" : "반대"
      const responderName =
        adjustment.responderName ??
        (adjustment.responderType ? PARTY_LABEL[adjustment.responderType] : "")
      return (
        <ResCard
          badge={verb}
          head={`${responderName} ${verb} · ${formatDateTime(
            adjustment.respondedAt ?? message.createdAt
          )}`}
        >
          <ResRow label="결과">
            {isAccepted ? (
              adjustment.rewardAmount !== undefined ? (
                // 「○○ 브랜드 제안 1,591,512원에 동의」 — 동의한 제안은 상대가 낸 것이다
                <>
                  {view?.proposals.find(
                    proposal => proposal.proposalId === adjustment.proposalId
                  )?.proposerName ??
                    (adjustment.responderType
                      ? PARTY_LABEL[otherParty(adjustment.responderType)]
                      : "")}{" "}
                  {proposalNoun(adjustment.seq)}{" "}
                  <b className="tabular-nums">
                    {formatWon(adjustment.rewardAmount)}
                  </b>
                  에 동의
                </>
              ) : (
                "요청 금액에 동의"
              )
            ) : (
              "요청 금액에 반대 · 협의는 합의 기한까지 이어집니다"
            )}
          </ResRow>
        </ResCard>
      )
    }

    case "SETTLEMENT_ADJUSTMENT_DEADLINE_NOTICE": {
      const deadline = adjustment.deadlineAt ?? view?.deadlineAt
      return (
        <ResCard badge="시스템" head="합의 기한 D-1 안내">
          <ResRow label="안내">
            {deadline ? `${formatDeadlineTime(deadline)}까지 ` : "기한까지 "}
            합의가 없으면 원래 금액으로 확정됩니다.
          </ResRow>
        </ResCard>
      )
    }

    case "SETTLEMENT_ADJUSTMENT_AGREED": {
      const final =
        adjustment.finalRewardAmount ??
        view?.finalRewardAmount ??
        view?.agreedRewardAmount ??
        null
      const agreedBy = adjustment.agreedByType
      const accepted = view?.proposals.find(
        proposal => proposal.status === "ACCEPTED"
      )
      const closedAt = adjustment.closedAt ?? view?.closedAt ?? null
      return (
        <ResCard badge="합의 완료" head="정산 금액 변경 · 이슈 종결">
          {final !== null && (
            <ResRow label="확정 금액">
              리워드 <b className="tabular-nums">{formatWon(final)}</b>
              {original !== null && <Sub>원래 {formatWon(original)}</Sub>}
            </ResRow>
          )}
          {agreedBy && (
            <ResRow label="합의">
              {PARTY_LABEL[otherParty(agreedBy)]} {proposalNoun(accepted?.seq)}
              에 {PARTY_LABEL[agreedBy]} 동의
              {closedAt && ` · ${formatDateTime(closedAt)}`}
            </ResRow>
          )}
          <ResRow label="정산">보류 해제 · 정산 관리에 바로 반영</ResRow>
        </ResCard>
      )
    }

    case "SETTLEMENT_ADJUSTMENT_WITHDRAWN": {
      // 시안에 결과 카드가 없다 — 만료 카드와 같은 틀에 「요청 철회」로 적는다(1021 기-14)
      const final = adjustment.finalRewardAmount ?? original
      const withdrawnBy = adjustment.agreedByType
      const closedAt = adjustment.closedAt ?? view?.closedAt ?? null
      return (
        <ResCard badge="요청 철회" head="원래 금액 확정 · 이슈 종결">
          {final !== null && (
            <ResRow label="확정 금액">
              리워드 <b className="tabular-nums">{formatWon(final)}</b>
              <Sub>원래 계약 금액</Sub>
            </ResRow>
          )}
          {withdrawnBy && (
            <ResRow label="철회">
              {PARTY_LABEL[withdrawnBy]} 요청 철회
              {closedAt && ` · ${formatDateTime(closedAt)}`}
            </ResRow>
          )}
          <ResRow label="정산">보류 해제 · 정산 관리에 바로 반영</ResRow>
        </ResCard>
      )
    }

    case "SETTLEMENT_ADJUSTMENT_EXPIRED": {
      const final = adjustment.finalRewardAmount ?? original
      return (
        <ResCard badge="기한 만료" head="원래 금액 확정 · 이슈 종결">
          {final !== null && (
            <ResRow label="확정 금액">
              리워드 <b className="tabular-nums">{formatWon(final)}</b>
              <Sub>원래 계약 금액</Sub>
            </ResRow>
          )}
          <ResRow label="정산">보류 해제 · 정산 관리에 바로 반영</ResRow>
        </ResCard>
      )
    }

    case "ACCOUNT_SUSPENDED": {
      // 시안 15 S7 — 운영팀 채널의 정지 카드. 소명은 별도 폼 없이 이 카드 아래 일반 답글로 받는다
      const sanction = card.detail?.sanction ?? {}
      return (
        <ResCard
          badge="계정 이용 정지"
          badgeVariant="danger"
          head={`시스템 · ${formatDateTime(card.detail?.processedAt ?? message.createdAt)}`}
          footer={
            <div className="flex flex-1 items-center justify-between gap-2">
              <span className="text-[11px] text-sz-n-500">
                이 카드 아래에 답글로 소명해 주세요
              </span>
              {sanction.payoutHeld && (
                <Link to="/store/basic?tab=settlement" className={FLINK_CLASS}>
                  정산 계좌 변경 요청
                </Link>
              )}
            </div>
          }
        >
          <ResRow label="사유">
            {sanction.reasonLabel ?? card.detail?.reasonLabel ?? "—"}
          </ResRow>
          {sanction.reasonDetail && (
            <ResRow label="상세 사유">{sanction.reasonDetail}</ResRow>
          )}
          {/* 1021 이후 카드에만 있는 값 — 배너(S1)와 같은 표기 */}
          {sanction.endsOn && (
            <ResRow label="정지 기간">
              ~ {formatDeadline(sanction.endsOn)}
              {sanction.periodDays != null && `(${sanction.periodDays}일)`}
              {sanction.autoReleaseAt &&
                ` · 자동 해제일 ${formatDeadline(sanction.autoReleaseAt)}`}
            </ResRow>
          )}
          {sanction.appealDeadlineAt && (
            <ResRow label="이의 신청 기한">
              {formatDeadline(sanction.appealDeadlineAt)}까지
            </ResRow>
          )}
          <ResRow label="차단">
            상품 등록 · 새 계약 등록 · 인플루언서 연결 요청 · 공구 개설 신청 ·
            오픈 전 공구의 오픈
          </ResRow>
          <ResRow label="계속 이용">
            진행 중 공구 판매 · 주문 처리 · 상품 문의 답변 · 기본정보 수정 ·
            소통 스레드 · 정산 조회
          </ResRow>
          <ResRow label="정산">
            확정까지 진행되며, 브랜드 몫은 정지가 풀리면 다음 영업일에
            지급됩니다.
          </ResRow>
        </ResCard>
      )
    }

    case "ACCOUNT_SUSPENSION_RELEASED": {
      const sanction = card.detail?.sanction ?? {}
      return (
        <ResCard
          badge="정지 해제"
          badgeVariant="success"
          head={`시스템 · ${formatDateTime(card.detail?.processedAt ?? message.createdAt)}`}
        >
          <ResRow label="사유">
            {sanction.reasonLabel ?? card.detail?.reasonLabel ?? "—"}
          </ResRow>
          {sanction.reasonDetail && (
            <ResRow label="메모">{sanction.reasonDetail}</ResRow>
          )}
        </ResCard>
      )
    }

    case "CONTRACT_CLOSE_CONSENT_REQUEST":
    case "CONTRACT_TERMINATED": {
      // 기-05 · 06 — 동의는 버튼이 아니라 이 카드 아래 답글로 받는다(운영자가 확인)
      const notice = card.detail?.notice ?? {}
      const isResult = card.cardType === "CONTRACT_TERMINATED"
      return (
        <ResCard
          badge={isResult ? "계약 해지" : card.title}
          head={`시스템 · ${formatDateTime(message.createdAt)}`}
          footer={
            isResult ? undefined : (
              <span className="flex-1 text-[11px] text-sz-n-500">
                동의 여부는 이 카드 아래 답글로 남겨 주세요
              </span>
            )
          }
        >
          <ResRow label="계약">
            {[card.contractNumber, card.groupBuyTitle]
              .filter(Boolean)
              .join(" · ") || "—"}
          </ResRow>
          {notice.body && (
            <ResRow label={isResult ? "설명" : "요청 내용"}>
              {notice.body}
            </ResRow>
          )}
          {isResult && notice.groupBuyClosed != null && (
            <ResRow label="공구">
              {notice.groupBuyClosed
                ? `생성된 공구${notice.groupBuyNumber ? `(${notice.groupBuyNumber})` : ""}도 함께 종료됐습니다`
                : "생성된 공구가 없습니다"}
            </ResRow>
          )}
        </ResCard>
      )
    }

    case "GROUP_BUY_SUSPENSION_NOTICE": {
      // 기-21 — 직권 중단 사전 통지 · 소명 요청. 양측에 같은 기한으로 가고, 의견은 답글로 받는다
      const notice = card.detail?.notice ?? {}
      return (
        <ResCard
          badge={card.title}
          badgeVariant="warning"
          head={`시스템 · ${formatDateTime(message.createdAt)}`}
          footer={
            <span className="flex-1 text-[11px] text-sz-n-500">
              소명 · 의견은 이 카드 아래 답글로 남겨 주세요
            </span>
          }
        >
          {card.groupBuyTitle && (
            <ResRow label="공구">
              {[notice.groupBuyNumber, card.groupBuyTitle]
                .filter(Boolean)
                .join(" · ")}
            </ResRow>
          )}
          {notice.reasonClauseLabel && (
            <ResRow label="근거">{notice.reasonClauseLabel}</ResRow>
          )}
          {notice.body && <ResRow label="통지 내용">{notice.body}</ResRow>}
          {notice.executeScheduledAt && (
            <ResRow label="집행 예정">
              {formatDeadlineTime(notice.executeScheduledAt)}
            </ResRow>
          )}
          {notice.appealDeadlineAt && (
            <ResRow label="소명 기한">
              {formatDeadlineTime(notice.appealDeadlineAt)}까지
            </ResRow>
          )}
          {notice.counterpartyName && notice.counterpartyType && (
            <ResRow label="상대 통지">
              {PARTY_LABEL[notice.counterpartyType]}({notice.counterpartyName}
              )에도 같은 통지가 갔습니다
            </ResRow>
          )}
        </ResCard>
      )
    }

    default:
      // 계약 카드 — 1:1 스레드의 절차 기록. 처리는 계약 관리에서 한다
      return (
        <SysBar>
          <b>{card.title}</b>
          {[card.contractNumber, card.groupBuyTitle].some(Boolean) &&
            ` · ${[card.contractNumber, card.groupBuyTitle]
              .filter(Boolean)
              .join(" ")}`}
        </SysBar>
      )
  }
}
