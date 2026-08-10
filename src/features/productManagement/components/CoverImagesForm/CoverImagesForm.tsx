import FormController from "@/common/components/Form/FormController"
import FormImageUploader from "@/common/components/Form/FormImageUploader"
import FormItem from "@/common/components/Form/FormItem"

import type { ProductFormData } from "@/features/productManagement/pages/RegisterProductPage"
import type { Control } from "react-hook-form"

interface CoverImagesFormProps {
  control: Control<ProductFormData>
  disabled?: boolean
}

/** 커버 이미지는 **선택**이다(최대 4개). 필수는 대표 이미지 1개뿐(§11-6) */
export default function CoverImagesForm(props: CoverImagesFormProps) {
  const { control, disabled = false } = props

  return (
    <FormController
      name="coverImages"
      control={control}
      render={({ field: coverImageField, formState }) => (
        <FormItem
          label="커버 이미지 (선택, 최대 4개)"
          error={formState.errors.coverImages?.message}
        >
          <div className={disabled ? "pointer-events-none opacity-60" : ""}>
            <FormImageUploader
              value={coverImageField.value}
              onImagesChange={coverImageField.onChange}
              accept=".jpg, .jpeg, .png"
              type="PRODUCT"
              maxLength={4}
              maxStorage={1024}
              recommendSize={{ width: 1000, height: 1000 }}
            />
          </div>
        </FormItem>
      )}
    />
  )
}
