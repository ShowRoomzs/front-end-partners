import DetailCard from "@/common/components/DetailCard/DetailCard"
import HistoryList from "@/common/components/HistoryList/HistoryList"
import RecordNav from "@/common/components/RecordNav/RecordNav"
import { confirm } from "@/common/components/ConfirmModal/confirm"
import { isApiNotReady } from "@/common/utils/devMock"
import ClosureReasonCard from "@/features/contracts/components/detail/ClosureReasonCard"
import ContentObligationCard from "@/features/contracts/components/detail/ContentObligationCard"
import ContractItemsCard from "@/features/contracts/components/detail/ContractItemsCard"
import ContractTermsCard from "@/features/contracts/components/detail/ContractTermsCard"
import DocumentsCard from "@/features/contracts/components/detail/DocumentsCard"
import DraftApprovalsCard from "@/features/contracts/components/detail/DraftApprovalsCard"
import SigningProgressCard from "@/features/contracts/components/detail/SigningProgressCard"
import StatusSideCard from "@/features/contracts/components/detail/StatusSideCard"
import SanctionNotice from "@/features/contracts/components/shared/SanctionNotice"
import CancelReviewModal from "@/features/contracts/components/modals/CancelReviewModal"
import DeleteDraftModal from "@/features/contracts/components/modals/DeleteDraftModal"
import TerminationRequestModal from "@/features/contracts/components/modals/TerminationRequestModal"
import { CONTRACT_LIST_PATH } from "@/features/contracts/constants/params"
import { TERMINATION_REASON_CODE } from "@/features/contracts/constants/provisional"
import {
  SIGNING_COUNTERPARTY_HELD_NOTICE,
  SIGNING_SUSPENDED_NOTICE,
} from "@/features/contracts/constants/suspension"
import {
  useCancelReviewRequest,
  useDeleteContract,
  useDuplicateContract,
  useRecordFixedFeePayment,
  useRequestResend,
  useRequestTermination,
  useWithdrawTermination,
} from "@/features/contracts/hooks/useContractMutations"
import type {
  ContractDetailResponse,
  ContractDocumentType,
} from "@/features/contracts/types"
import {
  CLOSED_VIEWS,
  CONCLUDED_VIEWS,
  headerMeta,
  type ContractViewState,
} from "@/features/contracts/utils/contractView"
import { getApiErrorMessage } from "@/features/contracts/utils/apiError"
import { toHistoryItems } from "@/features/contracts/utils/history"
import { useAccountSuspension } from "@/features/suspension"
import { useCallback, useState } from "react"
import toast from "react-hot-toast"
import { useContractNeighbors } from "@/features/contracts/hooks/useContractNeighbors"
import { useLocation, useNavigate } from "react-router-dom"

interface ContractReadViewProps {
  detail: ContractDetailResponse
  view: ContractViewState
  brandName: string
  onEditAfterReject: () => void
}

/**
 * 계약서 모드(B3c·B3d·B4·B4a·B4c·B4b·B5·B5a·B5b·B6·B7·B8·B9) — 한 응답으로 14종을 그린다.
 * 좌측: 서명 진행 → (사유·문서) → 계약 조건 → 상품 항목 → 콘텐츠 의무 / 우측: 상태 · 이력.
 */
export default function ContractReadView(props: ContractReadViewProps) {
  const { detail, view, brandName, onEditAfterReject } = props
  const navigate = useNavigate()
  const location = useLocation()
  const { isSuspended } = useAccountSuspension()

  /*
    서명 진행중 체결 보류 안내(시안 15 S4b · R1). 배지와 같은 서버 판정(sanctionHold)을 따르되,
    배포 전 서버는 필드가 없어 내 정지는 계정 상태로도 본다. 상대 정지는 서버 값으로만 안다.
  */
  const isSigning = detail.status === "SIGNING"
  const holdKind = detail.sanctionHold?.kind
  const signingHeldByMe = isSigning && (holdKind === "MINE" || isSuspended)
  const signingHeldByCounterparty =
    isSigning && !signingHeldByMe && holdKind === "COUNTERPARTY"

  const { mutateAsync: requestResend, isPending: isResending } =
    useRequestResend()
  const { mutateAsync: cancelReview, isPending: isCanceling } =
    useCancelReviewRequest()
  const { mutateAsync: recordPayment, isPending: isRecordingPayment } =
    useRecordFixedFeePayment()
  const { mutateAsync: duplicate, isPending: isDuplicating } =
    useDuplicateContract()
  const { mutateAsync: deleteContract, isPending: isDeleting } =
    useDeleteContract()
  const {
    mutateAsync: requestTermination,
    isPending: isRequestingTermination,
  } = useRequestTermination()
  const { mutateAsync: withdrawTermination, isPending: isWithdrawing } =
    useWithdrawTermination()

  const [isCancelOpen, setIsCancelOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isTerminationOpen, setIsTerminationOpen] = useState(false)

  const isConcluded = CONCLUDED_VIEWS.includes(view)
  const isClosed = CLOSED_VIEWS.includes(view)

  const { prevId, nextId } = useContractNeighbors(
    detail.contractId,
    location.search
  )
  const goToRecord = useCallback(
    (id: number) => {
      navigate({
        pathname: `${CONTRACT_LIST_PATH}/${id}`,
        search: location.search,
      })
    },
    [navigate, location.search]
  )

  const goToList = useCallback(() => {
    navigate({ pathname: CONTRACT_LIST_PATH, search: location.search })
  }, [navigate, location.search])

  const openThread = useCallback(() => {
    const name = detail.counterparty.showroomName
    navigate(
      name
        ? `/connections?counterpart=${encodeURIComponent(name)}`
        : "/connections"
    )
  }, [detail.counterparty.showroomName, navigate])

  /** [어드민에 문의] — 운영팀 소통 스레드로 간다(별도 요청 화면을 두지 않는다 · §25-3a) */
  const contactAdmin = useCallback(() => {
    navigate("/connections?operator=1")
  }, [navigate])

  const openDocument = useCallback(
    (type: ContractDocumentType) => {
      const doc = detail.documents.find(item => item.type === type)
      if (doc) {
        window.open(doc.downloadUrl, "_blank")
      }
    },
    [detail.documents]
  )

  const handleResend = useCallback(async () => {
    if (isResending || isSuspended) {
      return
    }
    try {
      const result = await requestResend(detail.contractId)
      if (result.alreadyRequested) {
        toast(
          "이미 접수된 재발송 요청이 있습니다. 어드민 확인을 기다려 주세요."
        )
      } else {
        toast.success(
          "서명 안내 재발송을 요청했습니다. 어드민이 확인한 뒤 모두싸인에서 다시 보냅니다."
        )
      }
    } catch {
      // 인터셉터가 서버 문구를 토스트로 띄운다
    }
  }, [detail.contractId, isResending, isSuspended, requestResend])

  const handleCancelReview = useCallback(async () => {
    if (isCanceling) {
      return
    }
    try {
      await cancelReview(detail.contractId)
      setIsCancelOpen(false)
      toast.success("검토 요청을 취소했습니다. 작성중으로 돌아갑니다.")
    } catch {
      setIsCancelOpen(false)
    }
  }, [cancelReview, detail.contractId, isCanceling])

  const handleRecordPayment = useCallback(async () => {
    if (isRecordingPayment) {
      return
    }
    const ok = await confirm({
      title: "고정 지급비 지급 완료를 기록할까요?",
      content:
        "브랜드가 인플루언서에게 직접 지급한 사실을 기록합니다. 플랫폼은 지급을 확인하거나 보증하지 않으며, 기록은 되돌릴 수 없습니다.",
      confirmText: "지급 완료 기록",
    })
    if (!ok) {
      return
    }
    try {
      await recordPayment(detail.contractId)
      toast.success("고정 지급비 지급 완료를 기록했습니다.")
    } catch {
      // 인터셉터가 서버 문구를 토스트로 띄운다
    }
  }, [detail.contractId, isRecordingPayment, recordPayment])

  const handleDuplicate = useCallback(async () => {
    // 재작성도 새 계약의 시작이다 — 정지 중엔 서버가 CONTRACT_CREATE로 막는다
    if (isDuplicating || isSuspended) {
      return
    }
    try {
      const result = await duplicate(detail.contractId)
      navigate(`${CONTRACT_LIST_PATH}/${result.contractId}`, {
        state: {
          duplicateValidation: result.validation,
          sourceTitle: detail.title,
        },
      })
    } catch {
      // 인터셉터가 서버 문구를 토스트로 띄운다
    }
  }, [
    detail.contractId,
    detail.title,
    duplicate,
    isDuplicating,
    isSuspended,
    navigate,
  ])

  /** 해지 요청 · 철회는 아직 없는 경로일 수 있어 실호출이 토스트를 끄고 온다 — 문구는 여기서 고른다 */
  const toastTerminationError = useCallback((error: unknown) => {
    toast.error(
      isApiNotReady(error)
        ? "아직 준비 중인 기능입니다."
        : (getApiErrorMessage(error) ?? "요청을 처리하지 못했습니다.")
    )
  }, [])

  const handleRequestTermination = useCallback(
    async (memo: string) => {
      if (isRequestingTermination) {
        return
      }
      try {
        await requestTermination({
          detail,
          body: { reasonCode: TERMINATION_REASON_CODE, memo },
        })
        setIsTerminationOpen(false)
        toast.success(
          "해지를 요청했습니다. 운영자가 상대 의사를 확인한 뒤 처리합니다."
        )
      } catch (error) {
        toastTerminationError(error)
      }
    },
    [detail, isRequestingTermination, requestTermination, toastTerminationError]
  )

  const handleWithdrawTermination = useCallback(async () => {
    if (isWithdrawing) {
      return
    }
    const ok = await confirm({
      title: "해지 요청을 철회할까요?",
      content: "철회하면 계약은 체결완료 그대로 유지됩니다.",
      confirmText: "요청 철회",
    })
    if (!ok) {
      return
    }
    try {
      await withdrawTermination(detail)
      toast.success("해지 요청을 철회했습니다.")
    } catch (error) {
      toastTerminationError(error)
    }
  }, [detail, isWithdrawing, toastTerminationError, withdrawTermination])

  const handleDelete = useCallback(async () => {
    if (isDeleting) {
      return
    }
    try {
      await deleteContract(detail.contractId)
      setIsDeleteOpen(false)
      toast.success("계약을 삭제했습니다.")
      navigate(CONTRACT_LIST_PATH)
    } catch {
      setIsDeleteOpen(false)
    }
  }, [deleteContract, detail.contractId, isDeleting, navigate])

  return (
    <>
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-[20px] font-semibold text-sz-n-900">
            {detail.title ?? "(공구명 미입력)"}
          </h1>
          <p className="mt-0.5 text-[12px] tabular-nums text-sz-n-600">
            {headerMeta(detail, view)}
          </p>
        </div>
        <RecordNav
          onList={goToList}
          onPrev={prevId !== null ? () => goToRecord(prevId) : undefined}
          onNext={nextId !== null ? () => goToRecord(nextId) : undefined}
        />
      </div>

      {signingHeldByMe && (
        <SanctionNotice tone="warn" title={SIGNING_SUSPENDED_NOTICE.title}>
          {SIGNING_SUSPENDED_NOTICE.body}
        </SanctionNotice>
      )}
      {signingHeldByCounterparty && (
        <SanctionNotice
          tone="neutral"
          title={SIGNING_COUNTERPARTY_HELD_NOTICE.title}
        >
          {SIGNING_COUNTERPARTY_HELD_NOTICE.body}
        </SanctionNotice>
      )}

      <div className="grid grid-cols-[1fr_320px] items-start gap-4">
        <div className="flex flex-col gap-4">
          <SigningProgressCard
            detail={detail}
            view={view}
            brandName={brandName}
            isResending={isResending}
            isCanceling={isCanceling}
            onResend={handleResend}
            onCancelRequest={() => setIsCancelOpen(true)}
            onEditAfterReject={onEditAfterReject}
            onDelete={() => setIsDeleteOpen(true)}
            suspended={isSuspended}
          />

          <ClosureReasonCard
            detail={detail}
            view={view}
            brandName={brandName}
          />

          {isConcluded && (
            <DocumentsCard
              contractId={detail.contractId}
              contractNumber={detail.contractNumber}
              documents={detail.documents}
            />
          )}

          <ContractTermsCard
            detail={detail}
            view={view}
            onOpenThread={openThread}
          />

          <ContractItemsCard
            items={detail.items}
            showSettlementNote={!isClosed}
          />

          {/* 시안 B8 · B9 — 직권 취소 · 해지 화면엔 콘텐츠 의무 카드가 없다 */}
          {view !== "canceled" && view !== "terminated" && (
            <ContentObligationCard content={detail.content} />
          )}

          {/* 기-30 — main 필드라 개발 서버 응답엔 없다(undefined면 카드째 숨김) */}
          {isConcluded && detail.draftApprovals && (
            <DraftApprovalsCard approvals={detail.draftApprovals} />
          )}
        </div>

        <div className="sticky top-0 flex flex-col gap-4">
          <StatusSideCard
            detail={detail}
            view={view}
            isRecordingPayment={isRecordingPayment}
            isDuplicating={isDuplicating}
            isWithdrawingTermination={isWithdrawing}
            onOpenDocument={openDocument}
            onContactAdmin={contactAdmin}
            onRecordPayment={handleRecordPayment}
            onOpenGroupBuy={() => navigate("/group-buy")}
            onDuplicate={handleDuplicate}
            onOpenThread={openThread}
            onRequestTermination={() => setIsTerminationOpen(true)}
            onWithdrawTermination={handleWithdrawTermination}
            suspended={isSuspended}
          />
          <DetailCard title="이력" flushBody>
            <HistoryList
              items={toHistoryItems(
                detail.history,
                detail.signature,
                detail.fixedFee.amount
              )}
            />
          </DetailCard>
        </div>
      </div>

      {isCancelOpen && (
        <CancelReviewModal
          detail={detail}
          isPending={isCanceling}
          onClose={() => setIsCancelOpen(false)}
          onConfirm={handleCancelReview}
        />
      )}

      {isTerminationOpen && (
        <TerminationRequestModal
          detail={detail}
          isPending={isRequestingTermination}
          onClose={() => setIsTerminationOpen(false)}
          onConfirm={handleRequestTermination}
        />
      )}

      {isDeleteOpen && (
        <DeleteDraftModal
          isPending={isDeleting}
          onClose={() => setIsDeleteOpen(false)}
          onConfirm={handleDelete}
        />
      )}
    </>
  )
}
