import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import ConnectionStatusBadge from "@/features/connections/components/ConnectionRequestModal/ConnectionStatusBadge"
import CounterpartAvatar from "@/features/connections/components/CounterpartAvatar/CounterpartAvatar"
import {
  connectionService,
  type ConnectionCodeCheckResponse,
} from "@/features/connections/services/connectionService"
import { formatFollowerCount } from "@/features/connections/utils/format"
import { cn } from "@/lib/utils"
import { useState } from "react"

interface ConnectionCodeTabProps {
  /** [확인]으로 일치가 확인된 코드 — 확인 전이면 null이라 전송 버튼이 잠긴다 */
  onConfirm: (code: string | null) => void
}

/**
 * 연결코드 입력 탭 (시안 B2·B5·B6).
 *
 * 코드 확인은 타이핑마다가 아니라 [확인] 버튼을 눌러야 실행된다 —
 * 코드 대입으로 쇼룸을 열거하는 걸 막기 위해 서버에도 레이트 리밋이 걸려 있다.
 */
export default function ConnectionCodeTab(props: ConnectionCodeTabProps) {
  const { onConfirm } = props
  const [code, setCode] = useState("")
  const [isChecking, setIsChecking] = useState(false)
  const [result, setResult] = useState<ConnectionCodeCheckResponse | null>(null)

  const handleCheck = async () => {
    const trimmed = code.trim()
    if (!trimmed || isChecking) {
      return
    }

    setIsChecking(true)
    try {
      const response = await connectionService.checkConnectionCode(trimmed)
      setResult(response)
      // 이미 연결됨·요청중이면 중복 요청 대상이라 전송을 열어주지 않는다
      onConfirm(response.found && !response.connectionStatus ? trimmed : null)
    } catch {
      setResult(null)
      onConfirm(null)
    } finally {
      setIsChecking(false)
    }
  }

  const followerText = formatFollowerCount(result?.followerCount ?? null)

  return (
    <div>
      <div className="mb-1.5 text-[12px] font-medium text-sz-n-600">
        연결코드
      </div>
      <div className="flex items-center gap-2">
        <Input
          value={code}
          onChange={event => {
            setCode(event.target.value)
            setResult(null)
            onConfirm(null)
          }}
          onKeyDown={event => {
            if (event.key === "Enter") {
              event.preventDefault()
              void handleCheck()
            }
          }}
          placeholder="예: SRZ-4K92"
          className={cn(
            "flex-1",
            result && !result.found && "border-sz-danger-text"
          )}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!code.trim() || isChecking}
          onClick={() => void handleCheck()}
        >
          확인
        </Button>
      </div>

      {result?.found && (
        <div className="mt-3 flex items-center gap-2.5 rounded-[6px] border border-sz-success-text bg-sz-success-bg p-3">
          <CounterpartAvatar
            name={result.showroomName ?? ""}
            imageUrl={result.profileImageUrl}
            className="h-[34px] w-[34px]"
          />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[12px] font-semibold text-sz-n-900">
              {result.showroomName}
            </div>
            <div className="mt-px text-[11px] text-sz-n-600">
              {followerText ? `${followerText} · ` : ""}
              일치하는 쇼룸을 찾았습니다
            </div>
          </div>
          {result.connectionStatus && (
            <ConnectionStatusBadge status={result.connectionStatus} />
          )}
        </div>
      )}

      {result && !result.found && (
        <div className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-sz-danger-text">
          <span>⚠</span>
          <span>일치하는 연결코드가 없습니다. 코드를 다시 확인해 주세요.</span>
        </div>
      )}

      <p className="mt-2.5 text-[11px] leading-relaxed text-sz-n-500">
        연결코드는 인플루언서의 쇼룸 스튜디오 화면에 표시되는 고유 코드입니다.
        인플루언서에게 요청해 전달받은 코드를 입력하세요. 코드는 쇼룸별로
        고정되어 있으며, 인플루언서가 원하면 재발급할 수 있습니다.
      </p>
    </div>
  )
}
