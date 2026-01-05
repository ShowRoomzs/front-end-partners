import { useState, useMemo } from "react"
import type { PreviewModalProps } from "@/common/components/PreviewModal/PreviewModal"

interface UsePreviewModalParams {
  images: Array<{ imageUrl: string }>
}

export function usePreviewModal(
  params: UsePreviewModalParams
): PreviewModalProps {
  const { images } = params
  const [isOpen, setIsOpen] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)

  const imageUrl = useMemo(() => {
    return images[currentIndex]?.imageUrl || ""
  }, [images, currentIndex])

  return {
    isOpen,
    onOpenChange: setIsOpen,
    imageUrl,
    currentIndex,
    fileLength: images.length,
    onIndexChange: setCurrentIndex,
  }
}
