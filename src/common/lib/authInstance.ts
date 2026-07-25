import { COOKIE_NAME } from "@/common/constants/cookie"
import { cookie } from "@/common/lib/cookie"
import axios, { isAxiosError } from "axios"
import toast from "react-hot-toast"

// 호출부에서 { suppressErrorToast: true }를 넘기면 이 인스턴스의 전역 에러 토스트를 끈다.
// (로그인/회원가입처럼 에러를 필드 인라인·배너로 직접 표현하는 화면 전용)
declare module "axios" {
  export interface AxiosRequestConfig {
    suppressErrorToast?: boolean
  }
}

export const authInstance = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/v1`,
})

authInstance.interceptors.response.use(
  res => res,
  error => {
    const suppressErrorToast = error.config?.suppressErrorToast === true
    const hasAccessToken = !!cookie.get(COOKIE_NAME.ACCESS_TOKEN)
    if (error.response?.status === 401 && hasAccessToken) {
      cookie.remove(COOKIE_NAME.ACCESS_TOKEN)
      cookie.remove(COOKIE_NAME.REFRESH_TOKEN)
      if (!suppressErrorToast) {
        toast.error("세션이 만료되었습니다. 다시 로그인해주세요.")
      }
      return
    }
    if (isAxiosError(error) && !suppressErrorToast) {
      const message = error.response?.data?.message
      toast.error(message)
    }
    return Promise.reject(error)
  }
)
