import { formatDateTimeShort } from "@/common/utils/formatDate"
import { Button } from "@/components/ui/button"
import { SettlementRequestModal } from "@/features/storeManagement/components/ChangeRequestModal/SettlementRequestModal"
import { SubmittedModal } from "@/features/storeManagement/components/ChangeRequestModal/SubmittedModal"
import RequestBanner from "@/features/storeManagement/components/RequestBanner/RequestBanner"
import {
  StoreButtonRow,
  StoreField,
  StoreFormCard,
  StoreSection,
  STORE_BUTTON_CLASS,
  STORE_INPUT_CLASS,
} from "@/features/storeManagement/components/StoreFormLayout/StoreFormLayout"
import { BASIC_INFO_QUERY_KEYS } from "@/features/storeManagement/constants/queryKeys"
import { useGetSettlementInfo } from "@/features/storeManagement/hooks/useGetSettlementInfo"
import {
  changeRequestService,
  type ChangeRequestCreateResponse,
} from "@/features/storeManagement/services/changeRequestService"
import {
  getBannerActionLabel,
  getBannerDate,
  getBannerTitle,
  getBannerTone,
} from "@/features/storeManagement/utils/changeRequestBanner"
import { cn } from "@/lib/utils"
import { useQueryClient } from "@tanstack/react-query"
import { useState } from "react"

export default function SettlementAccountTab() {
  const { data, isLoading } = useGetSettlementInfo()
  const queryClient = useQueryClient()

  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false)
  const [submitted, setSubmitted] =
    useState<ChangeRequestCreateResponse | null>(null)
  const [isBannerActionLoading, setIsBannerActionLoading] = useState(false)

  const invalidateSettlement = () =>
    queryClient.invalidateQueries({
      queryKey: [BASIC_INFO_QUERY_KEYS.SETTLEMENT],
    })

  const handleCancelRequest = async (requestId: number) => {
    setIsBannerActionLoading(true)
    try {
      await changeRequestService.cancel(requestId)
      invalidateSettlement()
    } catch {
      // 인터셉터가 토스트 처리
    } finally {
      setIsBannerActionLoading(false)
    }
  }

  const handleAcknowledge = async (requestId: number) => {
    setIsBannerActionLoading(true)
    try {
      await changeRequestService.acknowledge(requestId)
      invalidateSettlement()
    } catch {
      // 인터셉터가 토스트 처리
    } finally {
      setIsBannerActionLoading(false)
    }
  }

  if (isLoading || !data) {
    return (
      <StoreFormCard>
        <div className="p-5 text-[12px] text-sz-n-500">불러오는 중…</div>
      </StoreFormCard>
    )
  }

  const banner = data.changeRequest
  const isRequestPending = banner?.status === "PENDING"
  // 요청한 계좌 정보가 통째로 비어 있을 수 있어(항목 값이 서버에서 null) 빈 문자열이면
  // 항목 라벨 나열로 되돌린다 — "null null"이 배너에 찍히는 걸 막는다.
  const requestedAccountText = banner?.requestedAccount
    ? [
        banner.requestedAccount.bankName,
        banner.requestedAccount.maskedAccountNumber,
      ]
        .filter(Boolean)
        .join(" ")
    : ""
  const accountClause =
    requestedAccountText || (banner?.changedFieldLabels.join(", ") ?? "")

  return (
    <>
      <StoreFormCard>
        {banner && (
          <RequestBanner
            tone={getBannerTone(banner.status)}
            title={getBannerTitle(banner.status, "정산 계좌")}
            body={
              <>
                {formatDateTimeShort(getBannerDate(banner))}{" "}
                {banner.status === "PENDING"
                  ? "요청"
                  : banner.status === "APPROVED"
                    ? "승인"
                    : "반려"}{" "}
                {banner.status === "APPROVED" ? (
                  "· 새 계좌가 반영되었어요. 이미 확정된 정산 회차는 기존 계좌로 지급되며, 다음 회차부터 새 계좌로 지급됩니다."
                ) : (
                  <>
                    · {accountClause}
                    {banner.status === "PENDING" &&
                      " · 이후 통장 사본을 대조한 뒤 반영해요. 검토가 끝날 때까지 추가 변경 요청은 할 수 없어요."}
                  </>
                )}
              </>
            }
            rejectReason={
              banner.status === "REJECTED" ? banner.rejectReason : null
            }
            rejectReasonDetail={banner.rejectReasonDetail}
            actionLabel={getBannerActionLabel(banner.status)}
            isSubmitting={isBannerActionLoading}
            onAction={() =>
              isRequestPending
                ? handleCancelRequest(banner.requestId)
                : handleAcknowledge(banner.requestId)
            }
          />
        )}

        <StoreSection title="정산 수취 계좌">
          <StoreField label="은행">
            <input
              disabled
              value={data.bankName ?? ""}
              className={cn(
                "w-full max-w-[240px] rounded-[6px] border border-sz-n-200 bg-sz-n-100 text-[13px] text-sz-n-500",
                STORE_INPUT_CLASS
              )}
            />
          </StoreField>
          <StoreField
            label="계좌번호"
            hint="보안을 위해 뒤 6자리만 표시합니다."
          >
            <input
              disabled
              value={data.maskedAccountNumber ?? ""}
              className={cn(
                "w-full max-w-[240px] rounded-[6px] border border-sz-n-200 bg-sz-n-100 text-[13px] text-sz-n-500",
                STORE_INPUT_CLASS
              )}
            />
          </StoreField>
          <StoreField label="예금주">
            <input
              disabled
              value={data.accountHolder ?? ""}
              className={cn(
                "w-full rounded-[6px] border border-sz-n-200 bg-sz-n-100 text-[13px] text-sz-n-500",
                STORE_INPUT_CLASS
              )}
            />
          </StoreField>
        </StoreSection>

        <StoreButtonRow>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={STORE_BUTTON_CLASS}
            disabled={isRequestPending}
            onClick={() => setIsRequestModalOpen(true)}
          >
            변경 요청
          </Button>
        </StoreButtonRow>
      </StoreFormCard>

      <SettlementRequestModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        current={data}
        onSubmitted={response => {
          setIsRequestModalOpen(false)
          setSubmitted(response)
          invalidateSettlement()
        }}
      />
      <SubmittedModal response={submitted} onClose={() => setSubmitted(null)} />
    </>
  )
}
