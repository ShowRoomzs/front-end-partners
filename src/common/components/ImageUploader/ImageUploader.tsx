import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react"
import { X } from "lucide-react"
import { formatFileSizeFromKB } from "@/common/utils/formatFileSizeFromKB"
import { fileService, type FileType } from "@/common/services/fileService"
import { PreviewModal } from "@/common/components/PreviewModal/PreviewModal"
import { usePreviewModal } from "@/common/hooks/usePreviewModal"
import { getImageDimensions } from "@/common/utils/getImageDimensions"

interface Size {
  width: number
  height: number
}

export interface ImageUploaderProps {
  value?: string[] | string
  accept?: string
  onImagesChange?: (images: string[]) => void
  requiredSquare?: boolean // 정방형 여부
  maxLength?: number // 최대 업로드 갯수
  maxStorage?: number // 최대 업로드 용량 kb 기준
  recommendSize?: Size // 권장 이미지 크기(추가 검증 로직은 x)
  additionalInfoText?: string // 추가 정보 텍스트
  type: FileType
  isRounded?: boolean
}

export interface ImageFile {
  imageUrl: string
}

const DEFAULT_IMAGE_ACCEPT = ".jpg, .jpeg, .png, .gif,"

export default function ImageUploader(props: ImageUploaderProps) {
  const {
    accept = DEFAULT_IMAGE_ACCEPT,
    onImagesChange,
    value = [],
    maxLength = 1,
    maxStorage = 1024, // kb기준
    recommendSize,
    requiredSquare,
    additionalInfoText,
    type,
  } = props

  const inputRef = useRef<HTMLInputElement | null>(null)
  const [localImages, setLocalImages] = useState<ImageFile[]>([])
  const [isDragging, setIsDragging] = useState<boolean>(false)
  const inputId = useId()
  const previewModalProps = usePreviewModal({ images: localImages })
  const previews = useMemo(() => {
    return localImages.map(img => img.imageUrl)
  }, [localImages])

  useEffect(() => {
    if (value) {
      const urls = Array.isArray(value) ? value : [value]
      setLocalImages(urls.map(url => ({ imageUrl: url })))
    } else {
      setLocalImages([])
    }
  }, [value])

  const handleFiles = async (list: FileList | null) => {
    if (!list || list.length < 1) return

    const files = Array.from(list)

    if (localImages.length + files.length > maxLength) {
      alert(`최대 ${maxLength}개까지만 업로드 가능합니다.`)
      return
    }
    if (requiredSquare) {
      const { height, width } = await getImageDimensions(files[0])
      if (height !== width) {
        alert("정방형 이미지를 업로드해 주세요.")
        return
      }
    }
    const invalidFiles = files.filter(file => {
      const fileSizeInKB = file.size / 1024
      return fileSizeInKB > maxStorage
    })

    if (invalidFiles.length > 0) {
      const { value, unit } = formatFileSizeFromKB(maxStorage)
      alert(`파일 용량은 최대 ${value}${unit}까지 업로드 가능합니다.`)
      return
    }
    try {
      const uploadResults = await Promise.all(
        files.map(async file => {
          const result = await fileService.upload(file, type)
          return result
        })
      )

      const newImages = uploadResults.map(result => ({
        imageUrl: result.imageUrl,
      }))

      const updatedImages = [...localImages, ...newImages]
      setLocalImages(updatedImages)
      onImagesChange?.(updatedImages.map(img => img.imageUrl))
    } catch (error) {
      console.error("이미지 업로드 실패:", error)
      alert("이미지 업로드에 실패했습니다.")
    }
  }

  const removeAt = useCallback(
    (idx: number) => {
      setLocalImages(prev => {
        const updated = prev.filter((_, i) => i !== idx)
        onImagesChange?.(updated.map(img => img.imageUrl))
        return updated
      })
    },
    [onImagesChange]
  )

  const handleImageClick = useCallback(
    (idx: number) => {
      previewModalProps.onIndexChange?.(idx)
      previewModalProps.onOpenChange?.(true)
    },
    [previewModalProps]
  )

  const renderImages = useCallback(
    (images: ImageFile[]) => {
      return images.map((image, idx) => {
        const previewSrc = previews[idx]

        return (
          <div
            key={`${image.imageUrl}-${idx}`}
            className="relative group rounded-lg border border-gray-200 bg-white overflow-hidden shadow-sm w-32 cursor-pointer"
            onClick={e => {
              e.stopPropagation()
              e.preventDefault()
              handleImageClick(idx)
            }}
          >
            <div className="w-32 aspect-square flex items-center justify-center bg-gray-50">
              {previewSrc ? (
                <img
                  src={previewSrc}
                  alt={image.imageUrl}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-gray-400 text-xs">No preview</div>
              )}
            </div>

            <button
              type="button"
              aria-label="이미지 제거"
              className="absolute right-1 top-1 opacity-0 group-hover:opacity-100 bg-black/60 text-white rounded-full w-6 h-6 flex items-center justify-center transition-opacity cursor-pointer"
              onClick={e => {
                e.stopPropagation()
                e.preventDefault()
                removeAt(idx)
              }}
            >
              <X className="w-[8px] h-[8px]" />
            </button>
          </div>
        )
      })
    },
    [previews, removeAt, handleImageClick]
  )
  const infoText = useMemo(() => {
    const text = []
    if (recommendSize) {
      text.push(`권장 크기: ${recommendSize.width}x${recommendSize.height}`)
    }
    if (maxLength) {
      text.push(`제한 갯수: ${maxLength}개`)
    }
    if (maxStorage) {
      const { value, unit } = formatFileSizeFromKB(maxStorage)
      text.push(`제한 용량: ${value}${unit}`)
    }
    if (accept) {
      text.push(`허용 파일 형식: ${accept}`)
    }
    if (requiredSquare) {
      text.push("정방형 이미지만 업로드 가능")
    }

    return text.join(" / ")
  }, [accept, maxLength, maxStorage, recommendSize, requiredSquare])

  return (
    <>
      <PreviewModal {...previewModalProps} />
      <div className="w-full h-full">
        <div className="w-full">
          <div className="space-y-3">
            <input
              id={inputId}
              ref={inputRef}
              type="file"
              multiple={maxLength > 1}
              onChange={e => {
                handleFiles(e.target.files)
                e.target.value = ""
              }}
              accept={accept}
              className="hidden"
            />
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
              className={`flex flex-col items-center justify-center w-full min-h-28 cursor-pointer rounded-lg border-[1px] border-[#BCBEC0] transition-colors !m-0 ${
                isDragging
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-300 hover:bg-gray-50"
              }`}
            >
              {localImages.length > 0 ? (
                <div className="p-2 flex flex-wrap gap-3 justify-start w-full">
                  {renderImages(localImages)}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center">
                  <div className="flex items-center gap-2 text-gray-600">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="w-5 h-5"
                    >
                      <path
                        fillRule="evenodd"
                        d="M1.5 6a2.25 2.25 0 0 1 2.25-2.25h16.5A2.25 2.25 0 0 1 22.5 6v12a2.25 2.25 0 0 1-2.25 2.25H3.75A2.25 2.25 0 0 1 1.5 18V6ZM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0 0 21 18v-1.94l-2.69-2.689a1.5 1.5 0 0 0-2.12 0l-.88.879.97.97a.75.75 0 1 1-1.06 1.06l-5.16-5.159a1.5 1.5 0 0 0-2.12 0L3 16.061Zm10.125-7.81a1.125 1.125 0 1 1 2.25 0 1.125 1.125 0 0 1-2.25 0Z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-sm">
                      클릭하여 이미지를 선택하거나 이곳으로 드래그 하세요
                    </span>
                  </div>
                  <span className="mt-1 text-xs text-gray-400">
                    {maxLength > 1 ? "여러 이미지 선택 가능" : "단일 이미지"} ·{" "}
                    {accept || "모든 형식"}
                  </span>
                </div>
              )}
            </label>
            {localImages.length > 0 && (
              <div className="flex items-center justify-between text-xs text-gray-600">
                <span>선택됨: {localImages.length}개 이미지</span>
              </div>
            )}
            <span className="text-xs text-gray-400">{infoText}</span>
            {additionalInfoText && (
              <>
                <br />
                <span className="text-xs text-gray-400 whitespace-pre-line">
                  {additionalInfoText}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
