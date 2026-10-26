import DetailCard, { MetaRow } from "@/common/components/DetailCard/DetailCard"
import StatusBadge from "@/common/components/StatusBadge/StatusBadge"
import {
  formatDateTimeShort,
  parseServerDateTime,
} from "@/common/utils/formatDate"
import Btn from "@/features/contracts/components/shared/Btn"
import { FLINK_CLASS } from "@/features/contracts/components/shared/styles"
import {
  CANCEL_CONSENT_PHRASE,
  NO_CLAWBACK_TEXT,
  TERMINATION_HANDLER_PHRASE,
} from "@/features/contracts/constants/provisional"
import { SIGNATURE_DEADLINE_DAYS_BEFORE_START } from "@/features/contracts/constants/rules"
import { DEADLINE_PAUSED_NOTE } from "@/features/contracts/constants/suspension"
import type { ContractDetailResponse } from "@/features/contracts/types"
import {
  CLOSED_VIEWS,
  CONCLUDED_VIEWS,
  type ContractViewState,
} from "@/features/contracts/utils/contractView"
import { formatKRW } from "@/features/contracts/utils/format"
import { concludedAt } from "@/features/contracts/utils/contractView"
import {
  contractStatusLabel,
  toneToVariant,
} from "@/features/contracts/utils/statusBadge"
import { SanctionHoldBadge, SUSPENSION_COPY } from "@/features/suspension"
import type { ReactNode } from "react"

interface StatusSideCardProps {
  detail: ContractDetailResponse
  view: ContractViewState
  isRecordingPayment: boolean
  isDuplicating: boolean
  isWithdrawingTermination: boolean
  onOpenDocument: (
    type: "GENERATED_DRAFT" | "SIGNED_PDF" | "AUDIT_TRAIL"
  ) => void
  onContactAdmin: () => void
  onRecordPayment: () => void
  onOpenGroupBuy: () => void
  onDuplicate: () => void
  onOpenThread: () => void
  onRequestTermination: () => void
  onWithdrawTermination: () => void
  /** 계정 이용 정지 — [이 조건으로 새 계약 작성]은 새 계약의 시작이라 비활성 + 툴팁(시안 15 S4) */
  suspended?: boolean
}

/**
 * 우측 「상태」 카드 — 배지 + 메타 행 + 액션 + 안내. 레이아웃은 고정이고 표시 항목만 상태별로 갈린다.
 * 버튼은 서버 `permissions`가 정한다 — 상태 조합으로 다시 판정하지 않는다.
 */
export default function StatusSideCard(props: StatusSideCardProps) {
  const {
    detail,
    view,
    isRecordingPayment,
    isDuplicating,
    isWithdrawingTermination,
    onOpenDocument,
    onContactAdmin,
    onRecordPayment,
    onOpenGroupBuy,
    onDuplicate,
    onOpenThread,
    onRequestTermination,
    onWithdrawTermination,
    suspended = false,
  } = props
  const {
    review,
    signature,
    fixedFee,
    closure,
    groupBuy,
    permissions,
    documents,
  } = detail
  const hint = hintByView(view, detail)
  const isConcluded = CONCLUDED_VIEWS.includes(view)
  const isClosed = CLOSED_VIEWS.includes(view)
  const hasDraft = documents.some(doc => doc.type === "GENERATED_DRAFT")

  const time = (value: string | null) => (
    <span className="tabular-nums">{formatDateTimeShort(value)}</span>
  )
  const draftLink = (
    <MetaRow
      label="계약서"
      value={
        hasDraft ? (
          <button
            type="button"
            className={FLINK_CLASS}
            onClick={() => onOpenDocument("GENERATED_DRAFT")}
          >
            제출본 보기
          </button>
        ) : (
          <span className="font-normal text-sz-n-500">생성 전</span>
        )
      }
    />
  )
  const fee = (
    <MetaRow label="고정 지급비" value={formatKRW(fixedFee.amount ?? 0)} />
  )
  // 정지 보류 중이면 기한이 멈춰 있다 — 기본값 설명 대신 그 사실을 적는다(서버 signatureDeadlinePaused)
  const deadlinePausedNote = detail.signatureDeadlinePaused
    ? DEADLINE_PAUSED_NOTE[
        detail.sanctionHold?.kind === "COUNTERPARTY" ? "COUNTERPARTY" : "MINE"
      ]
    : null
  const deadline = (label: string) => (
    <MetaRow
      label={label}
      value={
        <span className="tabular-nums">
          {formatDateTimeShort(signature.deadlineAt)}
          {signature.deadlineAt && (
            <span className="block text-[10.5px] font-normal text-sz-n-500">
              {deadlinePausedNote ??
                deadlineNote(signature.deadlineAt, detail.period.startAt)}
            </span>
          )}
        </span>
      }
    />
  )
  // 처리 대기 해지 요청 — 시안에 없는 중간 상태라(C9 「처리 전까지 체결완료 유지」) 메타 한 줄로만 알린다
  const pendingTermination =
    detail.terminationRequest?.status === "PENDING" ? (
      <MetaRow
        label="해지 요청"
        value={`${detail.terminationRequest.statusLabel} · ${formatDateTimeShort(detail.terminationRequest.requestedAt)}`}
      />
    ) : null

  const rows: ReactNode = (() => {
    switch (view) {
      case "reviewPending":
        return (
          <>
            <MetaRow label="검토 요청" value={time(review.requestedAt)} />
            <MetaRow label="검토 상태" value="어드민 확인 중" />
            {fee}
            {draftLink}
          </>
        )
      case "reviewRejected":
        return (
          <>
            <MetaRow label="검토 요청" value={time(review.requestedAt)} />
            <MetaRow label="반려 처리" value={time(review.rejectedAt)} />
            {fee}
            {/* 반려 상태는 제출본을 보여주지 않는다(2026-09-26 기획 결정) — 「생성 전」도 사실과 달라 줄째 뺀다 */}
          </>
        )
      case "signingNone":
      case "signingMine":
      case "signingTheirs":
        return (
          <>
            <MetaRow label="검토 통과" value={time(review.approvedAt)} />
            <MetaRow
              label="서명 요청 발송"
              value={time(signature.requestedAt)}
            />
            {view === "signingMine" && (
              <MetaRow label="내 서명" value={time(signature.brandSignedAt)} />
            )}
            {view === "signingTheirs" && (
              <MetaRow
                label="상대 서명"
                value={time(signature.creatorSignedAt)}
              />
            )}
            {deadline("서명 기한")}
            {fee}
            {draftLink}
          </>
        )
      case "conclusionPending":
        return (
          <>
            <MetaRow
              label="서명 요청 발송"
              value={time(signature.requestedAt)}
            />
            <MetaRow
              label="브랜드 서명"
              value={time(signature.brandSignedAt)}
            />
            <MetaRow
              label="인플루언서 서명"
              value={time(signature.creatorSignedAt)}
            />
            {fee}
            {draftLink}
            {pendingTermination}
          </>
        )
      case "concludedNoFee":
      case "concludedPaid":
      case "concludedFeeDue":
        return (
          <>
            <MetaRow label="체결일시" value={time(concludedAt(detail))} />
            <MetaRow
              label="서명 PDF"
              value={
                <DocLink
                  available={documents.some(d => d.type === "SIGNED_PDF")}
                  onClick={() => onOpenDocument("SIGNED_PDF")}
                />
              }
            />
            <MetaRow
              label="감사추적인증서"
              value={
                <DocLink
                  available={documents.some(d => d.type === "AUDIT_TRAIL")}
                  onClick={() => onOpenDocument("AUDIT_TRAIL")}
                />
              }
            />
            <MetaRow
              label="고정 지급비"
              value={
                view === "concludedNoFee"
                  ? "없음"
                  : view === "concludedPaid"
                    ? "지급 완료 기록됨"
                    : "지급 예정 · 브랜드 직접"
              }
            />
            <MetaRow
              label="연결된 공구"
              value={
                groupBuy.groupBuyId !== null ? (
                  <button
                    type="button"
                    className={FLINK_CLASS}
                    onClick={onOpenGroupBuy}
                  >
                    {detail.title ?? "공구"} ↗
                  </button>
                ) : (
                  <span className="font-normal text-sz-n-500">없음</span>
                )
              }
            />
            {pendingTermination}
          </>
        )
      case "declined":
        return (
          <>
            <MetaRow label="검토 요청" value={time(review.requestedAt)} />
            <MetaRow label="거절일시" value={time(closure.closedAt)} />
            <MetaRow label="고정 지급비" value="지급 의무 소멸" />
            <MetaRow
              label="연결 상태"
              value={
                detail.counterparty.connectionId !== null
                  ? "연결됨 유지"
                  : "연결 없음"
              }
            />
          </>
        )
      case "expired":
        return (
          <>
            <MetaRow label="검토 요청" value={time(review.requestedAt)} />
            {/* 시안 B7 — 브랜드가 서명한 뒤 만료됐으면 남은 쪽은 상대다 */}
            {deadline(
              signature.brandSignedAt && !signature.creatorSignedAt
                ? "상대 서명 기한"
                : "서명 기한"
            )}
            <MetaRow label="만료 처리" value={time(closure.closedAt)} />
            <MetaRow label="고정 지급비" value="지급 의무 소멸" />
            <MetaRow
              label="연결 상태"
              value={
                detail.counterparty.connectionId !== null
                  ? "연결됨 유지"
                  : "연결 없음"
              }
            />
          </>
        )
      case "canceled":
        return (
          <>
            <MetaRow label="검토 요청" value={time(review.requestedAt)} />
            <MetaRow label="취소일시" value={time(closure.closedAt)} />
            <MetaRow
              label="상대 서명"
              value={
                signature.creatorSignedAt
                  ? time(signature.creatorSignedAt)
                  : "없음"
              }
            />
            <MetaRow label="고정 지급비" value="지급 의무 소멸" />
            <MetaRow
              label="연결 상태"
              value={
                detail.counterparty.connectionId !== null
                  ? "연결됨 유지"
                  : "연결 없음"
              }
            />
          </>
        )
      case "terminated":
        return (
          <>
            {/* 성립 일시는 main 필드 — 개발 서버 응답엔 없어 줄째 뺀다 */}
            {detail.establishedAt && (
              <MetaRow label="계약 성립" value={time(detail.establishedAt)} />
            )}
            <MetaRow label="해지일시" value={time(closure.closedAt)} />
            <MetaRow
              label="연결된 공구"
              value={groupBuy.groupBuyId !== null ? "오픈 전 종결" : "없음"}
            />
            <MetaRow label="고정 지급비" value="지급 의무 소멸" />
            <MetaRow
              label="연결 상태"
              value={
                detail.counterparty.connectionId !== null
                  ? "연결됨 유지"
                  : "연결 없음"
              }
            />
          </>
        )
      case "draft":
        return null
    }
  })()

  const isSigningPhase =
    view === "signingNone" ||
    view === "signingMine" ||
    view === "signingTheirs" ||
    view === "conclusionPending"

  return (
    <DetailCard title="상태">
      <div className="flex items-center justify-between gap-2.5 border-b border-sz-n-100 pb-3">
        <span className="shrink-0 text-[12px] text-sz-n-500">현재 상태</span>
        {/* 시안 15 S4b · R1 — 정지 보류는 상태 옆 보조 배지(문구 · 색은 서버) */}
        <span className="inline-flex flex-wrap justify-end gap-1">
          <StatusBadge variant={toneToVariant(detail.statusTone)}>
            {contractStatusLabel(detail.status, detail.statusLabel)}
          </StatusBadge>
          <SanctionHoldBadge hold={detail.sanctionHold} />
        </span>
      </div>
      <div className="pt-2">{rows}</div>

      {(isSigningPhase || isConcluded || isClosed) && (
        <div className="mt-4 flex flex-col gap-2">
          {isSigningPhase && (
            <Btn
              variant="secondary"
              className="w-full"
              onClick={onContactAdmin}
            >
              어드민에 문의
            </Btn>
          )}
          {permissions.canRecordPayment && (
            <Btn
              variant="primary"
              className="w-full"
              isLoading={isRecordingPayment}
              onClick={onRecordPayment}
            >
              지급 완료 기록
            </Btn>
          )}
          {isConcluded && (
            <Btn
              variant="secondary"
              className="w-full"
              onClick={onOpenGroupBuy}
            >
              공구 관리에서 보기 ↗
            </Btn>
          )}
          {/* 기-05 — main 필드라 개발 서버 응답엔 없고(undefined) 그때는 그리지 않는다 */}
          {permissions.canRequestTermination === true && (
            <Btn
              variant="ghost"
              className="w-full"
              onClick={onRequestTermination}
            >
              해지 요청
            </Btn>
          )}
          {permissions.canWithdrawTermination === true && (
            <Btn
              variant="ghost"
              className="w-full"
              isLoading={isWithdrawingTermination}
              onClick={onWithdrawTermination}
            >
              요청 철회
            </Btn>
          )}
          {isClosed && permissions.canDuplicate && (
            <Btn
              variant="primary"
              className="w-full"
              isLoading={isDuplicating}
              disabled={suspended}
              title={suspended ? SUSPENSION_COPY.blockedTooltip : undefined}
              onClick={onDuplicate}
            >
              이 조건으로 새 계약 작성
            </Btn>
          )}
          {isClosed && detail.counterparty.connectionId !== null && (
            <Btn variant="secondary" className="w-full" onClick={onOpenThread}>
              스레드에서 협의하기
            </Btn>
          )}
        </div>
      )}

      {hint && (
        <p className="mt-2.5 text-[11px] leading-[1.55] text-sz-n-500">
          {hint}
        </p>
      )}
    </DetailCard>
  )
}

function DocLink(props: { available: boolean; onClick: () => void }) {
  const { available, onClick } = props
  return available ? (
    <button type="button" className={FLINK_CLASS} onClick={onClick}>
      다운로드
    </button>
  ) : (
    <span className="font-normal text-sz-n-500">업로드 전</span>
  )
}

function hintByView(
  view: ContractViewState,
  detail: ContractDetailResponse
): ReactNode {
  switch (view) {
    // 시안 B3c·B3d 상태 카드엔 하단 안내가 없다 — 서명 진행 카드의 notice가 같은 말을 한다
    case "reviewPending":
    case "reviewRejected":
      return null
    case "signingNone":
    case "signingMine":
    case "signingTheirs":
    case "conclusionPending":
      return (
        <>
          <b className="font-semibold">
            검토 통과 이후에는 브랜드가 계약을 취소할 수 없습니다.
          </b>{" "}
          중단해야 할 사정이 생기면 어드민에 문의하세요 — 취소는{" "}
          <b className="font-semibold">어드민 직권</b>으로만 처리되며,{" "}
          <b className="font-semibold">{CANCEL_CONSENT_PHRASE}</b> 처리됩니다.
          기한까지 서명하지 않으면 <b className="font-semibold">만료</b>됩니다.
        </>
      )
    case "concludedNoFee":
    case "concludedFeeDue":
    case "concludedPaid":
      return concludedHint(view, detail)
    case "declined":
      return (
        <>
          거절은 <b className="font-semibold">계약만 종결</b>시킵니다. 연결이
          끊기지는 않으니 스레드에서 조건을 다시 협의할 수 있습니다.
        </>
      )
    case "expired":
      return (
        <>
          만료는 <b className="font-semibold">계약만 종결</b>시킵니다. 같은
          조건으로 다시 검토를 요청하면 서명 기한이 새로 계산됩니다.
        </>
      )
    case "canceled":
      return (
        <>
          검토 통과 이후 취소는 <b className="font-semibold">어드민 직권</b>
          으로만 처리됩니다. 조건을 고쳐 다시 진행하려면{" "}
          <b className="font-semibold">새 계약을 작성</b>해 주세요.
        </>
      )
    case "terminated":
      return (
        <>
          <b className="font-semibold">해지는 {TERMINATION_HANDLER_PHRASE}</b>
          합니다. 공구가 오픈된 뒤에는 해지가 아니라 공구 관리의{" "}
          <b className="font-semibold">중단 요청</b>을 이용하세요.
        </>
      )
    case "draft":
      return null
  }
}

/**
 * 서명 기한 부가 문구(기-07) — 기한은 운영자가 확인해 모두싸인에 넣은 값이다.
 * 기본값(공구 시작 3일 전)과 같은 날이면 그 사실도 밝힌다.
 */
function deadlineNote(deadlineAt: string, startAt: string | null) {
  const isDefault =
    !!startAt &&
    parseServerDateTime(startAt)
      .startOf("day")
      .diff(parseServerDateTime(deadlineAt).startOf("day"), "day") ===
      SIGNATURE_DEADLINE_DAYS_BEFORE_START
  return isDefault
    ? `공구 시작 ${SIGNATURE_DEADLINE_DAYS_BEFORE_START}일 전 · 운영자 확인`
    : "운영자 확인"
}

/**
 * 체결완료 3종의 안내 — 시안은 공구 생성 여부로 문구가 갈린다.
 * B5(공구 없음) · B5a(공구 있음 + 지급 기록) · B5b(공구 있음 + 지급 예정).
 */
function concludedHint(
  view: ContractViewState,
  detail: ContractDetailResponse
): ReactNode {
  const hasGroupBuy = detail.groupBuy.groupBuyId !== null
  const paid = view === "concludedPaid"
  const paidText = (
    <>
      {" "}
      고정 지급비는 계약서에 적은 지급 시점(
      <b className="font-semibold">{detail.fixedFee.triggerLabel}</b>)에{" "}
      <b className="font-semibold">브랜드가 직접 지급</b>했습니다. 플랫폼은
      지급을 확인·보증하지 않습니다. {NO_CLAWBACK_TEXT}
    </>
  )
  if (!hasGroupBuy) {
    return (
      <>
        양측 서명으로 <b className="font-semibold">계약이 성립</b>하면 어드민이
        확인해 <b className="font-semibold">공구를 생성</b>합니다(계약 1건당
        1건). 공구는 이 계약의 기간·공구가·리워드율을 그대로 상속합니다.
        {paid
          ? paidText
          : view === "concludedFeeDue" && (
              <>
                {" "}
                고정 지급비는 계약서에 적은 지급 시점에{" "}
                <b className="font-semibold">브랜드가 직접</b> 지급합니다.
              </>
            )}
        {detail.permissions.canRequestTermination === true && (
          <>
            {" "}
            공구 오픈 전에 계약을 끝내야 하면{" "}
            <b className="font-semibold">[해지 요청]</b>을 보내 주세요 —
            운영자가 확인해 처리합니다.
          </>
        )}
      </>
    )
  }
  return (
    <>
      공구가 이미 생성돼 있어{" "}
      <b className="font-semibold">추가로 만들 수 없습니다</b>(계약 1건당 공구
      1건).
      {paid ? (
        paidText
      ) : (
        <>
          {" "}
          승인 진행 상황은 <b className="font-semibold">공구 관리</b>에서 확인할
          수 있습니다.
        </>
      )}
    </>
  )
}
