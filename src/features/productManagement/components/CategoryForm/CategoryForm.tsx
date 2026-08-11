import FormCategorySelector from "@/common/components/Form/FormCategorySelector"
import FormController from "@/common/components/Form/FormController"
import { useGetCategory } from "@/common/hooks/useGetCategory"
import { ProductField } from "@/features/productManagement/components/ProductFormLayout/ProductFormLayout"
import { PRODUCT_VALIDATION_RULES } from "@/features/productManagement/constants/validationRules"
import type { ProductFormData } from "@/features/productManagement/pages/RegisterProductPage"
import type { Control } from "react-hook-form"

interface CategoryFormProps {
  control: Control<ProductFormData>
  disabled?: boolean
}

/**
 * 대/중/소분류 3단 연동 셀렉트 — 상위를 골라야 하위가 열린다.
 * 선택 결과는 소분류의 categoryId로 서버에 저장된다.
 */
export default function CategoryForm(props: CategoryFormProps) {
  const { control, disabled = false } = props
  const { categoryMap } = useGetCategory()

  return (
    <FormController
      name="category"
      control={control}
      rules={PRODUCT_VALIDATION_RULES.category}
      render={({ field, fieldState }) => (
        <ProductField
          label="카테고리"
          required
          error={fieldState.error?.message}
          hint="대분류를 선택해야 중분류를, 중분류를 선택해야 소분류를 선택할 수 있습니다."
        >
          {/*
            disabled를 셀렉트까지 내려보낸다. 예전엔 감싼 div에 pointer-events-none만
            걸었는데, 그러면 마우스로만 막히고 Tab·키보드로는 그대로 바뀐다
            (잠금 상태에서 값이 수정될 수 있는 구멍이었다).
          */}
          <FormCategorySelector
            categoryMap={categoryMap}
            disabled={disabled}
            value={{
              main: field.value?.main ?? null,
              sub: field.value?.sub ?? null,
              detail: field.value?.detail ?? null,
            }}
            onChange={field.onChange}
          />
        </ProductField>
      )}
    />
  )
}
