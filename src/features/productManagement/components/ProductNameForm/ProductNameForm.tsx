import FormController from "@/common/components/Form/FormController"
import FormItem from "@/common/components/Form/FormItem"
import { Input } from "@/components/ui/input"
import { PRODUCT_NAME_MAX_LENGTH } from "@/features/productManagement/constants/params"
import { PRODUCT_VALIDATION_RULES } from "@/features/productManagement/constants/validationRules"
import type { ProductFormData } from "@/features/productManagement/pages/RegisterProductPage"
import type { Control } from "react-hook-form"

/**
 * 이모지 제거 — 코드 포인트 단위로 검사한다.
 *
 * 정규식 문자 클래스로 이모지를 잡으면 ZWJ 시퀀스·변이 선택자가 결합 문자로
 * 취급돼 lint(no-misleading-character-class)에 걸리고, 국기 이모지처럼 코드
 * 포인트가 두 개인 것들이 반쪽만 지워진다. 코드 포인트를 하나씩 훑는 편이 안전하다.
 * 한글 자모(U+1100~)는 어느 범위에도 안 걸리므로 IME 조합 중에도 안전하다.
 */
const EMOJI_RANGES: Array<[number, number]> = [
  [0x1f000, 0x1faff], // 픽토그램·이모티콘 전반
  [0x2600, 0x27bf], // 기타 기호·딩벳
  [0xfe00, 0xfe0f], // 변이 선택자
  [0x1f1e6, 0x1f1ff], // 지역 표시(국기)
  [0x200d, 0x200d], // ZWJ
  [0x20e3, 0x20e3], // 키캡 결합 문자
]

function stripEmoji(value: string) {
  return Array.from(value)
    .filter(char => {
      const code = char.codePointAt(0)
      if (code === undefined) {
        return true
      }
      return !EMOJI_RANGES.some(([start, end]) => code >= start && code <= end)
    })
    .join("")
}

interface ProductNameFormProps {
  control: Control<ProductFormData>
  disabled?: boolean
}

/** 상품명 — 최대 100자, 이모지 실시간 차단, 우측 글자 수 카운터(§11-4) */
export default function ProductNameForm(props: ProductNameFormProps) {
  const { control, disabled = false } = props

  return (
    <FormController
      name="productName"
      control={control}
      rules={PRODUCT_VALIDATION_RULES.productName}
      render={({ field, fieldState }) => {
        const length = (field.value ?? "").length
        const isMax = length >= PRODUCT_NAME_MAX_LENGTH

        return (
          <FormItem label="상품명" required error={fieldState.error?.message}>
            <div className="relative">
              <Input
                value={field.value}
                placeholder="상품명을 입력해 주세요(특수문자 입력은 피해 주세요)"
                maxLength={PRODUCT_NAME_MAX_LENGTH}
                disabled={disabled}
                className="pr-[52px]"
                onChange={event =>
                  // 이모지는 붙여넣기까지 막아야 해서 입력 시점에 제거한다
                  field.onChange(stripEmoji(event.target.value))
                }
                onBlur={field.onBlur}
              />
              <span
                className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] ${
                  isMax ? "text-sz-danger-text" : "text-sz-n-400"
                }`}
              >
                {length}/{PRODUCT_NAME_MAX_LENGTH}
              </span>
            </div>
            <p className="mt-1.5 text-[11px] text-sz-n-500">
              이모지는 입력할 수 없습니다.
            </p>
          </FormItem>
        )
      }}
    />
  )
}
