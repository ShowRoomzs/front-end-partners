import { isAxiosError } from "axios"

/**
 * 서버 실패 응답에서 `code`를 꺼낸다 — 어느 **필드** 아래에 문구를 붙일지 고르기 위해서다.
 *
 * 계정 탭의 400/401은 토스트 하나로 뭉뚱그릴 수 없다. "현재 비밀번호가 일치하지 않습니다"는
 * 현재 비밀번호 칸에, "이미 사용 중인 이메일입니다"는 새 이메일 칸에 붙어야 사용자가
 * 어디를 고쳐야 하는지 안다. 메시지 문자열로 분기하면 서버 문구가 바뀔 때 조용히 깨지므로
 * `ErrorCode`의 안정적인 `code` 값을 기준으로 삼는다.
 *
 * ⚠️ 비밀번호 불일치(`PASSWORD_MISMATCH`)는 서버가 **401**로 내려준다. `apiInstance`
 * 인터셉터가 401을 토큰 만료로 보고 재발급→재요청을 한 번 시도한 뒤, 두 번째 실패는
 * 토스트 없이 그대로 reject한다 — 그래서 이 경우 화면에 아무 문구도 뜨지 않았다.
 * 인라인 표시가 선택이 아니라 유일한 통로다.
 */
export function getFieldErrorCode(error: unknown): string | null {
  if (!isAxiosError(error)) {
    return null
  }
  const code = (error.response?.data as { code?: unknown } | undefined)?.code
  return typeof code === "string" ? code : null
}

/** 서버가 내려준 실패 메시지. 없으면 호출부가 정한 기본 문구를 쓴다 */
export function getFieldErrorMessage(error: unknown, fallback: string): string {
  if (!isAxiosError(error)) {
    return fallback
  }
  const message = (error.response?.data as { message?: unknown } | undefined)
    ?.message
  return typeof message === "string" && message.length > 0 ? message : fallback
}

/** 현재 비밀번호 불일치 — 계정 탭 비밀번호 변경과 이메일 변경 모달이 함께 쓴다 */
export const PASSWORD_MISMATCH_CODE = "PASSWORD_MISMATCH"
/** 이미 가입된 이메일 */
export const DUPLICATE_EMAIL_CODE = "DUPLICATE_EMAIL"
/** 현재 이메일과 동일 등 입력값 자체가 거부된 경우 */
export const INVALID_INPUT_CODE = "INVALID_INPUT"
