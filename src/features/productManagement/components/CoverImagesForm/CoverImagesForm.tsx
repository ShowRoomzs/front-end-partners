import FormController from "@/common/components/Form/FormController"
import FormImageUploader from "@/common/components/Form/FormImageUploader"
import { ImageSubLabel } from "@/features/productManagement/components/ProductFormLayout/ProductFormLayout"
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
        <div className="mt-3.5">
          <ImageSubLabel note="(선택, 최대 4개)">커버 이미지</ImageSubLabel>
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
          {formState.errors.coverImages?.message && (
            <p className="mt-1.5 text-[11px] font-medium text-sz-danger-text">
              {formState.errors.coverImages.message}
            </p>
          )}
        </div>
      )}
    />
  )
}
