import { COOKIE_NAME } from '@/common/constants'
import { useCookie } from '@/common/hooks/useCookie'
import { authService } from '@/features/auth/services/authService'
import { useQuery } from '@tanstack/react-query'

export function useGetMarketInfo() {
  const [accessToken] = useCookie(COOKIE_NAME.ACCESS_TOKEN)
  return useQuery({
    queryKey: ['marketInfo', accessToken],
    queryFn: authService.getMarketInfo,
    enabled: !!accessToken,
  })
}
