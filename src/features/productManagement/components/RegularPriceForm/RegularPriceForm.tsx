import FormController from "@/common/components/Form/FormController"
import FormInput from "@/common/components/Form/FormInput"
import FormItem from "@/common/components/Form/FormItem"
import { PRODUCT_VALIDATION_RULES } from "@/features/productManagement/constants/validationRules"
import type { ProductFormData } from "@/features/productManagement/pages/RegisterProductPage"
import type { Control } from "react-hook-form"

interface RegularPriceFormProps {
  control: Control<ProductFormData>
}

export default function RegularPriceForm(props: RegularPriceFormProps) {
  const { control } = props

  return (
    <FormController
      name="regularPrice"
      control={control}
      rules={PRODUCT_VALIDATION_RULES.regularPrice}
      render={({ field, fieldState }) => (
        <FormItem required label="판매가" error={fieldState.error?.message}>
          <FormInput
            type="number"
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            min={0}
          />
        </FormItem>
      )}
    />
  )
}
