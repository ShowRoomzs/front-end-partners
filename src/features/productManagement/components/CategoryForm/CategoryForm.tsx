import FormCategorySelector from "@/common/components/Form/FormCategorySelector"
import FormController from "@/common/components/Form/FormController"
import FormItem from "@/common/components/Form/FormItem"
import { useGetCategory } from "@/common/hooks/useGetCategory"
import { PRODUCT_VALIDATION_RULES } from "@/features/productManagement/constants/validationRules"
import type { ProductFormData } from "@/features/productManagement/pages/RegisterProductPage"
import type { Control } from "react-hook-form"

interface CategoryFormProps {
  control: Control<ProductFormData>
}

export default function CategoryForm(props: CategoryFormProps) {
  const { control } = props
  const { categoryMap } = useGetCategory()

  return (
    <FormController
      name="category"
      control={control}
      rules={PRODUCT_VALIDATION_RULES.category}
      render={({ field, fieldState }) => (
        <FormItem label="카테고리" required error={fieldState.error?.message}>
          <FormCategorySelector
            categoryMap={categoryMap}
            value={{
              main: field.value?.main ?? null,
              sub: field.value?.sub ?? null,
              detail: field.value?.detail ?? null,
            }}
            onChange={field.onChange}
          />
        </FormItem>
      )}
    />
  )
}
