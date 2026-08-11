import { Button } from "@/components/ui/button"
import ConnectionCodeTab from "@/features/connections/components/ConnectionRequestModal/ConnectionCodeTab"
import ShowroomSearchTab from "@/features/connections/components/ConnectionRequestModal/ShowroomSearchTab"
import { CONNECTION_QUERY_KEYS } from "@/features/connections/constants/queryKeys"
import { connectionService } from "@/features/connections/services/connectionService"
import { cn } from "@/lib/utils"
import { useQueryClient } from "@tanstack/react-query"
import { useCallback, useEffect, useState } from "react"
import toast from "react-hot-toast"

interface ConnectionRequestModalProps {
  isOpen: boolean
  onClose: () => void
}

type RequestTab = "search" | "code"

/**
 * 연결 요청 모달 (시안 B1~B6).
 *
 * 두 탭 모두 **하단 [요청 보내기] 하나로** 전송한다 — 탭마다 전송 경로가 다르면
 * 로딩·에러 처리가 두 벌이 된다. 탭은 "대상을 어떻게 지정하느냐"만 다르다.
 */
export default function ConnectionRequestModal(
  props: ConnectionRequestModalProps
) {
  const { isOpen, onClose } = props
  const queryClient = useQueryClient()

  const [tab, setTab] = useState<RequestTab>("search")
  const [selectedCreatorId, setSelectedCreatorId] = useState<number | null>(
    null
  )
  const [confirmedCode, setConfirmedCode] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const target =
    tab === "search"
      ? selectedCreatorId !== null && { creatorId: selectedCreatorId }
      : confirmedCode !== null && { connectionCode: confirmedCode }

  const handleClose = useCallback(() => {
    setTab("search")
    setSelectedCreatorId(null)
    setConfirmedCode(null)
    onClose()
  }, [onClose])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault()
        handleClose()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    document.body.style.overflow = "hidden"

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = "unset"
    }
  }, [handleClose, isOpen])

  if (!isOpen) {
    return null
  }

  const handleSubmit = async () => {
    if (!target || isSubmitting) {
      return
    }

    setIsSubmitting(true)
    try {
      await connectionService.requestConnection(target)
      toast.success(
        "연결 요청을 보냈습니다. 인플루언서가 수락하면 대화가 열립니다."
      )
      queryClient.invalidateQueries({
        queryKey: [CONNECTION_QUERY_KEYS.CREATOR_SEARCH],
      })
      handleClose()
    } catch {
      // 실패 사유(중복 요청 등)는 apiInstance 인터셉터가 토스트로 띄운다
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={event => {
        if (event.target === event.currentTarget) {
          handleClose()
        }
      }}
    >
      <div className="w-[460px] max-w-[90vw] overflow-hidden rounded-lg bg-white shadow-lg">
        <div className="flex items-center justify-between border-b border-sz-n-200 px-[22px] py-4 text-[13px] font-semibold text-sz-n-900">
          연결 요청
          <button
            type="button"
            onClick={handleClose}
            className="text-sz-n-400 hover:text-sz-n-700"
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        <div className="p-[22px]">
          <div className="mb-4 flex overflow-hidden rounded-[6px] border border-sz-n-300">
            {(
              [
                { value: "search", label: "쇼룸명 검색" },
                { value: "code", label: "연결코드 입력" },
              ] as const
            ).map(item => (
              <button
                key={item.value}
                type="button"
                onClick={() => setTab(item.value)}
                className={cn(
                  "flex-1 py-[9px] text-center text-[12px]",
                  tab === item.value
                    ? "bg-sz-accent-500 font-medium text-white"
                    : "bg-white text-sz-n-600 hover:bg-sz-n-100"
                )}
              >
                {item.label}
              </button>
            ))}
          </div>

          {tab === "search" ? (
            <ShowroomSearchTab
              selectedCreatorId={selectedCreatorId}
              onSelect={setSelectedCreatorId}
            />
          ) : (
            <ConnectionCodeTab onConfirm={setConfirmedCode} />
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-sz-n-200 px-[22px] py-3.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClose}
          >
            취소
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={!target || isSubmitting}
            onClick={() => void handleSubmit()}
          >
            요청 보내기
          </Button>
        </div>
      </div>
    </div>
  )
}
