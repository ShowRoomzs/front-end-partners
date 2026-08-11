import useDebounce from "@/common/hooks/useDebounce"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import ConnectionStatusBadge from "@/features/connections/components/ConnectionRequestModal/ConnectionStatusBadge"
import CounterpartAvatar from "@/features/connections/components/CounterpartAvatar/CounterpartAvatar"
import { useSearchCreators } from "@/features/connections/hooks/useSearchCreators"
import { formatFollowerCount } from "@/features/connections/utils/format"
import { cn } from "@/lib/utils"
import { useState } from "react"

interface ShowroomSearchTabProps {
  selectedCreatorId: number | null
  onSelect: (creatorId: number | null) => void
}

/**
 * 쇼룸명 검색 탭 (시안 B1·B3·B4).
 *
 * 행의 [요청] 버튼은 그 상대를 **선택만** 한다 — 실제 전송은 모달 하단
 * [요청 보내기] 하나가 맡는다(연결코드 탭과 같은 경로).
 */
export default function ShowroomSearchTab(props: ShowroomSearchTabProps) {
  const { selectedCreatorId, onSelect } = props
  const [keyword, setKeyword] = useState("")
  const debouncedKeyword = useDebounce(keyword, 300)

  const { data, isFetching } = useSearchCreators(debouncedKeyword)
  const results = data?.content ?? []
  const totalResults = data?.pageInfo.totalResults ?? 0
  const hasSearched = debouncedKeyword.trim().length > 0

  return (
    <div>
      <div className="mb-1.5 text-[12px] font-medium text-sz-n-600">
        인플루언서 검색
      </div>
      <Input
        value={keyword}
        onChange={event => {
          setKeyword(event.target.value)
          onSelect(null)
        }}
        placeholder="쇼룸명 입력"
      />

      {hasSearched && (
        <div className="mt-3 max-h-[280px] overflow-y-auto rounded-[6px] border border-sz-n-200">
          {results.length === 0 ? (
            <div className="px-5 py-9 text-center">
              {isFetching ? (
                <div className="text-[12px] text-sz-n-500">검색 중…</div>
              ) : (
                <>
                  <div className="mb-2 text-[26px] text-sz-n-300">⌕</div>
                  <div className="mb-[3px] text-[12px] font-semibold text-sz-n-600">
                    검색 결과가 없습니다
                  </div>
                  <div className="text-[11px] text-sz-n-500">
                    쇼룸명을 정확히 입력했는지 확인해 주세요.
                  </div>
                </>
              )}
            </div>
          ) : (
            results.map(creator => {
              const isSelected = creator.creatorId === selectedCreatorId
              const followerText = formatFollowerCount(creator.followerCount)

              return (
                <div
                  key={creator.creatorId}
                  className={cn(
                    "flex items-center gap-2.5 border-b border-sz-n-100 px-3 py-2.5 last:border-b-0",
                    isSelected && "bg-sz-accent-50"
                  )}
                >
                  <CounterpartAvatar
                    name={creator.showroomName}
                    imageUrl={creator.profileImageUrl}
                    className="h-[34px] w-[34px]"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[12px] font-semibold text-sz-n-900">
                      {creator.showroomName}
                    </div>
                    {followerText && (
                      <div className="mt-px text-[11px] text-sz-n-500">
                        {followerText}
                      </div>
                    )}
                  </div>
                  {creator.connectionStatus ? (
                    <ConnectionStatusBadge status={creator.connectionStatus} />
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      variant={isSelected ? "default" : "outline"}
                      onClick={() => onSelect(creator.creatorId)}
                    >
                      {isSelected ? "선택됨" : "요청"}
                    </Button>
                  )}
                </div>
              )
            })
          )}
        </div>
      )}

      {results.length > 0 && totalResults > results.length && (
        <div className="mt-2 text-[11px] text-sz-n-500">
          "{debouncedKeyword}" 검색 결과 {totalResults}건 — 스크롤해서 더 볼 수
          있습니다
        </div>
      )}

      <p className="mt-2.5 text-[11px] leading-relaxed text-sz-n-500">
        탐색·추천 시스템은 제공하지 않습니다. 쇼룸명을 정확히 알고 있을 때
        검색하거나, 인플루언서가 전달한 연결코드로 요청하세요. 같은 상대에게
        이미 연결됨·요청중 상태면 중복 요청할 수 없습니다.
      </p>
    </div>
  )
}
