import { forwardRef } from "react"
import { Input } from "@/components/ui/input"

interface FormInputProps {
  placeholder?: string
  maxLength?: number
  disabled?: boolean
  value?: string | number
  onChange?: (value: string) => void
  onBlur?: () => void
  id?: string
  type?: "text" | "number"
}

const FormInput = forwardRef<HTMLInputElement, FormInputProps>((props, ref) => {
  const {
    placeholder,
    maxLength,
    disabled = false,
    value,
    onChange,
    onBlur,
    id,
    type = "text",
  } = props

  return (
    <Input
      ref={ref}
      id={id}
      type={type}
      placeholder={placeholder}
      maxLength={maxLength}
      disabled={disabled}
      value={value}
      onChange={e => onChange?.(e.target.value)}
      onBlur={onBlur}
    />
  )
})

FormInput.displayName = "FormInput"

export default FormInput
