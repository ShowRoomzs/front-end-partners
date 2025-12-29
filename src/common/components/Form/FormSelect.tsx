import { forwardRef } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export interface SelectOption {
  label: string
  value: string
}

interface FormSelectProps {
  options: Array<SelectOption>
  placeholder?: string
  disabled?: boolean
  onChange?: (value: string) => void
  value?: string
}

const FormSelect = forwardRef<HTMLButtonElement, FormSelectProps>(
  (props, ref) => {
    const { options, placeholder, disabled = false, onChange, value } = props

    return (
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger ref={ref}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent position="popper" sideOffset={2}>
          {options.map(option => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }
)

FormSelect.displayName = 'FormSelect'

export default FormSelect
