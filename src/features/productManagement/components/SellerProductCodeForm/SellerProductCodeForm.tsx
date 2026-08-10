import FormController from "@/common/components/Form/FormController"
import FormInput from "@/common/components/Form/FormInput"
import FormItem from "@/common/components/Form/FormItem"
import type { ProductFormData } from "@/features/productManagement/pages/RegisterProductPage"
import type { Control } from "react-hook-form"

interface SellerProductCodeFormProps {
  control: Control<ProductFormData>
  disabled?: boolean
}

/** 브랜드 내부 관리·ERP 매칭용 — 소비자에게 노출되지 않는다(§11-4) */
export default function SellerProductCodeForm(
  props: SellerProductCodeFormProps
) {
  const { control, disabled = false } = props

  return (
    <FormController
      name="sellerProductCode"
      control={control}
      render={({ field }) => (
        <FormItem label="브랜드상품코드">
          <FormInput
            value={field.value}
            placeholder="브랜드 내부 관리 코드"
            disabled={disabled}
            onChange={field.onChange}
            onBlur={field.onBlur}
          />
          <p className="mt-1.5 text-[11px] text-sz-n-500">
            브랜드 자체 재고·ERP 매칭용 · 소비자에게 노출되지 않습니다
          </p>
        </FormItem>
      )}
    />
  )
}
