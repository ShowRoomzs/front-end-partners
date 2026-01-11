import { COOKIE_NAME } from "@/common/constants"
import { QUERY_KEYS } from "@/common/constants/queryKeys"
import { useCookie } from "@/common/hooks/useCookie"
import { marketService } from "@/common/services/marketService"
import { useQuery } from "@tanstack/react-query"

export function useGetMarketInfo() {
  const [accessToken] = useCookie<string>(COOKIE_NAME.ACCESS_TOKEN)
  return useQuery({
    queryKey: [QUERY_KEYS.MARKET_INFO, accessToken],
    queryFn: marketService.getMarketInfo,
    enabled: !!accessToken,
  })
}
