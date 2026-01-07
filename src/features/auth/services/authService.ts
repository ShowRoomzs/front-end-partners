import { apiInstance } from "@/common/lib/apiInstance"
import { authInstance } from "@/common/lib/authInstance"

export interface RegisterData {
  email: string
  password: string
  passwordConfirm: string
  sellerName: string
  sellerContact: string
  marketName: string
  csNumber: string
}
export interface RegisterResponse {
  accessToken: string
  refreshToken: string
  accessTokenExpiresIn: number
  refreshTokenExpiresIn: number
  tokenType: string
  isNewMember: boolean
}
export interface LoginData {
  email: string
  password: string
}

export interface CheckDuplicateResponse {
  available: boolean
  code: string
  message: string
}
export type MarketImageStatus = "APPROVED" | "UNDER_REVIEW" | "REJECTED"

export type SnsType = "INSTAGRAM" | "YOUTUBE"
export interface SnsLink {
  snsType: SnsType
  snsUrl: string
}

export interface MarketInfo {
  marketId: number
  marketName: string
  csNumber: string
  marketImageUrl: string
  marketImageStatus: MarketImageStatus
  marketDescription: string
  marketUrl: string
  mainCategory: string
  snsLinks: Array<SnsLink>
  followerCount: number
}
export const authService = {
  register: async (data: RegisterData) => {
    const { data: response } = await authInstance.post<RegisterResponse>(
      "/seller/auth/signup",
      data
    )

    return response
  },
  login: async (data: LoginData) => {
    const { data: response } = await authInstance.post<RegisterResponse>(
      "/seller/auth/login",
      data
    )

    return response
  },
  refresh: async (refreshToken: string) => {
    const { data: response } = await authInstance.post<RegisterResponse>(
      "/seller/auth/refresh",
      {
        refreshToken,
      }
    )
    return response
  },
  checkEmailDuplicate: async (email: string) => {
    const { data: response } = await authInstance.get<CheckDuplicateResponse>(
      "/seller/auth/check-email",
      {
        params: {
          email,
        },
      }
    )

    return response
  },
  checkMarketNameDuplicate: async (marketName: string) => {
    const { data: response } = await authInstance.get<CheckDuplicateResponse>(
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
}
