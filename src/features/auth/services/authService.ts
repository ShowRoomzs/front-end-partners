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
  message: string
}
export interface LoginResponse {
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
  csNumber: string
  followerCount: number
  mainCategory: number | null
  marketDescription: string
  marketId: number
  marketImageStatus: MarketImageStatus
  marketImageUrl: string
  marketName: string
  marketUrl: string
  snsLinks: Array<SnsLink>
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
    const { data: response } = await authInstance.post<LoginResponse>(
      "/seller/auth/login",
      data
    )

    return response
  },
  refresh: async (refreshToken: string) => {
    const { data: response } = await authInstance.post<LoginResponse>(
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
}
