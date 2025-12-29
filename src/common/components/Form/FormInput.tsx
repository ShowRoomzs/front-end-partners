import { forwardRef } from 'react'
import { Input } from '@/components/ui/input'

interface FormInputProps {
  placeholder?: string
  maxLength?: number
  disabled?: boolean
  onChange?: (value: string) => void
  onBlur?: () => void
  id?: string
}

const FormInput = forwardRef<HTMLInputElement, FormInputProps>((props, ref) => {
  const {
    placeholder,
    maxLength,
    disabled = false,
    onChange,
    onBlur,
    id,
  } = props

  return (
    <Input
      ref={ref}
      id={id}
      type="text"
      placeholder={placeholder}
      maxLength={maxLength}
      disabled={disabled}
      onChange={e => onChange?.(e.target.value)}
      onBlur={onBlur}
    />
  )
})

FormInput.displayName = 'FormInput'

export default FormInput
