import FormController from "@/common/components/Form/FormController"
import { ImageSubLabel } from "@/features/productManagement/components/ProductFormLayout/ProductFormLayout"
import ProductImageBox from "@/features/productManagement/components/ProductImageBox/ProductImageBox"
import { PRODUCT_VALIDATION_RULES } from "@/features/productManagement/constants/validationRules"
import type { ProductFormData } from "@/features/productManagement/pages/RegisterProductPage"
import type { Control } from "react-hook-form"

interface TitleImageFormProps {
  control: Control<ProductFormData>
  disabled?: boolean
}

/** 대표 이미지 1개 — 시안 `.img-sub-lab` + `.img-row`(96×96 박스 하나) */
export default function TitleImageForm(props: TitleImageFormProps) {
  const { control, disabled = false } = props

  return (
    <FormController
      name="titleImage"
      control={control}
      rules={PRODUCT_VALIDATION_RULES.titleImage}
      render={({ field, formState }) => (
        <div>
          <ImageSubLabel required>대표 이미지</ImageSubLabel>
          <div className="flex flex-wrap gap-2.5">
            <ProductImageBox
              value={field.value}
              onChange={field.onChange}
              emptyLabel="대표"
              tag="대표"
              disabled={disabled}
            />
          </div>
          {formState.errors.titleImage?.message && (
            <p className="text-[11px] font-medium text-sz-danger-text">
              {formState.errors.titleImage.message}
            </p>
          )}
        </div>
      )}
    />
  )
}
