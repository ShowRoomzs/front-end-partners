import { forwardRef } from "react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import type { Option } from "@/common/types/option"

interface FormRadioWithAllProps {
  options: Array<Option<string | null>>
  disabled?: boolean
  onChange?: (value: string) => void
  value?: string
  allLabel?: string
  allValue?: string
}

const FormRadioWithAll = forwardRef<HTMLDivElement, FormRadioWithAllProps>(
  (props, ref) => {
    const {
      options,
      disabled = false,
      onChange,
      value,
      allLabel = "전체",
      allValue = "ALL",
    } = props

    const allOptions = [{ label: allLabel, value: allValue }, ...options]

    return (
      <RadioGroup
        ref={ref}
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        className="flex gap-4"
      >
        {allOptions.map(option => (
          <div key={option.value} className="flex items-center space-x-2">
            <RadioGroupItem
              value={option.value as string}
              id={option.value as string}
            />
            <Label htmlFor={option.value as string} className="font-normal">
              {option.label}
            </Label>
          </div>
        ))}
      </RadioGroup>
    )
  }
)

FormRadioWithAll.displayName = "FormRadioWithAll"

export default FormRadioWithAll
