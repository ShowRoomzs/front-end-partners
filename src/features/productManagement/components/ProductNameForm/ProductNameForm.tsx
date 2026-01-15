import FormController from "@/common/components/Form/FormController"
import FormInput from "@/common/components/Form/FormInput"
import FormItem from "@/common/components/Form/FormItem"
import { PRODUCT_VALIDATION_RULES } from "@/features/productManagement/constants/validationRules"
import type { ProductFormData } from "@/features/productManagement/pages/RegisterProductPage"
import type { Control } from "react-hook-form"

interface ProductNameFormProps {
  control: Control<ProductFormData>
}

export default function ProductNameForm(props: ProductNameFormProps) {
  const { control } = props

  return (
    <FormController
      name="productName"
      control={control}
      rules={PRODUCT_VALIDATION_RULES.productName}
      render={({ field, fieldState }) => (
        <FormItem label="상품명" required error={fieldState.error?.message}>
          <FormInput
            value={field.value}
            placeholder="상품명을 입력해 주세요(특수문자 입력은 피해 주세요)"
            maxLength={100}
            onChange={field.onChange}
            onBlur={field.onBlur}
          />
        </FormItem>
      )}
    />
  )
}
