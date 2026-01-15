import FormController from "@/common/components/Form/FormController"
import FormInput from "@/common/components/Form/FormInput"
import FormItem from "@/common/components/Form/FormItem"
import type { ProductFormData } from "@/features/productManagement/pages/RegisterProductPage"
import { useWatch, type Control } from "react-hook-form"

interface DiscountRateFormProps {
  control: Control<ProductFormData>
}

export default function DiscountRateForm(props: DiscountRateFormProps) {
  const { control } = props

  const isDiscount = useWatch({
    control,
    name: "isDiscount",
    defaultValue: false,
  })

  return (
    <FormController
      name="discountRate"
      control={control}
      render={({ field }) => (
        <FormItem label="">
          <FormInput
            disabled={!isDiscount}
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
