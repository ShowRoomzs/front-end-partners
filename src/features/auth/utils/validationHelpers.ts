// 동기 validation 함수들
export const validateEmailFormat = (email: string) => {
  if (!email) return '이메일을 입력해주세요'
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) return '올바른 이메일 형식이 아닙니다'
  return true
}

export const validatePasswordStrength = (password: string) => {
  if (!password) return '비밀번호를 입력해주세요'
  if (password.length < 8 || password.length > 16)
    return '비밀번호는 8-16자 이내여야 합니다'
  const hasLetter = /[a-zA-Z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password)
  if (!hasLetter || !hasNumber || !hasSpecial)
    return '영문자, 숫자, 특수문자를 조합해주세요'
  return true
}

export const validatePhoneNumber = (phone: string) => {
  if (!phone) return '연락처를 입력해주세요'
  const phoneRegex = /^[0-9-]+$/
  if (!phoneRegex.test(phone)) return '올바른 연락처 형식이 아닙니다'
  return true
}

export const validateMarketNameRules = (marketName: string) => {
  if (!marketName) return '마켓명을 입력해주세요'

  const hasSpace = /\s/.test(marketName)
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>[\]\\/'`~+=_-]/.test(marketName)
  const hasKorean = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(marketName)
  const hasEnglish = /[a-zA-Z]/.test(marketName)

  if (hasSpace) return '공백을 사용할 수 없습니다'
  if (hasSpecial) return '특수문자를 사용할 수 없습니다'
  if (hasKorean && hasEnglish) return '한/영 혼용은 사용할 수 없습니다'

  return true
}
