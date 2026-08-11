import FormController from "@/common/components/Form/FormController"
import { ImageSubLabel } from "@/features/productManagement/components/ProductFormLayout/ProductFormLayout"
import ProductImageBox from "@/features/productManagement/components/ProductImageBox/ProductImageBox"
import { COVER_IMAGE_MAX } from "@/features/productManagement/constants/params"
import type { ProductFormData } from "@/features/productManagement/pages/RegisterProductPage"
import type { Control } from "react-hook-form"

interface CoverImagesFormProps {
  control: Control<ProductFormData>
  disabled?: boolean
}

/**
 * 커버 이미지 — **선택**이고 최대 4개다(필수는 대표 이미지 1개뿐, §11-6).
 *
 * 채워진 박스들 뒤에 빈 "추가" 박스를 하나 더 붙이고, 4개가 다 차면 그 박스를 감춘다
 * (시안 스크립트 renderCover()와 동일한 규칙).
 */
export default function CoverImagesForm(props: CoverImagesFormProps) {
  const { control, disabled = false } = props

  return (
    <FormController
      name="coverImages"
      control={control}
      render={({ field, formState }) => {
        const images: Array<string> = field.value ?? []

        const replaceAt = (index: number, url: string) => {
          // 빈 문자열이면 삭제 — 배열 중간에 빈 칸을 남기지 않는다
          const next = url
            ? images.map((image, i) => (i === index ? url : image))
            : images.filter((_, i) => i !== index)
          field.onChange(next)
        }

        return (
          <div className="mt-3.5">
            <ImageSubLabel note={`(선택, 최대 ${COVER_IMAGE_MAX}개)`}>
              커버 이미지
            </ImageSubLabel>

            <div className="flex flex-wrap gap-2.5">
              {images.map((image, index) => (
                <ProductImageBox
                  key={`${image}-${index}`}
                  value={image}
                  onChange={url => replaceAt(index, url)}
                  emptyLabel="추가"
                  disabled={disabled}
                />
              ))}

              {images.length < COVER_IMAGE_MAX && (
                <ProductImageBox
                  onChange={url => {
                    if (url) {
                      field.onChange([...images, url])
                    }
                  }}
                  emptyLabel="추가"
                  disabled={disabled}
                />
              )}
            </div>

            {formState.errors.coverImages?.message && (
              <p className="text-[11px] font-medium text-sz-danger-text">
                {formState.errors.coverImages.message}
              </p>
            )}
          </div>
        )
      }}
    />
  )
}
