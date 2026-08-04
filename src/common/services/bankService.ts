import { authInstance } from "@/common/lib/authInstance"

// 서버 응답 필드명은 code/name이다 (bankCode/bankName 아님).
// code는 금융결제원 표준 3자리 코드 문자열 — "004"처럼 0 패딩이 유지돼야 한다.
export interface Bank {
  code: string
  name: string
}

type BanksResponse = Array<Bank>

export const bankService = {
  // 비로그인 상태(회원가입)에서 호출하므로 authInstance를 쓴다.
  // 에러는 필드 인라인으로 표현하므로 전역 토스트는 끈다.
  getBanks: async () => {
    const { data: response } = await authInstance.get<BanksResponse>(
      "/common/banks",
      { suppressErrorToast: true }
    )

    return response
  },
}
