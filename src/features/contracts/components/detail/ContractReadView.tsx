import DetailCard from "@/common/components/DetailCard/DetailCard"
import HistoryList from "@/common/components/HistoryList/HistoryList"
import RecordNav from "@/common/components/RecordNav/RecordNav"
import { confirm } from "@/common/components/ConfirmModal/confirm"
import ClosureReasonCard from "@/features/contracts/components/detail/ClosureReasonCard"
import ContentObligationCard from "@/features/contracts/components/detail/ContentObligationCard"
import ContractItemsCard from "@/features/contracts/components/detail/ContractItemsCard"
import ContractTermsCard from "@/features/contracts/components/detail/ContractTermsCard"
import DocumentsCard from "@/features/contracts/components/detail/DocumentsCard"
import SigningProgressCard from "@/features/contracts/components/detail/SigningProgressCard"
import StatusSideCard from "@/features/contracts/components/detail/StatusSideCard"
import CancelReviewModal from "@/features/contracts/components/modals/CancelReviewModal"
import DeleteDraftModal from "@/features/contracts/components/modals/DeleteDraftModal"
import { CONTRACT_LIST_PATH } from "@/features/contracts/constants/params"
import {
  useCancelReviewRequest,
  useDeleteContract,
  useDuplicateContract,
  useRecordFixedFeePayment,
  useRequestResend,
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
import { toHistoryItems } from "@/features/contracts/utils/history"
import { useCallback, useState } from "react"
import toast from "react-hot-toast"
import { useLocation, useNavigate } from "react-router-dom"

interface ContractReadViewProps {
  detail: ContractDetailResponse
  view: ContractViewState
  brandName: string
  onEditAfterReject: () => void
}

/**
 * 계약서 모드(B3c·B3d·B4·B4a·B4c·B4b·B5·B5a·B5b·B6·B7·B8) — 한 응답으로 13종을 그린다.
 * 좌측: 서명 진행 → (사유·문서) → 계약 조건 → 상품 항목 → 콘텐츠 의무 / 우측: 상태 · 이력.
 */
export default function ContractReadView(props: ContractReadViewProps) {
  const { detail, view, brandName, onEditAfterReject } = props
  const navigate = useNavigate()
  const location = useLocation()

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

  const [isCancelOpen, setIsCancelOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  const isConcluded = CONCLUDED_VIEWS.includes(view)
  const isClosed = CLOSED_VIEWS.includes(view)

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
    if (isResending) {
      return
    }
    try {
      const result = await requestResend(detail.contractId)
      if (result.alreadyRequested) {
        toast(
          "이미 접수된 재발송 요청이 있습니다. 운영자 확인을 기다려 주세요."
        )
      } else {
        toast.success(
          "서명 안내 재발송을 요청했습니다. 운영자가 확인한 뒤 모두싸인에서 다시 보냅니다."
        )
      }
    } catch {
      // 인터셉터가 서버 문구를 토스트로 띄운다
    }
  }, [detail.contractId, isResending, requestResend])

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
    if (isDuplicating) {
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
  }, [detail.contractId, detail.title, duplicate, isDuplicating, navigate])

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
        {/* 셀러 상세엔 이전/다음이 없다 — [목록]만 */}
        <RecordNav onList={goToList} />
      </div>

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
          />

          <ClosureReasonCard detail={detail} view={view} />

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

          <ContentObligationCard content={detail.content} />
        </div>

        <div className="sticky top-0 flex flex-col gap-4">
          <StatusSideCard
            detail={detail}
            view={view}
            isRecordingPayment={isRecordingPayment}
            isDuplicating={isDuplicating}
            onOpenDocument={openDocument}
            onContactAdmin={contactAdmin}
            onRecordPayment={handleRecordPayment}
            onOpenGroupBuy={() => navigate("/group-buy")}
            onDuplicate={handleDuplicate}
            onOpenThread={openThread}
          />
          <DetailCard title="이력" flushBody>
            <HistoryList items={toHistoryItems(detail.history)} />
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
