import { Button } from "@/components/ui/button"
import { formatDateTimeShort } from "@/common/utils/formatDate"
import { validateEmailFormat } from "@/features/auth/utils/validationHelpers"
import { BusinessInfoRequestModal } from "@/features/storeManagement/components/ChangeRequestModal/BusinessInfoRequestModal"
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
import { useGetBusinessInfo } from "@/features/storeManagement/hooks/useGetBusinessInfo"
import {
  basicInfoService,
  type BusinessInfoResponse,
} from "@/features/storeManagement/services/basicInfoService"
import type { ChangeRequestCreateResponse } from "@/features/storeManagement/services/changeRequestService"
import {
  getBannerActionLabel,
  getBannerDate,
  getBannerTitle,
  getBannerTone,
} from "@/features/storeManagement/utils/changeRequestBanner"
import { changeRequestService } from "@/features/storeManagement/services/changeRequestService"
import { cn } from "@/lib/utils"
import { useQueryClient } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import toast from "react-hot-toast"

const SITE_URL_PATTERN = /^$|^https?:\/\/.+$/

/**
 * 조회 전용으로 값만 그대로 뿌리는 문자열 필드들. 전부 `string | null`이라
 * 렌더 시 `?? ""`로 대체한다 — Extract를 쓰는 건 이름이 응답 스키마와 어긋나면
 * 여기서 바로 컴파일 에러가 나게 하기 위해서다.
 */
type ReadonlyFieldKey = Extract<
  keyof BusinessInfoResponse,
  | "businessType"
  | "marketName"
  | "representativeName"
  | "companyName"
  | "businessRegistrationNumber"
  | "businessCondition"
  | "businessAddress"
  | "mailOrderRegNumber"
>

const READONLY_FIELDS: Array<{
  key: ReadonlyFieldKey
  label: string
}> = [
  { key: "businessType", label: "사업자 유형" },
  { key: "marketName", label: "브랜드명" },
  { key: "representativeName", label: "대표자명" },
  { key: "companyName", label: "사업자등록증 상호" },
  { key: "businessRegistrationNumber", label: "사업자등록번호" },
  { key: "businessCondition", label: "업태" },
  { key: "businessAddress", label: "사업장 주소" },
  { key: "mailOrderRegNumber", label: "통신판매업 신고번호" },
]

export default function BusinessInfoTab() {
  const { data, isLoading } = useGetBusinessInfo()
  const queryClient = useQueryClient()

  const [taxEmail, setTaxEmail] = useState("")
  const [brandSiteUrl, setBrandSiteUrl] = useState("")
  const [touched, setTouched] = useState<{
    taxEmail: boolean
    brandSiteUrl: boolean
  }>({
    taxEmail: false,
    brandSiteUrl: false,
  })
  const [isSaving, setIsSaving] = useState(false)
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false)
  const [submitted, setSubmitted] =
    useState<ChangeRequestCreateResponse | null>(null)
  const [isBannerActionLoading, setIsBannerActionLoading] = useState(false)

  // 서버는 두 필드 모두 null을 내려줄 수 있다(가입 심사 중·미입력 계정).
  // 상태에 담기 전 여기서 한 번만 ""로 정규화하고, 이후 로직은 문자열만 다룬다.
  useEffect(() => {
    if (data) {
      setTaxEmail(data.taxEmail ?? "")
      setBrandSiteUrl(data.brandSiteUrl ?? "")
    }
  }, [data])

  const taxEmailValidation = validateEmailFormat(taxEmail)
  const isTaxEmailValid =
    taxEmailValidation === true && taxEmail.trim().length > 0
  const isSiteUrlValid = SITE_URL_PATTERN.test(brandSiteUrl)
  const taxEmailError =
    touched.taxEmail && !isTaxEmailValid
      ? taxEmail.trim().length === 0
        ? "tax 확인용 이메일은 필수입니다."
        : (taxEmailValidation as string)
      : undefined
  const siteUrlError =
    touched.brandSiteUrl && !isSiteUrlValid
      ? "올바른 주소 형식이 아닙니다. (예: https://example.com)"
      : undefined

  // 비교 대상도 같은 방식으로 정규화해야 한다 — null과 ""를 다르게 보면
  // 값이 비어 있는 계정은 아무것도 안 건드려도 항상 dirty로 잡힌다.
  const isDirty =
    !!data &&
    (taxEmail !== (data.taxEmail ?? "") ||
      brandSiteUrl !== (data.brandSiteUrl ?? ""))
  const isValid = isTaxEmailValid && isSiteUrlValid

  const invalidateBusiness = () =>
    queryClient.invalidateQueries({
      queryKey: [BASIC_INFO_QUERY_KEYS.BUSINESS],
    })

  const handleSave = async () => {
    setTouched({ taxEmail: true, brandSiteUrl: true })
    if (!isDirty || !isValid || isSaving) {
      return
    }
    setIsSaving(true)
    try {
      await basicInfoService.updateBusinessInfo({ taxEmail, brandSiteUrl })
      toast.success("저장되었습니다.")
      invalidateBusiness()
    } catch {
      // 실패 사유는 apiInstance 인터셉터가 토스트로 띄운다
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancelRequest = async (requestId: number) => {
    setIsBannerActionLoading(true)
    try {
      await changeRequestService.cancel(requestId)
      invalidateBusiness()
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
      invalidateBusiness()
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

  return (
    <>
      <StoreFormCard>
        {banner && (
          <RequestBanner
            tone={getBannerTone(banner.status)}
            title={getBannerTitle(banner.status, "사업자 정보")}
            body={
              <>
                {formatDateTimeShort(getBannerDate(banner))}{" "}
                {banner.status === "PENDING"
                  ? "요청"
                  : banner.status === "APPROVED"
                    ? "승인"
                    : "반려"}{" "}
                · {banner.changedFieldLabels.join(", ")}
                {banner.status === "PENDING" &&
                  " · 이후 검토 후 결과를 이메일로 안내드려요. 검토가 끝날 때까지 추가 변경 요청은 할 수 없어요."}
                {banner.status === "APPROVED" &&
                  "가 요청하신 정보에 반영되었어요."}
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

        <StoreSection>
          {READONLY_FIELDS.map(({ key, label }) => (
            <StoreField key={key} label={label}>
              <input
                disabled
                value={data[key] ?? ""}
                className={cn(
                  "w-full rounded-[6px] border border-sz-n-200 bg-sz-n-100 text-[13px] text-sz-n-500",
                  STORE_INPUT_CLASS
                )}
              />
            </StoreField>
          ))}

          <StoreField
            label="tax 확인용 이메일"
            required
            error={taxEmailError}
            hint="세금계산서 등 세무 확인용 · 로그인 이메일과 별개 값 · 즉시 수정 가능"
          >
            <input
              type="email"
              value={taxEmail}
              onChange={e => setTaxEmail(e.target.value)}
              onBlur={() => setTouched(t => ({ ...t, taxEmail: true }))}
              placeholder="brand@example.com"
              className={cn(
                "w-full rounded-[6px] border bg-white text-[13px] text-sz-n-900 focus:border-sz-accent-500 focus:outline-none",
                STORE_INPUT_CLASS,
                taxEmailError ? "border-sz-danger-text" : "border-sz-n-300"
              )}
            />
          </StoreField>

          <StoreField
            label="브랜드 사이트 링크"
            error={siteUrlError}
            hint='소비자 상품 상세페이지 "사이트에서 보기" 버튼에 사용(선택 입력, 미입력 시 버튼 비노출) · 즉시 수정 가능'
          >
            <input
              type="text"
              value={brandSiteUrl}
              onChange={e => setBrandSiteUrl(e.target.value)}
              onBlur={() => setTouched(t => ({ ...t, brandSiteUrl: true }))}
              placeholder="https:// 포함 전체 주소"
              className={cn(
                "w-full rounded-[6px] border bg-white text-[13px] text-sz-n-900 focus:border-sz-accent-500 focus:outline-none",
                STORE_INPUT_CLASS,
                siteUrlError ? "border-sz-danger-text" : "border-sz-n-300"
              )}
            />
          </StoreField>

          <StoreField label="심사 첨부 파일">
            <div className="flex flex-wrap gap-1.5">
              {data.reviewDocuments.map(doc => (
                <span
                  key={doc.documentType}
                  className="rounded-[10px] bg-sz-n-100 px-2.5 py-0.5 text-[11px] text-sz-n-600"
                >
                  {doc.label}
                </span>
              ))}
            </div>
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
          <Button
            type="button"
            size="sm"
            className={STORE_BUTTON_CLASS}
            disabled={!isDirty || !isValid}
            isLoading={isSaving}
            onClick={handleSave}
          >
            저장
          </Button>
        </StoreButtonRow>
      </StoreFormCard>

      <BusinessInfoRequestModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        onSubmitted={response => {
          setIsRequestModalOpen(false)
          setSubmitted(response)
          invalidateBusiness()
        }}
      />
      <SubmittedModal response={submitted} onClose={() => setSubmitted(null)} />
    </>
  )
}
