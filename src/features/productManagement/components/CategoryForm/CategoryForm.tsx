import FormCategorySelector from "@/common/components/Form/FormCategorySelector"
import FormController from "@/common/components/Form/FormController"
import FormItem from "@/common/components/Form/FormItem"
import { useGetCategory } from "@/common/hooks/useGetCategory"
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
        <FormItem label="카테고리" required error={fieldState.error?.message}>
          {/* 셀렉트는 div 기반 컨트롤이라 disabled가 안 먹는다 — 포인터를 막는다 */}
          <div className={disabled ? "pointer-events-none opacity-60" : ""}>
            <FormCategorySelector
              categoryMap={categoryMap}
              value={{
                main: field.value?.main ?? null,
                sub: field.value?.sub ?? null,
                detail: field.value?.detail ?? null,
              }}
              onChange={field.onChange}
            />
          </div>
        </FormItem>
      )}
    />
  )
}
