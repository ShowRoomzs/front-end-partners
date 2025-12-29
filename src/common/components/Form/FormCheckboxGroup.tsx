import { forwardRef } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

export interface CheckboxOption {
  label: string
  value: string
}

interface FormCheckboxGroupProps {
  options: Array<CheckboxOption>
  value?: Array<string>
  onChange?: (value: Array<string>) => void
  disabled?: boolean
}

const FormCheckboxGroup = forwardRef<HTMLDivElement, FormCheckboxGroupProps>(
  (props, ref) => {
    const { options, value = [], onChange, disabled = false } = props

    const handleCheckedChange = (optionValue: string, checked: boolean) => {
      if (checked) {
        onChange?.([...value, optionValue])
      } else {
        onChange?.(value.filter(v => v !== optionValue))
      }
    }

    return (
      <div ref={ref} className="flex flex-col space-y-3">
        {options.map(option => {
          const id = `checkbox-${option.value}`
          const isChecked = value.includes(option.value)

          return (
            <div key={option.value} className="flex items-center space-x-2">
              <Checkbox
                id={id}
                checked={isChecked}
                onCheckedChange={checked =>
                  handleCheckedChange(option.value, checked as boolean)
                }
                disabled={disabled}
              />
              <Label
                htmlFor={id}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                {option.label}
              </Label>
            </div>
          )
        })}
      </div>
    )
  }
)

FormCheckboxGroup.displayName = 'FormCheckboxGroup'

export default FormCheckboxGroup
