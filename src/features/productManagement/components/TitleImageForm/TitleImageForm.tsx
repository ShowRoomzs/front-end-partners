import FormController from "@/common/components/Form/FormController"
import FormImageUploader from "@/common/components/Form/FormImageUploader"
import { ImageSubLabel } from "@/features/productManagement/components/ProductFormLayout/ProductFormLayout"
import { PRODUCT_VALIDATION_RULES } from "@/features/productManagement/constants/validationRules"
import type { ProductFormData } from "@/features/productManagement/pages/RegisterProductPage"
import type { Control } from "react-hook-form"

interface TitleImageFormProps {
  control: Control<ProductFormData>
  disabled?: boolean
}

/** 대표 이미지 1개 — 상품 이미지 섹션 안의 소제목 블록(시안 `.img-sub-lab` + `.img-row`) */
export default function TitleImageForm(props: TitleImageFormProps) {
  const { control, disabled = false } = props

  return (
    <FormController
      name="titleImage"
      control={control}
      rules={PRODUCT_VALIDATION_RULES.titleImage}
      render={({ field: titleImageField, formState }) => (
        <div>
          <ImageSubLabel required>대표 이미지</ImageSubLabel>
          {/* 이미지 박스는 클릭 컨트롤이라 disabled가 안 먹는다 — 포인터를 막는다 */}
          <div className={disabled ? "pointer-events-none opacity-60" : ""}>
            <FormImageUploader
              value={titleImageField.value}
              onImagesChange={items => titleImageField.onChange(items[0])}
              accept=".jpg, .jpeg, .png"
              type="PRODUCT"
              maxLength={1}
              maxStorage={1024}
              recommendSize={{ width: 1000, height: 1000 }}
            />
          </div>
          {formState.errors.titleImage?.message && (
            <p className="mt-1.5 text-[11px] font-medium text-sz-danger-text">
              {formState.errors.titleImage.message}
            </p>
          )}
        </div>
      )}
    />
  )
}
