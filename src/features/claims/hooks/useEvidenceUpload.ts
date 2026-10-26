import { fileService } from "@/common/services/fileService"
import {
  EVIDENCE_FILE_TYPES,
  EVIDENCE_MAX_BYTES,
  EVIDENCE_MAX_COUNT,
} from "@/features/claims/constants/params"
import { isAxiosError } from "axios"
import { useState } from "react"

interface Evidence {
  key: string
  name: string
  url: string | null
}

/**
 * 검수 증빙 사진 업로드 — 반려(B1r)와 사유 번복(B2b)이 같은 규칙(1~5장 · PNG·JPG · 10MB)을 쓴다.
 * 올라간 URL만 제출 본문에 들어가고, 업로드 중에는 제출을 막는다.
 */
export function useEvidenceUpload() {
  const [evidences, setEvidences] = useState<Array<Evidence>>([])
  const [uploadError, setUploadError] = useState<string | null>(null)

  const uploading = evidences.some(item => item.url === null)
  const uploadedUrls = evidences.flatMap(item => (item.url ? [item.url] : []))

  const handleFiles = async (files: FileList | null) => {
    if (!files) return
    setUploadError(null)
    const room = EVIDENCE_MAX_COUNT - evidences.length
    const picked = Array.from(files).slice(0, room)
    if (files.length > room) {
      setUploadError(
        `증빙 사진은 최대 ${EVIDENCE_MAX_COUNT}장까지 올릴 수 있습니다.`
      )
    }
    for (const file of picked) {
      if (!EVIDENCE_FILE_TYPES.includes(file.type)) {
        setUploadError("PNG · JPG 파일만 올릴 수 있습니다.")
        continue
      }
      if (file.size > EVIDENCE_MAX_BYTES) {
        setUploadError("10MB 이하 파일만 올릴 수 있습니다.")
        continue
      }
      const key = `${file.name}-${file.size}-${Date.now()}`
      setEvidences(prev => [...prev, { key, name: file.name, url: null }])
      try {
        // CLAIM 타입은 정사각형 제한이 없다. 응답이 오지 않아도 계속 돌지 않게 시간 제한을 둔다
        const data = (await fileService.upload(file, "CLAIM", {
          timeoutMs: 60_000,
          suppressErrorToast: true,
        })) as { imageUrl?: string }
        if (!data?.imageUrl) throw new Error("EMPTY_IMAGE_URL")
        const imageUrl = data.imageUrl
        setEvidences(prev =>
          prev.map(item =>
            item.key === key ? { ...item, url: imageUrl } : item
          )
        )
      } catch (error) {
        setEvidences(prev => prev.filter(item => item.key !== key))
        const serverMessage = isAxiosError(error)
          ? (error.response?.data as { message?: string } | undefined)?.message
          : undefined
        setUploadError(
          serverMessage ??
            (isAxiosError(error) && error.code === "ECONNABORTED"
              ? `${file.name} 업로드 시간이 초과됐습니다. 다시 시도해 주세요.`
              : `${file.name}을(를) 올리지 못했습니다. 다시 시도해 주세요.`)
        )
      }
    }
  }

  const remove = (key: string) =>
    setEvidences(prev => prev.filter(item => item.key !== key))

  return {
    evidences,
    uploadError,
    uploading,
    uploadedUrls,
    handleFiles,
    remove,
  }
}
