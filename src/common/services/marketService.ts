import { apiInstance } from "@/common/lib/apiInstance"
import type { MarketInfo } from "@/features/auth/services/authService"
export interface CheckDuplicateResponse {
  available: boolean
  code: string
  message: string
}
export const marketService = {
  checkMarketNameDuplicate: async (marketName: string) => {
    const { data: response } = await apiInstance.get<CheckDuplicateResponse>(
      "/seller/markets/check-name",
      {
        params: {
          marketName,
        },
      }
    )

    return response
  },
  getMarketInfo: async () => {
    const { data: response } =
      await apiInstance.get<MarketInfo>("/seller/markets/me")

    return response
  },
  updateMarketInfo: async (data: MarketInfo) => {
    const { data: response } = await apiInstance.patch(
      "/seller/markets/me",
      data
    )

    return response
  },
}
