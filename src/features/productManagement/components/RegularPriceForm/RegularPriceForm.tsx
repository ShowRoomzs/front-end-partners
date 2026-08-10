import FormController from "@/common/components/Form/FormController"
import { Input } from "@/components/ui/input"
import { ProductField } from "@/features/productManagement/components/ProductFormLayout/ProductFormLayout"
import { PRICE_MAX } from "@/features/productManagement/constants/params"
import { PRODUCT_VALIDATION_RULES } from "@/features/productManagement/constants/validationRules"
import type { ProductFormData } from "@/features/productManagement/pages/RegisterProductPage"
import type { Control } from "react-hook-form"

interface RegularPriceFormProps {
  control: Control<ProductFormData>
  disabled?: boolean
}

function formatComma(digits: string) {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}

/**
 * 정가 — 숫자만, 3자리 콤마 자동, 최대 9,999,999원.
 *
 * ⚠️ 상한 초과는 **입력 자체를 거부**한다(직전 값 유지). 상한으로 스냅시키지 않는다(§11-5) —
 * 스냅하면 사용자가 잘못 입력한 걸 모른 채 다른 금액으로 저장되기 때문이다.
 */
export default function RegularPriceForm(props: RegularPriceFormProps) {
  const { control, disabled = false } = props

  return (
    <FormController
      name="regularPrice"
      control={control}
      rules={PRODUCT_VALIDATION_RULES.regularPrice}
      render={({ field, fieldState }) => (
        <ProductField
          required
          label="정가"
          error={fieldState.error?.message}
          hint={`옵션 조합(SKU)과 무관한 단일가입니다. 3자리마다 콤마(,) 자동 표시 · 숫자만 입력 · 최대 ${PRICE_MAX.toLocaleString()}원까지 입력 가능합니다.`}
        >
          <div className="flex items-center gap-2">
            <Input
              type="text"
              inputMode="numeric"
              disabled={disabled}
              placeholder="0"
              className="max-w-[200px]"
              value={field.value ? formatComma(String(field.value)) : ""}
              onChange={event => {
                const digitsOnly = event.target.value.replace(/[^0-9]/g, "")
                if (digitsOnly === "") {
                  field.onChange(0)
                  return
                }
                const next = Number(digitsOnly)
                if (next > PRICE_MAX) {
                  return // 초과 입력 거부 — 직전 값을 그대로 둔다
                }
                field.onChange(next)
              }}
              onBlur={field.onBlur}
            />
            <span className="shrink-0 text-[12px] text-sz-n-600">원</span>
          </div>
        </ProductField>
      )}
    />
  )
}
