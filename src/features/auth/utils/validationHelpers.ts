// 동기 validation 함수들
// - 문구: ui-partner-01/02 스펙 + SHOWROOMZ_기능요구사항 §1-3/§4 정확 문구
// - 정규식: 백엔드 SellerSignUpRequest 검증과 일치시켜 서버 거부(이중 불일치) 방지
// 미입력(빈 값)은 각 필드의 `required` 규칙이 처리하므로, 포맷 검증기는 빈 값에서 true 반환.

export const validateEmailFormat = (email: string) => {
  if (!email) return true
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email))
    return "올바른 이메일 형식이 아닙니다. (예: example@domain.com)"
  return true
}

export const validatePasswordStrength = (password: string) => {
  if (!password) return true
  // 백엔드 정규식과 동일: 영문+숫자+특수문자(@$!%*#?&) 조합, 8~16자
  const re = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,16}$/
  if (!re.test(password))
    return "8~16자 영문·숫자·특수문자 조합으로 입력해 주세요."
  return true
}

// (레거시) 크리에이터 가입 화면 전용 — 범위 밖이라 기존 동작 그대로 유지
export const validatePhoneNumber = (phone: string) => {
  if (!phone) return "연락처를 입력해주세요"
  const phoneRegex = /^[0-9-]+$/
  if (!phoneRegex.test(phone)) return "올바른 연락처 형식이 아닙니다"
  return true
}

// 핸드폰(모바일) 번호 — 판매 담당자 / 대표자 / 고객센터 연락처 공용
// 010-XXXX-XXXX 형식만 허용(하이픈 필수, 중간·끝 각 4자리). 백엔드도 이 형식을 수용.
export const validateMobilePhone = (phone: string) => {
  if (!phone) return true
  if (!/^010-\d{4}-\d{4}$/.test(phone))
    return "올바른 핸드폰 번호 형식으로 입력해 주세요. (예: 010-0000-0000)"
  return true
}

// 반품 수취인 연락처(온보딩) — 백엔드 SellerCompleteRegistrationRequest @Pattern과 동일:
//   ^01(?:0|1|[6-9])-\d{3,4}-\d{4}$  → 010/011/016~019 + 10~11자리, 하이픈 필수
//
// ⚠️ validateMobilePhone(010 11자리 고정)과 의도적으로 다른 규칙이다.
// 그쪽은 내부 관리자용 비공개 연락처, 이쪽은 반품 택배기사 등 외부에 노출되는
// 연락처라 구 통신사 번호(011~019, 10자리)까지 수용한다. 두 필드를 같은 함수로 묶지 말 것.
export const validateRecipientContact = (phone: string) => {
  if (!phone) return true
  if (!/^01(?:0|1|[6-9])-\d{3,4}-\d{4}$/.test(phone))
    return "올바른 휴대폰 번호 형식으로 입력해 주세요. (예: 010-1234-5678)"
  return true
}

// 반품 수취인 이름 — 한글·영문·공백만(백엔드 @Pattern ^[가-힣a-zA-Z\s]+$와 동일).
// 이모지·특수문자는 입력 시점에 실시간 필터링하지만, 붙여넣기 등 우회 대비로 검증도 둔다.
export const validateRecipientName = (value: string) => {
  if (!value) return true
  if (!/^[가-힣a-zA-Z\s]+$/.test(value)) return "한글·영문만 입력해 주세요."
  return true
}

// 고객센터 전화번호 — 백엔드 @Pattern과 100% 동일한 정규식(제출 실패 방지):
//   \d{4}-\d{4}            대표번호(8자리, 예: 1588-1234)
//   \d{2,4}-\d{3,4}-\d{4}  유선·휴대폰·안심번호(9~12자리, 예: 02-1234-5678 / 010-1234-5678 / 0507-1234-5678)
//   \d{3,4}                하이픈 없는 단축번호(3~4자리, 예: 114, 1588)
export const validateCsNumber = (value: string) => {
  if (!value) return true
  if (!/^(\d{4}-\d{4}|\d{2,4}-\d{3,4}-\d{4}|\d{3,4})$/.test(value))
    return "올바른 전화번호 형식으로 입력해 주세요. (예: 02-1234-5678, 1588-1234)"
  return true
}

export const validateMarketNameRules = (marketName: string) => {
  if (!marketName) return true
  // 백엔드 ^([가-힣0-9]+|[a-zA-Z0-9]+)$ : 공백·특수문자 불가, 한/영 혼용 불가
  if (!/^([가-힣0-9]+|[a-zA-Z0-9]+)$/.test(marketName))
    return "공백·특수문자를 제외하고 입력해 주세요."
  return true
}

// 사업자등록번호 — 000-00-00000
export const validateBusinessRegistrationNumber = (value: string) => {
  if (!value) return true
  if (!/^\d{3}-\d{2}-\d{5}$/.test(value))
    return "올바른 사업자등록번호 형식으로 입력해 주세요. (예: 000-00-00000)"
  return true
}

// 계좌번호 — 숫자와 '-'만
export const validateAccountNumber = (value: string) => {
  if (!value) return true
  if (!/^[0-9-]+$/.test(value)) return "올바른 계좌번호 형식으로 입력해 주세요."
  return true
}

// 통신판매업신고번호 년도 — 4자리 숫자
export const validateMailOrderYear = (value: string) => {
  if (!value) return true
  if (!/^\d{4}$/.test(value))
    return "년도는 4자리 숫자로 입력해 주세요. (예: 2024)"
  return true
}
