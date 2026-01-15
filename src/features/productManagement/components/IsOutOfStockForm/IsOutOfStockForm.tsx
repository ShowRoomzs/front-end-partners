import FormCheckbox from "@/common/components/Form/FormCheckbox"
import FormController from "@/common/components/Form/FormController"
import FormItem from "@/common/components/Form/FormItem"
import type { ProductFormData } from "@/features/productManagement/pages/RegisterProductPage"
import type { Control } from "react-hook-form"

interface IsOutOfStockFormProps {
  control: Control<ProductFormData>
}

export default function IsOutOfStockForm(props: IsOutOfStockFormProps) {
  const { control } = props

  return (
    <FormController
      name="isOutOfStockForced"
      control={control}
      render={({ field, fieldState }) => (
        <FormItem
          tooltipInfo={
            "강제 품절을 체크하면 해당 상품은 고객에게 품절로 노출되며,\n구매가 불가능하게 됩니다."
          }
          label="강제품절처리"
          error={fieldState.error?.message}
        >
          <FormCheckbox
            label="품절"
            checked={field.value}
            onCheckedChange={field.onChange}
          />
        </FormItem>
      )}
    />
  )
}
