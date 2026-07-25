// 앱(front-end)의 배송지 검색과 동일한 Daum(카카오) 우편번호 서비스를 웹에서 사용하기 위한 로더.
// 앱은 RN WebView로 임베드하지만, partners는 웹이므로 같은 스크립트를 1회 로드해
// `new window.daum.Postcode({ oncomplete }).open()` 팝업으로 띄운다(모달/의존성 불필요).

const SCRIPT_SRC =
  "https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"

// oncomplete 콜백이 받는 데이터 중 실제로 사용하는 필드만 선언(전체 스키마는 Daum 문서 참고).
export interface DaumPostcodeData {
  // "R"=도로명 우선 선택, "J"=지번 우선 선택
  userSelectedType: "R" | "J"
  roadAddress: string
  jibunAddress: string
  zonecode: string
}

interface DaumPostcodeOptions {
  oncomplete: (data: DaumPostcodeData) => void
  onclose?: (state: "FORCE_CLOSE" | "COMPLETE_CLOSE") => void
}

interface DaumPostcodeInstance {
  open: () => void
  embed: (element: HTMLElement) => void
}

declare global {
  interface Window {
    daum?: {
      Postcode: new (options: DaumPostcodeOptions) => DaumPostcodeInstance
    }
  }
}

let loadPromise: Promise<void> | null = null

// postcode.v2.js를 1회만 주입하고, window.daum.Postcode 준비 시 resolve.
export function loadDaumPostcode(): Promise<void> {
  if (window.daum?.Postcode) return Promise.resolve()
  if (loadPromise) return loadPromise

  loadPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script")
    script.src = SCRIPT_SRC
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => {
      loadPromise = null // 실패 시 다음 시도에서 재주입 가능하도록 캐시 해제
      reject(new Error("Daum 우편번호 스크립트를 불러오지 못했습니다."))
    }
    document.head.appendChild(script)
  })

  return loadPromise
}
