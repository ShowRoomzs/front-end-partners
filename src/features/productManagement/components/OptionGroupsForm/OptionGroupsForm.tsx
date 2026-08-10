import FormController from "@/common/components/Form/FormController"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import {
  FormHint,
  ProductField,
} from "@/features/productManagement/components/ProductFormLayout/ProductFormLayout"
import {
  OPTION_GROUP_MAX,
  OPTION_ITEM_MAX,
} from "@/features/productManagement/constants/params"
import { PRODUCT_VALIDATION_RULES } from "@/features/productManagement/constants/validationRules"
import type { ProductFormData } from "@/features/productManagement/pages/RegisterProductPage"
import type { OptionItem } from "@/features/productManagement/types"
import { cn } from "@/lib/utils"
import { useCallback } from "react"
import {
  useFieldArray,
  useWatch,
  type Control,
  type UseFormSetValue,
} from "react-hook-form"
import toast from "react-hot-toast"

interface OptionGroupsFormProps {
  control: Control<ProductFormData>
  setValue: UseFormSetValue<ProductFormData>
  disabled?: boolean
}

/** 항목 배열들의 데카르트 곱 — 그룹이 2개 이상이면 곱이 곧 SKU가 된다 */
function cartesianProduct(
  arrays: Array<Array<OptionItem>>
): Array<Array<OptionItem>> {
  if (arrays.length === 0) {
    return []
  }
  if (arrays.length === 1) {
    return arrays[0].map(item => [item])
  }

  const result: Array<Array<OptionItem>> = []
  const restProduct = cartesianProduct(arrays.slice(1))

  for (const item of arrays[0]) {
    for (const rest of restProduct) {
      result.push([item, ...rest])
    }
  }

  return result
}

/**
 * 옵션 그룹 에디터 — 시안 `.optgrp` 구조(그룹 헤더 + 항목 행 + 항목 추가).
 *
 * 그룹 최대 3개 · 그룹당 항목 1~30개 · 그룹이 2개 이상이면 항목의 곱이 SKU로 생성된다.
 * 항목 행에는 **옵션가 입력이 없다** — 옵션가는 조합 단위 값이라 아래 조합 표에서 받는다.
 */
export default function OptionGroupsForm(props: OptionGroupsFormProps) {
  const { control, setValue, disabled = false } = props

  const optionGroups = useWatch({ control, name: "optionGroups" })
  const useOptionGroup = useWatch({ control, name: "useOptionGroup" })
  const combinations = useWatch({ control, name: "optionCombinations" })

  const { fields, append, remove } = useFieldArray({
    control,
    name: "optionGroups",
  })

  const handleGenerateCombinations = useCallback(() => {
    if (optionGroups.length === 0) {
      toast.error("옵션을 입력해 주세요.")
      return
    }

    for (const [index, group] of optionGroups.entries()) {
      if (!group.name) {
        toast.error(`그룹 ${index + 1}의 그룹명을 입력해 주세요.`)
        return
      }
      const hasSameGroupName = optionGroups.some(
        curGroup => curGroup.name === group.name && curGroup.id !== group.id
      )
      if (hasSameGroupName) {
        toast.error("동일한 옵션명은 사용할 수 없습니다.")
        return
      }

      const filledItems = group.items.filter(item => item.name)
      if (filledItems.length === 0) {
        toast.error(`"${group.name}" 옵션 항목을 입력해 주세요.`)
        return
      }
      if (filledItems.length > OPTION_ITEM_MAX) {
        toast.error(
          `옵션 항목은 그룹당 최대 ${OPTION_ITEM_MAX}개까지 입력할 수 있습니다.`
        )
        return
      }
      const hasSameItemName = group.items.some(item =>
        group.items.some(
          curItem => curItem.name === item.name && curItem.id !== item.id
        )
      )
      if (hasSameItemName) {
        toast.error("동일한 옵션 항목명은 사용할 수 없습니다.")
        return
      }
    }

    const validItems = optionGroups.map(group =>
      group.items.filter(item => item.name)
    )

    // 이미 입력해 둔 옵션가·재고는 조합명이 같으면 살린다 — 그룹을 하나 더
    // 추가했다고 기존 조합의 입력값까지 0으로 밀면 안 된다
    const previousByName = new Map(
      (combinations ?? []).map(combo => [combo.combination.join(" / "), combo])
    )

    const generated = cartesianProduct(validItems).map((combo, index) => {
      const names = combo.map(item => item.name)
      const previous = previousByName.get(names.join(" / "))

      return {
        id: previous?.id ?? crypto.randomUUID(),
        combination: names,
        extraPrice: previous?.extraPrice ?? 0,
        stock: previous?.stock ?? 0,
        isRepresentative: previous?.isRepresentative ?? index === 0,
      }
    })

    // 살려낸 대표 표시가 하나도 없으면(대표였던 조합이 사라진 경우) 첫 행을 대표로
    if (!generated.some(combo => combo.isRepresentative) && generated[0]) {
      generated[0].isRepresentative = true
    }

    setValue("optionCombinations", generated, { shouldDirty: true })
    toast.success(`옵션 조합 ${generated.length}개를 생성했습니다.`)
  }, [combinations, optionGroups, setValue])

  const handleAddOptionGroup = useCallback(() => {
    if (fields.length >= OPTION_GROUP_MAX) {
      toast.error(
        `옵션 그룹은 최대 ${OPTION_GROUP_MAX}개까지 추가할 수 있습니다.`
      )
      return
    }
    append({
      id: crypto.randomUUID(),
      name: "",
      items: [{ id: crypto.randomUUID(), name: "" }],
    })
  }, [append, fields.length])

  return (
    <>
      <FormController
        name="useOptionGroup"
        control={control}
        render={({ field }) => (
          <ProductField label="옵션 그룹 사용">
            <div className="flex h-8 items-center gap-2.5">
              <Switch
                checked={field.value}
                disabled={disabled}
                onCheckedChange={field.onChange}
              />
              <span className="text-[12px] text-sz-n-700">
                {field.value
                  ? "사용 중 (끄면 기본 조합 1개로 통일)"
                  : "미사용 (기본 조합 1개로 통일)"}
              </span>
            </div>
          </ProductField>
        )}
      />

      {/*
        토글 OFF면 그룹 에디터를 아예 감춘다 — 존재하지 않는 개념(대표 옵션·옵션가)을
        비활성 상태로 남겨두면 "언젠가 켜지는 필드"로 오해된다(§6 UI 차이 표).
      */}
      {useOptionGroup && (
        <ProductField label="옵션 그룹" sub={`(최대 ${OPTION_GROUP_MAX})`}>
          <div
            className={cn(
              // div 기반 클릭 컨트롤(항목 추가/삭제)은 disabled가 안 먹는다
              disabled && "pointer-events-none opacity-60"
            )}
          >
            {fields.map((field, index) => (
              <FormController
                key={field.id}
                name={`optionGroups.${index}.name`}
                control={control}
                rules={PRODUCT_VALIDATION_RULES.optionGroupName}
                render={({ field: nameField, fieldState: nameFieldState }) => (
                  <FormController
                    name={`optionGroups.${index}.items`}
                    control={control}
                    rules={PRODUCT_VALIDATION_RULES.optionGroupItems}
                    render={({
                      field: itemsField,
                      fieldState: itemsFieldState,
                    }) => {
                      const items = itemsField.value

                      const changeItem = (
                        itemId: string | number,
                        name: string
                      ) =>
                        itemsField.onChange(
                          items.map(item =>
                            item.id === itemId ? { ...item, name } : item
                          )
                        )

                      const removeItem = (itemId: string | number) => {
                        if (items.length <= 1) {
                          return
                        }
                        itemsField.onChange(
                          items.filter(item => item.id !== itemId)
                        )
                      }

                      const addItem = () => {
                        if (items.length >= OPTION_ITEM_MAX) {
                          toast.error(
                            `옵션 항목은 그룹당 최대 ${OPTION_ITEM_MAX}개까지 입력할 수 있습니다.`
                          )
                          return
                        }
                        itemsField.onChange([
                          ...items,
                          { id: crypto.randomUUID(), name: "" },
                        ])
                      }

                      return (
                        <div className="mb-2.5 overflow-hidden rounded-[6px] border border-sz-n-200">
                          <div className="flex items-center gap-2 border-b border-sz-n-200 bg-sz-n-50 px-2.5 py-2">
                            <span className="shrink-0 whitespace-nowrap text-[11px] text-sz-n-500">
                              그룹 {index + 1} · 그룹명
                            </span>
                            <Input
                              value={nameField.value}
                              onChange={nameField.onChange}
                              onBlur={nameField.onBlur}
                              placeholder="예: 용량"
                              className="h-[30px] flex-1"
                            />
                            {fields.length > 1 && (
                              <button
                                type="button"
                                onClick={() => remove(index)}
                                className="shrink-0 whitespace-nowrap text-[11px] text-sz-n-500 hover:text-sz-danger-text"
                              >
                                그룹 삭제 ×
                              </button>
                            )}
                          </div>

                          <div className="flex flex-col gap-1.5 p-2.5">
                            {items.map(item => (
                              <div
                                key={item.id}
                                className="flex items-center gap-2"
                              >
                                <Input
                                  value={item.name}
                                  onChange={event =>
                                    changeItem(item.id, event.target.value)
                                  }
                                  placeholder="예: 50ml"
                                  className="h-[30px] flex-1"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeItem(item.id)}
                                  disabled={items.length <= 1}
                                  aria-label="항목 삭제"
                                  className="shrink-0 px-1 text-[13px] text-sz-n-400 hover:text-sz-danger-text disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={addItem}
                              className="self-start py-0.5 text-[11px] text-sz-accent-600 hover:underline"
                            >
                              + 항목 추가
                            </button>
                          </div>

                          {(nameFieldState.error?.message ||
                            itemsFieldState.error?.message) && (
                            <p className="px-2.5 pb-2.5 text-[11px] font-medium text-sz-danger-text">
                              {nameFieldState.error?.message ??
                                itemsFieldState.error?.message}
                            </p>
                          )}
                        </div>
                      )
                    }}
                  />
                )}
              />
            ))}

            {fields.length < OPTION_GROUP_MAX && (
              <button
                type="button"
                onClick={handleAddOptionGroup}
                className="inline-flex items-center text-[12px] text-sz-accent-600 hover:underline"
              >
                + 옵션 그룹 추가
              </button>
            )}

            {/* 시안 `.gen-bridge` — 그룹 편집 결과를 아래 조합 표로 내려보내는 자리 */}
            <div className="my-2 flex">
              <button
                type="button"
                onClick={handleGenerateCombinations}
                className="inline-flex h-8 items-center rounded-[6px] border border-sz-n-300 bg-white px-3 text-[12px] font-medium text-sz-n-900 hover:bg-sz-n-100"
              >
                ↓ 옵션 조합 생성·갱신
              </button>
            </div>

            <FormHint className="mt-0">
              그룹당 항목 1~{OPTION_ITEM_MAX}개 · 그룹이 2개 이상이면 항목의
              조합(곱)이 SKU로 자동 생성됩니다
            </FormHint>
          </div>
        </ProductField>
      )}
    </>
  )
}
