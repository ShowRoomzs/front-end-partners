import { Button } from "@/components/ui/button"
import { PasswordInput } from "@/common/components/Auth/PasswordInput"
import { ModalShell } from "@/features/storeManagement/components/ChangeRequestModal/ModalShell"
import { STORE_INPUT_CLASS } from "@/features/storeManagement/components/StoreFormLayout/StoreFormLayout"
import { validateEmailFormat } from "@/features/auth/utils/validationHelpers"
import { basicInfoService } from "@/features/storeManagement/services/basicInfoService"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { isAxiosError } from "axios"

interface EmailChangeModalProps {
  isOpen: boolean
  onClose: () => void
  currentEmail: string
  onChanged: () => void
}

/** M4 — 로그인 이메일 변경. 현재 비밀번호 확인 → 즉시 변경 확정(인증 링크 없음, §15-5) */
export function EmailChangeModal(props: EmailChangeModalProps) {
  const { isOpen, onClose, currentEmail, onChanged } = props

  const [currentPassword, setCurrentPassword] = useState("")
  const [newEmail, setNewEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [interacted, setInteracted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const reset = () => {
    setCurrentPassword("")
    setNewEmail("")
    setError(null)
    setInteracted(false)
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const emailValidation = validateEmailFormat(newEmail)
  const isEmailValid = emailValidation === true && String(newEmail ?? "").trim().length > 0
  const canSubmit = String(currentPassword ?? "").trim().length > 0 && isEmailValid

  const handleSubmit = async () => {
    setInteracted(true)
    setError(null)
    if (!canSubmit || isSubmitting) {
      return
    }
    setIsSubmitting(true)
    try {
      await basicInfoService.changeEmail({ currentPassword, newEmail })
      reset()
      onChanged()
    } catch (err) {
      // 400(비밀번호 불일치·이메일 중복)은 여기서 모달 안에 표시 —
      // apiInstance 인터셉터 토스트만으로는 모달이 닫힐 때 사라져 원인을 놓치기 쉽다.
      if (isAxiosError(err) && err.response) {
        setError(err.response.data?.message ?? "변경에 실패했습니다.")
      } else {
        setError("변경에 실패했습니다. 다시 시도해 주세요.")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <ModalShell
      isOpen={isOpen}
      title="로그인 이메일 변경"
      width={460}
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
            isLoading={isSubmitting}
            onClick={handleSubmit}
          >
            변경
          </Button>
        </>
      }
    >
      <div className="mb-4 flex gap-2 rounded-[6px] bg-sz-info-bg p-3.5 text-[11px] leading-[1.65] text-sz-n-700">
        <span className="mt-px flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-sz-info-text text-[10px] font-bold text-white">
          i
        </span>
        <span>
          변경 즉시 <b>새 이메일이 로그인 계정</b>이 되고,{" "}
          <b>자동으로 로그아웃</b>되어 새 이메일로 다시 로그인해야 합니다.
          로그인 이메일은 <b>월 1회</b>만 변경할 수 있으니 정확히 입력했는지
          확인해 주세요. 변경 사실은 기존 이메일에도 알려드려요.
        </span>
      </div>

      <div className="mb-4">
        <label className="mb-1 block text-[12px] font-medium text-sz-n-600">
          현재 이메일
        </label>
        <input
          disabled
          value={currentEmail}
          className={cn(
            "w-full rounded-[6px] border border-sz-n-200 bg-sz-n-100 text-[13px] text-sz-n-500",
            STORE_INPUT_CLASS
          )}
        />
      </div>

      <div className="mb-4">
        <label className="mb-1 block text-[12px] font-medium text-sz-n-600">
          현재 비밀번호<span className="ml-0.5 text-sz-danger-text">*</span>
        </label>
        {/* PasswordInput의 표시/숨김 버튼은 absolute다 — 라벨까지 감싸면 라벨 위로 올라붙는다 */}
        <div className="relative flex items-center">
          <PasswordInput
            value={currentPassword}
            onChange={e => setCurrentPassword(e.target.value)}
            placeholder="현재 비밀번호"
            hasError={interacted && !String(currentPassword ?? "").trim()}
            className={STORE_INPUT_CLASS}
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-[12px] font-medium text-sz-n-600">
          새 이메일<span className="ml-0.5 text-sz-danger-text">*</span>
        </label>
        <input
          type="email"
          value={newEmail}
          onChange={e => setNewEmail(e.target.value)}
          placeholder="brand@example.com"
          className={cn(
            "w-full rounded-[6px] border bg-white text-[13px] text-sz-n-900 focus:border-sz-accent-500 focus:outline-none",
            STORE_INPUT_CLASS,
            interacted && !isEmailValid
              ? "border-sz-danger-text"
              : "border-sz-n-300"
          )}
        />
        <p className="mt-1.5 text-[11px] leading-[1.55] text-sz-n-500">
          이미 가입된 이메일은 사용할 수 없습니다.
        </p>
      </div>

      {error && <p className="mt-3 text-[12px] text-sz-danger-text">{error}</p>}
    </ModalShell>
  )
}
