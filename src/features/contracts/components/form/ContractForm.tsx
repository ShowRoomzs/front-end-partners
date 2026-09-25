import { confirm } from "@/common/components/ConfirmModal/confirm"
import DetailCard, { FieldRow } from "@/common/components/DetailCard/DetailCard"
import Notice from "@/common/components/Notice/Notice"
import RecordNav from "@/common/components/RecordNav/RecordNav"
import { formatDateTimeShort } from "@/common/utils/formatDate"
import ClausesCard from "@/features/contracts/components/form/ClausesCard"
import ContentCard from "@/features/contracts/components/form/ContentCard"
import CounterpartyCard from "@/features/contracts/components/form/CounterpartyCard"
import DuplicateSourceBanner from "@/features/contracts/components/form/DuplicateSourceBanner"
import FixedFeeCard from "@/features/contracts/components/form/FixedFeeCard"
import FormActionBar from "@/features/contracts/components/form/FormActionBar"
import ItemsCard from "@/features/contracts/components/form/ItemsCard"
import NoteCard from "@/features/contracts/components/form/NoteCard"
import PeriodCard from "@/features/contracts/components/form/PeriodCard"
import SettlementSummaryCard from "@/features/contracts/components/form/SettlementSummaryCard"
import ClausesModal from "@/features/contracts/components/modals/ClausesModal"
import DeleteDraftModal from "@/features/contracts/components/modals/DeleteDraftModal"
import ReviewRequestModal from "@/features/contracts/components/modals/ReviewRequestModal"
import UnsavedLeaveModal from "@/features/contracts/components/modals/UnsavedLeaveModal"
import { FSUB_CLASS } from "@/features/contracts/components/shared/styles"
import { CONTRACT_LIST_PATH } from "@/features/contracts/constants/params"
import { VIOLATION_FIELD_CARD } from "@/features/contracts/constants/labels"
import { useContractForm } from "@/features/contracts/hooks/useContractForm"
import {
  useDeleteContract,
  useRequestReview,
  useUpdateContract,
  useValidateContract,
} from "@/features/contracts/hooks/useContractMutations"
import { useUnsavedLeaveGuard } from "@/features/contracts/hooks/useUnsavedLeaveGuard"
import type {
  ContractClausesResponse,
  ContractDetailResponse,
  ContractFormSourcesResponse,
  ContractViolation,
  ContractWarning,
} from "@/features/contracts/types"
import {
  getApiErrorCode,
  getApiErrorMessage,
  isContractValidationError,
} from "@/features/contracts/utils/apiError"
import { toUpdateRequest } from "@/features/contracts/utils/contractForm"
import { useCallback, useEffect, useRef, useState } from "react"
import toast from "react-hot-toast"
import { useLocation, useNavigate } from "react-router-dom"

interface ContractFormProps {
  detail: ContractDetailResponse
  sources: ContractFormSourcesResponse
  clauses: ContractClausesResponse | undefined
  /** 상세를 다시 받아 폼을 되돌릴 때(편집 충돌) */
  onRefetch: () => Promise<ContractDetailResponse | undefined>
}

interface LocationState {
  /** 재작성 직후 — 복사 즉시 재검증 결과와 출처 공구명 */
  duplicateValidation?: { hardViolations: Array<ContractViolation> }
  sourceTitle?: string | null
}

/**
 * B1·B2·B3·B2a(작성중) · B3d 편집 — 한 화면이다. 값과 버튼 상태만 바뀐다.
 *
 * 필수 미입력은 에러 문구 없이 [검토 요청] 비활성, 규칙 위반에만 인라인 문구(절대 규칙).
 * 규칙의 정본은 서버(`/validate`)이고, 여기 판정은 즉시 피드백이다.
 */
export default function ContractForm(props: ContractFormProps) {
  const { detail, sources, clauses, onRefetch } = props
  const navigate = useNavigate()
  const location = useLocation()
  const locationState = (location.state ?? {}) as LocationState

  const form = useContractForm(detail, sources.products)
  const {
    values,
    version,
    hasErrors,
    requiredOk,
    isDirty,
    changedSections,
    hydrate,
    applyViolations,
  } = form

  const { mutateAsync: updateContract, isPending: isSaving } =
    useUpdateContract()
  const { mutateAsync: deleteContract, isPending: isDeleting } =
    useDeleteContract()
  const { mutateAsync: validateContract } = useValidateContract()
  const { mutateAsync: requestReview, isPending: isRequesting } =
    useRequestReview()

  const [savedAt, setSavedAt] = useState<string | null>(null)
  const hasSavedOnceRef = useRef(false)
  const [isValidating, setIsValidating] = useState(false)
  const [reviewWarnings, setReviewWarnings] =
    useState<Array<ContractWarning> | null>(null)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isClausesOpen, setIsClausesOpen] = useState(false)

  const guard = useUnsavedLeaveGuard({ when: isDirty })

  // 재작성 직후 — 복사 즉시 재검증 결과를 위반 행에 띄운다(§26-5). 한 번만.
  const appliedDuplicateRef = useRef(false)
  useEffect(() => {
    if (appliedDuplicateRef.current || !locationState.duplicateValidation) {
      return
    }
    appliedDuplicateRef.current = true
    applyViolations(locationState.duplicateValidation.hardViolations)
  }, [applyViolations, locationState.duplicateValidation])

  const goToList = useCallback(() => {
    navigate({ pathname: CONTRACT_LIST_PATH, search: location.search })
  }, [navigate, location.search])

  const scrollToFirstViolation = useCallback(
    (violations: Array<ContractViolation>) => {
      const first = violations.find(violation => violation.kind === "RULE")
      const field = first?.field ?? ""
      const target = VIOLATION_FIELD_CARD.find(entry =>
        field.startsWith(entry.prefix)
      )
      if (target) {
        document
          .getElementById(target.cardId)
          ?.scrollIntoView({ behavior: "smooth", block: "center" })
      }
    },
    []
  )

  /** 임시저장 — 성공하면 서버가 돌려준 상세로 폼을 되돌린다(버전 갱신 포함) */
  const save = useCallback(async (): Promise<ContractDetailResponse | null> => {
    try {
      const saved = await updateContract({
        contractId: detail.contractId,
        body: toUpdateRequest(values, version),
      })
      hydrate(saved)
      hasSavedOnceRef.current = true
      setSavedAt(new Date().toISOString())
      return saved
    } catch (error) {
      const code = getApiErrorCode(error)
      if (code === "CONTRACT_MODIFIED_ELSEWHERE") {
        const reload = await confirm({
          title: "다른 곳에서 먼저 저장되었습니다",
          content:
            "이 계약이 다른 탭이나 기기에서 먼저 저장되었습니다. 서버에 저장된 내용을 불러올까요? 지금 입력한 내용은 사라집니다.",
          confirmText: "불러오기",
          cancelText: "유지",
        })
        if (reload) {
          const fresh = await onRefetch()
          if (fresh) {
            hydrate(fresh)
          }
        }
        return null
      }
      toast.error(getApiErrorMessage(error) ?? "임시저장에 실패했습니다.")
      return null
    }
  }, [detail.contractId, hydrate, onRefetch, updateContract, values, version])

  const handleSave = useCallback(async () => {
    if (isSaving) {
      return
    }
    const saved = await save()
    if (saved) {
      toast.success("임시저장했습니다.")
    }
  }, [isSaving, save])

  /**
   * [검토 요청] — ① 변경분 저장 ② 서버 검증 ③ 경고 열거 모달(C3) ④ 확정.
   * 하드 위반이 남아 있으면 모달을 열지 않고 위반 칸으로 보낸다.
   */
  const handleRequestReview = useCallback(async () => {
    if (isValidating || isRequesting) {
      return
    }
    setIsValidating(true)
    try {
      if (isDirty) {
        const saved = await save()
        if (!saved) {
          return
        }
      }
      const validation = await validateContract(detail.contractId)
      if (!validation.canSubmit) {
        applyViolations(validation.hardViolations)
        scrollToFirstViolation(validation.hardViolations)
        if (validation.hardViolations.every(v => v.kind === "REQUIRED")) {
          toast("아직 입력하지 않은 필수 항목이 있습니다.")
        }
        return
      }
      setReviewWarnings(validation.warnings)
    } finally {
      setIsValidating(false)
    }
  }, [
    applyViolations,
    detail.contractId,
    isDirty,
    isRequesting,
    isValidating,
    save,
    scrollToFirstViolation,
    validateContract,
  ])

  const handleConfirmReview = useCallback(async () => {
    if (!reviewWarnings || isRequesting) {
      return
    }
    try {
      await requestReview({
        contractId: detail.contractId,
        body: { acknowledgedWarnings: reviewWarnings.map(w => w.code) },
      })
      setReviewWarnings(null)
      toast.success("검토를 요청했습니다. 어드민 확인 결과를 기다려 주세요.")
      // 상태가 바뀌어 같은 라우트가 검토 대기 화면으로 다시 그려진다(무효화는 훅이 한다)
    } catch (error) {
      setReviewWarnings(null)
      if (isContractValidationError(error)) {
        const violations = error.response?.data.hardViolations ?? []
        applyViolations(violations)
        scrollToFirstViolation(violations)
        toast.error("계약 내용을 다시 확인해 주세요.")
        return
      }
      const code = getApiErrorCode(error)
      if (code === "CONTRACT_WARNING_MISMATCH") {
        toast.error(
          getApiErrorMessage(error) ??
            "확인한 주의 항목이 현재 내용과 다릅니다. 다시 확인해 주세요."
        )
        // 경고 집합이 바뀌었으니 다시 판정해 모달을 새로 띄운다
        const validation = await validateContract(detail.contractId)
        if (validation.canSubmit) {
          setReviewWarnings(validation.warnings)
        } else {
          applyViolations(validation.hardViolations)
        }
        return
      }
      toast.error(getApiErrorMessage(error) ?? "검토 요청에 실패했습니다.")
    }
  }, [
    applyViolations,
    detail.contractId,
    isRequesting,
    requestReview,
    reviewWarnings,
    scrollToFirstViolation,
    validateContract,
  ])

  const handleDelete = useCallback(async () => {
    if (isDeleting) {
      return
    }
    try {
      await deleteContract(detail.contractId)
      setIsDeleteOpen(false)
      guard.bypassNext()
      toast.success("작성 중인 계약을 삭제했습니다.")
      navigate(CONTRACT_LIST_PATH)
    } catch {
      // 인터셉터가 서버 문구를 토스트로 띄운다
    }
  }, [deleteContract, detail.contractId, guard, isDeleting, navigate])

  /** C6 [저장 없이 나가기] — 한 번도 저장하지 않은 빈 초안은 지워서 작성중 탭에 쌓이지 않게 한다 */
  const handleLeaveWithoutSave = useCallback(() => {
    if (version === 0 && !hasSavedOnceRef.current) {
      void deleteContract(detail.contractId).catch(() => undefined)
    }
    guard.proceed()
  }, [deleteContract, detail.contractId, guard, version])

  const handleSaveAndLeave = useCallback(async () => {
    const saved = await save()
    if (saved) {
      guard.proceed()
    } else {
      guard.stay()
    }
  }, [guard, save])

  const isRejected = detail.status === "REVIEW_REJECTED"
  const canRequestReview =
    detail.permissions.canRequestReview && requiredOk && !hasErrors

  return (
    <>
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-[20px] font-semibold text-sz-n-900">계약 작성</h1>
          <p className="mt-0.5 text-[12px] text-sz-n-600">
            검토 요청 전까지 임시저장할 수 있습니다.{" "}
            <b className="font-semibold text-sz-n-900">
              검토 요청을 보내면 어드민 검토로 넘어가고 편집이 잠기며
            </b>{" "}
            이후 내용을 수정할 수 없습니다.
          </p>
        </div>
        <RecordNav onList={goToList} />
      </div>

      {detail.sourceContractId !== null && (
        <DuplicateSourceBanner
          sourceContractId={detail.sourceContractId}
          sourceTitle={locationState.sourceTitle ?? null}
        />
      )}

      {isRejected && (
        <DetailCard
          title="검토 반려 사유"
          note={`${formatDateTimeShort(detail.review.rejectedAt)} · 어드민`}
          className="mb-4"
        >
          <Notice tone="warn" className="mb-3">
            <b className="font-semibold">어드민이 검토를 반려했습니다.</b> 아래
            사유를 반영해 수정한 뒤{" "}
            <b className="font-semibold">다시 검토를 요청</b>해 주세요.
          </Notice>
          <FieldRow label="반려 사유">
            {detail.review.rejectReason?.code ?? "—"}
            {detail.review.rejectReason?.detail && (
              <div className={FSUB_CLASS}>
                {detail.review.rejectReason.detail}
              </div>
            )}
          </FieldRow>
        </DetailCard>
      )}

      <div className="flex flex-col gap-4">
        <CounterpartyCard
          form={form}
          detail={detail}
          counterparties={sources.counterparties}
          savedAt={savedAt}
        />
        <PeriodCard form={form} />
        <ItemsCard form={form} products={sources.products} />
        <FixedFeeCard form={form} />
        <ContentCard form={form} />
        <NoteCard form={form} />
        <SettlementSummaryCard
          settlement={detail.settlement}
          fixedFeeAmount={values.fixedFeeAmount}
          hasCounterparty={values.creatorId !== null}
        />
        <ClausesCard
          clauses={clauses}
          onOpenFullText={() => setIsClausesOpen(true)}
        />
      </div>

      <FormActionBar
        canDelete={detail.permissions.canDelete}
        canRequestReview={canRequestReview}
        isSaving={isSaving}
        isRequesting={isValidating || isRequesting}
        onDelete={() => setIsDeleteOpen(true)}
        onSave={handleSave}
        onRequestReview={handleRequestReview}
      />

      {reviewWarnings && (
        <ReviewRequestModal
          values={values}
          counterparties={sources.counterparties}
          warnings={reviewWarnings}
          isPending={isRequesting}
          onCancel={() => setReviewWarnings(null)}
          onConfirm={handleConfirmReview}
        />
      )}

      {isDeleteOpen && (
        <DeleteDraftModal
          isPending={isDeleting}
          onClose={() => setIsDeleteOpen(false)}
          onConfirm={handleDelete}
        />
      )}

      {isClausesOpen && (
        <ClausesModal
          clauses={clauses}
          onClose={() => setIsClausesOpen(false)}
        />
      )}

      {guard.isBlocked && (
        <UnsavedLeaveModal
          changedSections={changedSections}
          isSaving={isSaving}
          onLeave={handleLeaveWithoutSave}
          onSaveAndLeave={handleSaveAndLeave}
          onStay={guard.stay}
        />
      )}
    </>
  )
}
