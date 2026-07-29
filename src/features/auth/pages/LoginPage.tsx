import { useState } from "react"
import { useForm } from "react-hook-form"
import { useLocation, useNavigate } from "react-router-dom"
import { isAxiosError } from "axios"
import { cn } from "@/lib/utils"
import { AuthShell } from "@/common/components/Auth/AuthShell"
import { FormField } from "@/common/components/Auth/FormField"
import { PasswordInput } from "@/common/components/Auth/PasswordInput"
import { authInputClass } from "@/common/components/Auth/authStyles"
import {
  authService,
  type LoginData,
} from "@/features/auth/services/authService"
import { useCookie } from "@/common/hooks/useCookie"
import { COOKIE_NAME } from "@/common/constants/cookie"
import { useMarketStore } from "@/common/stores/useMarketStore"

const SERVER_ERROR_MESSAGE =
  "일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요."

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { setRole } = useMarketStore()
  const [, setAccessToken] = useCookie<string>(COOKIE_NAME.ACCESS_TOKEN)
  const [, setRefreshToken] = useCookie<string>(COOKIE_NAME.REFRESH_TOKEN)

  // 상태 C(서버 일시 오류) 배너
  const [serverError, setServerError] = useState<string | null>(null)
  // 안내 배너 — 온보딩에서 registerToken이 만료돼 돌려보내진 경우 등
  const [info, setInfo] = useState<string | null>(
    (location.state as { info?: string } | null)?.info ?? null
  )

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginData>({
    mode: "onTouched",
    reValidateMode: "onChange",
    defaultValues: { email: "", password: "" },
  })

  const onSubmit = async (data: LoginData) => {
    setServerError(null)
    setInfo(null)
    try {
      const res = await authService.login(data, { suppressErrorToast: true })

      // 승인 후 첫 로그인: access/refresh 없이 registerToken(5분)만 온다.
      // 온보딩 게이트에서 필수 정보를 제출해야 정식 토큰이 발급되므로 여기서는 로그인 처리를 하지 않는다.
      if (res.isNewMember) {
        if (!res.registerToken) {
          setServerError(SERVER_ERROR_MESSAGE)
          return
        }
        navigate("/onboarding", {
          state: { registerToken: res.registerToken },
        })
        return
      }

      setRole(res.role)
      setAccessToken(res.accessToken)
      setRefreshToken(res.refreshToken)
      navigate("/")
    } catch (err) {
      if (!isAxiosError(err) || !err.response) {
        // 네트워크 오류 등 → 서버 일시 오류 배너
        setServerError(SERVER_ERROR_MESSAGE)
        return
      }
      const status = err.response.status
      const code = err.response.data?.code as string | undefined

      // rev.7 에러 매핑(전부 필드별 인라인·분리) — 백엔드 code 기준:
      // - PASSWORD_MISMATCH(승인 계정 비번 불일치) → 비밀번호 필드.
      // - EMAIL_NOT_REGISTERED(미가입·탈퇴·심사대기·반려 통합) → 이메일 필드.
      //   (둘 다 401이라 status가 아닌 code로 구분해야 함. 그 외 401/403은 이메일 필드로 폴백.)
      // - 그 외(5xx 등) → 서버 일시 오류 배너.
      if (code === "PASSWORD_MISMATCH") {
        setError("password", { message: "비밀번호가 일치하지 않습니다." })
      } else if (
        code === "EMAIL_NOT_REGISTERED" ||
        status === 401 ||
        status === 403
      ) {
        setError("email", { message: "등록되지 않은 이메일입니다." })
      } else {
        setServerError(SERVER_ERROR_MESSAGE)
      }
    }
  }

  return (
    <AuthShell width={400} subtitle="브랜드 파트너센터" align="center">
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        {serverError && (
          <div
            role="alert"
            className="mb-5 rounded-[6px] bg-sz-warning-bg px-3.5 py-3"
          >
            <div className="flex items-center gap-2 text-[13px] font-semibold text-sz-n-900">
              <span className="inline-flex items-center rounded-[10px] bg-white px-2 py-0.5 text-[11px] font-medium text-sz-warning-text">
                오류
              </span>
              일시적인 오류가 발생했습니다
            </div>
            <p className="mt-1.5 text-[12px] text-sz-n-600">
              잠시 후 다시 시도해 주세요. 문제가 반복되면 이용에 참고해 주세요.
            </p>
          </div>
        )}

        {info && (
          <div
            role="status"
            className="mb-5 rounded-[6px] bg-sz-info-bg px-3.5 py-3 text-[12px] text-sz-n-700"
          >
            {info}
          </div>
        )}

        <FormField label="이메일" htmlFor="email" error={errors.email?.message}>
          <input
            id="email"
            type="email"
            placeholder="brand@example.com"
            disabled={isSubmitting}
            className={authInputClass(!!errors.email)}
            {...register("email", { required: "이메일을 입력해 주세요." })}
          />
        </FormField>

        <FormField
          label="비밀번호"
          htmlFor="password"
          error={errors.password?.message}
        >
          <PasswordInput
            id="password"
            placeholder="비밀번호를 입력하세요"
            hasError={!!errors.password}
            disabled={isSubmitting}
            {...register("password", { required: "비밀번호를 입력해 주세요." })}
          />
        </FormField>

        <button
          type="submit"
          disabled={isSubmitting}
          className={cn(
            "mt-6 flex h-10 w-full items-center justify-center gap-2 rounded-[6px] text-[13px] font-medium text-white transition-colors",
            isSubmitting
              ? "cursor-progress bg-sz-n-700"
              : "bg-sz-auth-action hover:bg-sz-auth-action-hover"
          )}
        >
          {isSubmitting && (
            <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/35 border-t-white" />
          )}
          {isSubmitting ? "로그인 중" : "로그인"}
        </button>

        <div className="mt-4 flex items-center justify-center">
          <button
            type="button"
            onClick={() => navigate("/register/market")}
            className="text-[12px] text-sz-n-600 hover:text-sz-n-900 hover:underline"
          >
            회원가입
          </button>
        </div>
      </form>
    </AuthShell>
  )
}
