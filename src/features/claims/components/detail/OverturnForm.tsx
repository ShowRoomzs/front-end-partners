import { isApiNotReady } from "@/common/utils/devMock"
import Btn from "@/features/contracts/components/shared/Btn"
import { TEXTAREA_CLASS } from "@/features/contracts/components/shared/styles"
import { EvidenceField } from "@/features/claims/components/detail/EvidenceField"
import {
  AmountRow,
  CollectFreightNotice,
  MWARN_CLASS,
} from "@/features/claims/components/detail/FreightParts"
import {
  useClaimMutations,
  useGetClaimFreightPreview,
} from "@/features/claims/hooks/useClaimQueries"
import { useEvidenceUpload } from "@/features/claims/hooks/useEvidenceUpload"
import type { ClaimDetailResponse } from "@/features/claims/types"
import { formatWon } from "@/features/claims/utils/format"
import { cn } from "@/lib/utils"
import { isAxiosError } from "axios"
import type { ReactNode } from "react"
import { useState } from "react"
import toast from "react-hot-toast"

function Label(props: { children: ReactNode; first?: boolean }) {
  return (
    <label
      className={cn(
        "mb-1 block text-[12px] font-medium text-sz-n-600",
        props.first ? "mt-0" : "mt-4"
      )}
    >
      {props.children}
      <span className="ml-0.5 text-sz-danger-text">*</span>
    </label>
  )
}

/**
 * 시안 B2b — 사유 번복(기-17 【잠정】 · 기-93). 불량 · 오배송(착불) 신청을 단순 변심으로 재분류하고 교환은 진행한다.
 * 설명 · 증빙은 소비자에게 그대로 전달되어 필수다 — 미입력은 에러 없이 버튼만 비활성(전역 규칙).
 * 결제를 기다리는 동안은 반려 보류(A6) 화면을 재사용한다.
 */
export default function OverturnForm(props: {
  detail: ClaimDetailResponse
  onCancel: () => void
}) {
  const { detail, onCancel } = props
  const mutations = useClaimMutations()
  const upload = useEvidenceUpload()
  const [explanation, setExplanation] = useState("")
  const { data: preview } = useGetClaimFreightPreview(detail, true)

  const canSubmit =
    explanation.trim() !== "" &&
    upload.uploadedUrls.length > 0 &&
    !upload.uploading &&
    !mutations.overturn.isPending

  const handleSubmit = async () => {
    try {
      await mutations.overturn.mutateAsync({
        current: detail,
        body: {
          explanation: explanation.trim(),
          evidenceImageUrls: upload.uploadedUrls,
        },
      })
      toast.success(
        "사유 번복을 제출했습니다. 소비자에게 재발송 배송비 결제가 요청됩니다."
      )
      onCancel()
    } catch (error) {
      // 실호출은 전역 토스트를 끄고 보낸다(아직 없는 경로의 404 때문) — 서버 메시지는 여기서 띄운다
      if (isApiNotReady(error)) {
        toast.error("아직 준비 중인 기능입니다.")
        return
      }
      toast.error(
        (isAxiosError(error)
          ? (error.response?.data as { message?: string } | undefined)?.message
          : undefined) ?? "사유 번복을 제출하지 못했습니다."
      )
    }
  }

  return (
    <div className="mt-3 border-t border-sz-n-100 pt-3">
      <div className="mb-3 flex items-center justify-between text-[12px] font-semibold text-sz-n-900">
        사유 번복 · 단순 변심으로 재분류
        <button
          type="button"
          onClick={onCancel}
          className="cursor-pointer text-[11px] font-normal text-sz-n-500 hover:text-sz-n-700"
        >
          접기
        </button>
      </div>

      <Label first>판정 근거 설명</Label>
      <textarea
        value={explanation}
        onChange={event => setExplanation(event.target.value)}
        className={cn(TEXTAREA_CLASS, "min-h-16")}
        placeholder="불량이 아니라고 판단한 근거를 적어 주세요. 소비자에게 그대로 전달됩니다"
      />

      <Label>증빙 사진</Label>
      <EvidenceField title="정상 작동·상태가 보이는 사진" upload={upload} />

      <CollectFreightNotice />
      {preview && (
        <div className="mt-1">
          <AmountRow
            label="착불 운임(회수)"
            sub="브랜드가 낸 금액(상품 기본 배송비 정액) · 소비자 청구"
          >
            {formatWon(preview.freight)}
          </AmountRow>
          <AmountRow
            label="소비자 결제 합계"
            sub={`재발송 배송비 ${preview.reshipFee.toLocaleString()} + 착불 운임 ${preview.freight.toLocaleString()}`}
          >
            <b className="font-semibold">
              {formatWon(preview.reshipFee + preview.freight)}
            </b>
          </AmountRow>
        </div>
      )}

      <div className={cn(MWARN_CLASS, "mt-3")}>
        제출하면 귀책이 <b>소비자 귀책(단순 변심)</b>으로 바뀌고, 소비자에게{" "}
        <b>재발송 배송비 + 착불 운임 결제</b>가 요청됩니다. 결제가 확인되면{" "}
        <b>재발송</b> 탭으로 넘어갑니다.
      </div>
      <Btn
        variant="primary"
        className="mt-3 w-full"
        disabled={!canSubmit}
        isLoading={mutations.overturn.isPending}
        onClick={handleSubmit}
      >
        사유 번복 제출
      </Btn>
    </div>
  )
}
