import { forwardRef } from "react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

export interface RadioOption<T = string> {
  label: string
  value: T
}

interface FormRadioGroupProps<T = string> {
  options: Array<RadioOption<T>>
  disabled?: boolean
  onChange?: (value: T) => void
  value?: T
}

const FormRadioGroup = forwardRef<HTMLDivElement, FormRadioGroupProps<any>>(
  (props, ref) => {
    const { options, disabled = false, onChange, value } = props

    return (
      <RadioGroup
        ref={ref}
        value={String(value)}
        onValueChange={val => {
          const option = options.find(opt => String(opt.value) === val)
          if (option) {
            onChange?.(option.value)
          }
        }}
        disabled={disabled}
        className="flex gap-4"
      >
        {options.map(option => (
          <div
            key={String(option.value)}
            className="flex items-center space-x-2"
          >
            <RadioGroupItem
              value={String(option.value)}
              id={String(option.value)}
            />
            <Label htmlFor={String(option.value)} className="font-normal">
              {option.label}
            </Label>
          </div>
        ))}
      </RadioGroup>
    )
  }
)

FormRadioGroup.displayName = "FormRadioGroup"

export default FormRadioGroup
