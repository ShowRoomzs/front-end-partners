import { Button } from "@/components/ui/button"
import {
  STORE_BUTTON_CLASS,
  STORE_INPUT_CLASS,
} from "@/features/storeManagement/components/StoreFormLayout/StoreFormLayout"
import {
  EvidenceUpload,
  type EvidenceFile,
} from "@/features/storeManagement/components/ChangeRequestModal/EvidenceUpload"
import {
  ModalFieldError,
  ModalLabel,
  ModalNotice,
  ModalShell,
} from "@/features/storeManagement/components/ChangeRequestModal/ModalShell"
import { withObjectParticle } from "@/common/utils/korean"
import { useChangeRequestFields } from "@/features/storeManagement/hooks/useChangeRequestFields"
import {
  changeRequestService,
  type ChangeRequestCreateResponse,
  type ChangeRequestField,
} from "@/features/storeManagement/services/changeRequestService"
import { cn } from "@/lib/utils"
import { useState } from "react"

const REASON_MAX = 500

interface BusinessInfoRequestModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmitted: (response: ChangeRequestCreateResponse) => void
}

/**
 * M1 — 사업자 정보 변경 요청.
 *
 * 체크한 항목마다 "바꿀 값" 입력칸이 동적으로 생기고, 체크를 해제하면 입력값도
 * 함께 폐기한다(잔류 값이 요청 레코드에 실리지 않도록, §15 상태 관리 메모).
 */
export function BusinessInfoRequestModal(props: BusinessInfoRequestModalProps) {
  const { isOpen, onClose, onSubmitted } = props

  const { data: fields } = useChangeRequestFields("BUSINESS_INFO", isOpen)
  const [checked, setChecked] = useState<Set<ChangeRequestField>>(new Set())
  const [values, setValues] = useState<Record<string, string>>({})
  const [reason, setReason] = useState("")
  const [evidence, setEvidence] = useState<EvidenceFile | null>(null)
  const [interacted, setInteracted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const reset = () => {
    setChecked(new Set())
    setValues({})
    setReason("")
    setEvidence(null)
    setInteracted(false)
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const toggle = (fieldKey: ChangeRequestField) => {
    setChecked(prev => {
      const next = new Set(prev)
      if (next.has(fieldKey)) {
        next.delete(fieldKey)
        // 체크를 풀면 입력해 둔 "바꿀 값"도 함께 버린다 —
        // 남겨두면 다시 체크했을 때 옛 값이 되살아나 요청 레코드에 실린다(§15-6)
        setValues(v => {
          const rest = { ...v }
          delete rest[fieldKey]
          return rest
        })
      } else {
        next.add(fieldKey)
      }
      return next
    })
  }

  const checkedList = fields?.filter(f => checked.has(f.fieldKey)) ?? []
  // 체크는 했지만 아직 입력하지 않은 항목 — values에 키 자체가 없을 수 있다
  const hasEmptyValue = checkedList.some(
    f => !(values[f.fieldKey] ?? "").trim()
  )
  const canSubmit =
    checkedList.length > 0 &&
    !hasEmptyValue &&
    reason.trim().length > 0 &&
    !!evidence

  const handleSubmit = async () => {
    setInteracted(true)
    if (!canSubmit || !evidence || isSubmitting) {
      return
    }
    setIsSubmitting(true)
    try {
      const response = await changeRequestService.create({
        type: "BUSINESS_INFO",
        items: checkedList.map(f => ({
          fieldKey: f.fieldKey,
          requestedValue: values[f.fieldKey],
        })),
        reason,
        evidenceFileUrl: evidence.url,
        evidenceFileName: evidence.name,
        evidenceFileSize: evidence.size,
      })
      reset()
      onSubmitted(response)
    } catch {
      // 실패 사유는 apiInstance 인터셉터가 토스트로 띄운다
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <ModalShell
      isOpen={isOpen}
      title="사업자 정보 변경 요청"
      width={560}
      onClose={handleClose}
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={STORE_BUTTON_CLASS}
            onClick={handleClose}
          >
            취소
          </Button>
          <Button
            type="button"
            size="sm"
            className={STORE_BUTTON_CLASS}
            disabled={interacted && !canSubmit}
            onClick={handleSubmit}
            isLoading={isSubmitting}
          >
            변경 요청
          </Button>
        </>
      }
    >
      <ModalNotice>
        법정 신원정보는 브랜드가 직접 수정할 수 없어요. 변경할 항목을 고르고{" "}
        <b className="text-sz-n-900">바꿀 값</b>과{" "}
        <b className="text-sz-n-900">증빙 서류</b>를 함께 남기면 운영자가 서류와
        대조해 반영해요. 결과는 이메일로 안내드려요.
      </ModalNotice>

      <div className="mb-4">
        <ModalLabel required>변경 항목</ModalLabel>
        <div
          className={cn(
            "grid grid-cols-2 gap-x-3 gap-y-2 rounded-[6px] border p-3.5",
            interacted && checkedList.length === 0
              ? "border-sz-danger-text"
              : "border-sz-n-300"
          )}
        >
          {fields?.map(f => (
            <label
              key={f.fieldKey}
              className="flex cursor-pointer items-center gap-[7px] text-[12px] text-sz-n-700"
            >
              <input
                type="checkbox"
                checked={checked.has(f.fieldKey)}
                onChange={() => toggle(f.fieldKey)}
                className="h-[15px] w-[15px] accent-sz-accent-500"
              />
              {f.label}
            </label>
          ))}
        </div>
        {interacted && checkedList.length === 0 && (
          <ModalFieldError>변경할 항목을 선택해 주세요.</ModalFieldError>
        )}
        <p className="mt-1.5 text-[11px] leading-[1.55] text-sz-n-500">
          사업자등록번호는 변경 대상이 아닙니다 — 번호가 바뀌면 정보 변경이
          아니라 신규 입점 신청 대상입니다.
        </p>
      </div>

      {checkedList.length > 0 && (
        <div className="mb-4">
          <ModalLabel required>변경할 값</ModalLabel>
          <div className="rounded-[6px] border border-sz-n-300 bg-sz-n-50 p-3.5">
            {checkedList.map((f, index) => {
              const isEmpty = !(values[f.fieldKey] ?? "").trim()

              return (
                <div key={f.fieldKey} className={cn(index > 0 && "mt-3.5")}>
                  <div className="mb-0.5 text-[12px] font-semibold text-sz-n-900">
                    {f.label}
                  </div>
                  <div className="mb-1.5 text-[11px] text-sz-n-500">
                    {/* 아직 값이 없는 항목은 서버가 null을 내려준다 */}
                    현재 · {f.currentValue ?? "—"}
                  </div>
                  <input
                    type="text"
                    value={values[f.fieldKey] ?? ""}
                    onChange={e =>
                      setValues(v => ({ ...v, [f.fieldKey]: e.target.value }))
                    }
                    placeholder="변경할 값을 입력하세요"
                    className={cn(
                      "w-full rounded-[6px] border bg-white text-[13px] text-sz-n-900 focus:border-sz-accent-500 focus:outline-none",
                      STORE_INPUT_CLASS,
                      interacted && isEmpty
                        ? "border-sz-danger-text"
                        : "border-sz-n-300"
                    )}
                  />
                  {interacted && isEmpty && (
                    // 항목 라벨은 서버가 내려주므로 문구를 통째로 하드코딩할 수 없다
                    <ModalFieldError>
                      {withObjectParticle(f.label)} 입력해 주세요.
                    </ModalFieldError>
                  )}
                </div>
              )
            })}
          </div>
          <p className="mt-1.5 text-[11px] leading-[1.55] text-sz-n-500">
            증빙 서류에 적힌 값과 <b className="text-sz-n-900">똑같이</b> 입력해
            주세요 — 다르면 반려됩니다.
          </p>
        </div>
      )}

      <div className="mb-4">
        <ModalLabel required>변경 사유</ModalLabel>
        <textarea
          value={reason}
          maxLength={REASON_MAX}
          onChange={e => setReason(e.target.value)}
          placeholder="변경이 필요한 사유를 입력해 주세요. (최대 500자)"
          rows={3}
          className={cn(
            "w-full resize-y rounded-[6px] border px-2.5 py-1.5 text-[13px] leading-[1.6] text-sz-n-900 focus:border-sz-accent-500 focus:outline-none",
            interacted && !reason.trim()
              ? "border-sz-danger-text"
              : "border-sz-n-300"
          )}
        />
        {interacted && !reason.trim() && (
          <ModalFieldError>변경 사유를 입력해 주세요.</ModalFieldError>
        )}
      </div>

      <div>
        <ModalLabel required>변경 증빙 파일</ModalLabel>
        <EvidenceUpload
          label="변경 증빙 파일"
          value={evidence}
          onChange={setEvidence}
          error={
            interacted && !evidence
              ? "변경 증빙 파일을 첨부해 주세요."
              : undefined
          }
        />
        <p className="mt-1.5 text-[11px] leading-[1.55] text-sz-n-500">
          변경 사실을 확인할 수 있는 서류(사업자등록증 등).
        </p>
      </div>
    </ModalShell>
  )
}
