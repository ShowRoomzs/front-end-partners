import { isAxiosError } from "axios"

/*
  백엔드 API가 아직 없는 화면(브랜드 탈퇴 신청)의 데이터 원천.
  정산 관리 · 배송·반품 정책은 실제 API로 옮겼다(2026-10-17).

  개발 서버(`pnpm dev`)에서만 목업으로 채우고, 배포본에서는 각 화면이 「준비 중」을 띄운다 —
  실제 브랜드에게 가짜 값이 보이면 안 된다. API가 생기면 각 서비스 함수의 본문만 바꾼다.
*/

export const DEV_MOCK_ENABLED = import.meta.env.DEV

/** 목업 응답에 네트워크 지연을 흉내 낸다 — 로딩 상태를 눈으로 확인할 수 있게 */
export function mockDelay<T>(value: T, ms = 250): Promise<T> {
  return new Promise(resolve => {
    setTimeout(() => resolve(structuredClone(value)), ms)
  })
}

/**
 * 시안의 다른 상태를 보고 싶을 때 주소에 `?mock=<값>`을 붙인다(개발 서버 전용).
 * 예: 기본정보 관리 `?tab=account&mock=withdraw-blocked`
 */
export function mockScenario(): string | null {
  if (!DEV_MOCK_ENABLED) return null
  return new URLSearchParams(window.location.search).get("mock")
}

export class ApiNotReadyError extends Error {
  constructor(feature: string) {
    super(`${feature} API가 아직 준비되지 않았습니다.`)
    this.name = "ApiNotReadyError"
  }
}

/**
 * 백엔드 main에는 있으나 개발 서버에 아직 배포되지 않은 API(2026-10-24 기준 1017 · 1021 설계분).
 *
 * 실호출을 먼저 하고, 서버가 그 경로를 모르면(404 · 405) 배포본은 `ApiNotReadyError`(화면은 「준비 중」),
 * 개발 서버는 목업으로 채운다. 배포되면 코드를 고치지 않아도 실데이터로 바뀐다.
 * 개발 서버는 로컬 로그인이 막혀(CORS) 실호출이 대개 실패하므로 어떤 실패든 목업으로 넘긴다.
 *
 * 실호출에는 `{ suppressErrorToast: true }`를 넘겨, 아직 없는 경로의 404 토스트가 뜨지 않게 한다.
 */
export async function callOrMock<T>(
  feature: string,
  real: () => Promise<T>,
  mock: () => Promise<T>
): Promise<T> {
  try {
    return await real()
  } catch (error) {
    if (DEV_MOCK_ENABLED) return mock()
    if (isAxiosError(error) && [404, 405].includes(error.response?.status ?? 0))
      throw new ApiNotReadyError(feature)
    throw error
  }
}

/** `callOrMock`의 실패가 「아직 배포 안 됨」인지 — 화면이 「준비 중」을 고를 때 쓴다 */
export const isApiNotReady = (error: unknown) =>
  error instanceof ApiNotReadyError
