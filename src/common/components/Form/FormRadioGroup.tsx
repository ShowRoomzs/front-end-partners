import { forwardRef } from 'react'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'

export interface RadioOption {
  label: string
  value: string
}

interface FormRadioGroupProps {
  options: Array<RadioOption>
  disabled?: boolean
  onChange?: (value: string) => void
  value?: string
}

const FormRadioGroup = forwardRef<HTMLDivElement, FormRadioGroupProps>(
  (props, ref) => {
    const { options, disabled = false, onChange, value } = props

    return (
      <RadioGroup
        ref={ref}
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        className="flex gap-4"
      >
        {options.map(option => (
          <div key={option.value} className="flex items-center space-x-2">
            <RadioGroupItem value={option.value} id={option.value} />
            <Label htmlFor={option.value} className="font-normal">
              {option.label}
            </Label>
          </div>
        ))}
      </RadioGroup>
    )
  }
)

FormRadioGroup.displayName = 'FormRadioGroup'

export default FormRadioGroup
