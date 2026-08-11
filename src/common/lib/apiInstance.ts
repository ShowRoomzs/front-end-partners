import { COOKIE_NAME } from "@/common/constants/cookie"
import { cookie } from "@/common/lib/cookie"
import { authService } from "@/features/auth/services/authService"
import axios from "axios"
import toast from "react-hot-toast"

export const apiInstance = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/v1`,
})
apiInstance.interceptors.request.use(config => {
  const accessToken = cookie.get(COOKIE_NAME.ACCESS_TOKEN)
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

apiInstance.interceptors.response.use(
  res => res,
  async error => {
    const config = error.config ?? {}

    if (error.response?.status === 401) {
      const refreshToken = cookie.get(COOKIE_NAME.REFRESH_TOKEN)

      /*
        `_retry`가 없으면 갱신 후 재요청이 또 401일 때 갱신→재요청이 무한히 돈다.
        한 요청당 한 번만 갱신을 시도한다.
      */
      if (!refreshToken || config._retry) {
        return Promise.reject(error)
      }
      config._retry = true

      try {
        const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
          await authService.refresh(refreshToken)
        cookie.set(COOKIE_NAME.ACCESS_TOKEN, newAccessToken)
        cookie.set(COOKIE_NAME.REFRESH_TOKEN, newRefreshToken)

        return await apiInstance(config)
      } catch {
        // 갱신 실패는 인터셉터 밖으로 흘리지 않는다 —
        // 여기서 던지면 원래 401이 갱신 에러로 바뀌어 원인을 못 찾는다
        return Promise.reject(error)
      }
    }

    /*
      네트워크 끊김·CORS·타임아웃이면 response 자체가 없다.
      예전엔 error.response.data.message를 바로 읽어서 인터셉터가 먼저 터졌고,
      정작 원래 실패 원인은 화면에 아무것도 안 뜨는 채로 묻혔다.
    */
    const message =
      error.response?.data?.message ??
      "요청을 처리하지 못했습니다. 네트워크 상태를 확인한 뒤 다시 시도해 주세요."
    toast.error(message)
    return Promise.reject(error)
  }
)
