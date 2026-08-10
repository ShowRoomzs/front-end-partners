import FormController from "@/common/components/Form/FormController"
import FormInput from "@/common/components/Form/FormInput"
import FormItem from "@/common/components/Form/FormItem"
import { PRODUCT_NOTICE_FIELDS } from "@/features/productManagement/constants/params"
import { PRODUCT_VALIDATION_RULES } from "@/features/productManagement/constants/validationRules"
import type { ProductFormData } from "@/features/productManagement/pages/RegisterProductPage"
import type { ProductNotice } from "@/features/productManagement/services/productService"
import type { Control, FieldErrors } from "react-hook-form"

interface ProductNoticeFormProps {
  control: Control<ProductFormData>
  disabled?: boolean
}

/**
 * 상품정보제공고시 — **화장품 카테고리 고정 11항목, 전부 필수**(§11-8).
 *
 * 필드 정의를 PRODUCT_NOTICE_FIELDS 한 곳에서 끌어다 쓴다 —
 * 필드마다 같은 JSX를 11번 반복하면 항목이 바뀔 때 누락이 생긴다.
 * 화장품제조업자·소비자상담 전화번호는 상위에서 가입 정보로 프리필된다(수정 가능).
 */
export default function ProductNoticeForm(props: ProductNoticeFormProps) {
  const { control, disabled = false } = props

  return (
    <>
      {PRODUCT_NOTICE_FIELDS.map(field => {
        const noticeKey = field.key as keyof ProductNotice
        const name = `productNotice.${noticeKey}` as const

        return (
          <FormController
            key={field.key}
            name={name}
            control={control}
            rules={PRODUCT_VALIDATION_RULES.productNotice[field.key]}
            render={({ field: controllerField, formState }) => {
              const noticeErrors = formState.errors.productNotice as
                | FieldErrors<ProductNotice>
                | undefined
              const error = noticeErrors?.[noticeKey]

              return (
                <FormItem
                  required
                  label={field.label}
                  error={error?.message as string | undefined}
                >
                  <FormInput
                    value={controllerField.value as string}
                    placeholder="제품 상세 참고 시 그대로 입력"
                    disabled={disabled}
                    onChange={controllerField.onChange}
                    onBlur={controllerField.onBlur}
                  />
                </FormItem>
              )
            }}
          />
        )
      })}
    </>
  )
}
