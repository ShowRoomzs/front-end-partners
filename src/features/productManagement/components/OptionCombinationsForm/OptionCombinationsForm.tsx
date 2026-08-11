import FormController from "@/common/components/Form/FormController"
import { Input } from "@/components/ui/input"
import {
  FormHint,
  ProductField,
} from "@/features/productManagement/components/ProductFormLayout/ProductFormLayout"
import { SoldOutBadge } from "@/features/productManagement/components/StatusBadge/StatusBadge"
import {
  PRICE_MAX,
  STOCK_MAX,
} from "@/features/productManagement/constants/params"
import { PRODUCT_VALIDATION_RULES } from "@/features/productManagement/constants/validationRules"
import type { ProductFormData } from "@/features/productManagement/pages/RegisterProductPage"
import type { OptionCombination } from "@/features/productManagement/types"
import { cn } from "@/lib/utils"
import { useWatch, type Control } from "react-hook-form"

interface OptionCombinationsFormProps {
  control: Control<ProductFormData>
  /** 잠금 상태 표기 — 재고 입력 자체는 어떤 상태에서도 막지 않는다 */
  isLocked?: boolean
}

function formatComma(value: number) {
  return value.toLocaleString()
}

function parseDigits(raw: string, max: number) {
  const digitsOnly = raw.replace(/[^0-9]/g, "")
  if (digitsOnly === "") {
    return 0
  }
  const next = Number(digitsOnly)
  // 상한 초과는 스냅이 아니라 거부 — 정가 입력과 같은 규칙(§11-5)
  return next > max ? null : next
}

const HEAD_CLASS =
  "border-b border-sz-n-200 bg-sz-n-100 px-3 py-2.5 text-center text-[11px] font-medium text-sz-n-600"
const CELL_CLASS =
  "border-b border-sz-n-100 px-3 py-2.5 text-center text-[12px]"

/** 잠금 상태에서 유일하게 열려 있는 열이라는 걸 헤더에서 드러낸다 */
function StockHead({ isLocked }: { isLocked: boolean }) {
  return (
    <th
      className={cn(
        HEAD_CLASS,
        "w-[132px] whitespace-nowrap",
        isLocked && "text-sz-accent-600"
      )}
    >
      {isLocked ? "재고 수량(수정 가능)" : "재고 수량"}
    </th>
  )
}

/**
 * 옵션 목록(조합 SKU) 표 / 재고 수량 표.
 *
 * ⚠️ **재고 입력은 모든 상태에서 항상 활성**이다(§11-9 확정) — 잠금 상태에서도
 * 재고 보충은 허용되어야 한다. 그래서 잠금(`isLocked`)은 옵션가·대표 지정에만 건다.
 *
 * 토글 OFF면 대표·옵션가 열이 **아예 없다**(회색 처리로 남겨두지 않는다) —
 * 존재하지 않는 개념을 비활성 상태로 보여주면 "언젠가 켜지는 필드"로 오해된다(§11-7).
 *
 * "진열 여부" 열은 읽기 전용이다. 재고 0이면 품절, 아니면 진열 —
 * 조합 단위 진열 토글은 브랜드 권한이 아니고 서버에도 해당 필드가 없다(§11-2).
 */
export default function OptionCombinationsForm(
  props: OptionCombinationsFormProps
) {
  const { control, isLocked = false } = props
  const useOptionGroup = useWatch({ control, name: "useOptionGroup" })
  const optionGroups = useWatch({ control, name: "optionGroups" })

  /*
    조합 표의 앞쪽 컬럼은 그룹 하나당 하나다(예: "용량" | "색상").
    조합명을 "50ml / 레드"처럼 한 칸에 합치면 시안과 달라진다.
  */
  const groupNames = (optionGroups ?? [])
    .filter(group => group.name.trim())
    .map(group => group.name)

  if (!useOptionGroup) {
    return (
      <ProductField label="재고 수량" required>
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
                      <th className={cn(HEAD_CLASS, "text-left")}>구성</th>
                      <StockHead isLocked={isLocked} />
                      <th className={cn(HEAD_CLASS, "w-[100px]")}>진열 여부</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td
                        className={cn(
                          CELL_CLASS,
                          "border-b-0 text-left text-sz-n-500"
                        )}
                      >
                        기본 조합(옵션 없음)
                      </td>
                      <td className={cn(CELL_CLASS, "border-b-0")}>
                        <Input
                          type="text"
                          inputMode="numeric"
                          className="mx-auto h-[30px] max-w-[80px]"
                          value={formatComma(stockValue)}
                          onChange={event => {
                            const next = parseDigits(
                              event.target.value,
                              STOCK_MAX
                            )
                            if (next !== null) {
                              field.onChange(next)
                            }
                          }}
                          onBlur={field.onBlur}
                        />
                      </td>
                      <td className={cn(CELL_CLASS, "border-b-0")}>
                        {stockValue === 0 ? (
                          <SoldOutBadge />
                        ) : (
                          <span className="text-[12px] text-sz-n-700">
                            진열
                          </span>
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
                <FormHint>
                  대표 옵션·옵션가 개념 없이 재고 수량만 입력합니다 · 재고 0이면
                  자동으로 품절 표시 · 옵션 그룹을 켜면 조합별 옵션가·재고
                  입력으로 전환됩니다
                </FormHint>
              </div>
            )
          }}
        />
      </ProductField>
    )
  }

  return (
    <ProductField label="옵션 목록" sub="(조합 SKU)" required>
      <FormController
        name="optionCombinations"
        control={control}
        rules={PRODUCT_VALIDATION_RULES.optionCombinations}
        render={({ field, fieldState }) => {
          const combinations: Array<OptionCombination> = field.value ?? []

          const update = (id: string, patch: Partial<OptionCombination>) =>
            field.onChange(
              combinations.map(combo =>
                combo.id === id ? { ...combo, ...patch } : combo
              )
            )

          const setRepresentative = (id: string) =>
            field.onChange(
              combinations.map(combo => ({
                ...combo,
                isRepresentative: combo.id === id,
                // 대표는 정가가 곧 가격이라 옵션가를 가질 수 없다
                extraPrice: combo.id === id ? 0 : combo.extraPrice,
              }))
            )

          if (combinations.length === 0) {
            return (
              <div>
                <div className="rounded-[6px] border border-dashed border-sz-n-300 px-4 py-8 text-center text-[12px] text-sz-n-500">
                  위 옵션 그룹의 그룹명과 항목을 입력하면 조합이 자동으로
                  생성됩니다.
                </div>
                {fieldState.error?.message && (
                  <p className="mt-1.5 text-[11px] font-medium text-sz-danger-text">
                    {fieldState.error.message}
                  </p>
                )}
              </div>
            )
          }

          return (
            <div>
              <table className="w-full border-collapse overflow-hidden rounded-[6px] border border-sz-n-200">
                <thead>
                  <tr>
                    {/* 그룹마다 컬럼 하나 — 시안 스크립트의 head 생성과 동일 */}
                    {groupNames.map(name => (
                      <th key={name} className={cn(HEAD_CLASS, "text-left")}>
                        {name}
                      </th>
                    ))}
                    <th className={cn(HEAD_CLASS, "w-[56px]")}>대표</th>
                    <th className={cn(HEAD_CLASS, "w-[110px]")}>옵션가</th>
                    <StockHead isLocked={isLocked} />
                    <th className={cn(HEAD_CLASS, "w-[90px]")}>진열 여부</th>
                  </tr>
                </thead>
                <tbody>
                  {combinations.map((combo, index) => {
                    const isLast = index === combinations.length - 1

                    return (
                      <tr key={combo.id}>
                        {/* 그룹 순서대로 항목명을 한 칸씩 — 헤더의 그룹 컬럼과 1:1 */}
                        {combo.combination.map((name, nameIndex) => (
                          <td
                            key={`${combo.id}-${nameIndex}`}
                            className={cn(
                              CELL_CLASS,
                              "text-left text-sz-n-900",
                              isLast && "border-b-0"
                            )}
                          >
                            {name}
                          </td>
                        ))}
                        <td className={cn(CELL_CLASS, isLast && "border-b-0")}>
                          <input
                            type="radio"
                            name="representative-combination"
                            checked={combo.isRepresentative}
                            disabled={isLocked}
                            onChange={() => setRepresentative(combo.id)}
                            className="h-3.5 w-3.5 accent-sz-accent-500 disabled:opacity-40"
                          />
                        </td>
                        <td className={cn(CELL_CLASS, isLast && "border-b-0")}>
                          {combo.isRepresentative ? (
                            <span className="text-[11px] font-semibold text-sz-accent-600">
                              정가 적용
                            </span>
                          ) : (
                            <Input
                              type="text"
                              inputMode="numeric"
                              disabled={isLocked}
                              className="mx-auto h-[30px] max-w-[90px]"
                              value={formatComma(combo.extraPrice)}
                              onChange={event => {
                                const next = parseDigits(
                                  event.target.value,
                                  PRICE_MAX
                                )
                                if (next !== null) {
                                  update(combo.id, { extraPrice: next })
                                }
                              }}
                            />
                          )}
                        </td>
                        <td className={cn(CELL_CLASS, isLast && "border-b-0")}>
                          {/* 재고는 잠금 상태에서도 열어 둔다 — 유일한 예외 */}
                          <Input
                            type="text"
                            inputMode="numeric"
                            className="mx-auto h-[30px] max-w-[80px]"
                            value={formatComma(combo.stock)}
                            onChange={event => {
                              const next = parseDigits(
                                event.target.value,
                                STOCK_MAX
                              )
                              if (next !== null) {
                                update(combo.id, { stock: next })
                              }
                            }}
                          />
                        </td>
                        <td className={cn(CELL_CLASS, isLast && "border-b-0")}>
                          {combo.stock === 0 ? (
                            <SoldOutBadge />
                          ) : (
                            <span className="text-[12px] text-sz-n-700">
                              진열
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>

              {fieldState.error?.message && (
                <p className="mt-1.5 text-[11px] font-medium text-sz-danger-text">
                  {fieldState.error.message}
                </p>
              )}

              <FormHint>
                재고·옵션가는 직접 입력(3자리마다 콤마 자동 표시) · 조합
                추가/삭제는 위 그룹에서 관리 · 대표 옵션은 정가가 곧 가격이라
                옵션가 입력 불가 · 재고 0이면 자동으로 품절 표시
                {isLocked && (
                  <>
                    <br />
                    <b className="text-sz-n-700">
                      진행중 공구에 연결되어 재고 수량만 수정할 수 있습니다.
                    </b>{" "}
                    옵션 그룹·항목·옵션가·대표 옵션 변경은 공구 종료 후
                    가능합니다.
                  </>
                )}
              </FormHint>
            </div>
          )
        }}
      />
    </ProductField>
  )
}
