import { fileService } from "@/common/services/fileService"
import { cn } from "@/lib/utils"
import { useId, useRef, useState } from "react"

/** 시안 §상품 이미지 — 1MB, JPG/PNG만 */
const MAX_SIZE_KB = 1024
const ACCEPT = ".jpg,.jpeg,.png"

interface ProductImageBoxProps {
  /** 업로드된 이미지 URL. 비어 있으면 "추가" 상태로 그려진다 */
  value?: string
  /** 업로드 성공 시 URL, 삭제 시 빈 문자열 */
  onChange: (url: string) => void
  /** 빈 상태 박스 안에 뜨는 라벨 (예: "대표", "추가") */
  emptyLabel: string
  /** 채워진 박스 좌상단에 붙는 뱃지 (예: "대표") */
  tag?: string
  disabled?: boolean
}

/**
 * 시안 `.img-box` — 96×96 정사각 업로드 박스.
 *
 * 공용 `ImageUploader`(큰 드롭존 + 안내문 + 128px 미리보기)는 프로필 사진·가입 서류
 * 등 다른 화면이 쓰고 있어 그쪽을 이 모양으로 바꿀 수 없다. 상품 이미지 전용으로
 * 따로 둔다.
 *
 * 업로드 성공은 **조용히** 반영한다(§11-6) — 썸네일이 채워지는 것 자체가 피드백이라
 * 별도 토스트를 띄우지 않고, 실패했을 때만 박스 아래 캡션으로 알린다.
 */
export default function ProductImageBox(props: ProductImageBoxProps) {
  const { value, onChange, emptyLabel, tag, disabled = false } = props
  const inputRef = useRef<HTMLInputElement>(null)
  const inputId = useId()
  const [error, setError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const handleFile = async (file: File | undefined) => {
    if (!file) {
      return
    }
    setError(null)

    if (file.size / 1024 > MAX_SIZE_KB) {
      setError("1MB 이하 파일만 올릴 수 있습니다.")
      return
    }

    setIsUploading(true)
    try {
      const result = await fileService.upload(file, "PRODUCT")
      onChange(result.imageUrl)
    } catch {
      setError("업로드에 실패했습니다. 다시 시도해 주세요.")
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <input
        id={inputId}
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={event => {
          void handleFile(event.target.files?.[0])
          // 같은 파일을 연속으로 고를 수 있게 비워둔다
          event.target.value = ""
        }}
      />

      <div
        className={cn(
          "group relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-[8px] border bg-sz-n-50 text-[9px] text-sz-n-500",
          value
            ? "border-sz-n-300 bg-sz-n-100"
            : "border-dashed border-sz-n-300 hover:shadow-[0_0_0_2px_var(--sz-accent-500)]",
          error && "border-solid border-sz-danger-text bg-sz-danger-bg",
          disabled ? "pointer-events-none opacity-60" : "cursor-pointer"
        )}
        onClick={() => inputRef.current?.click()}
        style={
          value
            ? {
                backgroundImage: `url(${value})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : undefined
        }
      >
        {!value && (
          <div className="flex flex-col items-center gap-1">
            <span className="text-[16px] leading-none text-sz-n-400">+</span>
            <span>{isUploading ? "업로드 중" : emptyLabel}</span>
          </div>
        )}

        {value && tag && (
          <span className="absolute left-1 top-1 rounded-[4px] bg-sz-n-900 px-[5px] py-px text-[9px] font-semibold text-white">
            {tag}
          </span>
        )}

        {value && !disabled && (
          <button
            type="button"
            aria-label="이미지 삭제"
            onClick={event => {
              // 박스 클릭(=파일 선택창)까지 같이 터지면 지우자마자 창이 열린다
              event.stopPropagation()
              setError(null)
              onChange("")
            }}
            className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-black/55 text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100"
          >
            ×
          </button>
        )}
      </div>

      {/* 성공은 조용히, 실패만 캡션으로 */}
      <div className="min-h-[14px] text-[11px] text-sz-danger-text">
        {error}
      </div>
    </div>
  )
}
