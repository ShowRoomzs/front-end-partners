import { CloseIcon } from "@/features/connections/components/icons"
import { useCallback, useEffect } from "react"
import type { ReactNode } from "react"

interface ModalShellProps {
  isOpen: boolean
  title: string
  width?: number
  onClose: () => void
  children: ReactNode
  footer: ReactNode
}

/**
 * 시안 `.overlay`/`.modal`/`.modal-h`/`.modal-b`/`.modal-f` 셸.
 *
 * `ConfirmModal.tsx`와 같은 오버레이·Esc·backdrop-click 관례를 따르되, 그건
 * "제목+본문 한 줄+취소/확인 두 버튼"짜리 확인창 전용이라 폼이 들어가는
 * M1~M4에는 못 쓴다 — 헤더 X버튼·스크롤 가능한 본문·자유 형식 푸터가 필요해 새로 둔다.
 */
export function ModalShell(props: ModalShellProps) {
  const { isOpen, title, width = 560, onClose, children, footer } = props

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!isOpen) return
      if (event.key === "Escape") {
        event.preventDefault()
        onClose()
      }
    },
    [isOpen, onClose]
  )

  const handleBackdropClick = useCallback(
    (event: React.MouseEvent) => {
      if (event.target === event.currentTarget) {
        onClose()
      }
    },
    [onClose]
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={handleBackdropClick}
    >
      <div
        className="max-h-[90vh] overflow-hidden rounded-[8px] bg-white shadow-[0_8px_24px_rgba(26,27,31,0.12),0_2px_6px_rgba(26,27,31,0.08)]"
        style={{ width }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-sz-n-200 px-[22px] py-4">
          <h2 className="text-[13px] font-semibold text-sz-n-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="text-sz-n-400 hover:text-sz-n-600"
          >
            <CloseIcon />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto p-[22px]">{children}</div>
        <div className="flex justify-end gap-2 border-t border-sz-n-200 px-[22px] py-3.5">
          {footer}
        </div>
      </div>
    </div>
  )
}
