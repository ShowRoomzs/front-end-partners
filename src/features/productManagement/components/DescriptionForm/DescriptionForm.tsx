import FormController from "@/common/components/Form/FormController"
import FormEditor from "@/common/components/Form/FormEditor"
import FormItem from "@/common/components/Form/FormItem"
import { PRODUCT_VALIDATION_RULES } from "@/features/productManagement/constants/validationRules"
import type { ProductFormData } from "@/features/productManagement/pages/RegisterProductPage"
import type { Control } from "react-hook-form"

interface DescriptionFormProps {
  control: Control<ProductFormData>
  disabled?: boolean
}

export default function DescriptionForm(props: DescriptionFormProps) {
  const { control, disabled = false } = props

  return (
    <FormController
      name="description"
      control={control}
      rules={PRODUCT_VALIDATION_RULES.description}
      render={({ field, formState }) => (
        <FormItem
          required
          label="상세설명"
          error={formState.errors.description?.message}
        >
          {/* 에디터 툴바는 클릭 컨트롤이라 disabled가 안 먹는다 — 포인터를 막는다 */}
          <div className={disabled ? "pointer-events-none opacity-60" : ""}>
            <FormEditor
              value={field.value}
              onChange={field.onChange}
              imageUploadType="PRODUCT"
              placeholder="상품 설명을 입력하세요"
            />
          </div>
          <p className="mt-1.5 text-[11px] text-sz-n-500">
            소비자 상품 상세 페이지 본문에 노출됩니다. 법정 고지 정보는 아래
            별도 섹션에서 입력합니다.
          </p>
        </FormItem>
      )}
    />
  )
}
