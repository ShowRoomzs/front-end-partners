import DetailCard, { MetaRow } from "@/common/components/DetailCard/DetailCard"
import StatusBadge from "@/common/components/StatusBadge/StatusBadge"
import { formatDateTimeShort } from "@/common/utils/formatDate"
import Btn from "@/features/contracts/components/shared/Btn"
import { FLINK_CLASS } from "@/features/contracts/components/shared/styles"
import type { ContractDetailResponse } from "@/features/contracts/types"
import {
  CLOSED_VIEWS,
  CONCLUDED_VIEWS,
  type ContractViewState,
} from "@/features/contracts/utils/contractView"
import { formatKRW } from "@/features/contracts/utils/format"
import { concludedAt } from "@/features/contracts/utils/contractView"
import { toneToVariant } from "@/features/contracts/utils/statusBadge"
import type { ReactNode } from "react"

interface StatusSideCardProps {
  detail: ContractDetailResponse
  view: ContractViewState
  isRecordingPayment: boolean
  isDuplicating: boolean
  onOpenDocument: (
    type: "GENERATED_DRAFT" | "SIGNED_PDF" | "AUDIT_TRAIL"
  ) => void
  onContactAdmin: () => void
  onRecordPayment: () => void
  onOpenGroupBuy: () => void
  onDuplicate: () => void
  onOpenThread: () => void
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
    onOpenDocument,
    onContactAdmin,
    onRecordPayment,
    onOpenGroupBuy,
    onDuplicate,
    onOpenThread,
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
            {draftLink}
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
            <MetaRow label="서명 기한" value={time(signature.deadlineAt)} />
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
            <MetaRow
              // 시안 B7 — 브랜드가 서명한 뒤 만료됐으면 남은 쪽은 상대다
              label={
                signature.brandSignedAt && !signature.creatorSignedAt
                  ? "상대 서명 기한"
                  : "서명 기한"
              }
              value={time(signature.deadlineAt)}
            />
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
        <span className="text-[12px] text-sz-n-500">현재 상태</span>
        <StatusBadge variant={toneToVariant(detail.statusTone)}>
          {detail.statusLabel}
        </StatusBadge>
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
          {isClosed && permissions.canDuplicate && (
            <Btn
              variant="primary"
              className="w-full"
              isLoading={isDuplicating}
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
          <b className="font-semibold">어드민 직권</b>으로만 처리됩니다.
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
    case "draft":
      return null
  }
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
      <b className="font-semibold">{detail.fixedFee.triggerLabel}</b>)에
      브랜드가 직접 지급했습니다. 플랫폼은 지급을 확인·보증하지 않으며, 지급
      이후 콘텐츠 미이행이 있어도 지급액을 되돌릴 수 없습니다.
    </>
  )
  if (!hasGroupBuy) {
    return (
      <>
        계약이 체결되면 <b className="font-semibold">공구가 자동으로 생성</b>
        됩니다(계약 1건당 1건). 공구는 이 계약의 기간·공구가·리워드율을 그대로
        상속합니다.
        {paid
          ? paidText
          : view === "concludedFeeDue" && (
              <>
                {" "}
                고정 지급비는 계약서에 적은 지급 시점에{" "}
                <b className="font-semibold">브랜드가 직접</b> 지급합니다.
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
