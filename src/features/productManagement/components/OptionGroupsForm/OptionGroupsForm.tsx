import FormController from "@/common/components/Form/FormController"
import FormOptionTable from "@/common/components/Form/FormOptionTable"
import { Button } from "@/components/ui/button"
import { PRODUCT_VALIDATION_RULES } from "@/features/productManagement/constants/validationRules"
import type { ProductFormData } from "@/features/productManagement/pages/RegisterProductPage"
import { ArrowDown, Trash2 } from "lucide-react"
import { useCallback } from "react"
import type { Control, UseFieldArrayReturn } from "react-hook-form"

interface OptionGroupsFormProps {
  control: Control<ProductFormData>
  fields: UseFieldArrayReturn<ProductFormData, "optionGroups">["fields"]
  remove: UseFieldArrayReturn<ProductFormData, "optionGroups">["remove"]
  append: UseFieldArrayReturn<ProductFormData, "optionGroups">["append"]
  onMoveToCombinations: () => void
}

export default function OptionGroupsForm(props: OptionGroupsFormProps) {
  const { control, fields, remove, append, onMoveToCombinations } = props

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
          onClick={onMoveToCombinations}
          className="w-full"
        >
          <ArrowDown className="h-4 w-4 mr-2" />
          옵션 목록으로 이동
        </Button>
      </div>
    </div>
  )
}
