import AttachmentStrip from "@/common/components/AttachmentStrip/AttachmentStrip"
import { formatDateTimeShort } from "@/common/utils/formatDate"
import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

interface ThreadMessageProps {
  authorName: string
  /** 이름 뒤에 붙는 역할 표기 — "소비자" · "브랜드" */
  roleLabel: string
  /** 이름 줄 우측 보조 표기 — 답변 "등록 · 수정" 시각 병기 등 */
  meta?: ReactNode
  sentAt: string
  content: string
  /** 액센트 배경 — "우리 쪽이 쓴 글". 파트너센터에서는 브랜드 답변이 해당한다 */
  emphasized?: boolean
  imageUrls?: Array<string> | null
}

/**
 * 스레드 메시지 한 덩어리.
 *
 * 채팅처럼 좌우로 나누지 않고 배경색으로만 구분한다. 스레드가 최대 2건(문의 + 답변)이라
 * 좌우 정렬은 폭만 낭비하고, 본문이 소비자에게 그대로 나가는 원문이므로 넓게 읽히는
 * 쪽이 오타를 잡는 데 유리하다.
 */
export default function ThreadMessage(props: ThreadMessageProps) {
  const {
    authorName,
    roleLabel,
    meta,
    sentAt,
    content,
    emphasized = false,
    imageUrls,
  } = props

  return (
    <div
      className={cn(
        "rounded-[6px] border px-3.5 py-3 text-[12px] leading-[1.75] text-sz-n-700",
        emphasized
          ? "border-sz-accent-100 bg-sz-accent-50"
          : "border-sz-n-200 bg-white"
      )}
    >
      <div className="mb-[5px] flex flex-wrap items-center gap-1.5 text-[11px] font-semibold text-sz-n-700">
        {authorName}
        <span className="font-normal text-sz-n-500">
          {roleLabel} · {meta ?? formatDateTimeShort(sentAt)}
        </span>
      </div>
      {/* 작성자가 줄바꿈으로 정리해 쓴 내용이 한 덩어리로 뭉치지 않게 한다 */}
      <p className="m-0 whitespace-pre-wrap">{content}</p>
      <AttachmentStrip imageUrls={imageUrls ?? []} />
    </div>
  )
}
