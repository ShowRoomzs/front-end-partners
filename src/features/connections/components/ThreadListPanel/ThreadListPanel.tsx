import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import CounterpartAvatar from "@/features/connections/components/CounterpartAvatar/CounterpartAvatar"
import type { ThreadListItem } from "@/features/connections/services/threadService"
import { formatRelativeTime } from "@/features/connections/utils/format"
import { cn } from "@/lib/utils"

interface ThreadListPanelProps {
  threads: Array<ThreadListItem>
  selectedThreadId: number | null
  keyword: string
  isLoading: boolean
  onKeywordChange: (keyword: string) => void
  onSelectThread: (threadId: number) => void
  onClickRequest: () => void
}

/**
 * 좌측 대화 상대 목록 (시안 `.cs-list`).
 *
 * **상태 배지를 쓰지 않는다** — 목록에 떠 있다는 것 자체가 연결됨이라 중복이다(§13-2).
 * [+ 연결 요청]은 상단이 아니라 목록 하단에 둔다.
 */
export default function ThreadListPanel(props: ThreadListPanelProps) {
  const {
    threads,
    selectedThreadId,
    keyword,
    isLoading,
    onKeywordChange,
    onSelectThread,
    onClickRequest,
  } = props

  return (
    <div className="flex w-[320px] shrink-0 flex-col border-r border-sz-n-200 bg-white">
      <div className="shrink-0 border-b border-sz-n-100 p-3.5">
        <Input
          value={keyword}
          onChange={event => onKeywordChange(event.target.value)}
          placeholder="쇼룸명 검색"
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading && threads.length === 0 && (
          <div className="px-4 py-8 text-center text-[12px] text-sz-n-500">
            불러오는 중…
          </div>
        )}

        {threads.map(thread => {
          const isActive = thread.threadId === selectedThreadId

          return (
            <button
              key={thread.threadId}
              type="button"
              onClick={() => onSelectThread(thread.threadId)}
              className={cn(
                "flex w-full gap-2.5 border-b px-3.5 py-[13px] text-left",
                thread.operatorChannel ? "border-sz-n-200" : "border-sz-n-100",
                isActive
                  ? "bg-sz-accent-50 shadow-[inset_3px_0_0_var(--color-sz-accent-500)]"
                  : "hover:bg-sz-n-50"
              )}
            >
              <CounterpartAvatar
                name={thread.counterpartName}
                imageUrl={thread.counterpartImageUrl}
                isOperator={thread.operatorChannel}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1.5">
                  <span className="truncate text-[13px] font-semibold text-sz-n-900">
                    {thread.counterpartName}
                  </span>
                  <span className="shrink-0 text-[11px] text-sz-n-400">
                    {formatRelativeTime(thread.lastMessageAt)}
                  </span>
                </div>
                <div className="mt-[3px] flex items-center justify-between gap-2">
                  <span className="min-w-0 flex-1 truncate text-[12px] text-sz-n-500">
                    {thread.lastMessagePreview ?? ""}
                  </span>
                  {thread.unreadCount > 0 && (
                    <span className="inline-flex h-[18px] min-w-[18px] shrink-0 items-center justify-center rounded-[9px] bg-sz-accent-500 px-[5px] text-[11px] font-semibold text-white">
                      {thread.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      <div className="flex h-16 shrink-0 items-center border-t border-sz-n-100 px-4">
        <Button type="button" className="h-10 w-full" onClick={onClickRequest}>
          + 연결 요청
        </Button>
      </div>
    </div>
  )
}
