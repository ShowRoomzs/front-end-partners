import { PasswordInput } from "@/common/components/Auth/PasswordInput"
import { COOKIE_NAME } from "@/common/constants/cookie"
import { cookie } from "@/common/lib/cookie"
import { formatDateOnly } from "@/common/utils/formatDate"
import { Button } from "@/components/ui/button"
import { validatePasswordStrength } from "@/features/auth/utils/validationHelpers"
import { EmailChangeModal } from "@/features/storeManagement/components/AccountModals/EmailChangeModal"
import {
  StoreButtonRow,
  StoreField,
  StoreFormCard,
  StoreSection,
  STORE_INPUT_CLASS,
} from "@/features/storeManagement/components/StoreFormLayout/StoreFormLayout"
import { useGetAccountInfo } from "@/features/storeManagement/hooks/useGetAccountInfo"
import { basicInfoService } from "@/features/storeManagement/services/basicInfoService"
import { cn } from "@/lib/utils"
import { useState } from "react"
import toast from "react-hot-toast"

export default function AccountTab() {
  const { data, isLoading } = useGetAccountInfo()

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("")
  const [touched, setTouched] = useState(false)
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
  const isNewPasswordValid =
    newPasswordValidation === true && String(newPassword ?? "").trim().length > 0
  const isConfirmValid =
    String(newPasswordConfirm ?? "").trim().length > 0 && newPasswordConfirm === newPassword
  const canSubmit =
    String(currentPassword ?? "").trim().length > 0 && isNewPasswordValid && isConfirmValid

  const handleChangePassword = async () => {
    setTouched(true)
    if (!canSubmit || isSaving) {
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
      setTouched(false)
    } catch {
      // 현재 비밀번호 불일치 등은 apiInstance 인터셉터가 토스트로 띄운다
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
                className="shrink-0"
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
            error={
              touched && !String(currentPassword ?? "").trim()
                ? "현재 비밀번호를 입력해 주세요."
                : undefined
            }
          >
            <div className="relative flex items-center">
              <PasswordInput
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder="현재 비밀번호"
                hasError={touched && !String(currentPassword ?? "").trim()}
                className={STORE_INPUT_CLASS}
              />
            </div>
          </StoreField>
          <StoreField
            label="새 비밀번호"
            required
            error={
                touched && !isNewPasswordValid
                ? String(newPassword ?? "").trim().length === 0
                  ? "새 비밀번호를 입력해 주세요."
                  : (newPasswordValidation as string)
                : undefined
            }
          >
            <div className="relative flex items-center">
              <PasswordInput
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="8~16자 영문·숫자·특수문자 조합"
                hasError={touched && !isNewPasswordValid}
                className={STORE_INPUT_CLASS}
              />
            </div>
          </StoreField>
          <StoreField
            label="새 비밀번호 재입력"
            required
            error={
                touched && !isConfirmValid
                ? String(newPasswordConfirm ?? "").trim().length === 0
                  ? "새 비밀번호 확인을 입력해 주세요."
                  : "비밀번호가 일치하지 않습니다."
                : undefined
            }
          >
            <div className="relative flex items-center">
              <PasswordInput
                value={newPasswordConfirm}
                onChange={e => setNewPasswordConfirm(e.target.value)}
                placeholder="비밀번호를 다시 입력하세요"
                hasError={touched && !isConfirmValid}
                className={STORE_INPUT_CLASS}
              />
            </div>
          </StoreField>
        </StoreSection>

        <StoreButtonRow>
          <Button
            type="button"
            size="sm"
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
