import { useRef, useState } from "react"
import { cn } from "@/lib/utils"
import { authService } from "@/features/auth/services/authService"

const MAX_SIZE = 5 * 1024 * 1024 // 5MB (스펙 기준. 백엔드는 20MB까지 허용하나 더 엄격하게)
const ALLOWED_EXT = ["jpg", "jpeg", "png"]

type FileUploadFieldProps = {
  label: string
  /** 업로드된 이미지 URL(RHF 필드 값) */
  value: string
  onChange: (url: string) => void
  /** 첫 상호작용 표시(에러 노출 타이밍용) */
  onInteract?: () => void
  /** RHF required 등 외부 에러(미첨부) */
  error?: string
  showError?: boolean
  /** 간이과세자 등 첨부 면제 */
  exempt?: boolean
  exemptHint?: string
  disabled?: boolean
}

// 단일 파일(5MB·jpg/jpeg/png) 선택 즉시 검증 → signup-documents API로 실제 업로드 → URL 저장.
export function FileUploadField({
  label,
  value,
  onChange,
  onInteract,
  error,
  showError = true,
  exempt = false,
  exemptHint,
  disabled = false,
}: FileUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState<string>("")
  const [uploading, setUploading] = useState(false)
  const [internalError, setInternalError] = useState<string>("")

  const handleSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    onInteract?.()
    setInternalError("")
    const file = e.target.files?.[0]
    e.target.value = "" // 같은 파일 재선택 허용
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
      const res = await authService.uploadSignupDocument(file)
      setFileName(file.name)
      onChange(res.imageUrl)
    } catch {
      setInternalError("업로드에 실패했습니다. 다시 시도해 주세요.")
    } finally {
      setUploading(false)
    }
  }

  const shownError = internalError || (showError ? error : undefined)
  const uploaded = !!value

  return (
    <div className="mb-4">
      <div
        className={cn(
          "flex items-center justify-between gap-3 rounded-[6px] border border-dashed p-3.5",
          exempt && "opacity-60",
          shownError
            ? "border-sz-danger-text bg-sz-danger-bg"
            : "border-sz-n-300 bg-sz-n-50"
        )}
      >
        <div className="flex flex-col gap-0.5">
          <div className="text-[12px] font-medium text-sz-n-700">
            📎 {label}
          </div>
          <div className="text-[11px] text-sz-n-500">
            {exempt
              ? (exemptHint ?? "첨부 불필요")
              : uploading
                ? "업로드 중…"
                : uploaded
                  ? `${fileName || "업로드 완료"}`
                  : "최대 5MB · jpg, jpeg, png"}
          </div>
        </div>
        <button
          type="button"
          disabled={disabled || exempt || uploading}
          onClick={() => inputRef.current?.click()}
          className="h-8 whitespace-nowrap rounded-[6px] border border-sz-n-300 bg-white px-3.5 text-[11px] font-medium text-sz-n-700 hover:enabled:bg-sz-n-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {uploaded ? "다시 선택" : "파일 선택"}
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
