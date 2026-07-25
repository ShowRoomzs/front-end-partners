import { authInstance } from "@/common/lib/authInstance"
import type { AxiosRequestConfig } from "axios"
import type { Role } from "@/common/types/role"

export interface RegisterData {
  email: string
  password: string
  passwordConfirm: string
  sellerName: string
  sellerContact: string
  marketName: string
  csNumber: string
}

// 사업자 구분 — 백엔드는 free string이지만 프론트에서는 4종으로 제한(스펙 기준)
export type BusinessType =
  | "일반과세자"
  | "간이과세자"
  | "면세사업자"
  | "법인 사업자"

// 회원가입 Step2(사업자·정산 정보). 필드명은 백엔드 SellerSignUpRequest와 1:1 일치.
export interface BusinessInfoData {
  businessType: BusinessType | ""
  representativeName: string
  representativeContact: string
  companyName: string
  businessRegistrationNumber: string
  businessCondition: string
  businessAddress: string
  detailAddress: string
  taxEmail: string
  businessLicenseImageUrl: string
  // 간이과세자는 아래 4개가 서버에서도 면제됨(빈 값 허용)
  mailOrderRegImageUrl: string
  mailOrderRegNumberYear: string
  mailOrderRegNumberRegion: string
  mailOrderRegNumberSeq: string
  bankName: string
  accountHolder: string
  accountNumber: string
  bankbookImageUrl: string
}

// 회원가입 Step3(약관 동의). 모두 true여야 서버 통과(@AssertTrue).
export interface TermsData {
  agreePrivacyPolicy: boolean
  agreeTermsOfService: boolean
  agreeOperationPolicy: boolean
}

// 최종 제출 페이로드 = 1차 + 2차 + 3차
export type FullSignupData = RegisterData & BusinessInfoData & TermsData

// 실제 서버 전송용 페이로드. 간이과세자는 통신판매업 신고 필드를 null로 보낸다
// (서버 @Pattern은 null은 통과시키지만 빈 문자열 ""은 거부하기 때문).
export type BrandSignupPayload = Omit<
  FullSignupData,
  | "mailOrderRegImageUrl"
  | "mailOrderRegNumberYear"
  | "mailOrderRegNumberRegion"
  | "mailOrderRegNumberSeq"
> & {
  mailOrderRegImageUrl: string | null
  mailOrderRegNumberYear: string | null
  mailOrderRegNumberRegion: string | null
  mailOrderRegNumberSeq: string | null
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
  // 승인 후 첫 로그인(isNewMember=true) 시에만 내려오며 access/refresh는 미발급
  registerToken?: string
  role: Role
}
export interface LoginData {
  email: string
  password: string
}

// 실제 배포 API의 JSON 필드는 available (true=사용가능, false=중복).
// 백엔드 Java 필드는 isAvailable이지만 Jackson이 boolean getter의 is 접두사를 떼고 직렬화함.
export interface CheckDuplicateResponse {
  available: boolean
  code: string
  message: string
}

export interface ImageUploadResponse {
  imageUrl: string
}
export type MarketImageStatus = "APPROVED" | "UNDER_REVIEW" | "REJECTED"

export type SnsType = "INSTAGRAM" | "YOUTUBE" | "X" | "TIKTOK"

export interface CreatorRegisterData {
  email: string
  password: string
  passwordConfirm: string
  marketName: string
  snsType: SnsType
  activityName: string
  snsUrl: string
  sellerName: string
  sellerContact: string
}

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
  // 브랜드(판매자) 회원가입 최종 제출 — 1~3차 전체 필드를 한 번에 전송
  submitBrandSignup: async (data: BrandSignupPayload) => {
    const { data: response } = await authInstance.post<RegisterResponse>(
      "/seller/auth/signup",
      data
    )

    return response
  },
  // 회원가입 증빙 서류 업로드(공개 이미지 업로드 API, 인증 불필요, multipart).
  // /seller/auth/signup-documents는 배포 서버에서 401(비로그인 차단)이라, 가입 전 단계에서도
  // 쓸 수 있는 공개 엔드포인트 /common/images?type=SIGNUP_DOCUMENT로 업로드한다. 반환 imageUrl을 payload에 채운다.
  uploadSignupDocument: async (file: File) => {
    const formData = new FormData()
    formData.append("file", file)
    const { data: response } = await authInstance.post<ImageUploadResponse>(
      "/common/images",
      formData,
      {
        // type은 백엔드 ImageType enum 값(SIGNUP_DOCUMENT: 판매자 가입 증빙 서류 전용)
        params: { type: "SIGNUP_DOCUMENT" },
        // Content-Type은 지정하지 않는다 — FormData면 브라우저가
        // "multipart/form-data; boundary=..."로 자동 설정(수동 지정 시 boundary 누락으로 서버 파싱 실패).
        // 업로드 실패는 FileUploadField가 인라인으로 표시하므로 전역 토스트 억제
        suppressErrorToast: true,
      }
    )

    return response
  },
  login: async (data: LoginData, config?: AxiosRequestConfig) => {
    const { data: response } = await authInstance.post<LoginResponse>(
      "/seller/auth/login",
      data,
      config
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
  checkBusinessRegistrationNumberDuplicate: async (
    businessRegistrationNumber: string
  ) => {
    const { data: response } = await authInstance.get<CheckDuplicateResponse>(
      "/seller/auth/check-business-registration-number",
      {
        params: {
          businessRegistrationNumber,
        },
      }
    )

    return response
  },
  creatorRegister: async (data: CreatorRegisterData) => {
    const { data: response } = await authInstance.post<RegisterResponse>(
      "/creator/auth/signup",
      data
    )

    return response
  },
}
