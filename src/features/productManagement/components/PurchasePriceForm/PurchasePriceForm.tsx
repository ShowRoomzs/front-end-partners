import FormController from "@/common/components/Form/FormController"
import FormInput from "@/common/components/Form/FormInput"
import FormItem from "@/common/components/Form/FormItem"
import type { ProductFormData } from "@/features/productManagement/pages/RegisterProductPage"
import type { Control } from "react-hook-form"

interface PurchasePriceFormProps {
  control: Control<ProductFormData>
}

export default function PurchasePriceForm(props: PurchasePriceFormProps) {
  const { control } = props

  return (
    <FormController
      name="purchasePrice"
      control={control}
      render={({ field }) => (
        <FormItem label="매입가">
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
