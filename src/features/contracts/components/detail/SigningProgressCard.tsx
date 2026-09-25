import { reviewRejectReasonLabel } from "@/features/contracts/constants/labels"
import DetailCard, { FieldRow } from "@/common/components/DetailCard/DetailCard"
import Notice from "@/common/components/Notice/Notice"
import { formatDateTimeShort } from "@/common/utils/formatDate"
import SignatureBoxes from "@/features/contracts/components/detail/SignatureBoxes"
import Stepper from "@/features/contracts/components/detail/Stepper"
import Btn from "@/features/contracts/components/shared/Btn"
import { FSUB_CLASS } from "@/features/contracts/components/shared/styles"
import type { ContractDetailResponse } from "@/features/contracts/types"
import {
  buildStepper,
  CLOSED_VIEWS,
  CONCLUDED_VIEWS,
  type ContractViewState,
} from "@/features/contracts/utils/contractView"

interface SigningProgressCardProps {
  detail: ContractDetailResponse
  view: ContractViewState
  brandName: string
  isResending: boolean
  isCanceling: boolean
  onResend: () => void
  onCancelRequest: () => void
  onEditAfterReject: () => void
  onDelete: () => void
}

const NOTE_BY_VIEW: Partial<Record<ContractViewState, string>> = {
  reviewPending: "어드민 검토 → 양측 동시 서명 요청",
  reviewRejected: "어드민 검토 → 양측 동시 서명 요청",
  signingNone: "어드민 검토 → 양측 동시 서명 요청",
  signingMine: "어드민 검토 → 양측 동시 서명 요청",
  signingTheirs: "어드민 검토 → 양측 동시 서명 요청",
  conclusionPending: "어드민 검토 → 양측 동시 서명 요청",
  concludedNoFee: "체결 완료",
  concludedPaid: "체결 완료",
  concludedFeeDue: "체결 완료",
  declined: "상대 거절로 종결",
  expired: "서명 기한 초과로 종결",
  canceled: "어드민 직권 취소로 종결",
}

/**
 * 좌측 첫 카드 「서명 진행」 — 배너(조치·종결 안내) → 스텝퍼 → 서명 카드 2장 → 기준 시각 → 안내.
 * 검토 대기·반려에서는 서명 카드 대신 인라인 액션([요청 취소] / [수정하고 다시 요청] [삭제])이 온다.
 */
export default function SigningProgressCard(props: SigningProgressCardProps) {
  const {
    detail,
    view,
    brandName,
    isResending,
    isCanceling,
    onResend,
    onCancelRequest,
    onEditAfterReject,
    onDelete,
  } = props
  const { signature, review, permissions, counterparty } = detail
  const creatorName = counterparty.showroomName ?? "인플루언서"
  const isConcluded = CONCLUDED_VIEWS.includes(view)
  const isClosed = CLOSED_VIEWS.includes(view)
  const showSignatureBoxes =
    view === "signingNone" ||
    view === "signingMine" ||
    view === "signingTheirs" ||
    view === "conclusionPending" ||
    view === "expired" ||
    isConcluded

  return (
    <DetailCard title="서명 진행" note={NOTE_BY_VIEW[view]}>
      {view === "signingTheirs" && (
        <Notice tone="warn" className="mb-3">
          <b className="font-semibold">
            인플루언서가 서명을 완료했습니다. 내 서명만 남았습니다.
          </b>{" "}
          기한({formatDateTimeShort(signature.deadlineAt)})까지 서명하지 않으면
          계약이 <b className="font-semibold">만료</b>되고 공구가 생성되지
          않습니다 —{" "}
          <b className="font-semibold">메일·문자로 받은 전자서명 링크</b>에서
          서명해 주세요 — 안내를 받지 못했다면 아래{" "}
          <b className="font-semibold">[서명 안내 다시 받기]</b>를 눌러주세요.
        </Notice>
      )}
      {view === "declined" && (
        <Notice tone="danger" className="mb-4">
          <b className="font-semibold">인플루언서가 계약을 거절했습니다.</b> 이
          계약은 되돌릴 수 없습니다. 조건을 조정해{" "}
          <b className="font-semibold">새 계약을 작성</b>하세요 — 연결은
          유지되며 같은 상대와 다시 계약할 수 있습니다.
        </Notice>
      )}
      {view === "expired" && (
        <Notice tone="neutral" className="mb-4">
          <b className="font-semibold">
            {/* 시안 B7 — 누가 서명하지 않았는지 밝힌다 */}
            서명 기한까지{" "}
            {signature.brandSignedAt && !signature.creatorSignedAt
              ? "인플루언서가 서명하지 않아"
              : !signature.brandSignedAt && signature.creatorSignedAt
                ? "브랜드 서명이 완료되지 않아"
                : "양측 서명이 완료되지 않아"}{" "}
            만료되었습니다.
          </b>{" "}
          거절된 것이 아니라 <b className="font-semibold">응답이 없었던</b>{" "}
          건입니다 — 상대가 계약서를 열어보지 않았을 수 있으니, 스레드에서
          확인한 뒤 다시 보내는 것을 권합니다.
        </Notice>
      )}
      {view === "canceled" && (
        <Notice tone="neutral" className="mb-4">
          <b className="font-semibold">
            어드민 직권으로 취소되어 종결된 계약입니다.
          </b>{" "}
          인플루언서에게도 취소 사실과 사유가 전달되었습니다. 조건을 고쳐 다시
          진행하려면 <b className="font-semibold">새 계약을 작성</b>하세요.
        </Notice>
      )}

      <Stepper steps={buildStepper(view, detail)} />

      {view === "reviewPending" && (
        <>
          <Notice tone="info" className="mt-4">
            <b className="font-semibold">
              어드민이 계약 내용을 확인하고 있습니다.
            </b>{" "}
            통과하면{" "}
            <b className="font-semibold">전자서명 요청이 양측에 각각 발송</b>
            됩니다 — 그때까지 브랜드가 할 일은 없습니다.
          </Notice>
          <Notice tone="neutral" className="mt-3">
            내용을 고쳐야 하면 <b className="font-semibold">[요청 취소]</b>로
            작성중으로 돌아가세요 — 플랫폼을 거친 결제가 없어{" "}
            <b className="font-semibold">정산·환불 처리 없이</b> 되돌릴 수
            있습니다.
          </Notice>
          {permissions.canCancelRequest && (
            <div className="mt-3">
              <Btn
                variant="secondary"
                className="w-full"
                isLoading={isCanceling}
                onClick={onCancelRequest}
              >
                요청 취소
              </Btn>
            </div>
          )}
        </>
      )}

      {view === "reviewRejected" && (
        <>
          <Notice tone="warn" className="mt-4">
            <b className="font-semibold">어드민이 검토를 반려했습니다.</b> 아래
            사유를 반영해 수정한 뒤{" "}
            <b className="font-semibold">다시 검토를 요청</b>해 주세요.
          </Notice>
          <div className="mt-3">
            <FieldRow label="반려 사유">
              {reviewRejectReasonLabel(review.rejectReason?.code)}
              {review.rejectReason?.detail && (
                <div className={FSUB_CLASS}>{review.rejectReason.detail}</div>
              )}
            </FieldRow>
            <FieldRow label="반려 처리">
              <span className="tabular-nums">
                {formatDateTimeShort(review.rejectedAt)} · 어드민
              </span>
            </FieldRow>
          </div>
          <div className="mt-3 flex flex-col gap-2">
            {permissions.canEdit && (
              <Btn
                variant="primary"
                className="w-full"
                onClick={onEditAfterReject}
              >
                수정하고 다시 요청
              </Btn>
            )}
            {/* 서버는 작성중 초안만 지운다 — 반려 건의 [삭제]는 permissions.canDelete가 열릴 때만 */}
            {permissions.canDelete && (
              <Btn variant="delete" className="w-full" onClick={onDelete}>
                삭제
              </Btn>
            )}
          </div>
        </>
      )}

      {showSignatureBoxes && (
        <SignatureBoxes
          brandName={brandName}
          creatorName={creatorName}
          brandSignedAt={signature.brandSignedAt}
          creatorSignedAt={signature.creatorSignedAt}
          // 어드민이 서명을 아직 한 번도 옮겨 적지 않았으면 asOf가 비어 온다 — 발송 시각이 기준이다
          asOf={
            isConcluded || isClosed
              ? null
              : (signature.asOf ?? signature.requestedAt)
          }
          counterpartyViewed={signature.counterpartyViewed}
          isExpired={view === "expired"}
          showResend={permissions.canRequestResend}
          isResending={isResending}
          onResend={onResend}
        />
      )}

      {(view === "signingNone" ||
        view === "signingMine" ||
        view === "signingTheirs") && (
        <Notice tone="info" className="mt-3">
          <b className="font-semibold">양측이 모두 서명해야</b> 체결로
          넘어갑니다. 서명이 끝나면 어드민이 확인해{" "}
          <b className="font-semibold">체결 완료 처리</b>하고, 그때 서명
          PDF·감사추적인증서가 발급되며 공구가 생성됩니다.
        </Notice>
      )}

      {view === "conclusionPending" && (
        <Notice tone="info" className="mt-3">
          <b className="font-semibold">
            양측 서명이 확인되어 어드민 체결 처리를 기다립니다.
          </b>{" "}
          서명 완료는{" "}
          <b className="font-semibold">어드민이 모두싸인에서 확인</b>한
          것이고(자동 통지가 아닙니다), 체결 처리 시{" "}
          <b className="font-semibold">
            어드민이 서명 PDF·감사추적인증서를 내려받아 업로드
          </b>
          합니다. 그때 체결완료로 바뀌고{" "}
          <b className="font-semibold">공구가 생성</b>됩니다 —{" "}
          <b className="font-semibold">아직 공구는 만들어지지 않았습니다.</b>
        </Notice>
      )}
    </DetailCard>
  )
}
