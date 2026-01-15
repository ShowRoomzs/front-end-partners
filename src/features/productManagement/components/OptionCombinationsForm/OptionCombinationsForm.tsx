import FormController from "@/common/components/Form/FormController"
import FormOptionCombinationTable from "@/common/components/Form/FormOptionCombinationTable"
import { PRODUCT_VALIDATION_RULES } from "@/features/productManagement/constants/validationRules"
import type { ProductFormData } from "@/features/productManagement/pages/RegisterProductPage"
import type { Control } from "react-hook-form"

interface OptionCombinationsFormProps {
  control: Control<ProductFormData>
}

export default function OptionCombinationsForm(
  props: OptionCombinationsFormProps
) {
  const { control } = props

  return (
    <FormController
      name="optionCombinations"
      control={control}
      rules={PRODUCT_VALIDATION_RULES.optionCombinations}
      render={({ field }) => (
        <FormOptionCombinationTable
          combinations={field.value}
          onChange={field.onChange}
        />
      )}
    />
  )
}
