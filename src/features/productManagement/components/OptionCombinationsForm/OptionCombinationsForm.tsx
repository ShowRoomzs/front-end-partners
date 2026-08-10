import FormController from "@/common/components/Form/FormController"
import FormOptionCombinationTable from "@/common/components/Form/FormOptionCombinationTable"
import { Input } from "@/components/ui/input"
import { SoldOutBadge } from "@/features/productManagement/components/StatusBadge/StatusBadge"
import { PRODUCT_VALIDATION_RULES } from "@/features/productManagement/constants/validationRules"
import type { ProductFormData } from "@/features/productManagement/pages/RegisterProductPage"
import { useWatch, type Control } from "react-hook-form"

interface OptionCombinationsFormProps {
  control: Control<ProductFormData>
  /** 잠금 상태 표기 — 재고 입력 자체는 어떤 상태에서도 막지 않는다 */
  isLocked?: boolean
}

function formatComma(digits: string) {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}

/**
 * 옵션 목록(조합 SKU) 표 / 재고 수량 표.
 *
 * ⚠️ **재고 입력은 모든 상태에서 항상 활성**이다(§11-9 확정) — 잠금 상태에서도
 * 재고 보충은 허용되어야 한다. 잠금 상태에서는 표 헤더를 "재고 수량(수정 가능)"으로
 * 액센트 표기해 유일하게 열린 필드임을 드러낸다.
 *
 * 토글 OFF면 대표·옵션가 열이 **아예 없다**(회색 처리로 남겨두지 않는다) —
 * 존재하지 않는 개념을 비활성 상태로 보여주면 "언젠가 켜지는 필드"로 오해된다(§11-7).
 */
export default function OptionCombinationsForm(
  props: OptionCombinationsFormProps
) {
  const { control, isLocked = false } = props
  const useOptionGroup = useWatch({ control, name: "useOptionGroup" })

  if (!useOptionGroup) {
    return (
      <FormController
        name="stock"
        control={control}
        render={({ field }) => {
          const stockValue = Number(field.value ?? 0)

          return (
            <div>
              <table className="w-full table-fixed border-collapse overflow-hidden rounded-[6px] border border-sz-n-200">
                <thead>
                  <tr>
                    <th className="border-b border-sz-n-200 bg-sz-n-100 px-3 py-2.5 text-left text-[11px] font-medium text-sz-n-600">
                      구성
                    </th>
                    <th
                      className={`w-[132px] whitespace-nowrap border-b border-sz-n-200 bg-sz-n-100 px-3 py-2.5 text-center text-[11px] font-medium ${
                        isLocked ? "text-sz-accent-600" : "text-sz-n-600"
                      }`}
                    >
                      {isLocked ? "재고 수량(수정 가능)" : "재고 수량"}
                    </th>
                    <th className="w-[100px] border-b border-sz-n-200 bg-sz-n-100 px-3 py-2.5 text-center text-[11px] font-medium text-sz-n-600">
                      진열 여부
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="px-3 py-2.5 text-left text-[12px] text-sz-n-500">
                      기본 조합(옵션 없음)
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <Input
                        type="text"
                        inputMode="numeric"
                        className="mx-auto h-[30px] max-w-[80px]"
                        value={formatComma(String(stockValue))}
                        onChange={event => {
                          const digitsOnly = event.target.value.replace(
                            /[^0-9]/g,
                            ""
                          )
                          field.onChange(
                            digitsOnly === "" ? 0 : Number(digitsOnly)
                          )
                        }}
                        onBlur={field.onBlur}
                      />
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      {/* 재고 0이면 자동 품절 — 별도 입력 필드가 아니다 */}
                      {stockValue === 0 ? (
                        <SoldOutBadge />
                      ) : (
                        <span className="text-[12px] text-sz-n-700">진열</span>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
              <p className="mt-1.5 text-[11px] leading-relaxed text-sz-n-500">
                대표 옵션·옵션가 개념 없이 재고 수량만 입력합니다 · 재고 0이면
                자동으로 품절 표시 · 옵션 그룹을 켜면 조합별 옵션가·재고
                입력으로 전환됩니다
              </p>
            </div>
          )
        }}
      />
    )
  }

  return (
    <FormController
      name="optionCombinations"
      control={control}
      rules={PRODUCT_VALIDATION_RULES.optionCombinations}
      render={({ field, fieldState }) => (
        <div>
          <FormOptionCombinationTable
            combinations={field.value}
            onChange={field.onChange}
          />
          {fieldState.error?.message && (
            <p className="mt-1.5 text-sm font-medium text-destructive">
              {fieldState.error.message}
            </p>
          )}
          <p className="mt-1.5 text-[11px] leading-relaxed text-sz-n-500">
            재고·옵션가는 직접 입력 · 조합 추가/삭제는 위 그룹에서 관리 · 대표
            옵션은 정가가 곧 가격이라 옵션가 입력 불가 · 재고 0이면 자동으로
            품절 표시
            {isLocked && (
              <>
                <br />
                <b className="text-sz-n-700">
                  진행중 공구에 연결되어 재고 수량만 수정할 수 있습니다.
                </b>{" "}
                옵션 그룹·항목·옵션가·대표 옵션 변경은 공구 종료 후 가능합니다.
              </>
            )}
          </p>
        </div>
      )}
    />
  )
}
