/** 옵션 그룹 안의 항목 하나 (예: "50ml") — 서버에서 오면 id가 optionId(number)다 */
export interface OptionItem {
  id: string | number
  name: string
}

/** 옵션 그룹 하나 (예: 그룹명 "용량" + 항목 50ml/100ml) */
export interface OptionGroup {
  id: string | number
  name: string
  items: Array<OptionItem>
}

/**
 * 옵션 조합(SKU) 한 행.
 *
 * ⚠️ `extraPrice`는 **정가에 더해지는 옵션가**다. 서버의 `variants[].regularPrice`는
 * 옵션가가 이미 더해진 절대 판매가라서 값의 의미가 다르다 —
 * 로드할 때 `regularPrice - 정가`로 풀고, 저장할 때 `정가 + extraPrice`로 되돌린다.
 * 시안이 "옵션가"를 추가금으로 보여주기 때문에 폼 내부는 추가금 기준으로 다룬다.
 *
 * 조합 단위 진열 여부는 필드가 아니다 — 재고 0이면 자동 품절이고, 진열 전환은
 * 운영자 전용 권한이라 브랜드 폼에 토글이 존재하지 않는다(§11-2).
 */
export interface OptionCombination {
  id: string
  /** 그룹 순서대로의 항목명 배열 (예: ["50ml", "레드"]) */
  combination: Array<string>
  /** 옵션가(추가금). 대표 조합은 항상 0 — 정가가 곧 가격이다 */
  extraPrice: number
  stock: number
  isRepresentative: boolean
}
