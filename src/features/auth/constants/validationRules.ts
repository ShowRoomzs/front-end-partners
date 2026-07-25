import type { RegisterOptions } from "react-hook-form"
import {
  validateAccountNumber,
  validateBusinessRegistrationNumber,
  validateCsNumber,
  validateEmailFormat,
  validateMailOrderYear,
  validateMarketNameRules,
  validateMobilePhone,
  validatePasswordStrength,
  validatePhoneNumber,
} from "../utils/validationHelpers"
import {
  type BusinessInfoData,
  type CreatorRegisterData,
  type FullSignupData,
  type RegisterData,
} from "@/features/auth/services/authService"
import { createDebouncedValidation } from "../utils/createDebouncedValidation"
import {
  checkBusinessRegistrationNumberDuplicate,
  checkEmailDuplicate,
  checkMarketNameDuplicate,
} from "@/features/auth/utils/checkDuplication"

// ── 회원가입 Step1 (계정·셀러·마켓) ──────────────────────────────
const RAW_VALIDATION_RULES = {
  email: {
    required: "이메일을 입력해 주세요.",
    validate: {
      format: validateEmailFormat,
      duplicate: checkEmailDuplicate,
    },
  },
  password: {
    required: "비밀번호를 입력해 주세요.",
    validate: validatePasswordStrength,
  },
  passwordConfirm: {
    required: "비밀번호를 다시 입력해 주세요.",
    validate: (value: string, formValues: unknown) => {
      const data = formValues as RegisterData
      return value === data.password || "비밀번호가 일치하지 않습니다."
    },
  },
  sellerName: {
    required: "판매 담당자 이름을 입력해 주세요.",
  },
  sellerContact: {
    required: "판매 담당자 연락처를 입력해 주세요.",
    validate: validateMobilePhone,
  },
  marketName: {
    required: "브랜드명을 입력해 주세요.",
    validate: {
      format: validateMarketNameRules,
      duplicate: checkMarketNameDuplicate,
    },
  },
  csNumber: {
    // 완화 형식: 하이픈 1개 이상 + 하이픈 제외 숫자 8~12자리(유선/휴대 모두 허용)
    required: "고객센터 전화번호를 입력해 주세요.",
    validate: validateCsNumber,
  },
} as const satisfies Record<keyof RegisterData, RegisterOptions>

// 모든 validation에 300ms debounce 적용
export const VALIDATION_RULES = Object.entries(RAW_VALIDATION_RULES).reduce(
  (acc, [key, rules]) => {
    acc[key as keyof RegisterData] = createDebouncedValidation(rules, 300)
    return acc
  },
  {} as Record<keyof RegisterData, RegisterOptions>
)

// ── 회원가입 Step2 (사업자·정산 정보) ────────────────────────────
// 간이과세자 예외: 통신판매업신고증 사본 + 신고번호 3종은 businessType이
// "간이과세자"일 때 조건부로 면제(백엔드 @AssertTrue 면제 조건과 일치).
const isSimplifiedTax = (formValues: unknown) =>
  (formValues as FullSignupData).businessType === "간이과세자"

const RAW_BUSINESS_VALIDATION_RULES = {
  businessType: {
    required: "사업자 구분을 선택해 주세요.",
  },
  representativeName: {
    required: "대표자명을 입력해 주세요.",
  },
  representativeContact: {
    required: "대표자 연락처를 입력해 주세요.",
    validate: validateMobilePhone,
  },
  companyName: {
    required: "사업자등록증 상호명을 입력해 주세요.",
  },
  businessRegistrationNumber: {
    required: "사업자등록번호를 입력해 주세요.",
    validate: {
      format: validateBusinessRegistrationNumber,
      duplicate: checkBusinessRegistrationNumberDuplicate,
    },
  },
  businessCondition: {
    required: "업태를 입력해 주세요.",
  },
  businessAddress: {
    required: "사업장 주소를 입력해 주세요.",
  },
  detailAddress: {
    required: "상세주소를 입력해 주세요.",
  },
  taxEmail: {
    required: "이메일 주소를 입력해 주세요.",
    validate: validateEmailFormat,
  },
  businessLicenseImageUrl: {
    required: "사업자등록증 사본을 첨부해 주세요.",
  },
  // ── 간이과세자 면제 대상 4종 (조건부 required) ──
  mailOrderRegImageUrl: {
    validate: (value: unknown, formValues: unknown) => {
      if (isSimplifiedTax(formValues)) return true
      return value ? true : "통신판매업신고증 사본을 첨부해 주세요."
    },
  },
  mailOrderRegNumberYear: {
    validate: (value: unknown, formValues: unknown) => {
      if (isSimplifiedTax(formValues)) return true
      if (!value) return "통신판매업신고번호를 모두 입력해 주세요."
      return validateMailOrderYear(value as string)
    },
  },
  mailOrderRegNumberRegion: {
    validate: (value: unknown, formValues: unknown) => {
      if (isSimplifiedTax(formValues)) return true
      return value ? true : "통신판매업신고번호를 모두 입력해 주세요."
    },
  },
  mailOrderRegNumberSeq: {
    validate: (value: unknown, formValues: unknown) => {
      if (isSimplifiedTax(formValues)) return true
      return value ? true : "통신판매업신고번호를 모두 입력해 주세요."
    },
  },
  // ── 정산 정보 ──
  bankName: {
    required: "은행명을 선택해 주세요.",
  },
  accountHolder: {
    // 법인 사업자면 문구 분기(2-E)
    validate: (value: unknown, formValues: unknown) => {
      if (value) return true
      return (formValues as FullSignupData).businessType === "법인 사업자"
        ? "법인 명의 예금주명을 입력해 주세요."
        : "예금주명을 입력해 주세요."
    },
  },
  accountNumber: {
    required: "계좌번호를 입력해 주세요.",
    validate: validateAccountNumber,
  },
  bankbookImageUrl: {
    required: "통장 사본을 첨부해 주세요.",
  },
} as const satisfies Record<keyof BusinessInfoData, RegisterOptions>

export const BUSINESS_VALIDATION_RULES = Object.entries(
  RAW_BUSINESS_VALIDATION_RULES
).reduce(
  (acc, [key, rules]) => {
    acc[key as keyof BusinessInfoData] = createDebouncedValidation(rules, 300)
    return acc
  },
  {} as Record<keyof BusinessInfoData, RegisterOptions>
)

// ── 크리에이터 가입 (범위 밖, 기존 유지) ─────────────────────────
const RAW_CREATOR_VALIDATION_RULES = {
  email: {
    required: "이메일을 입력해주세요",
    validate: {
      format: validateEmailFormat,
      duplicate: checkEmailDuplicate,
    },
  },
  password: {
    required: "비밀번호를 입력해주세요",
    validate: validatePasswordStrength,
  },
  passwordConfirm: {
    required: "비밀번호 확인을 입력해주세요",
    validate: (value: string, formValues: unknown) => {
      const data = formValues as CreatorRegisterData
      return value === data.password || "비밀번호가 일치하지 않습니다"
    },
  },
  marketName: {
    required: "마켓명을 입력해주세요",
    validate: {
      format: validateMarketNameRules,
      duplicate: checkMarketNameDuplicate,
    },
  },
  snsType: {
    required: "플랫폼을 선택해주세요",
  },
  activityName: {
    required: "활동명을 입력해주세요",
  },
  snsUrl: {
    required: "사이트 주소를 입력해주세요",
  },
  sellerName: {
    required: "크리에이터 이름을 입력해주세요",
  },
  sellerContact: {
    required: "연락처를 입력해주세요",
    validate: validatePhoneNumber,
  },
} as const satisfies Record<keyof CreatorRegisterData, RegisterOptions>

export const CREATOR_VALIDATION_RULES = Object.entries(
  RAW_CREATOR_VALIDATION_RULES
).reduce(
  (acc, [key, rules]) => {
    acc[key as keyof CreatorRegisterData] = createDebouncedValidation(
      rules,
      300
    )
    return acc
  },
  {} as Record<keyof CreatorRegisterData, RegisterOptions>
)
