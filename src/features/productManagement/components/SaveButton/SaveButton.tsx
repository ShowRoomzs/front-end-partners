import { Button } from "@/components/ui/button"
import { PRODUCT_NOTICE_FIELDS } from "@/features/productManagement/constants/params"
import type { ProductFormData } from "@/features/productManagement/pages/RegisterProductPage"
import type { ProductNotice } from "@/features/productManagement/services/productService"
import { useWatch, type Control } from "react-hook-form"

interface SaveButtonProps {
  control: Control<ProductFormData>
  isLoading?: boolean
}

function isFilled(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0
}

/**
 * 필수 항목이 전부 채워졌는지 — 저장 버튼 활성화 판정.
 *
 * ⚠️ 여기서는 **값이 있는지만** 본다. 형식 검증(길이 상한·금액 상한 등)은
 * 제출 시 PRODUCT_VALIDATION_RULES가 맡는다. 조건을 여기에 더 얹지 말 것 —
 * 버튼이 꺼져 있으면 어느 칸이 문제인지 알려줄 수단이 없다(눌러야 해당 칸으로
 * 스크롤되며 이유가 뜬다). 값 유무는 화면만 봐도 비어 있는 게 보이니 예외다.
 */
function hasAllRequiredValues(values: Partial<ProductFormData>): boolean {
  // 카테고리는 소분류까지 골라야 categoryId가 정해진다
  if (values.category?.detail == null) {
    return false
  }
  if (!isFilled(values.productName)) {
    return false
  }
  if (!values.regularPrice || Number(values.regularPrice) <= 0) {
    return false
  }
  // 대표 이미지만 필수 — 커버는 선택(§11-6)
  if (!isFilled(values.titleImage)) {
    return false
  }
  if (!isFilled(values.description)) {
    return false
  }

  // 고시 11필드는 전부 필수 — 목록을 여기 또 적지 않고 상수에서 끌어온다
  const notice = values.productNotice
  if (
    !notice ||
    PRODUCT_NOTICE_FIELDS.some(
      field => !isFilled(notice[field.key as keyof ProductNotice])
    )
  ) {
    return false
  }

  // 옵션 그룹을 쓰면 조합이 하나는 있어야 한다(미사용이면 기본 조합 1개라 검사 불필요)
  if (values.useOptionGroup && !values.optionCombinations?.length) {
    return false
  }

  return true
}

/**
 * 저장 버튼 — 시안 B1의 `<button class="btn btn-primary" disabled>저장</button>`.
 *
 * 폼 값 구독을 이 컴포넌트 안에 가둔다. 페이지에서 useWatch를 하면 글자를 칠 때마다
 * 폼 전체(고시 11필드 포함)가 다시 그려져 입력이 버벅인다.
 */
export default function SaveButton(props: SaveButtonProps) {
  const { control, isLoading = false } = props
  const values = useWatch({ control }) as Partial<ProductFormData>

  return (
    <Button
      type="submit"
      size="sm"
      // 시안 `.btn` — 32px 높이 · 12px 글씨 · 좌우 14px
      className="px-3.5 text-[12px]"
      isLoading={isLoading}
      disabled={!hasAllRequiredValues(values)}
    >
      저장
    </Button>
  )
}
