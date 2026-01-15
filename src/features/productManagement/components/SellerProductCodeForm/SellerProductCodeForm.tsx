import FormController from "@/common/components/Form/FormController"
import FormInput from "@/common/components/Form/FormInput"
import FormItem from "@/common/components/Form/FormItem"
import type { ProductFormData } from "@/features/productManagement/pages/RegisterProductPage"
import type { Control } from "react-hook-form"

interface SellerProductCodeFormProps {
  control: Control<ProductFormData>
}

export default function SellerProductCodeForm(
  props: SellerProductCodeFormProps
) {
  const { control } = props

  return (
    <FormController
      name="sellerProductCode"
      control={control}
      render={({ field }) => (
        <FormItem label="판매자상품코드">
          <FormInput
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
          />
        </FormItem>
      )}
    />
  )
}
