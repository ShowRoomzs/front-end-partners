import { queryClient } from '@/common/lib/queryClient'
import {
  authService,
  type CheckDuplicateResponse,
} from '@/features/auth/services/authService'

const checkDuplication = async (
  value: string,
  type: 'email' | 'marketName'
): Promise<boolean> => {
  const service =
    type === 'email'
      ? authService.checkEmailDuplicate
      : authService.checkMarketNameDuplicate
  const cachedQuery = queryClient.getQueryData<CheckDuplicateResponse>([
    'checkDuplication',
    type,
    value,
  ])

  if (cachedQuery) {
    return cachedQuery.available
  }
  const response = await service(value)
  queryClient.setQueryData(['checkDuplication', type, value], response)

  return response.available
}

export const checkEmailDuplicate = async (
  value: string
): Promise<string | undefined> => {
  const res = await checkDuplication(value, 'email')
  return !res ? '이미 사용중인 이메일입니다.' : undefined
}

export const checkMarketNameDuplicate = async (
  value: string
): Promise<string | undefined> => {
  const res = await checkDuplication(value, 'marketName')
  return !res ? '이미 사용중인 마켓명입니다.' : undefined
}
