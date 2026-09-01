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

const ConfirmModal = (props: ConfirmModalProps) => {
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
      {/*
        디자인시스템 v1.2 「모달」 규격 — padding 20px · h3 13px/600(아래 8px) ·
        본문 12px n-600(아래 20px) · 버튼 행 우측 정렬 gap 8px.

        예전엔 24px 패딩에 제목 18px · 본문 14px · 버튼 14px이었다. 화면 본문이 전역
        Compact 스케일(13/12/11px)인데 모달만 한 단계씩 커서, 같은 화면 안에서 모달이
        딴 서비스처럼 보였다. 크기를 임의로 올리지 말 것 — 규격은 위 파일이 정본이다.
      */}
      <div
        className="bg-white rounded-lg shadow-lg w-[400px] max-w-[90vw] p-5"
        onClick={e => e.stopPropagation()}
      >
        <div className="mb-2 flex items-center gap-2">
          {/* 아이콘은 제목 글자에 맞춰 16px — 13px 제목 옆의 20px 아이콘은 제목보다 크다 */}
          {type === "warn" && (
            <AlertTriangle className="size-4 text-sz-danger-text shrink-0" />
          )}
          <h2 className="text-[13px] font-semibold text-sz-n-900">{title}</h2>
        </div>

        <p className="mb-5 whitespace-pre-wrap text-[12px] leading-[1.7] text-sz-n-600">
          {content}
        </p>

        {/* 버튼도 디자인시스템 규격 — 12px/500 · 높이 32px · 좌우 14px */}
        <div className="flex gap-2 justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="px-3.5 text-[12px]"
            onClick={onCancel}
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            variant={type === "warn" ? "destructive" : "default"}
            size="sm"
            className="px-3.5 text-[12px]"
            onClick={onConfirm}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmModal
