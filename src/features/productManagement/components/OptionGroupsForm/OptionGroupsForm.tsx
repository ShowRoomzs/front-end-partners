import FormController from "@/common/components/Form/FormController"
import FormOptionTable, {
  type OptionItem,
} from "@/common/components/Form/FormOptionTable"
import { Button } from "@/components/ui/button"
import { PRODUCT_VALIDATION_RULES } from "@/features/productManagement/constants/validationRules"
import type { ProductFormData } from "@/features/productManagement/pages/RegisterProductPage"
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
}

export default function OptionGroupsForm(props: OptionGroupsFormProps) {
  const { control, setValue } = props

  const optionGroups = useWatch({ control, name: "optionGroups" })

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
    append({
      id: crypto.randomUUID(),
      name: "",
      items: [{ id: crypto.randomUUID(), name: "", price: null }],
    })
  }, [append])

  return (
    <div className="space-y-6">
      {fields.map((field, index) => (
        <div key={field.id} className="relative">
          <div className="flex items-center justify-between mb-4">
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
                <Trash2 className="h-4 w-4 mr-1" />
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
      <Button type="button" variant="outline" onClick={handleAddOptionGroup}>
        + 새로운 옵션 추가
      </Button>

      <div className="pt-4 border-t">
        <Button
          type="button"
          variant="default"
          onClick={handleMoveToCombinations}
          className="w-full"
        >
          <ArrowDown className="h-4 w-4 mr-2" />
          옵션 목록으로 이동
        </Button>
      </div>
    </div>
  )
}
