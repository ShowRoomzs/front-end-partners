/**
 * 전화번호를 하이픈 포맷으로 변환
 * @param phoneNumber - 하이픈 없는 전화번호 (예: "01012341234")
 * @returns 하이픈이 추가된 전화번호 (예: "010-1234-1234")
 */
export const formatPhoneNumber = (phoneNumber: string): string => {
  // 숫자만 추출
  const numbers = phoneNumber.replace(/[^\d]/g, '')

  // 10자리 (지역번호 02 등)
  if (numbers.length === 10) {
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}-${numbers.slice(6)}`
  }

  // 11자리 (일반 휴대폰)
  if (numbers.length === 11) {
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`
  }

  // 그 외는 그대로 반환
  return phoneNumber
}

// 사용 예시
// formatPhoneNumber('01012341234') // "010-1234-1234"
// formatPhoneNumber('0212341234') // "021-234-1234"
