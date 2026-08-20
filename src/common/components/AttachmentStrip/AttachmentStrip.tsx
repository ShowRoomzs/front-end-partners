import { PreviewModal } from "@/common/components/PreviewModal/PreviewModal"
import { useState } from "react"

interface AttachmentStripProps {
  imageUrls: Array<string>
}

/**
 * 첨부 사진 — `첨부 사진 N장` + 72px 썸네일 한 줄, 클릭 시 라이트박스.
 *
 * 장수 상한은 서버가 이미 검증하고 내려주므로 이 컴포넌트는 받은 만큼 그린다 —
 * 여기에 3이나 5를 박아 넣지 말 것.
 */
export default function AttachmentStrip(props: AttachmentStripProps) {
  const { imageUrls } = props
  // null = 닫힘. 0이 첫 장이라 인덱스 자체로는 열림 여부를 판단할 수 없다
  const [previewIndex, setPreviewIndex] = useState<number | null>(null)

  if (imageUrls.length === 0) {
    return null
  }

  return (
    <>
      <div className="mt-2.5 text-[11px] text-sz-n-500">
        첨부 사진 {imageUrls.length}장
      </div>
      <div className="mt-2.5 flex gap-2">
        {imageUrls.map((url, index) => (
          <button
            key={`${url}-${index}`}
            type="button"
            onClick={() => setPreviewIndex(index)}
            aria-label={`첨부 사진 ${index + 1} 확대`}
            className="size-[72px] shrink-0 overflow-hidden rounded-[6px] border border-sz-n-200 bg-sz-n-100 hover:border-sz-accent-500"
          >
            <img
              src={url}
              alt={`첨부 사진 ${index + 1}`}
              className="size-full object-cover"
            />
          </button>
        ))}
      </div>

      <PreviewModal
        isOpen={previewIndex !== null}
        onOpenChange={open => {
          if (!open) {
            setPreviewIndex(null)
          }
        }}
        imageUrl={previewIndex === null ? "" : imageUrls[previewIndex]}
        currentIndex={previewIndex ?? 0}
        fileLength={imageUrls.length}
        onIndexChange={setPreviewIndex}
      />
    </>
  )
}
