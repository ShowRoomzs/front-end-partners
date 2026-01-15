import FormController from "@/common/components/Form/FormController"
import FormItem from "@/common/components/Form/FormItem"
import FormRadioGroup from "@/common/components/Form/FormRadioGroup"
import type { ProductFormData } from "@/features/productManagement/pages/RegisterProductPage"
import type { Control } from "react-hook-form"

interface IsDisplayFormProps {
  control: Control<ProductFormData>
}

export default function IsDisplayForm(props: IsDisplayFormProps) {
  const { control } = props

  return (
    <FormController
      name="isDisplay"
      control={control}
      render={({ field, fieldState }) => (
        <FormItem label="진열상태" required error={fieldState.error?.message}>
          <FormRadioGroup<boolean>
            options={[
              { label: "진열", value: true },
              { label: "미진열", value: false },
            ]}
            value={field.value}
            onChange={field.onChange}
          />
        </FormItem>
      )}
    />
  )
}
