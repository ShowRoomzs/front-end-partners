import "axios"

declare module "axios" {
  interface AxiosRequestConfig {
    /**
     * true면 응답 인터셉터가 에러 토스트를 띄우지 않는다.
     * 호출부가 에러를 직접 화면에 그리는 경우(검증 실패의 인라인 문구, 편집 충돌 확인창)에 쓴다 —
     * 안 그러면 같은 실패가 토스트와 화면에 두 번 뜬다.
     */
    suppressErrorToast?: boolean
  }
}
