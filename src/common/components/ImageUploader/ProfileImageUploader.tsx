import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react"
import { X } from "lucide-react"
import { formatFileSizeFromKB } from "@/common/utils/formatFileSizeFromKB"
import { fileService, type FileType } from "@/common/services/fileService"
import { getImageDimensions } from "@/common/utils/getImageDimensions"

interface Size {
  width: number
  height: number
}

export interface ProfileImageUploaderProps {
  value?: string
  accept?: string
  onImageChange?: (image: string | null) => void
  maxStorage?: number
  recommendSize?: Size
  additionalInfoText?: string
  type: FileType
  required?: boolean
}

const DEFAULT_IMAGE_ACCEPT = ".jpg, .jpeg, .png, .gif"

export default function ProfileImageUploader(props: ProfileImageUploaderProps) {
  const {
    accept = DEFAULT_IMAGE_ACCEPT,
    onImageChange,
    value,
    maxStorage = 1024,
    recommendSize,
    additionalInfoText,
    type,
    required = false,
  } = props

  const inputRef = useRef<HTMLInputElement | null>(null)
  const [localImage, setLocalImage] = useState<string>()
  const [isDragging, setIsDragging] = useState<boolean>(false)
  const inputId = useId()

  useEffect(() => {
    if (value) {
      setLocalImage(value)
    }
  }, [value])

  const handleFiles = async (list: FileList | null) => {
    if (!list || list.length < 1) return

    const file = list[0]

    const { height, width } = await getImageDimensions(file)
    if (height !== width) {
      alert("정방형 이미지를 업로드해 주세요.")
      return
    }

    const fileSizeInKB = file.size / 1024
    if (fileSizeInKB > maxStorage) {
      const { value, unit } = formatFileSizeFromKB(maxStorage)
      alert(`파일 용량은 최대 ${value}${unit}까지 업로드 가능합니다.`)
      return
    }

    try {
      const result = await fileService.upload(file, type)
      setLocalImage(result.imageUrl)
      onImageChange?.(result.imageUrl)
    } catch (error) {
      console.error("이미지 업로드 실패:", error)
      alert("이미지 업로드에 실패했습니다.")
    }
  }

  const handleRemove = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      e.preventDefault()
      setLocalImage(undefined)
      onImageChange?.(null)
    },
    [onImageChange]
  )

  const infoText = useMemo(() => {
    const text = []
    if (recommendSize) {
      text.push(`권장 크기: ${recommendSize.width}x${recommendSize.height}`)
    }
    if (maxStorage) {
      const { value, unit } = formatFileSizeFromKB(maxStorage)
      text.push(`제한 용량: ${value}${unit}`)
    }
    if (accept) {
      text.push(`허용 파일 형식: ${accept}`)
    }
    text.push("정방형 이미지만 업로드 가능")

    return text.join(" / ")
  }, [accept, maxStorage, recommendSize])

  return (
    <div className="w-full h-full">
      <div className="w-full">
        <div className="space-y-3">
          <input
            id={inputId}
            ref={inputRef}
            type="file"
            onChange={e => {
              handleFiles(e.target.files)
              e.target.value = ""
            }}
            accept={accept}
            className="hidden"
          />
          <div className="flex items-start gap-4 flex-col">
            <label
              htmlFor={inputId}
              onDragOver={e => {
                e.preventDefault()
                setIsDragging(true)
              }}
              onDragEnter={e => {
                e.preventDefault()
                setIsDragging(true)
              }}
              onDragLeave={e => {
                e.preventDefault()
                setIsDragging(false)
              }}
              onDrop={e => {
                e.preventDefault()
                setIsDragging(false)
                handleFiles(e.dataTransfer.files)
              }}
              className={`relative cursor-pointer rounded-full transition-all ${
                isDragging ? "ring-2 ring-blue-500" : ""
              }`}
            >
              {required && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-medium z-10">
                  필수
                </div>
              )}
              <div
                className={`w-32 h-32 rounded-full flex items-center justify-center border-2 border-dashed transition-colors ${
                  localImage
                    ? "border-transparent"
                    : isDragging
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-300 bg-gray-50 hover:bg-gray-100"
                }`}
              >
                {localImage ? (
                  <div className="relative w-full h-full group">
                    <img
                      src={localImage}
                      alt="Profile"
                      className="w-full h-full object-cover rounded-full"
                    />
                    <button
                      type="button"
                      aria-label="이미지 제거"
                      className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 bg-black/60 text-white rounded-full w-8 h-8 flex items-center justify-center transition-opacity"
                      onClick={handleRemove}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-12 h-12 text-gray-400"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 4.5v15m7.5-7.5h-15"
                      />
                    </svg>
                  </div>
                )}
              </div>
            </label>
            <div className="flex-1">
              <span className="text-xs text-gray-400 block">{infoText}</span>
              {additionalInfoText && (
                <span className="text-xs text-gray-400 whitespace-pre-line block mt-2">
                  {additionalInfoText}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
