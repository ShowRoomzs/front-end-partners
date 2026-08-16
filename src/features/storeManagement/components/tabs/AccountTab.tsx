import { PasswordInput } from "@/common/components/Auth/PasswordInput"
import { COOKIE_NAME } from "@/common/constants/cookie"
import { cookie } from "@/common/lib/cookie"
import { formatDateOnly, formatDateTimeShort } from "@/common/utils/formatDate"
import { Button } from "@/components/ui/button"
import { validatePasswordStrength } from "@/features/auth/utils/validationHelpers"
import { EmailChangeModal } from "@/features/storeManagement/components/AccountModals/EmailChangeModal"
import RequestBanner from "@/features/storeManagement/components/RequestBanner/RequestBanner"
import {
  getFieldErrorCode,
  getFieldErrorMessage,
  PASSWORD_MISMATCH_CODE,
} from "@/features/storeManagement/utils/apiFieldError"
import {
  StoreButtonRow,
  StoreField,
  StoreFormCard,
  StoreSection,
  STORE_BUTTON_CLASS,
  STORE_INPUT_CLASS,
} from "@/features/storeManagement/components/StoreFormLayout/StoreFormLayout"
import { useGetAccountInfo } from "@/features/storeManagement/hooks/useGetAccountInfo"
import { basicInfoService } from "@/features/storeManagement/services/basicInfoService"
import { cn } from "@/lib/utils"
import { useState } from "react"
import toast from "react-hot-toast"

type PasswordField = "currentPassword" | "newPassword" | "newPasswordConfirm"

export default function AccountTab() {
  const { data, isLoading } = useGetAccountInfo()

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("")
  const [touched, setTouched] = useState<
    Partial<Record<PasswordField, boolean>>
  >({})
  /** 현재 비밀번호 불일치 — 원인이 그 칸 하나로 특정되므로 칸 아래에 붙인다 */
  const [passwordMismatch, setPasswordMismatch] = useState<string | null>(null)
  /** 어느 칸의 문제인지 특정할 수 없는 실패 — 버튼 위에 한 줄로 */
  const [formError, setFormError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false)

  /**
   * 로그인 이메일을 바꾸면 그 세션은 더 못 쓴다 — 화면에 남겨두면 안 된다.
   *
   * 서버는 이메일을 리프레시 토큰의 키로 쓰기 때문에 변경 시 그 토큰을 **삭제**한다.
   * 게다가 지금 들고 있는 액세스 토큰의 subject는 여전히 구 이메일이라, 이후
   * 셀러 API를 호출하면 서버가 그 이메일로 계정을 찾지 못해 전부 실패한다.
   * 그래서 성공 즉시 쿠키를 비우고 로그인 화면으로 새로 띄운다.
   */
  const handleEmailChanged = () => {
    cookie.remove(COOKIE_NAME.ACCESS_TOKEN)
    cookie.remove(COOKIE_NAME.REFRESH_TOKEN)
    // navigate가 아니라 문서 교체 — 라우터가 accessToken 유무로 트리를 갈아끼우므로
    // 같은 라우터 안에서 이동시키면 주소와 화면이 어긋난다.
    window.location.replace("/login")
  }

  const newPasswordValidation = validatePasswordStrength(newPassword)

  // 가입·온보딩과 같은 규칙: blur 이후 검사 → 이후 입력 변경 시 즉시 재검사.
  // 문구는 ui-partner-02-signup Step1과 동일하게 맞춘다.
  const errors: Partial<Record<PasswordField, string>> = {
    currentPassword: !currentPassword.trim()
      ? "현재 비밀번호를 입력해 주세요."
      : undefined,
    newPassword: !newPassword.trim()
      ? "새 비밀번호를 입력해 주세요."
      : newPasswordValidation !== true
        ? newPasswordValidation
        : undefined,
    newPasswordConfirm: !newPasswordConfirm.trim()
      ? "새 비밀번호 확인을 입력해 주세요."
      : newPasswordConfirm !== newPassword
        ? "비밀번호가 일치하지 않습니다."
        : undefined,
  }
  const isFormValid = Object.values(errors).every(e => !e)

  const touch = (field: PasswordField) =>
    setTouched(prev => ({ ...prev, [field]: true }))
  /** 표시 대상 오류 — blur 전에는 숨긴다. 현재 비밀번호는 서버 실패 문구가 우선한다 */
  const errorOf = (field: PasswordField) => {
    if (field === "currentPassword" && passwordMismatch) {
      return passwordMismatch
    }
    return touched[field] ? errors[field] : undefined
  }

  const handleChangePassword = async () => {
    setTouched({
      currentPassword: true,
      newPassword: true,
      newPasswordConfirm: true,
    })
    setPasswordMismatch(null)
    setFormError(null)
    if (!isFormValid || isSaving) {
      return
    }
    setIsSaving(true)
    try {
      await basicInfoService.changePassword({
        currentPassword,
        newPassword,
        newPasswordConfirm,
      })
      toast.success("비밀번호가 변경되었습니다.")
      setCurrentPassword("")
      setNewPassword("")
      setNewPasswordConfirm("")
      setTouched({})
    } catch (err) {
      // 비밀번호 불일치는 401이라 인터셉터가 토스트도 못 띄운다 — 여기서 칸 아래에 붙인다.
      // 그 외의 실패는 어느 칸 탓인지 알 수 없으므로 현재 비밀번호에 뒤집어씌우지 않는다.
      if (getFieldErrorCode(err) === PASSWORD_MISMATCH_CODE) {
        setPasswordMismatch("현재 비밀번호가 일치하지 않습니다.")
      } else {
        setFormError(
          getFieldErrorMessage(err, "비밀번호를 변경하지 못했습니다.")
        )
      }
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading || !data) {
    return (
      <StoreFormCard>
        <div className="p-5 text-[12px] text-sz-n-500">불러오는 중…</div>
      </StoreFormCard>
    )
  }

  return (
    <>
      <StoreFormCard>
        {/* 4-E — 월 1회 제한을 이미 쓴 상태. 조치가 필요한 게 아니라 안내라서 정보색·버튼 없음 */}
        {!data.emailChangeable && (
          <RequestBanner
            tone="info"
            title="이번 달 이메일 변경 완료"
            body={
              <>
                {formatDateTimeShort(data.lastEmailChangedAt)} 변경 · 로그인
                이메일은 <b className="text-sz-n-900">월 1회</b>만 변경할 수
                있어요. 다음 변경 가능일은{" "}
                <b className="text-sz-n-900">
                  {formatDateOnly(data.nextEmailChangeableAt)}
                </b>
                입니다.
              </>
            }
          />
        )}

        <StoreSection>
          <StoreField
            label="로그인 이메일"
            hint={
              data.emailChangeable
                ? "현재 비밀번호 확인 후 즉시 변경됩니다. 월 1회만 변경할 수 있어요."
                : `${formatDateOnly(data.nextEmailChangeableAt)}부터 다시 변경할 수 있어요.`
            }
          >
            <div className="flex gap-2">
              <input
                disabled
                value={data.loginEmail}
                className={cn(
                  "w-full rounded-[6px] border border-sz-n-200 bg-sz-n-100 text-[13px] text-sz-n-500",
                  STORE_INPUT_CLASS
                )}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className={cn("shrink-0", STORE_BUTTON_CLASS)}
                disabled={!data.emailChangeable}
                onClick={() => setIsEmailModalOpen(true)}
              >
                변경
              </Button>
            </div>
          </StoreField>
        </StoreSection>

        <StoreSection title="비밀번호 변경">
          <StoreField
            label="현재 비밀번호"
            required
            error={errorOf("currentPassword")}
          >
            <div className="relative flex items-center">
              <PasswordInput
                value={currentPassword}
                onChange={e => {
                  setCurrentPassword(e.target.value)
                  // 고치기 시작하면 이전 실패 문구는 더 이상 사실이 아니다
                  setPasswordMismatch(null)
                }}
                onBlur={() => touch("currentPassword")}
                placeholder="현재 비밀번호"
                hasError={!!errorOf("currentPassword")}
                className={STORE_INPUT_CLASS}
              />
            </div>
          </StoreField>
          <StoreField
            label="새 비밀번호"
            required
            error={errorOf("newPassword")}
          >
            <div className="relative flex items-center">
              <PasswordInput
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                onBlur={() => touch("newPassword")}
                placeholder="8~16자 영문·숫자·특수문자 조합"
                hasError={!!errorOf("newPassword")}
                className={STORE_INPUT_CLASS}
              />
            </div>
          </StoreField>
          <StoreField
            label="새 비밀번호 재입력"
            required
            error={errorOf("newPasswordConfirm")}
          >
            <div className="relative flex items-center">
              <PasswordInput
                value={newPasswordConfirm}
                onChange={e => setNewPasswordConfirm(e.target.value)}
                onBlur={() => touch("newPasswordConfirm")}
                placeholder="비밀번호를 다시 입력하세요"
                hasError={!!errorOf("newPasswordConfirm")}
                className={STORE_INPUT_CLASS}
              />
            </div>
          </StoreField>
        </StoreSection>

        {formError && (
          <p
            role="alert"
            className="px-5 pt-1 text-right text-[12px] text-sz-danger-text"
          >
            {formError}
          </p>
        )}

        <StoreButtonRow>
          <Button
            type="button"
            size="sm"
            className={STORE_BUTTON_CLASS}
            disabled={!isFormValid}
            isLoading={isSaving}
            onClick={handleChangePassword}
          >
            변경 저장
          </Button>
        </StoreButtonRow>
      </StoreFormCard>

      <EmailChangeModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        currentEmail={data.loginEmail}
        onChanged={handleEmailChanged}
      />
    </>
  )
}
