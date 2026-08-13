import { useGetBanks } from "@/common/hooks/useGetBanks"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  EvidenceUpload,
  type EvidenceFile,
} from "@/features/storeManagement/components/ChangeRequestModal/EvidenceUpload"
import { ModalShell } from "@/features/storeManagement/components/ChangeRequestModal/ModalShell"
import { STORE_INPUT_CLASS } from "@/features/storeManagement/components/StoreFormLayout/StoreFormLayout"
import {
  changeRequestService,
  type ChangeRequestCreateResponse,
} from "@/features/storeManagement/services/changeRequestService"
import type { SettlementInfoResponse } from "@/features/storeManagement/services/basicInfoService"
import { cn } from "@/lib/utils"
import { useState } from "react"

interface SettlementRequestModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmitted: (response: ChangeRequestCreateResponse) => void
  /** 모달의 "현재 계좌" 표시행 — 이미 로드된 정산 탭 데이터를 그대로 쓴다(재조회 불필요) */
  current: SettlementInfoResponse
}

/** 하이픈·공백 등 숫자가 아닌 문자를 전부 제거한다(§15-3 — 하이픈 없이 숫자만 10~16자리) */
function digitsOnly(value: string) {
  return value.replace(/[^0-9]/g, "")
}

/**
 * M2 — 정산 계좌 변경 요청.
 *
 * 셀프 변경이 없는 민감정보라 은행·계좌번호·예금주 3개가 고정 항목이다(체크박스 없음,
 * `/change-requests/fields` 호출도 필요 없다). 사유는 백엔드에서 선택값이고 시안에도
 * 입력칸이 없어 만들지 않는다 — M1과 달리 여기선 증빙(통장 사본)이 사유 역할을 겸한다.
 */
export function SettlementRequestModal(props: SettlementRequestModalProps) {
  const { isOpen, onClose, onSubmitted, current } = props

  const { data: banks } = useGetBanks(isOpen)
  const [bankCode, setBankCode] = useState("")
  const [accountNumber, setAccountNumber] = useState("")
  const [accountHolder, setAccountHolder] = useState("")
  const [evidence, setEvidence] = useState<EvidenceFile | null>(null)
  const [interacted, setInteracted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const reset = () => {
    setBankCode("")
    setAccountNumber("")
    setAccountHolder("")
    setEvidence(null)
    setInteracted(false)
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const accountNumberValid =
    accountNumber.length >= 10 && accountNumber.length <= 16
  const canSubmit =
    !!bankCode &&
    accountNumberValid &&
    accountHolder.trim().length > 0 &&
    !!evidence

  const handleSubmit = async () => {
    setInteracted(true)
    if (!canSubmit || !evidence || isSubmitting) {
      return
    }
    setIsSubmitting(true)
    try {
      const response = await changeRequestService.create({
        type: "SETTLEMENT_ACCOUNT",
        items: [
          { fieldKey: "BANK_CODE", requestedValue: bankCode },
          { fieldKey: "ACCOUNT_NUMBER", requestedValue: accountNumber },
          { fieldKey: "ACCOUNT_HOLDER", requestedValue: accountHolder },
        ],
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
      title="정산 계좌 변경 요청"
      width={540}
      onClose={handleClose}
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClose}
          >
            취소
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={interacted && !canSubmit}
            onClick={handleSubmit}
            isLoading={isSubmitting}
          >
            변경 요청
          </Button>
        </>
      }
    >
      <div className="mb-4 flex gap-2 rounded-[6px] bg-sz-info-bg p-3.5 text-[11px] leading-[1.65] text-sz-n-700">
        <span className="mt-px flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-sz-info-text text-[10px] font-bold text-white">
          i
        </span>
        <span>
          정산 계좌는 <b>통장 사본 대조 후 운영자가 직접 반영</b>해요. 정산 예정
          금액이 있으면 반영 완료 이전 회차는 기존 계좌로 지급됩니다.
        </span>
      </div>

      <div className="mb-4">
        <label className="mb-1 block text-[12px] font-medium text-sz-n-600">
          현재 계좌
        </label>
        <input
          disabled
          value={`${current.bankName} ${current.maskedAccountNumber} · ${current.accountHolder}`}
          className={cn(
            "w-full rounded-[6px] border border-sz-n-200 bg-sz-n-100 text-[13px] text-sz-n-500",
            STORE_INPUT_CLASS
          )}
        />
      </div>

      <div className="mb-4 h-px bg-sz-n-200" />

      <div className="mb-4">
        <label className="mb-1 block text-[12px] font-medium text-sz-n-600">
          변경할 은행<span className="ml-0.5 text-sz-danger-text">*</span>
        </label>
        <Select value={bankCode || undefined} onValueChange={setBankCode}>
          <SelectTrigger
            className={cn(
              "w-full",
              STORE_INPUT_CLASS,
              interacted && !bankCode && "border-sz-danger-text"
            )}
          >
            <SelectValue placeholder="은행 선택" />
          </SelectTrigger>
          <SelectContent>
            {/* value는 은행 코드, 표시는 은행명 — 서버가 노출 순서대로 내려주므로 재정렬하지 않는다 */}
            {banks?.map(b => (
              <SelectItem key={b.code} value={b.code}>
                {b.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="mb-4">
        <label className="mb-1 block text-[12px] font-medium text-sz-n-600">
          변경할 계좌번호<span className="ml-0.5 text-sz-danger-text">*</span>
        </label>
        <input
          type="text"
          inputMode="numeric"
          maxLength={16}
          value={accountNumber}
          onChange={e => setAccountNumber(digitsOnly(e.target.value))}
          placeholder="- 없이 숫자만 입력"
          className={cn(
            "w-full rounded-[6px] border bg-white text-[13px] text-sz-n-900 focus:border-sz-accent-500 focus:outline-none",
            STORE_INPUT_CLASS,
            interacted && !accountNumberValid
              ? "border-sz-danger-text"
              : "border-sz-n-300"
          )}
        />
        {interacted && !accountNumberValid && (
          <p className="mt-1.5 text-[12px] text-sz-danger-text">
            계좌번호는 10~16자리 숫자로 입력해 주세요.
          </p>
        )}
      </div>

      <div className="mb-4">
        <label className="mb-1 block text-[12px] font-medium text-sz-n-600">
          예금주명<span className="ml-0.5 text-sz-danger-text">*</span>
        </label>
        <input
          type="text"
          value={accountHolder}
          onChange={e => setAccountHolder(e.target.value)}
          placeholder="법인은 법인 명의 계좌만"
          className={cn(
            "w-full rounded-[6px] border bg-white text-[13px] text-sz-n-900 focus:border-sz-accent-500 focus:outline-none",
            STORE_INPUT_CLASS,
            interacted && !accountHolder.trim()
              ? "border-sz-danger-text"
              : "border-sz-n-300"
          )}
        />
      </div>

      <div>
        <label className="mb-1 block text-[12px] font-medium text-sz-n-600">
          통장 사본<span className="ml-0.5 text-sz-danger-text">*</span>
        </label>
        <EvidenceUpload
          label="통장 사본"
          value={evidence}
          onChange={setEvidence}
          error={
            interacted && !evidence ? "통장 사본을 첨부해 주세요." : undefined
          }
        />
      </div>
    </ModalShell>
  )
}
