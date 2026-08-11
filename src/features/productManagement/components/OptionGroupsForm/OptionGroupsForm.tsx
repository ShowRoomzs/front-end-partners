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
import type {
  OptionCombination,
  OptionItem,
} from "@/features/productManagement/types"
import { cn } from "@/lib/utils"
import { useCallback, useEffect, useRef, useState } from "react"
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

const TEXT_LINK_CLASS =
  "text-[12px] font-medium text-sz-accent-600 hover:underline disabled:cursor-not-allowed disabled:text-sz-n-400 disabled:no-underline"

/**
 * 옵션 그룹 에디터 — 시안 `.optgrp` 구조(그룹 헤더 + 항목 행 + 항목 추가).
 *
 * 그룹 최대 3개 · 그룹당 항목 1~30개 · 그룹이 2개 이상이면 항목의 곱이 SKU가 된다.
 * 항목 행에는 **옵션가 입력이 없다** — 옵션가는 조합 단위 값이라 아래 조합 표에서 받는다.
 *
 * ⚠️ 조합표는 **입력하는 즉시 자동으로 갱신된다.** 예전엔 "옵션 조합 생성·갱신"
 * 버튼을 눌러야 반영됐는데 시안엔 그런 버튼이 없다(시안 스크립트도 input 이벤트마다
 * renderTable()을 부른다). 버튼을 다시 만들지 말 것.
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

  // 그룹 내 항목 드래그 재정렬 — 어느 그룹의 몇 번째를 집었는지
  const [dragSource, setDragSource] = useState<{
    groupIndex: number
    itemIndex: number
  } | null>(null)

  /*
    조합 자동 생성.

    combinations를 의존성에 넣으면 setValue → 재실행 → setValue … 로 루프가 돈다.
    직전 값을 읽기만 하는 용도라 ref로 넘긴다(effect 트리거는 optionGroups 변화만).
  */
  const combinationsRef = useRef<Array<OptionCombination>>([])

  // 렌더 중에 ref를 쓰면 안 되므로 별도 effect로 동기화한다.
  // 아래 syncCombinations effect보다 먼저 선언해야 최신 값을 보고 병합한다.
  useEffect(() => {
    combinationsRef.current = combinations ?? []
  }, [combinations])

  const syncCombinations = useCallback(() => {
    const validItems = (optionGroups ?? [])
      .filter(group => group.name.trim())
      .map(group => group.items.filter(item => item.name.trim()))

    // 그룹명이나 항목이 아직 안 채워졌으면 조합을 만들지 않는다(입력 중간 상태)
    if (validItems.length === 0 || validItems.some(items => !items.length)) {
      return
    }

    // 조합명이 같으면 이미 입력해 둔 옵션가·재고를 살린다 —
    // 그룹을 하나 더 추가했다고 기존 입력값까지 0으로 밀면 안 된다
    const previousByName = new Map(
      combinationsRef.current.map(combo => [combo.combination.join("|"), combo])
    )

    const generated = cartesianProduct(validItems).map((combo, index) => {
      const names = combo.map(item => item.name)
      const previous = previousByName.get(names.join("|"))

      return {
        id: previous?.id ?? crypto.randomUUID(),
        combination: names,
        extraPrice: previous?.extraPrice ?? 0,
        stock: previous?.stock ?? 0,
        isRepresentative: previous?.isRepresentative ?? index === 0,
      }
    })

    // 대표였던 조합이 사라졌으면 첫 행을 대표로 승격 — 대표는 항상 정확히 하나
    if (!generated.some(combo => combo.isRepresentative) && generated[0]) {
      generated[0].isRepresentative = true
    }

    const isSame =
      generated.length === combinationsRef.current.length &&
      generated.every((combo, index) => {
        const previous = combinationsRef.current[index]
        return (
          previous &&
          previous.combination.join("|") === combo.combination.join("|") &&
          previous.extraPrice === combo.extraPrice &&
          previous.stock === combo.stock &&
          previous.isRepresentative === combo.isRepresentative
        )
      })

    // 내용이 그대로면 setValue를 건너뛴다(불필요한 dirty 표시·리렌더 방지)
    if (isSame) {
      return
    }

    setValue("optionCombinations", generated, { shouldDirty: true })
  }, [optionGroups, setValue])

  useEffect(() => {
    if (!useOptionGroup) {
      return
    }
    syncCombinations()
  }, [syncCombinations, useOptionGroup])

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
            {/* 시안 `.toggle-row{height:36px}` */}
            <div className="flex h-9 items-center gap-2.5">
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
        비활성 상태로 남겨두면 "언젠가 켜지는 필드"로 오해된다(§11-7).
      */}
      {useOptionGroup && (
        <ProductField label="옵션 그룹" sub={`(최대 ${OPTION_GROUP_MAX})`}>
          <div
            className={cn(
              // div 기반 클릭 컨트롤(항목 추가/삭제·드래그)은 disabled가 안 먹는다
              disabled && "pointer-events-none opacity-60"
            )}
          >
            {fields.map((field, groupIndex) => (
              <FormController
                key={field.id}
                name={`optionGroups.${groupIndex}.name`}
                control={control}
                rules={PRODUCT_VALIDATION_RULES.optionGroupName}
                render={({ field: nameField, fieldState: nameFieldState }) => (
                  <FormController
                    name={`optionGroups.${groupIndex}.items`}
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

                      const dropOn = (targetIndex: number) => {
                        // 다른 그룹으로는 옮기지 않는다 — 그룹이 곧 축이라 섞이면 조합이 깨진다
                        if (
                          !dragSource ||
                          dragSource.groupIndex !== groupIndex
                        ) {
                          return
                        }
                        const next = [...items]
                        const [moved] = next.splice(dragSource.itemIndex, 1)
                        next.splice(targetIndex, 0, moved)
                        itemsField.onChange(next)
                        setDragSource(null)
                      }

                      return (
                        <div className="mb-2.5 overflow-hidden rounded-[6px] border border-sz-n-200">
                          {/* 시안 `.optgrp-h` */}
                          <div className="flex items-center gap-2 border-b border-sz-n-200 bg-sz-n-50 px-2.5 py-2">
                            <span className="shrink-0 whitespace-nowrap text-[11px] text-sz-n-500">
                              그룹 {groupIndex + 1} · 그룹명
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
                                onClick={() => remove(groupIndex)}
                                className="shrink-0 whitespace-nowrap text-[11px] text-sz-n-500 hover:text-sz-danger-text"
                              >
                                그룹 삭제 ×
                              </button>
                            )}
                          </div>

                          {/* 시안 `.opt-rows` */}
                          <div className="flex flex-col gap-1.5 p-2.5">
                            {items.map((item, itemIndex) => (
                              <div
                                key={item.id}
                                draggable={!disabled}
                                onDragStart={() =>
                                  setDragSource({ groupIndex, itemIndex })
                                }
                                onDragEnd={() => setDragSource(null)}
                                onDragOver={event => event.preventDefault()}
                                onDrop={() => dropOn(itemIndex)}
                                className={cn(
                                  "flex items-center gap-2",
                                  dragSource?.groupIndex === groupIndex &&
                                    dragSource.itemIndex === itemIndex &&
                                    "opacity-40"
                                )}
                              >
                                <span
                                  aria-hidden
                                  className="shrink-0 cursor-grab text-[12px] text-sz-n-400 active:cursor-grabbing"
                                >
                                  ↕
                                </span>
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
                                  className="shrink-0 px-1 text-[14px] text-sz-n-400 hover:text-sz-danger-text disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                            {/* 시안 `.opt-addrow` — 테두리 없는 텍스트 링크 */}
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

            {/* 시안 `.btn-line-sm` — 테두리 없는 텍스트 링크 */}
            {fields.length < OPTION_GROUP_MAX && (
              <button
                type="button"
                onClick={handleAddOptionGroup}
                className={cn(TEXT_LINK_CLASS, "mt-2 inline-flex items-center")}
              >
                + 옵션 그룹 추가
              </button>
            )}

            <FormHint>
              그룹당 항목 1~{OPTION_ITEM_MAX}개 · 그룹이 2개 이상이면 항목의
              조합(곱)이 SKU로 자동 생성됩니다
            </FormHint>
          </div>
        </ProductField>
      )}
    </>
  )
}
