import FormController from "@/common/components/Form/FormController"
import FormInput from "@/common/components/Form/FormInput"
import { ProductField } from "@/features/productManagement/components/ProductFormLayout/ProductFormLayout"
import {
  FUNCTIONAL_COSMETIC_OPTIONS,
  PRODUCT_NOTICE_FIELDS,
} from "@/features/productManagement/constants/params"
import { PRODUCT_VALIDATION_RULES } from "@/features/productManagement/constants/validationRules"
import type { ProductFormData } from "@/features/productManagement/pages/RegisterProductPage"
import type { ProductNotice } from "@/features/productManagement/services/productService"
import type { Control, FieldErrors } from "react-hook-form"

// Tailwind 임의값으로는 데이터 URI가 파싱되지 않아 인라인 스타일로 넣는다
const SELECT_CHEVRON_STYLE = {
  backgroundImage:
    "url(\"data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6' fill='none'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%235B5F68' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")",
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 10px center",
}

const CONTROL_CLASS =
  "h-8 w-full rounded-[6px] border border-sz-n-300 bg-white px-2.5 text-[13px] text-sz-n-900 outline-none placeholder:text-sz-n-400 focus:border-sz-accent-500 focus:ring-[3px] focus:ring-sz-accent-50 disabled:bg-sz-n-100 disabled:text-sz-n-400"

interface ProductNoticeFormProps {
  control: Control<ProductFormData>
  disabled?: boolean
}

/**
 * 상품정보제공고시 — **화장품 카테고리 고정 11항목, 전부 필수**(§11-8).
 *
 * 필드 정의를 PRODUCT_NOTICE_FIELDS 한 곳에서 끌어다 쓴다 —
 * 필드마다 같은 JSX를 11번 반복하면 항목이 바뀔 때 누락이 생긴다.
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
              const value = (controllerField.value as string) ?? ""

              return (
                <ProductField
                  required
                  label={field.label}
                  hint={field.hint}
                  error={error?.message as string | undefined}
                >
                  {field.control === "textarea" && (
                    <textarea
                      value={value}
                      placeholder="제품 상세 참고하여 입력"
                      disabled={disabled}
                      rows={3}
                      onChange={controllerField.onChange}
                      onBlur={controllerField.onBlur}
                      className={`${CONTROL_CLASS} h-auto min-h-[64px] resize-y py-2 leading-relaxed`}
                    />
                  )}

                  {field.control === "select" && (
                    <select
                      value={value}
                      disabled={disabled}
                      onChange={controllerField.onChange}
                      onBlur={controllerField.onBlur}
                      style={SELECT_CHEVRON_STYLE}
                      className={`${CONTROL_CLASS} appearance-none pr-8`}
                    >
                      {/*
                        빈 값이 유효한 선택지가 아니라는 걸 드러내야 한다 —
                        placeholder 옵션 없이 첫 항목을 자동 선택시키면
                        "해당사항 없음"이 검토 없이 저장된다.
                      */}
                      <option value="">선택하세요</option>
                      {FUNCTIONAL_COSMETIC_OPTIONS.map(option => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  )}

                  {!field.control && (
                    <FormInput
                      value={value}
                      placeholder="제품 상세 참고하여 입력"
                      disabled={disabled}
                      onChange={controllerField.onChange}
                      onBlur={controllerField.onBlur}
                    />
                  )}
                </ProductField>
              )
            }}
          />
        )
      })}
    </>
  )
}
