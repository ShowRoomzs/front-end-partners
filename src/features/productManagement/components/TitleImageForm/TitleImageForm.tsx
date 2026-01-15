import FormController from "@/common/components/Form/FormController"
import FormImageUploader from "@/common/components/Form/FormImageUploader"
import FormItem from "@/common/components/Form/FormItem"
import { PRODUCT_VALIDATION_RULES } from "@/features/productManagement/constants/validationRules"
import type { ProductFormData } from "@/features/productManagement/pages/RegisterProductPage"
import type { Control } from "react-hook-form"

interface TitleImageFormProps {
  control: Control<ProductFormData>
}

export default function TitleImageForm(props: TitleImageFormProps) {
  const { control } = props

  return (
    <FormController
      name="titleImage"
      control={control}
      rules={PRODUCT_VALIDATION_RULES.titleImage}
      render={({ field: titleImageField, formState }) => (
        <FormItem
          required
          label="대표 이미지"
          error={formState.errors.titleImage?.message}
        >
          <FormImageUploader
            value={titleImageField.value}
            onImagesChange={items => titleImageField.onChange(items[0])}
            accept=".jpg, .jpeg, .png, .gif"
            type="PRODUCT"
            maxLength={1}
            maxStorage={1024}
            recommendSize={{ width: 640, height: 768 }}
          />
        </FormItem>
      )}
    />
  )
}
