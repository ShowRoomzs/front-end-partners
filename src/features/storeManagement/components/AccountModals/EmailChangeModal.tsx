import { Button } from "@/components/ui/button"
import { PasswordInput } from "@/common/components/Auth/PasswordInput"
import {
  ModalFieldError,
  ModalLabel,
  ModalNotice,
  ModalShell,
} from "@/features/storeManagement/components/ChangeRequestModal/ModalShell"
import {
  STORE_BUTTON_CLASS,
  STORE_INPUT_CLASS,
} from "@/features/storeManagement/components/StoreFormLayout/StoreFormLayout"
import { validateEmailFormat } from "@/features/auth/utils/validationHelpers"
import { basicInfoService } from "@/features/storeManagement/services/basicInfoService"
import {
  DUPLICATE_EMAIL_CODE,
  getFieldErrorCode,
  getFieldErrorMessage,
  INVALID_INPUT_CODE,
  PASSWORD_MISMATCH_CODE,
} from "@/features/storeManagement/utils/apiFieldError"
import { cn } from "@/lib/utils"
import { useState } from "react"

interface EmailChangeModalProps {
  isOpen: boolean
  onClose: () => void
  currentEmail: string
  onChanged: () => void
}

type EmailField = "currentPassword" | "newEmail"

/** M4 — 로그인 이메일 변경. 현재 비밀번호 확인 → 즉시 변경 확정(인증 링크 없음, §15-5) */
export function EmailChangeModal(props: EmailChangeModalProps) {
  const { isOpen, onClose, currentEmail, onChanged } = props

  const [currentPassword, setCurrentPassword] = useState("")
  const [newEmail, setNewEmail] = useState("")
  const [touched, setTouched] = useState<Partial<Record<EmailField, boolean>>>(
    {}
  )
  /** 제출해 봐야 알 수 있는 실패를 해당 칸 아래에 붙인다(비밀번호 불일치 / 이메일 중복) */
  const [submitErrors, setSubmitErrors] = useState<
    Partial<Record<EmailField, string>>
  >({})
  /** 어느 칸에도 매칭되지 않는 실패(월 1회 제한 등)는 모달 하단에 한 줄로 */
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const reset = () => {
    setCurrentPassword("")
    setNewEmail("")
    setTouched({})
    setSubmitErrors({})
    setFormError(null)
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const emailValidation = validateEmailFormat(newEmail)
  const errors: Partial<Record<EmailField, string>> = {
    currentPassword: !currentPassword.trim()
      ? "현재 비밀번호를 입력해 주세요."
      : undefined,
    newEmail: !newEmail.trim()
      ? "새 이메일을 입력해 주세요."
      : emailValidation !== true
        ? emailValidation
        : undefined,
  }
  const isFormValid = Object.values(errors).every(e => !e)

  const touch = (field: EmailField) =>
    setTouched(prev => ({ ...prev, [field]: true }))
  /** 서버 실패 문구가 형식 검증보다 우선한다 — 값이 형식상 멀쩡한데도 거부된 경우다 */
  const errorOf = (field: EmailField) =>
    submitErrors[field] ?? (touched[field] ? errors[field] : undefined)

  const handleSubmit = async () => {
    setTouched({ currentPassword: true, newEmail: true })
    setSubmitErrors({})
    setFormError(null)
    if (!isFormValid || isSubmitting) {
      return
    }
    setIsSubmitting(true)
    try {
      await basicInfoService.changeEmail({ currentPassword, newEmail })
      reset()
      onChanged()
    } catch (err) {
      /*
        실패 원인을 칸별로 갈라 붙인다. 모달 하단에 한 줄로 몰아두면 어느 칸을 고쳐야
        하는지 알 수 없고, 비밀번호 불일치는 401이라 인터셉터 토스트도 뜨지 않는다.
      */
      const code = getFieldErrorCode(err)
      if (code === PASSWORD_MISMATCH_CODE) {
        setSubmitErrors({
          currentPassword: "현재 비밀번호가 일치하지 않습니다.",
        })
      } else if (code === DUPLICATE_EMAIL_CODE) {
        setSubmitErrors({ newEmail: "이미 사용 중인 이메일입니다." })
      } else if (code === INVALID_INPUT_CODE) {
        // "현재 이메일과 동일합니다." 등 새 이메일 값 자체가 거부된 경우
        setSubmitErrors({
          newEmail: getFieldErrorMessage(err, "사용할 수 없는 이메일입니다."),
        })
      } else {
        setFormError(
          getFieldErrorMessage(err, "변경에 실패했습니다. 다시 시도해 주세요.")
        )
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
            className={STORE_BUTTON_CLASS}
            onClick={handleClose}
          >
            취소
          </Button>
          <Button
            type="button"
            size="sm"
            className={STORE_BUTTON_CLASS}
            disabled={!isFormValid}
            isLoading={isSubmitting}
            onClick={handleSubmit}
          >
            변경
          </Button>
        </>
      }
    >
      <ModalNotice>
        변경 즉시 <b className="text-sz-n-900">새 이메일이 로그인 계정</b>이
        되고, <b className="text-sz-n-900">자동으로 로그아웃</b>되어 새 이메일로
        다시 로그인해야 합니다. 로그인 이메일은{" "}
        <b className="text-sz-n-900">월 1회</b>만 변경할 수 있으니 정확히
        입력했는지 확인해 주세요. 변경 사실은 기존 이메일에도 알려드려요.
      </ModalNotice>

      <div className="mb-4">
        <ModalLabel>현재 이메일</ModalLabel>
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
        <ModalLabel required>현재 비밀번호</ModalLabel>
        {/* PasswordInput의 표시/숨김 버튼은 absolute다 — 라벨까지 감싸면 라벨 위로 올라붙는다 */}
        <div className="relative flex items-center">
          <PasswordInput
            value={currentPassword}
            onChange={e => {
              setCurrentPassword(e.target.value)
              setSubmitErrors(prev => ({ ...prev, currentPassword: undefined }))
            }}
            onBlur={() => touch("currentPassword")}
            placeholder="현재 비밀번호"
            hasError={!!errorOf("currentPassword")}
            className={STORE_INPUT_CLASS}
          />
        </div>
        {errorOf("currentPassword") && (
          <ModalFieldError>{errorOf("currentPassword")}</ModalFieldError>
        )}
      </div>

      <div>
        <ModalLabel required>새 이메일</ModalLabel>
        <input
          type="email"
          value={newEmail}
          onChange={e => {
            setNewEmail(e.target.value)
            setSubmitErrors(prev => ({ ...prev, newEmail: undefined }))
          }}
          onBlur={() => touch("newEmail")}
          placeholder="brand@example.com"
          className={cn(
            "w-full rounded-[6px] border bg-white text-[13px] text-sz-n-900 focus:border-sz-accent-500 focus:outline-none",
            STORE_INPUT_CLASS,
            errorOf("newEmail") ? "border-sz-danger-text" : "border-sz-n-300"
          )}
        />
        {errorOf("newEmail") && (
          <ModalFieldError>{errorOf("newEmail")}</ModalFieldError>
        )}
        <p className="mt-1.5 text-[11px] leading-[1.55] text-sz-n-500">
          이미 가입된 이메일은 사용할 수 없습니다.
        </p>
      </div>

      {formError && (
        <p role="alert" className="mt-3 text-[12px] text-sz-danger-text">
          {formError}
        </p>
      )}
    </ModalShell>
  )
}
