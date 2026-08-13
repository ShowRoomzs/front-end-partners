import { Button } from "@/components/ui/button"
import { AddressField } from "@/features/auth/components/AddressField"
import { loadDaumPostcode } from "@/features/auth/utils/loadDaumPostcode"
import {
  validateCsNumber,
  validateMobilePhone,
  validateRecipientContact,
  validateRecipientName,
} from "@/features/auth/utils/validationHelpers"
import {
  StoreButtonRow,
  StoreField,
  StoreFormCard,
  StoreSection,
  STORE_INPUT_CLASS,
} from "@/features/storeManagement/components/StoreFormLayout/StoreFormLayout"
import { BASIC_INFO_QUERY_KEYS } from "@/features/storeManagement/constants/queryKeys"
import { useGetManagerInfo } from "@/features/storeManagement/hooks/useGetManagerInfo"
import { basicInfoService } from "@/features/storeManagement/services/basicInfoService"
import { cn } from "@/lib/utils"
import { useQueryClient } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import toast from "react-hot-toast"

interface FormState {
  managerName: string
  managerContact: string
  csNumber: string
  recipientName: string
  recipientContact: string
  address: string
  detailAddress: string
}

const EMPTY_FORM: FormState = {
  managerName: "",
  managerContact: "",
  csNumber: "",
  recipientName: "",
  recipientContact: "",
  address: "",
  detailAddress: "",
}

/**
 * 담당자·CS 탭 — 이 탭은 변경요청 대상이 아니다(§15-1 분류 ①: 직접 수정).
 * 반품 수취 주소 4필드는 온보딩(ui-partner-03)과 같은 컴포넌트를 재사용하되,
 * 상세주소는 **주소 검색 여부와 무관하게 항상 입력 가능**하다 — 온보딩의
 * "검색 완료 전 비활성" 규칙은 rev.2~3에서 폐기됐다(§15-4). 그 disabled 로직만은
 * 그대로 옮기지 않는다.
 */
export default function ManagerCsTab() {
  const { data, isLoading } = useGetManagerInfo()
  const queryClient = useQueryClient()

  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [touched, setTouched] = useState<
    Partial<Record<keyof FormState, boolean>>
  >({})
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (data) {
      setForm({
        managerName: data.managerName,
        managerContact: data.managerContact,
        csNumber: data.csNumber,
        recipientName: data.returnAddress.recipientName,
        recipientContact: data.returnAddress.recipientContact,
        address: data.returnAddress.address,
        detailAddress: data.returnAddress.detailAddress,
      })
    }
  }, [data])

  const set = (key: keyof FormState, value: string) =>
    setForm(prev => ({ ...prev, [key]: value }))
  const touch = (key: keyof FormState) =>
    setTouched(prev => ({ ...prev, [key]: true }))

  const errors: Partial<Record<keyof FormState, string>> = {
    managerName: String(form.managerName ?? "").trim()
      ? undefined
      : "판매 담당자 이름을 입력해 주세요.",
    managerContact:
      (validateMobilePhone(form.managerContact) !== true &&
        (validateMobilePhone(form.managerContact) as string)) ||
      (!String(form.managerContact ?? "").trim()
        ? "판매 담당자 연락처는 필수입니다."
        : undefined),
    csNumber:
      (validateCsNumber(form.csNumber) !== true &&
        (validateCsNumber(form.csNumber) as string)) ||
      (!String(form.csNumber ?? "").trim() ? "고객센터 전화번호는 필수입니다." : undefined),
    recipientName:
      (validateRecipientName(form.recipientName) !== true &&
        (validateRecipientName(form.recipientName) as string)) ||
      (!String(form.recipientName ?? "").trim() ? "수취인 이름은 필수입니다." : undefined),
    recipientContact:
      (validateRecipientContact(form.recipientContact) !== true &&
        (validateRecipientContact(form.recipientContact) as string)) ||
      (!String(form.recipientContact ?? "").trim()
        ? "수취인 연락처는 필수입니다."
        : undefined),
    address: String(form.address ?? "").trim() ? undefined : "주소를 검색해 입력해 주세요.",
    detailAddress: String(form.detailAddress ?? "").trim()
      ? undefined
      : "상세 주소를 입력해 주세요.",
  }
  const isValid = Object.values(errors).every(e => !e)

  const handleAddressSearch = async () => {
    try {
      await loadDaumPostcode()
    } catch {
      return
    }
    if (!window.daum?.Postcode) return
    new window.daum.Postcode({
      oncomplete: d => {
        const addr = d.userSelectedType === "J" ? d.jibunAddress : d.roadAddress
        set("address", addr)
        touch("address")
      },
    }).open()
  }

  const handleSave = async () => {
    setTouched({
      managerName: true,
      managerContact: true,
      csNumber: true,
      recipientName: true,
      recipientContact: true,
      address: true,
      detailAddress: true,
    })
    if (!isValid || isSaving) {
      return
    }
    setIsSaving(true)
    try {
      await basicInfoService.updateManagerInfo(form)
      toast.success("저장되었습니다.")
      queryClient.invalidateQueries({
        queryKey: [BASIC_INFO_QUERY_KEYS.MANAGER],
      })
    } catch {
      // 인터셉터가 토스트 처리
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading || !data) {
    return (
      <StoreFormCard>
        <div className="p-5 text-[12px] text-sz-n-500">불러오는 중…</div>
      </StoreFormCard>
    )
  }

  const inputClass = (key: keyof FormState) =>
    cn(
      "w-full rounded-[6px] border bg-white text-[13px] text-sz-n-900 focus:border-sz-accent-500 focus:outline-none",
      STORE_INPUT_CLASS,
      touched[key] && errors[key] ? "border-sz-danger-text" : "border-sz-n-300"
    )

  return (
    <StoreFormCard>
      <StoreSection title="담당자·CS 정보">
        <StoreField
          label="판매 담당자 이름"
          required
          error={touched.managerName ? errors.managerName : undefined}
        >
          <input
            type="text"
            value={form.managerName}
            onChange={e => set("managerName", e.target.value)}
            onBlur={() => touch("managerName")}
            placeholder="담당자 이름"
            className={inputClass("managerName")}
          />
        </StoreField>
        <StoreField
          label="판매 담당자 연락처"
          required
          error={touched.managerContact ? errors.managerContact : undefined}
        >
          <input
            type="tel"
            value={form.managerContact}
            onChange={e =>
              set("managerContact", e.target.value.replace(/[^0-9-]/g, ""))
            }
            onBlur={() => touch("managerContact")}
            placeholder="010-0000-0000"
            className={cn("max-w-[240px]", inputClass("managerContact"))}
          />
        </StoreField>
        <StoreField
          label="고객센터 전화번호"
          required
          error={touched.csNumber ? errors.csNumber : undefined}
          hint="소비자 앱 상품 상세에 노출됩니다. 존재하지 않는 번호 입력 시 서비스 이용이 제한될 수 있습니다."
        >
          <input
            type="tel"
            value={form.csNumber}
            onChange={e =>
              set("csNumber", e.target.value.replace(/[^0-9-]/g, ""))
            }
            onBlur={() => touch("csNumber")}
            placeholder="'-' 포함 8~12자리 숫자"
            className={cn("max-w-[240px]", inputClass("csNumber"))}
          />
        </StoreField>
      </StoreSection>

      <StoreSection title="반품 수취 주소">
        <StoreField
          label="수취인 이름"
          required
          error={touched.recipientName ? errors.recipientName : undefined}
        >
          <input
            type="text"
            value={form.recipientName}
            onChange={e => set("recipientName", e.target.value)}
            onBlur={() => touch("recipientName")}
            placeholder="담당자 이름"
            className={inputClass("recipientName")}
          />
        </StoreField>
        <StoreField
          label="수취인 연락처"
          required
          error={touched.recipientContact ? errors.recipientContact : undefined}
        >
          <input
            type="tel"
            value={form.recipientContact}
            onChange={e =>
              set("recipientContact", e.target.value.replace(/[^0-9-]/g, ""))
            }
            onBlur={() => touch("recipientContact")}
            placeholder="'-' 포함 10~11자리 숫자"
            className={cn("max-w-[240px]", inputClass("recipientContact"))}
          />
        </StoreField>
        <StoreField
          label="주소"
          required
          error={touched.address ? errors.address : undefined}
        >
          <AddressField
            value={form.address}
            onChange={v => set("address", v)}
            onBlur={() => touch("address")}
            hasError={!!(touched.address && errors.address)}
            placeholder="클릭하면 주소 검색창이 열립니다"
            onSearchClick={handleAddressSearch}
            readOnly
          />
        </StoreField>
        <StoreField
          label="상세 주소"
          required
          error={touched.detailAddress ? errors.detailAddress : undefined}
        >
          <input
            type="text"
            value={form.detailAddress}
            onChange={e => set("detailAddress", e.target.value)}
            onBlur={() => touch("detailAddress")}
            placeholder="상세 주소 입력"
            className={inputClass("detailAddress")}
          />
        </StoreField>
      </StoreSection>

      <StoreButtonRow>
        <Button
          type="button"
          size="sm"
          isLoading={isSaving}
          onClick={handleSave}
        >
          저장
        </Button>
      </StoreButtonRow>
    </StoreFormCard>
  )
}
