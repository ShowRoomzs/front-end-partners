import Notice from "@/common/components/Notice/Notice"

interface DuplicateSourceBannerProps {
  sourceContractId: number
  sourceTitle: string | null
}

/**
 * 재작성 출처 표기(§26-5) — "봄 클렌저 공구의 조건을 복사했습니다".
 * 공구 기간·게시 완료 기한은 비운 채로 열리고, 고정 지급비 고지 확인은 다시 받는다.
 */
export default function DuplicateSourceBanner(
  props: DuplicateSourceBannerProps
) {
  const { sourceContractId, sourceTitle } = props

  return (
    <Notice tone="info" className="mb-4">
      <b className="font-semibold">
        {sourceTitle ?? `CTR #${sourceContractId}`}의 조건을 복사했습니다.
      </b>{" "}
      공구 기간과 게시 완료 기한은 새로 고르고, 고정 지급비 고지 확인도 다시
      받습니다. 그 사이 상품이 미진열로 바뀌었거나 정가가 내려갔다면 해당 행에
      오류가 표시됩니다.
    </Notice>
  )
}
