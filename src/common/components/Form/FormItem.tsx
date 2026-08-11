import type { ReactNode } from "react"
import { Label } from "@/components/ui/label"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Info } from "lucide-react"

interface FormItemProps {
  label: string
  required?: boolean
  error?: string
  success?: string
  children: ReactNode
  htmlFor?: string
  tooltipInfo?: string
}

export default function FormItem(props: FormItemProps) {
  const {
    label,
    required = false,
    error,
    success,
    children,
    htmlFor,
    tooltipInfo,
  } = props

  return (
    <div className="space-y-2">
      <div className="flex gap-4 items-center">
        <div className="flex items-center gap-1.5 w-32 shrink-0">
          {/* 디자인시스템 label — 12px/500 n-600 */}
          <Label
            htmlFor={htmlFor}
            className="text-[12px] font-medium text-sz-n-600"
          >
            {/* 필수 표시(*)는 언제나 라벨 왼쪽 */}
            {required && <span className="mr-0.5 text-sz-danger-text">*</span>}
            {label}
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
          <p className="flex-1 text-[11px] font-medium text-sz-danger-text">
            {error}
          </p>
        </div>
      )}
      {success && (
        <div className="flex gap-4">
          <div className="w-32 shrink-0" />
          <p className="flex-1 text-[11px] font-medium text-sz-success-text">
            {success}
          </p>
        </div>
      )}
    </div>
  )
}
