import useDebounce from "@/common/hooks/useDebounce"
import ConnectionRequestModal from "@/features/connections/components/ConnectionRequestModal/ConnectionRequestModal"
import ThreadListPanel from "@/features/connections/components/ThreadListPanel/ThreadListPanel"
import ThreadPanel from "@/features/connections/components/ThreadPanel/ThreadPanel"
import { useGetThreadList } from "@/features/connections/hooks/useGetThreadList"
import { useState } from "react"
import { useSearchParams } from "react-router-dom"

/**
 * 연결·소통 (§13) — 좌측 대화 상대 목록 + 우측 스레드.
 *
 * 선택한 스레드를 경로가 아니라 쿼리파라미터로 들고 있는다 — 상대를 바꾸는 건
 * 화면 이동이 아니라 같은 화면 안의 선택이라, 라우트를 갈아끼우면 목록까지
 * 불필요하게 다시 마운트된다.
 */
export default function ConnectionsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [keyword, setKeyword] = useState("")
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false)

  const debouncedKeyword = useDebounce(keyword, 300)
  const { data, isLoading } = useGetThreadList(debouncedKeyword)
  const threads = data?.content ?? []

  const threadIdParam = Number(searchParams.get("threadId"))
  const selectedThread =
    threads.find(thread => thread.threadId === threadIdParam) ?? threads[0]

  return (
    <div className="flex min-h-0 flex-1 border-t border-sz-n-200">
      <ThreadListPanel
        threads={threads}
        selectedThreadId={selectedThread?.threadId ?? null}
        keyword={keyword}
        isLoading={isLoading}
        onKeywordChange={setKeyword}
        onSelectThread={threadId =>
          setSearchParams({ threadId: String(threadId) })
        }
        onClickRequest={() => setIsRequestModalOpen(true)}
      />

      {selectedThread ? (
        <ThreadPanel key={selectedThread.threadId} thread={selectedThread} />
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 bg-sz-n-50 p-10 text-center">
          <div className="text-[13px] font-semibold text-sz-n-600">
            대화를 선택해 주세요
          </div>
          <div className="max-w-[280px] text-[12px] leading-relaxed text-sz-n-500">
            좌측 목록에서 상대를 선택하면 대화 내용이 표시됩니다.
          </div>
        </div>
      )}

      <ConnectionRequestModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
      />
    </div>
  )
}
