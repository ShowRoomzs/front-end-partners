import { Button } from "@/components/ui/button"
import { useCallback, useEffect } from "react"
import { AlertTriangle } from "lucide-react"

export type ConfirmType = "default" | "warn"

export interface ConfirmModalProps {
  isOpen: boolean
  type: ConfirmType
  title: string
  content: string
  cancelText: string
  confirmText: string
  onCancel: () => void
  onConfirm: () => void
}

export const ConfirmModal = (props: ConfirmModalProps) => {
  const {
    isOpen,
    type,
    title,
    content,
    cancelText,
    confirmText,
    onCancel,
    onConfirm,
  } = props

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!isOpen) return

      if (event.key === "Escape") {
        event.preventDefault()
        event.stopPropagation()
        onCancel()
      }
    },
    [isOpen, onCancel]
  )

  const handleBackdropClick = useCallback(
    (event: React.MouseEvent) => {
      if (event.target === event.currentTarget) {
        onCancel()
      }
    },
    [onCancel]
  )

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown)
      document.body.style.overflow = "hidden"
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = "unset"
    }
  }, [isOpen, handleKeyDown])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center"
      onClick={handleBackdropClick}
    >
      <div
        className="bg-white rounded-lg shadow-lg w-[400px] max-w-[90vw]"
        onClick={e => e.stopPropagation()}
      >
        {/* Title */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            {type === "warn" && (
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
            )}
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-6">
          <p className="text-sm text-gray-600 whitespace-pre-wrap">{content}</p>
        </div>

        {/* Buttons */}
        <div className="flex gap-2 justify-end px-6 pb-6">
          <Button type="button" variant="outline" onClick={onCancel}>
            {cancelText}
          </Button>
          <Button
            type="button"
            variant={type === "warn" ? "destructive" : "default"}
            onClick={onConfirm}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  )
}
