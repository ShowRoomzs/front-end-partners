import FormController from "@/common/components/Form/FormController"
import FormOptionTable, {
  type OptionItem,
} from "@/common/components/Form/FormOptionTable"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import {
  OPTION_GROUP_MAX,
  OPTION_ITEM_MAX,
} from "@/features/productManagement/constants/params"
import { PRODUCT_VALIDATION_RULES } from "@/features/productManagement/constants/validationRules"
import type { ProductFormData } from "@/features/productManagement/pages/RegisterProductPage"
import { cn } from "@/lib/utils"
import { ArrowDown, Trash2 } from "lucide-react"
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

/**
 * 옵션 그룹 에디터 — 토글 ON일 때만 노출된다(§11-7).
 *
 * 그룹 최대 3개 · 그룹당 항목 1~30개 · 그룹이 2개 이상이면 항목의 곱(조합)이
 * SKU로 자동 생성된다. 대표 옵션은 옵션가를 입력할 수 없다(정가가 곧 가격).
 */
export default function OptionGroupsForm(props: OptionGroupsFormProps) {
  const { control, setValue, disabled = false } = props

  const optionGroups = useWatch({ control, name: "optionGroups" })
  const useOptionGroup = useWatch({ control, name: "useOptionGroup" })

  const { fields, append, remove } = useFieldArray({
    control,
    name: "optionGroups",
  })

  const handleMoveToCombinations = () => {
    if (optionGroups.length === 0) {
      toast.error("옵션을 입력해 주세요.")
      return
    }

    for (const group of optionGroups) {
      const index = optionGroups.indexOf(group)
      if (!group.name) {
        toast.error(`옵션${index + 1} 그룹명을 입력해 주세요.`)
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

    const cartesianProduct = (
      arrays: Array<Array<OptionItem>>
    ): Array<Array<OptionItem>> => {
      if (arrays.length === 0) return []
      if (arrays.length === 1) return arrays[0].map(item => [item])

      const result: Array<Array<OptionItem>> = []
      const restProduct = cartesianProduct(arrays.slice(1))

      for (const item of arrays[0]) {
        for (const rest of restProduct) {
          result.push([item, ...rest])
        }
      }

      return result
    }

    const combinations = cartesianProduct(validItems)

    const newCombinations = combinations.map((combo, index) => ({
      id: crypto.randomUUID(),
      combination: combo.map(item => item.name),
      price: combo
        .reduce((sum, item) => sum + Number(item.price || 0), 0)
        .toString(),
      stock: "0",
      isDisplayed: true,
      isRepresentative: index === 0,
    }))

    setValue("optionCombinations", newCombinations)
  }

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
      items: [{ id: crypto.randomUUID(), name: "", price: null }],
    })
  }, [append, fields.length])

  return (
    <div className="space-y-6">
      <FormController
        name="useOptionGroup"
        control={control}
        render={({ field }) => (
          <div className="flex items-center gap-2.5">
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
        )}
      />

      {/*
        토글 OFF면 그룹 에디터를 아예 감춘다 — 존재하지 않는 개념(대표 옵션·옵션가)을
        비활성 상태로 남겨두면 "언젠가 켜지는 필드"로 오해된다(§6 UI 차이 표).
      */}
      {useOptionGroup && (
        <div
          className={cn(
            "space-y-6",
            // div 기반 클릭 컨트롤(항목 추가/삭제·드래그)은 disabled가 안 먹는다
            disabled && "pointer-events-none opacity-60"
          )}
        >
          {fields.map((field, index) => (
            <div key={field.id} className="relative">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-900">
                  옵션 {index + 1}
                </h3>
                {fields.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="mr-1 h-4 w-4" />
                    옵션 삭제
                  </Button>
                )}
              </div>
              <FormController
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
                    }) => (
                      <FormOptionTable
                        optionName={nameField.value}
                        onOptionNameChange={nameField.onChange}
                        options={itemsField.value}
                        onChange={itemsField.onChange}
                        nameError={nameFieldState.error?.message}
                        itemsError={itemsFieldState.error?.message}
                      />
                    )}
                  />
                )}
              />
            </div>
          ))}

          {fields.length < OPTION_GROUP_MAX && (
            <Button
              type="button"
              variant="outline"
              onClick={handleAddOptionGroup}
            >
              + 새로운 옵션 추가
            </Button>
          )}

          <p className="text-[11px] leading-relaxed text-sz-n-500">
            그룹 최대 {OPTION_GROUP_MAX}개 · 그룹당 항목 1~{OPTION_ITEM_MAX}개 ·
            그룹이 2개 이상이면 항목의 조합(곱)이 SKU로 자동 생성됩니다
          </p>

          <div className="border-t pt-4">
            <Button
              type="button"
              variant="default"
              onClick={handleMoveToCombinations}
              className="w-full"
            >
              <ArrowDown className="mr-2 h-4 w-4" />
              옵션 목록으로 이동
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
