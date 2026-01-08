import type { RegisterOptions } from "react-hook-form"
import {
  validateEmailFormat,
  validatePasswordStrength,
  validatePhoneNumber,
  validateMarketNameRules,
} from "../utils/validationHelpers"
import { type RegisterData } from "@/features/auth/services/authService"
import { createDebouncedValidation } from "../utils/createDebouncedValidation"
import {
  checkEmailDuplicate,
  checkMarketNameDuplicate,
} from "@/features/auth/utils/checkDuplication"

// 원본 validation 규칙 (debounce 적용 전)
const RAW_VALIDATION_RULES = {
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
      const data = formValues as RegisterData
      return value === data.password || "비밀번호가 일치하지 않습니다"
    },
  },
  sellerName: {
    required: "판매 담당자 이름을 입력해주세요",
  },
  sellerContact: {
    required: "연락처를 입력해주세요",
    validate: validatePhoneNumber,
  },
  marketName: {
    required: "마켓명을 입력해주세요",
    validate: {
      format: validateMarketNameRules,
      duplicate: checkMarketNameDuplicate,
    },
  },
  csNumber: {
    required: "고객센터 전화번호를 입력해주세요",
    validate: validatePhoneNumber,
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
