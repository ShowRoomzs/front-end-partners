import FormInput from "@/common/components/Form/FormInput"
import type { ProductFormData } from "@/features/productManagement/pages/RegisterProductPage"
import {
  useWatch,
  type Control,
  type ControllerRenderProps,
} from "react-hook-form"

interface DiscountRateProps {
  control: Control<ProductFormData>
  field: ControllerRenderProps<ProductFormData>
}

export default function DiscountRate(props: DiscountRateProps) {
  const { control, field } = props

  const isDiscount = useWatch({
    control,
    name: "isDiscount",
    defaultValue: false,
  })

  return (
    <FormInput
      disabled={!isDiscount}
      type="number"
      value={field.value as string}
      onChange={field.onChange}
      onBlur={field.onBlur}
      min={0}
    />
  )
}
