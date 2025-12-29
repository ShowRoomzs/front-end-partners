import type { ReactNode } from 'react'
import { Label } from '@/components/ui/label'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Info } from 'lucide-react'

interface FormItemProps {
  label: string
  required?: boolean
  error?: string
  children: ReactNode
  htmlFor?: string
  tooltipInfo?: string
}

export default function FormItem(props: FormItemProps) {
  const {
    label,
    required = false,
    error,
    children,
    htmlFor,
    tooltipInfo,
  } = props

  return (
    <div className="space-y-2">
      <div className="flex gap-4 items-center">
        <div className="flex items-center gap-1.5 w-32 shrink-0">
          <Label htmlFor={htmlFor} className="text-sm font-medium">
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </Label>
          {tooltipInfo && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="whitespace-pre-line">{tooltipInfo}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
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
