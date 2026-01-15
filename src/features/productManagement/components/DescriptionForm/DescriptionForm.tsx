import FormController from "@/common/components/Form/FormController"
import FormEditor from "@/common/components/Form/FormEditor"
import FormItem from "@/common/components/Form/FormItem"
import { PRODUCT_VALIDATION_RULES } from "@/features/productManagement/constants/validationRules"
import type { ProductFormData } from "@/features/productManagement/pages/RegisterProductPage"
import type { Control } from "react-hook-form"

interface DescriptionFormProps {
  control: Control<ProductFormData>
}

export default function DescriptionForm(props: DescriptionFormProps) {
  const { control } = props

  return (
    <FormController
      name="description"
      control={control}
      rules={PRODUCT_VALIDATION_RULES.description}
      render={({ field, formState }) => (
        <FormItem
          required
          label="상세설명"
          error={formState.errors.description?.message}
        >
          <FormEditor
            value={field.value}
            onChange={field.onChange}
            imageUploadType="PRODUCT"
            placeholder="상품 상세설명을 입력하세요..."
          />
        </FormItem>
      )}
    />
  )
}
