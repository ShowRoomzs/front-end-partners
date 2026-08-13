import { fileService } from "@/common/services/fileService"
import { cn } from "@/lib/utils"
import { useRef, useState } from "react"

const MAX_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_EXT = ["jpg", "jpeg", "png"]

export interface EvidenceFile {
  url: string
  name: string
  size: number
}

interface EvidenceUploadProps {
  label: string
  value: EvidenceFile | null
  onChange: (file: EvidenceFile | null) => void
  error?: string
  disabled?: boolean
}

/**
 * 시안 `.upload` — 변경 요청 증빙 파일 첨부.
 *
 * `FileUploadField.tsx`(가입 서류 첨부)와 같은 5MB·jpg/png 검증 규칙을 쓰지만,
 * (1) 업로드 대상이 `authService.uploadSignupDocument`가 아니라
 * `fileService.upload(file, "CHANGE_REQUEST_DOCUMENT")`이고, (2) 시안이 완료 상태에
 * 실선 테두리+초록 배경+체크 표시를 요구해 그 상태 자체가 원본에 없다 — 그대로
 * 가져다 쓰지 않고 포크한다. `CreateChangeRequestRequest`가 URL 외에 파일명·크기도
 * 요구하므로 `onChange`가 문자열이 아니라 `{url,name,size}` 객체를 돌려준다.
 */
export function EvidenceUpload(props: EvidenceUploadProps) {
  const { label, value, onChange, error, disabled = false } = props
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [internalError, setInternalError] = useState("")

  const handleSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setInternalError("")
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return

    const ext = file.name.split(".").pop()?.toLowerCase() ?? ""
    if (!ALLOWED_EXT.includes(ext)) {
      setInternalError("jpg, jpeg, png 형식만 첨부할 수 있습니다.")
      return
    }
    if (file.size > MAX_SIZE) {
      setInternalError(
        "파일 크기가 5MB를 초과했습니다. 5MB 이하의 파일을 선택해 주세요."
      )
      return
    }

    try {
      setUploading(true)
      const res = await fileService.upload(file, "CHANGE_REQUEST_DOCUMENT")
      onChange({ url: res.imageUrl, name: file.name, size: file.size })
    } catch {
      setInternalError("업로드에 실패했습니다. 다시 시도해 주세요.")
    } finally {
      setUploading(false)
    }
  }

  const shownError = internalError || error
  const done = !!value

  return (
    <div>
      <div
        className={cn(
          "flex items-center justify-between gap-3 rounded-[6px] border p-3.5",
          done
            ? "border-sz-success-text bg-sz-success-bg"
            : shownError
              ? "border-sz-danger-text border-dashed bg-sz-danger-bg"
              : "border-dashed border-sz-n-300 bg-sz-n-50"
        )}
      >
        <div className="flex flex-col gap-0.5">
          <div
            className={cn(
              "text-[12px] font-medium",
              done ? "text-sz-success-text" : "text-sz-n-700"
            )}
          >
            {done ? "✓ " : "📎 "}
            {done ? value.name : label}
          </div>
          <div
            className={cn(
              "text-[11px]",
              done ? "font-medium text-sz-success-text" : "text-sz-n-500"
            )}
          >
            {uploading
              ? "업로드 중…"
              : done
                ? "업로드 완료"
                : "최대 5MB · jpg, jpeg, png"}
          </div>
        </div>
        <button
          type="button"
          disabled={disabled || uploading}
          onClick={() => inputRef.current?.click()}
          className="h-8 shrink-0 rounded-[6px] border border-sz-n-300 bg-white px-3.5 text-[11px] font-medium whitespace-nowrap text-sz-n-700 hover:enabled:bg-sz-n-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {done ? "다시 선택" : "파일 선택"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".jpg,.jpeg,.png"
          className="hidden"
          onChange={handleSelect}
        />
      </div>
      {shownError && (
        <p role="alert" className="mt-1.5 text-[12px] text-sz-danger-text">
          {shownError}
        </p>
      )}
    </div>
  )
}
