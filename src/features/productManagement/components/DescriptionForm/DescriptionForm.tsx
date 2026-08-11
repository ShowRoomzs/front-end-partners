import FormController from "@/common/components/Form/FormController"
import FormEditor from "@/common/components/Form/FormEditor"
import { FormHint } from "@/features/productManagement/components/ProductFormLayout/ProductFormLayout"
import { PRODUCT_VALIDATION_RULES } from "@/features/productManagement/constants/validationRules"
import type { ProductFormData } from "@/features/productManagement/pages/RegisterProductPage"
import type { Control } from "react-hook-form"

interface DescriptionFormProps {
  control: Control<ProductFormData>
  disabled?: boolean
}

/** 상세설명 — 시안에서는 라벨 없이 섹션 제목 아래 에디터가 바로 온다 */
export default function DescriptionForm(props: DescriptionFormProps) {
  const { control, disabled = false } = props

  return (
    <FormController
      name="description"
      control={control}
      rules={PRODUCT_VALIDATION_RULES.description}
      render={({ field, formState }) => (
        <div>
          {/*
            잠금은 에디터 안쪽까지 내려보낸다. 감싼 div에 pointer-events-none만
            걸면 본문이 contenteditable이라 Tab으로 들어가 그대로 타이핑된다.
          */}
          <FormEditor
            value={field.value}
            onChange={field.onChange}
            imageUploadType="PRODUCT"
            placeholder="상품 설명을 입력하세요"
            disabled={disabled}
          />
          {formState.errors.description?.message && (
            <p className="mt-1.5 text-[11px] font-medium text-sz-danger-text">
              {formState.errors.description.message}
            </p>
          )}
          <FormHint>
            소비자 상품 상세 페이지 본문에 노출됩니다. 법적 고시 정보는 아래
            별도 섹션에 입력합니다.
          </FormHint>
        </div>
      )}
    />
  )
}
