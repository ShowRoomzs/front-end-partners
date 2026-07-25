import { queryClient } from "@/common/lib/queryClient"
import {
  authService,
  type CheckDuplicateResponse,
} from "@/features/auth/services/authService"
import {
  validateBusinessRegistrationNumber,
  validateEmailFormat,
  validateMarketNameRules,
} from "@/features/auth/utils/validationHelpers"

type DuplicationType = "email" | "marketName" | "businessRegistrationNumber"

const serviceMap: Record<
  DuplicationType,
  (value: string) => Promise<CheckDuplicateResponse>
> = {
  email: authService.checkEmailDuplicate,
  marketName: authService.checkMarketNameDuplicate,
  businessRegistrationNumber:
    authService.checkBusinessRegistrationNumberDuplicate,
}

// true = 사용 가능(중복 아님) / false = 중복 (백엔드 응답 필드는 isAvailable)
const checkDuplication = async (
  value: string,
  type: DuplicationType
): Promise<boolean> => {
  const service = serviceMap[type]
  const cachedQuery = queryClient.getQueryData<CheckDuplicateResponse>([
    "checkDuplication",
    type,
    value,
  ])

  if (cachedQuery) {
    return cachedQuery.available
  }
  const response = await service(value)
  queryClient.setQueryData(["checkDuplication", type, value], response)

  return response.available
}

export const checkEmailDuplicate = async (
  value: string
): Promise<string | undefined> => {
  // 형식이 유효할 때만 서버 조회(빈 값·잘못된 형식으로 인한 불필요한 400/토스트 방지)
  if (validateEmailFormat(value) !== true) return undefined
  const isAvailable = await checkDuplication(value, "email")
  return isAvailable
    ? undefined
    : "이미 신청이 접수된 이메일입니다. 심사 결과는 이메일·문자로 안내드립니다."
}

export const checkMarketNameDuplicate = async (
  value: string
): Promise<string | undefined> => {
  if (validateMarketNameRules(value) !== true) return undefined
  const isAvailable = await checkDuplication(value, "marketName")
  return isAvailable ? undefined : "이미 사용 중인 브랜드명입니다."
}

export const checkBusinessRegistrationNumberDuplicate = async (
  value: string
): Promise<string | undefined> => {
  if (validateBusinessRegistrationNumber(value) !== true) return undefined
  const isAvailable = await checkDuplication(
    value,
    "businessRegistrationNumber"
  )
  return isAvailable
    ? undefined
    : "이미 입점 신청이 접수된 사업자등록번호입니다. 담당자에게 확인해 주세요."
}
