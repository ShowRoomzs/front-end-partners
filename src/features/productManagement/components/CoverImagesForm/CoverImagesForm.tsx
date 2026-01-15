import FormController from "@/common/components/Form/FormController"
import FormImageUploader from "@/common/components/Form/FormImageUploader"
import FormItem from "@/common/components/Form/FormItem"
import { PRODUCT_VALIDATION_RULES } from "@/features/productManagement/constants/validationRules"
import type { ProductFormData } from "@/features/productManagement/pages/RegisterProductPage"
import type { Control } from "react-hook-form"

interface CoverImagesFormProps {
  control: Control<ProductFormData>
}

export default function CoverImagesForm(props: CoverImagesFormProps) {
  const { control } = props

  return (
    <FormController
      name="coverImages"
      control={control}
      rules={PRODUCT_VALIDATION_RULES.coverImages}
      render={({ field: coverImageField, formState }) => (
        <FormItem
          required
          label="커버 이미지"
          error={formState.errors.coverImages?.message}
        >
          <FormImageUploader
            value={coverImageField.value}
            onImagesChange={coverImageField.onChange}
            accept=".jpg, .jpeg, .png, .gif"
            type="PRODUCT"
            maxLength={4}
            maxStorage={1024}
            recommendSize={{ width: 640, height: 640 }}
          />
        </FormItem>
      )}
    />
  )
}
