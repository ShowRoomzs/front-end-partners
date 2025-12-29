import type { ReactNode } from 'react'
import { Label } from '@/components/ui/label'

interface FormItemProps {
  label: string
  required?: boolean
  error?: string
  children: ReactNode
  htmlFor?: string
}

export default function FormItem(props: FormItemProps) {
  const { label, required = false, error, children, htmlFor } = props

  return (
    <div className="space-y-2">
      <div className="flex gap-4 items-center">
        <Label htmlFor={htmlFor} className="text-sm font-medium w-32 shrink-0">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
        <div className="flex-1">{children}</div>
      </div>
      {error && (
        <div className="flex gap-4">
          <div className="w-32 shrink-0" />
          <p className="text-sm font-medium text-destructive flex-1">{error}</p>
        </div>
      )}
    </div>
  )
}
