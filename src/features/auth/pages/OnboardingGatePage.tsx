import { useEffect, useState } from "react"
import { Controller, useForm, useWatch } from "react-hook-form"
import { useLocation, useNavigate } from "react-router-dom"
import { isAxiosError } from "axios"
import { cn } from "@/lib/utils"
import { AuthShell } from "@/common/components/Auth/AuthShell"
import { FormField } from "@/common/components/Auth/FormField"
import { authInputClass } from "@/common/components/Auth/authStyles"
import { AddressField } from "@/features/auth/components/AddressField"
import { NumberField } from "@/features/auth/components/NumberField"
import { NoticeBox } from "@/features/auth/components/NoticeBox"
import {
  authService,
  type OnboardingData,
} from "@/features/auth/services/authService"
import {
  validateRecipientContact,
  validateRecipientName,
} from "@/features/auth/utils/validationHelpers"
import { loadDaumPostcode } from "@/features/auth/utils/loadDaumPostcode"
import { useCookie } from "@/common/hooks/useCookie"
import { COOKIE_NAME } from "@/common/constants/cookie"
import { useMarketStore } from "@/common/stores/useMarketStore"

const SERVER_ERROR_MESSAGE =
  "일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요."

// 폼은 전부 문자열로 다루고 제출 시점에만 숫자로 변환한다
// (빈 값과 0을 구분해야 하고, number 입력의 중간 상태를 그대로 보존하기 위함).
type OnboardingFormValues = {
  recipientName: string
  contact: string
  address: string
  detailAddress: string
  defaultDeliveryFee: string
  freeShippingThreshold: string
  remoteAreaSurcharge: string
  shippingLeadDays: string
  returnFee: string
  exchangeFee: string
}

// 업계 평균값을 기본 제시 — 담당자가 그대로 두거나 수정할 수 있다.
// 이 두 필드는 "필수"지만 처음부터 채워진 채 시작하므로 초기 상태에서 이미 유효하다.
const DEFAULT_RETURN_FEE = "3000"
const DEFAULT_EXCHANGE_FEE = "6000"

const Required = () => <span className="ml-0.5 text-sz-danger-text">*</span>
const Optional = () => (
  <span className="ml-1 font-normal text-sz-n-400">(선택)</span>
)

/**
 * 승인 후 최초 로그인 시 강제 진입하는 활성화 게이트.
 *
 * 로그인 응답의 registerToken(5분 단명)을 라우터 state로 넘겨받아 제출에 사용한다.
 * 제출에 성공하면 서버가 isNewMember를 내리고 정식 토큰을 발급하므로,
 * 이후 로그인부터는 이 화면을 다시 만나지 않는다.
 */
export default function OnboardingGatePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { setRole } = useMarketStore()
  const [, setAccessToken] = useCookie<string>(COOKIE_NAME.ACCESS_TOKEN)
  const [, setRefreshToken] = useCookie<string>(COOKIE_NAME.REFRESH_TOKEN)

  const registerToken = (location.state as { registerToken?: string } | null)
    ?.registerToken

  const [serverError, setServerError] = useState<string | null>(null)

  const {
    control,
    handleSubmit,
    getValues,
    setValue,
    setFocus,
    formState: { errors, isValid, isSubmitting },
  } = useForm<OnboardingFormValues>({
    // 실시간 검증 — 필수 8개가 모두 유효해야 제출 버튼이 켜진다(제출 후 에러 표시 방식 아님)
    mode: "onChange",
    defaultValues: {
      recipientName: "",
      contact: "",
      address: "",
      detailAddress: "",
      defaultDeliveryFee: "",
      freeShippingThreshold: "",
      remoteAreaSurcharge: "",
      shippingLeadDays: "",
      returnFee: DEFAULT_RETURN_FEE,
      exchangeFee: DEFAULT_EXCHANGE_FEE,
    },
  })

  // registerToken 없이 들어온 경우(직접 URL 접근·새로고침) — 토큰을 되살릴 방법이 없다.
  useEffect(() => {
    if (!registerToken) {
      navigate("/login", { replace: true })
    }
  }, [registerToken, navigate])

  // 주소 검색 완료 여부 — 상세 주소는 이 값이 있어야 입력할 수 있다.
  // watch() 대신 useWatch를 쓴다(watch는 매 렌더 새 함수를 반환해 메모이제이션이 깨짐).
  const address = useWatch({ control, name: "address" })

  if (!registerToken) {
    return null
  }

  const handleAddressSearch = async () => {
    try {
      await loadDaumPostcode()
    } catch {
      return // 스크립트 로드 실패 시 조용히 무시
    }
    if (!window.daum?.Postcode) return
    new window.daum.Postcode({
      oncomplete: data => {
        // 앱 로직 동일: J=지번, R=도로명
        const addr =
          data.userSelectedType === "J" ? data.jibunAddress : data.roadAddress
        setValue("address", addr, {
          shouldValidate: true,
          shouldDirty: true,
        })
        setFocus("detailAddress")
      },
    }).open()
  }

  const onSubmit = async () => {
    setServerError(null)
    const v = getValues()
    // 선택 항목은 미입력 시 null(서버가 0으로 처리하거나 비워둔다)
    const toOptionalNumber = (value: string) =>
      value.trim() === "" ? null : Number(value)

    const payload: OnboardingData = {
      recipientName: v.recipientName.trim(),
      contact: v.contact,
      address: v.address,
      detailAddress: v.detailAddress.trim(),
      defaultDeliveryFee: Number(v.defaultDeliveryFee),
      freeShippingThreshold: toOptionalNumber(v.freeShippingThreshold),
      remoteAreaSurcharge: toOptionalNumber(v.remoteAreaSurcharge),
      shippingLeadDays: Number(v.shippingLeadDays),
      returnFee: Number(v.returnFee),
      exchangeFee: Number(v.exchangeFee),
    }

    try {
      const res = await authService.completeRegistration(registerToken, payload)
      // 제출 성공 = 온보딩 완료 + 정식 로그인
      setRole(res.role)
      setAccessToken(res.accessToken)
      setRefreshToken(res.refreshToken)
      navigate("/")
    } catch (err) {
      if (!isAxiosError(err) || !err.response) {
        setServerError(SERVER_ERROR_MESSAGE)
        return
      }
      const code = err.response.data?.code as string | undefined
      const message = err.response.data?.message as string | undefined

      // registerToken 만료(5분) — 다시 로그인해야 새 토큰을 받는다
      if (code === "REGISTER_EXPIRED") {
        navigate("/login", {
          replace: true,
          state: {
            info: "회원가입 유효 시간이 만료되었습니다. 다시 로그인해주세요.",
          },
        })
        return
      }
      setServerError(message ?? SERVER_ERROR_MESSAGE)
    }
  }

  return (
    <AuthShell width={480} subtitle="브랜드 파트너센터" align="top">
      <div className="mb-6 text-center">
        <h1 className="text-[16px] font-semibold text-sz-n-900">
          서비스 시작 전, 필수 정보를 입력해 주세요
        </h1>
        <p className="mt-1.5 text-[12px] text-sz-n-600">
          입력을 완료해야 파트너센터를 이용할 수 있어요.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        {serverError && (
          <div
            role="alert"
            className="mb-5 rounded-[6px] bg-sz-warning-bg px-3.5 py-3 text-[12px] text-sz-n-700"
          >
            {serverError}
          </div>
        )}

        <h2 className="mb-3 border-b border-sz-n-200 pb-2 text-[13px] font-semibold text-sz-n-900">
          반품 수취 주소
        </h2>

        <div className="grid grid-cols-2 gap-3">
          <Controller
            control={control}
            name="recipientName"
            rules={{
              required: "수취인 이름을 입력해 주세요.",
              validate: validateRecipientName,
            }}
            render={({ field }) => (
              <FormField
                label={
                  <>
                    수취인 이름
                    <Required />
                  </>
                }
                htmlFor="recipientName"
                error={errors.recipientName?.message}
              >
                <input
                  id="recipientName"
                  type="text"
                  placeholder="담당자 이름"
                  disabled={isSubmitting}
                  className={authInputClass(!!errors.recipientName)}
                  value={field.value}
                  onBlur={field.onBlur}
                  // 이모지·특수문자는 입력 즉시 걸러낸다
                  onChange={e =>
                    field.onChange(
                      e.target.value.replace(/[^가-힣a-zA-Z\s]/g, "")
                    )
                  }
                />
              </FormField>
            )}
          />

          <Controller
            control={control}
            name="contact"
            rules={{
              required: "수취인 연락처를 입력해 주세요.",
              validate: validateRecipientContact,
            }}
            render={({ field }) => (
              <FormField
                label={
                  <>
                    수취인 연락처
                    <Required />
                  </>
                }
                htmlFor="contact"
                error={errors.contact?.message}
              >
                <input
                  id="contact"
                  type="tel"
                  placeholder="'-' 포함 10~11자리 숫자"
                  disabled={isSubmitting}
                  className={authInputClass(!!errors.contact)}
                  value={field.value}
                  onBlur={field.onBlur}
                  onChange={e =>
                    field.onChange(e.target.value.replace(/[^0-9-]/g, ""))
                  }
                />
              </FormField>
            )}
          />
        </div>

        <Controller
          control={control}
          name="address"
          rules={{ required: "주소를 검색해 입력해 주세요." }}
          render={({ field }) => (
            <FormField
              label={
                <>
                  주소
                  <Required />
                </>
              }
              htmlFor="address"
              error={errors.address?.message}
            >
              <AddressField
                id="address"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                hasError={!!errors.address}
                placeholder="우편번호 검색"
                disabled={isSubmitting}
                onSearchClick={handleAddressSearch}
                readOnly
              />
            </FormField>
          )}
        />

        <Controller
          control={control}
          name="detailAddress"
          rules={{ required: "상세 주소를 입력해 주세요." }}
          render={({ field }) => (
            <FormField
              label={
                <>
                  상세 주소
                  <Required />
                </>
              }
              htmlFor="detailAddress"
              error={errors.detailAddress?.message}
              help={
                address ? undefined : "주소 검색 완료 후 입력할 수 있습니다."
              }
            >
              <input
                id="detailAddress"
                type="text"
                placeholder="상세 주소 입력"
                // 주소 검색 전에는 입력할 수 없다
                disabled={isSubmitting || !address}
                className={authInputClass(!!errors.detailAddress)}
                {...field}
              />
            </FormField>
          )}
        />

        <div className="my-5 h-px bg-sz-n-200" />

        <h2 className="mb-3 border-b border-sz-n-200 pb-2 text-[13px] font-semibold text-sz-n-900">
          배송·반품 정책
        </h2>

        <Controller
          control={control}
          name="defaultDeliveryFee"
          rules={{ required: "기본 배송비를 입력해 주세요." }}
          render={({ field }) => (
            <FormField
              label={
                <>
                  기본 배송비
                  <Required />
                </>
              }
              htmlFor="defaultDeliveryFee"
              error={errors.defaultDeliveryFee?.message}
            >
              <NumberField
                id="defaultDeliveryFee"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                hasError={!!errors.defaultDeliveryFee}
                placeholder="3000"
                disabled={isSubmitting}
                suffix="원"
              />
            </FormField>
          )}
        />

        <Controller
          control={control}
          name="freeShippingThreshold"
          render={({ field }) => (
            <FormField
              label={
                <>
                  무료배송 기준금액
                  <Optional />
                </>
              }
              htmlFor="freeShippingThreshold"
            >
              <NumberField
                id="freeShippingThreshold"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                placeholder="0"
                disabled={isSubmitting}
                suffix="원"
              />
            </FormField>
          )}
        />

        <Controller
          control={control}
          name="remoteAreaSurcharge"
          render={({ field }) => (
            <FormField
              label={
                <>
                  도서산간 추가비
                  <Optional />
                </>
              }
              htmlFor="remoteAreaSurcharge"
              help="미입력 시 0원으로 적용됩니다."
            >
              <NumberField
                id="remoteAreaSurcharge"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                placeholder="0"
                disabled={isSubmitting}
                suffix="원"
              />
            </FormField>
          )}
        />

        <Controller
          control={control}
          name="shippingLeadDays"
          rules={{
            required: "출고 소요일을 입력해 주세요.",
            // 서버가 @Min(1)이라 0을 보내면 거부된다
            validate: value =>
              Number(value) >= 1 || "출고 소요일은 1일 이상으로 입력해 주세요.",
          }}
          render={({ field }) => (
            <FormField
              label={
                <>
                  출고 소요일
                  <Required />
                </>
              }
              htmlFor="shippingLeadDays"
              error={errors.shippingLeadDays?.message}
              help="영업일 기준"
            >
              <NumberField
                id="shippingLeadDays"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                hasError={!!errors.shippingLeadDays}
                placeholder="3"
                disabled={isSubmitting}
                suffix="일"
              />
            </FormField>
          )}
        />

        <div className="grid grid-cols-2 gap-3">
          <Controller
            control={control}
            name="returnFee"
            rules={{ required: "반품비를 입력해 주세요." }}
            render={({ field }) => (
              <FormField
                label={
                  <>
                    반품비(회수비)
                    <Required />
                  </>
                }
                htmlFor="returnFee"
                error={errors.returnFee?.message}
              >
                <NumberField
                  id="returnFee"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  hasError={!!errors.returnFee}
                  disabled={isSubmitting}
                  suffix="원"
                />
              </FormField>
            )}
          />

          <Controller
            control={control}
            name="exchangeFee"
            rules={{ required: "교환비를 입력해 주세요." }}
            render={({ field }) => (
              <FormField
                label={
                  <>
                    교환비
                    <Required />
                  </>
                }
                htmlFor="exchangeFee"
                error={errors.exchangeFee?.message}
              >
                <NumberField
                  id="exchangeFee"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  hasError={!!errors.exchangeFee}
                  disabled={isSubmitting}
                  suffix="원"
                />
              </FormField>
            )}
          />
        </div>

        <NoticeBox className="mb-5">
          배송·반품 정책은 여기서 최초 설정한 뒤에도 <b>기본정보관리</b>에서
          계속 수정할 수 있어요. 수정하면 진행 중인 공동구매는 기존 값이 그대로
          유지되고, 새 값은 다음 결제부터 적용됩니다.
        </NoticeBox>

        <button
          type="submit"
          disabled={!isValid || isSubmitting}
          className={cn(
            "flex h-10 w-full items-center justify-center gap-2 rounded-[6px] text-[13px] font-medium transition-colors",
            !isValid || isSubmitting
              ? "cursor-not-allowed border border-sz-n-200 bg-sz-n-100 text-sz-n-400"
              : "bg-sz-auth-action text-white hover:bg-sz-auth-action-hover"
          )}
        >
          {isSubmitting && (
            <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/35 border-t-white" />
          )}
          시작하기
        </button>
      </form>
    </AuthShell>
  )
}
