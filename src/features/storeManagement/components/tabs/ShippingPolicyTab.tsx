import NotReady from "@/common/components/NotReady/NotReady"
import { DEV_MOCK_ENABLED } from "@/common/utils/devMock"
import { Button } from "@/components/ui/button"
import {
  StoreButtonRow,
  StoreField,
  StoreFormCard,
  StoreHint,
  StoreSection,
  STORE_BUTTON_CLASS,
  STORE_INPUT_CLASS,
} from "@/features/storeManagement/components/StoreFormLayout/StoreFormLayout"
import { BASIC_INFO_QUERY_KEYS } from "@/features/storeManagement/constants/queryKeys"
import {
  shippingPolicyService,
  type ShippingPolicy,
} from "@/features/storeManagement/services/shippingPolicyService"
import { cn } from "@/lib/utils"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useState, type ReactNode } from "react"
import toast from "react-hot-toast"

type FormState = Record<keyof ShippingPolicy, string>

const SHIP_DUE_MIN = 1
const SHIP_DUE_MAX = 7

function toForm(policy: ShippingPolicy): FormState {
  return {
    defaultDeliveryFee: String(policy.defaultDeliveryFee),
    freeShippingThreshold: String(policy.freeShippingThreshold),
    jejuSurcharge: String(policy.jejuSurcharge),
    remoteAreaSurcharge: String(policy.remoteAreaSurcharge),
    shippingLeadDays: String(policy.shippingLeadDays),
    returnFee: String(policy.returnFee),
    exchangeFee: String(policy.exchangeFee),
  }
}

/** 금액 칸은 시안처럼 천 단위 쉼표로 보여 주고, 상태에는 숫자만 둔다 */
function withComma(value: string) {
  return value === "" ? "" : Number(value).toLocaleString("ko-KR")
}

/**
 * 기본정보 관리 › 배송·반품 정책(ui-partner-06 5-A).
 *
 * 사업자 정보·정산 계좌와 달리 **브랜드가 바로 고친다**(운영자 검토 없음) — 영업 조건이지 법정
 * 신원정보가 아니다. 저장하면 소비자 화면의 배송비·도착 예정일과 정산의 배송비 항목에 반영되고,
 * 발송 기한은 값을 바꾼 뒤 접수되는 주문에만 적용된다(주문 시점 값 고정).
 *
 * 조회·수정 API가 아직 없어 개발 서버에서만 목업으로 동작한다(`shippingPolicyService`).
 */
export default function ShippingPolicyTab() {
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: [BASIC_INFO_QUERY_KEYS.SHIPPING_POLICY],
    queryFn: shippingPolicyService.get,
    enabled: DEV_MOCK_ENABLED,
  })
  const [form, setForm] = useState<FormState | null>(null)
  const [touched, setTouched] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (data) setForm(toForm(data))
  }, [data])

  if (!DEV_MOCK_ENABLED) {
    return (
      <StoreFormCard>
        <NotReady title="배송·반품 정책 화면은 준비 중입니다">
          처음 입력한 배송·반품 정책은 그대로 적용되고 있습니다.
          <br />
          변경이 필요하면 운영자에게 문의해 주세요.
        </NotReady>
      </StoreFormCard>
    )
  }

  if (isLoading || !form || !data) {
    return (
      <StoreFormCard>
        <div className="p-5 text-[12px] text-sz-n-500">불러오는 중…</div>
      </StoreFormCard>
    )
  }

  const set = (key: keyof FormState, raw: string) =>
    setForm(prev =>
      prev
        ? {
            ...prev,
            [key]: raw.replace(/[^0-9]/g, "").replace(/^0+(?=\d)/, ""),
          }
        : prev
    )

  const leadDays = Number(form.shippingLeadDays)
  const leadDaysError =
    form.shippingLeadDays === ""
      ? "발송 기한을 입력해 주세요."
      : leadDays < SHIP_DUE_MIN || leadDays > SHIP_DUE_MAX
        ? `발송 기한은 ${SHIP_DUE_MIN}~${SHIP_DUE_MAX}영업일로 입력해 주세요.`
        : undefined
  // 필수 미입력은 문구 없이 [저장]만 비활성 — 범위 위반(발송 기한)만 문구를 띄운다
  const requiredFilled =
    form.defaultDeliveryFee !== "" &&
    form.shippingLeadDays !== "" &&
    form.returnFee !== "" &&
    form.exchangeFee !== ""
  const isDirty = JSON.stringify(form) !== JSON.stringify(toForm(data))
  const canSave =
    requiredFilled &&
    !(leadDays < SHIP_DUE_MIN || leadDays > SHIP_DUE_MAX) &&
    isDirty

  const handleSave = async () => {
    setTouched(true)
    if (!canSave || isSaving) return
    setIsSaving(true)
    try {
      await shippingPolicyService.update({
        defaultDeliveryFee: Number(form.defaultDeliveryFee),
        freeShippingThreshold: Number(form.freeShippingThreshold || 0),
        jejuSurcharge: Number(form.jejuSurcharge || 0),
        remoteAreaSurcharge: Number(form.remoteAreaSurcharge || 0),
        shippingLeadDays: leadDays,
        returnFee: Number(form.returnFee),
        exchangeFee: Number(form.exchangeFee),
      })
      toast.success("저장되었습니다. 이후 접수되는 주문부터 적용됩니다.")
      queryClient.invalidateQueries({
        queryKey: [BASIC_INFO_QUERY_KEYS.SHIPPING_POLICY],
      })
    } catch {
      // 인터셉터가 토스트 처리
    } finally {
      setIsSaving(false)
    }
  }

  const money = (key: keyof FormState) => (
    <div className="relative flex w-full max-w-[240px] items-center">
      <input
        type="text"
        inputMode="numeric"
        value={withComma(form[key])}
        placeholder="0"
        onChange={event => set(key, event.target.value)}
        className={cn(
          "w-full rounded-[6px] border border-sz-n-300 bg-white pr-[34px] text-[13px] tabular-nums text-sz-n-900 focus:border-sz-accent-500 focus:outline-none",
          STORE_INPUT_CLASS
        )}
      />
      <span className="pointer-events-none absolute right-3 text-[12px] text-sz-n-500">
        원
      </span>
    </div>
  )

  const showLeadError =
    leadDaysError && (touched || form.shippingLeadDays !== "")

  return (
    <StoreFormCard>
      {/* 시안 `.card-h`는 다른 탭과 같이 생략한다 — 서브탭 이름이 이미 제목 역할을 한다 */}
      <StoreSection title="배송비">
        <StoreField label="기본 배송비" required>
          {money("defaultDeliveryFee")}
        </StoreField>
        <StoreField
          label={<Optional>무료배송 기준금액</Optional>}
          hint="0원이면 무료배송을 적용하지 않습니다."
        >
          {money("freeShippingThreshold")}
        </StoreField>
      </StoreSection>

      <StoreSection title="권역 추가비">
        <StoreField label={<Optional>제주 추가비</Optional>}>
          {money("jejuSurcharge")}
        </StoreField>
        <StoreField label={<Optional>도서산간 추가비</Optional>}>
          {money("remoteAreaSurcharge")}
        </StoreField>
        <StoreHint>
          권역 판정은{" "}
          <b className="font-semibold text-sz-n-700">우편번호 기준</b>
          이며 플랫폼이 자동으로 분류합니다. 두 권역이 겹치는 주소는{" "}
          <b className="font-semibold text-sz-n-700">제주 추가비</b>가 우선
          적용됩니다.
        </StoreHint>
      </StoreSection>

      <StoreSection title="출고">
        <StoreField
          label="발송 기한"
          required
          error={showLeadError ? leadDaysError : undefined}
          hint={
            <>
              공구 마감 후 기준 · 최대 7영업일 · 소비자 상품 상세에 「공구 마감
              후 N영업일 이내 발송」으로 자동 표시됩니다 · 영업일 = 주말·공휴일
              제외. 연휴가 끼면 기한이 그만큼 늦어집니다. 판매 관리의{" "}
              <b className="font-semibold text-sz-n-700">발송기한</b>도 이
              값으로 계산됩니다.
            </>
          }
        >
          <div className="flex items-center gap-2">
            <span className="shrink-0 text-[12px] text-sz-n-600">
              공구 마감 후
            </span>
            <div className="relative flex w-full max-w-[240px] items-center">
              <input
                type="text"
                inputMode="numeric"
                value={form.shippingLeadDays}
                placeholder="0"
                maxLength={1}
                onChange={event => set("shippingLeadDays", event.target.value)}
                onBlur={() => setTouched(true)}
                className={cn(
                  "w-full rounded-[6px] border bg-white pr-[52px] text-[13px] tabular-nums text-sz-n-900 focus:border-sz-accent-500 focus:outline-none",
                  STORE_INPUT_CLASS,
                  showLeadError ? "border-sz-danger-text" : "border-sz-n-300"
                )}
              />
              <span className="pointer-events-none absolute right-3 text-[12px] text-sz-n-500">
                영업일
              </span>
            </div>
            <span className="shrink-0 text-[12px] text-sz-n-600">이내</span>
          </div>
        </StoreField>
      </StoreSection>

      <StoreSection title="반품·교환비">
        <StoreField label="반품비(회수비)" required>
          {money("returnFee")}
        </StoreField>
        <StoreField label="교환비" required>
          {money("exchangeFee")}
        </StoreField>
      </StoreSection>

      <StoreButtonRow>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={STORE_BUTTON_CLASS}
          disabled={!isDirty || isSaving}
          onClick={() => {
            setForm(toForm(data))
            setTouched(false)
          }}
        >
          취소
        </Button>
        <Button
          type="button"
          size="sm"
          className={STORE_BUTTON_CLASS}
          disabled={!canSave}
          isLoading={isSaving}
          onClick={handleSave}
        >
          저장
        </Button>
      </StoreButtonRow>
    </StoreFormCard>
  )
}

/** 시안 `.flab` 뒤의 「(선택)」 — 11px 보통 굵기 회색 */
function Optional({ children }: { children: ReactNode }) {
  return (
    <>
      {children}{" "}
      <span className="text-[11px] font-normal text-sz-n-500">(선택)</span>
    </>
  )
}
