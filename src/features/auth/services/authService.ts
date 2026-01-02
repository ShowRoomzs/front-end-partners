import { authInstance } from '@/common/lib/authInstance'

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
export const authService = {
  register: async (data: RegisterData) => {
    const { data: response } = await authInstance.post<RegisterResponse>(
      '/admin/signup',
      data
    )

    return response
  },
  login: async (data: LoginData) => {
    const { data: response } = await authInstance.post<RegisterResponse>(
      'admin/login',
      data
    )

    return response
  },
  // true 시 중복, false 시 사용 가능
  checkEmailDuplicate: async (email: string) => {
    const { data: response } = await authInstance.get('admin/check-email', {
      params: {
        email,
      },
    })

    return response
  },
  // true 시 중복, false 시 사용 가능
  checkMarketNameDuplicate: async (marketName: string) => {
    const { data: response } = await authInstance.get(
      'admin/check-market-name',
      {
        params: {
          marketName,
        },
      }
    )

    return response
  },
}
