import Btn from "@/features/contracts/components/shared/Btn"
import { ERR_CLASS } from "@/features/contracts/components/shared/styles"
import {
  EVIDENCE_FILE_TYPES,
  EVIDENCE_MAX_COUNT,
} from "@/features/claims/constants/params"
import type { useEvidenceUpload } from "@/features/claims/hooks/useEvidenceUpload"
import { Loader2, X } from "lucide-react"
import { useRef } from "react"

/** 시안 `.drop` 드롭존 + 썸네일 — 상태는 `useEvidenceUpload`가 든다 */
export function EvidenceField(props: {
  /** 드롭존 제목 — 반려 「개봉·사용 흔적이 보이는 사진」 · 사유 번복 「정상 작동·상태가 보이는 사진」 */
  title: string
  upload: ReturnType<typeof useEvidenceUpload>
}) {
  const { title, upload } = props
  const fileInputRef = useRef<HTMLInputElement>(null)

  return (
    <>
      <div className="rounded-[8px] border-[1.5px] border-dashed border-sz-n-300 bg-sz-n-50 p-4 text-center">
        <div className="text-[12px] font-semibold text-sz-n-900">{title}</div>
        <div className="mt-[3px] text-[11px] text-sz-n-500">
          PNG · JPG · 10MB 이하 · 최대 {EVIDENCE_MAX_COUNT}장
        </div>
        <Btn
          variant="secondary"
          className="mt-2"
          disabled={upload.evidences.length >= EVIDENCE_MAX_COUNT}
          onClick={() => fileInputRef.current?.click()}
        >
          파일 선택
        </Btn>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={EVIDENCE_FILE_TYPES.join(",")}
          className="hidden"
          onChange={event => {
            void upload.handleFiles(event.target.files)
            event.target.value = ""
          }}
        />
      </div>
      {upload.uploadError && <p className={ERR_CLASS}>{upload.uploadError}</p>}
      {upload.evidences.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {upload.evidences.map(item => (
            <div
              key={item.key}
              className="relative size-14 overflow-hidden rounded-[6px] border border-sz-n-200 bg-sz-n-100"
            >
              {item.url ? (
                <img
                  src={item.url}
                  alt={item.name}
                  className="size-full object-cover"
                />
              ) : (
                <div className="flex size-full items-center justify-center">
                  <Loader2 className="size-4 animate-spin text-sz-n-400" />
                </div>
              )}
              {item.url && (
                <button
                  type="button"
                  aria-label={`${item.name} 삭제`}
                  onClick={() => upload.remove(item.key)}
                  className="absolute right-0.5 top-0.5 flex size-4 cursor-pointer items-center justify-center rounded-full bg-black/55 text-white"
                >
                  <X className="size-2.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  )
}
