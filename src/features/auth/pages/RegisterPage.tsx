import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  useForm,
  useController,
  type FieldPath,
  type RegisterOptions,
} from "react-hook-form"
import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AuthShell } from "@/common/components/Auth/AuthShell"
import { FormField } from "@/common/components/Auth/FormField"
import { PasswordInput } from "@/common/components/Auth/PasswordInput"
import { Stepper } from "@/common/components/Auth/Stepper"
import {
  TermsAgreement,
  type Term,
} from "@/common/components/Auth/TermsAgreement"
import { authInputClass } from "@/common/components/Auth/authStyles"
import { FileUploadField } from "@/features/auth/components/FileUploadField"
import { AddressField } from "@/features/auth/components/AddressField"
import { SplitNumberField } from "@/features/auth/components/SplitNumberField"
import {
  VALIDATION_RULES,
  BUSINESS_VALIDATION_RULES,
} from "@/features/auth/constants/validationRules"
import {
  authService,
  type BrandSignupPayload,
  type BusinessInfoData,
  type BusinessType,
  type RegisterData,
} from "@/features/auth/services/authService"
import { formatPhoneNumber } from "@/features/auth/utils/formatPhoneNumber"
import { loadDaumPostcode } from "@/features/auth/utils/loadDaumPostcode"

type SignupFormValues = RegisterData & BusinessInfoData
type FieldName = FieldPath<SignupFormValues>

const BUSINESS_TYPES: BusinessType[] = [
  "일반과세자",
  "간이과세자",
  "면세사업자",
  "법인 사업자",
]

// 셀렉트의 "미선택" 표시 옵션 값 — 고르면 빈 값("")으로 처리되어 required 오류가 뜬다.
// (Radix Select는 value=""인 SelectItem을 허용하지 않아 문자열 sentinel로 표현)
const BUSINESS_TYPE_PLACEHOLDER = "선택하세요"
const BANK_PLACEHOLDER = "은행 선택"

const BANKS = [
  "국민은행",
  "신한은행",
  "우리은행",
  "하나은행",
  "농협은행",
  "기업은행",
  "카카오뱅크",
  "토스뱅크",
  "케이뱅크",
  "SC제일은행",
  "씨티은행",
  "부산은행",
  "대구은행",
  "경남은행",
  "광주은행",
  "전북은행",
  "제주은행",
  "새마을금고",
  "신협",
  "우체국",
]

const STEP1_FIELDS: FieldName[] = [
  "email",
  "password",
  "passwordConfirm",
  "sellerName",
  "sellerContact",
  "marketName",
  "csNumber",
]

const STEP2_FIELDS: FieldName[] = [
  "businessType",
  "representativeName",
  "representativeContact",
  "companyName",
  "businessRegistrationNumber",
  "businessCondition",
  "businessAddress",
  "detailAddress",
  "taxEmail",
  "businessLicenseImageUrl",
  "mailOrderRegImageUrl",
  "mailOrderRegNumberYear",
  "mailOrderRegNumberRegion",
  "mailOrderRegNumberSeq",
  "bankName",
  "accountHolder",
  "accountNumber",
  "bankbookImageUrl",
]

const ALL_RULES: Record<string, RegisterOptions> = {
  ...VALIDATION_RULES,
  ...BUSINESS_VALIDATION_RULES,
}
const rule = <N extends FieldName>(name: N) =>
  ALL_RULES[name] as RegisterOptions<SignupFormValues, N>

const DEFAULT_VALUES: SignupFormValues = {
  email: "",
  password: "",
  passwordConfirm: "",
  sellerName: "",
  sellerContact: "",
  marketName: "",
  csNumber: "",
  businessType: "",
  representativeName: "",
  representativeContact: "",
  companyName: "",
  businessRegistrationNumber: "",
  businessCondition: "",
  businessAddress: "",
  detailAddress: "",
  taxEmail: "",
  businessLicenseImageUrl: "",
  mailOrderRegImageUrl: "",
  mailOrderRegNumberYear: "",
  mailOrderRegNumberRegion: "",
  mailOrderRegNumberSeq: "",
  bankName: "",
  accountHolder: "",
  accountNumber: "",
  bankbookImageUrl: "",
}

// 약관 정의(내용은 임시 문안 — 추후 실제 약관으로 교체)
const TERMS = [
  {
    key: "agreePrivacyPolicy",
    label: "개인정보처리방침",
    content: `(임시 문안) SHOWROOMZ 브랜드 파트너센터는 판매자 회원의 개인정보를 아래와 같이 처리합니다.

제1조(수집 항목)
- 필수: 이메일, 비밀번호, 담당자 이름·연락처, 사업자 정보, 정산 계좌 정보

제2조(이용 목적)
- 회원 가입 및 입점 심사, 정산, 고객 문의 대응

제3조(보유 기간)
- 회원 탈퇴 시까지. 단, 관계 법령에 따른 보존 의무가 있는 경우 해당 기간 동안 보관합니다.

※ 본 문안은 임시 예시이며 실제 약관으로 대체될 예정입니다.`,
  },
  {
    key: "agreeTermsOfService",
    label: "서비스 이용 약관",
    content: `(임시 문안) 본 약관은 SHOWROOMZ 브랜드 파트너센터 이용에 관한 조건과 절차를 규정합니다.

제1조(목적)
- 판매자와 회사 간의 권리·의무 및 책임사항을 정합니다.

제2조(계정)
- 판매자는 관리자 승인 후 파트너센터를 이용할 수 있습니다.

제3조(금지행위)
- 허위 정보 등록, 타인 명의 도용, 서비스 운영 방해 행위를 금지합니다.

※ 본 문안은 임시 예시이며 실제 약관으로 대체될 예정입니다.`,
  },
  {
    key: "agreeOperationPolicy",
    label: "서비스 운영정책",
    content: `(임시 문안) 본 정책은 원활한 서비스 운영을 위한 기준을 정합니다.

제1조(상품 등록)
- 상품 정보는 사실에 근거하여 정확히 등록해야 합니다.

제2조(배송·정산)
- 배송 및 정산은 회사가 정한 절차와 일정에 따릅니다.

제3조(제재)
- 정책 위반 시 노출 제한·이용 정지 등의 조치가 있을 수 있습니다.

※ 본 문안은 임시 예시이며 실제 약관으로 대체될 예정입니다.`,
  },
]

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h3 className="mb-3 border-b border-sz-n-200 pb-2 text-[13px] font-semibold text-sz-n-900">
    {children}
  </h3>
)

export default function RegisterPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<1 | 2 | 3 | "complete">(1)
  const [submitting, setSubmitting] = useState(false)
  const [isStepValid, setIsStepValid] = useState(false)
  const [interacted, setInteracted] = useState<Set<string>>(new Set())
  const [terms, setTerms] = useState<Record<string, boolean>>({})
  const [viewingTerm, setViewingTerm] = useState<(typeof TERMS)[number] | null>(
    null
  )
  const [completed, setCompleted] = useState<{
    marketName: string
    appliedAt: Date
  } | null>(null)

  // "보기" 버튼 → 약관 원문 모달 노출
  const termsWithView: Term[] = TERMS.map(t => ({
    key: t.key,
    label: t.label,
    onView: () => setViewingTerm(t),
  }))

  const {
    register,
    control,
    trigger,
    getValues,
    watch,
    formState: { errors, touchedFields },
  } = useForm<SignupFormValues>({
    mode: "onTouched",
    reValidateMode: "onChange",
    defaultValues: DEFAULT_VALUES,
  })

  const businessType = watch("businessType")
  const isSimplified = businessType === "간이과세자"
  const isCorporate = businessType === "법인 사업자"

  const markInteracted = (name: string) =>
    setInteracted(prev => {
      if (prev.has(name)) return prev
      const next = new Set(prev)
      next.add(name)
      return next
    })

  // ── 커스텀(비 blur) 필드 컨트롤러 ──
  const bizTypeCtl = useController({
    name: "businessType",
    control,
    rules: rule("businessType"),
  })
  const addressCtl = useController({
    name: "businessAddress",
    control,
    rules: rule("businessAddress"),
  })
  const licenseCtl = useController({
    name: "businessLicenseImageUrl",
    control,
    rules: rule("businessLicenseImageUrl"),
  })
  const mailImgCtl = useController({
    name: "mailOrderRegImageUrl",
    control,
    rules: rule("mailOrderRegImageUrl"),
  })
  const mailYearCtl = useController({
    name: "mailOrderRegNumberYear",
    control,
    rules: rule("mailOrderRegNumberYear"),
  })
  const mailRegionCtl = useController({
    name: "mailOrderRegNumberRegion",
    control,
    rules: rule("mailOrderRegNumberRegion"),
  })
  const mailSeqCtl = useController({
    name: "mailOrderRegNumberSeq",
    control,
    rules: rule("mailOrderRegNumberSeq"),
  })
  const bankCtl = useController({
    name: "bankName",
    control,
    rules: rule("bankName"),
  })
  const bankbookCtl = useController({
    name: "bankbookImageUrl",
    control,
    rules: rule("bankbookImageUrl"),
  })

  // ── 버튼 gating: 현재 스텝 필드가 모두 유효할 때만 활성 ──
  const values = watch()
  useEffect(() => {
    if (step !== 1 && step !== 2) return
    setIsStepValid(false)
    const fields = step === 1 ? STEP1_FIELDS : STEP2_FIELDS
    let cancelled = false
    const timer = setTimeout(async () => {
      const ok = await trigger(fields)
      if (!cancelled) setIsStepValid(ok)
    }, 300)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, JSON.stringify(values), trigger])

  const allTermsAgreed = TERMS.every(t => terms[t.key])

  const goNext = () => {
    if (step === 1) setStep(2)
    else if (step === 2) setStep(3)
  }
  const goPrev = () => {
    if (step === 1) navigate("/login")
    else if (step === 2) setStep(1)
    else if (step === 3) setStep(2)
  }

  // 사업장 주소 검색 — 앱과 동일한 Daum 우편번호 서비스(스크립트 로드 후 팝업).
  const handleAddressSearch = async () => {
    try {
      await loadDaumPostcode()
    } catch {
      return // 스크립트 로드 실패 시 조용히 무시(수동 입력 가능)
    }
    if (!window.daum?.Postcode) return
    new window.daum.Postcode({
      oncomplete: data => {
        // 앱 로직 동일: J=지번, R=도로명. (백엔드에 우편번호 필드 없어 zonecode 미저장)
        const addr =
          data.userSelectedType === "J" ? data.jibunAddress : data.roadAddress
        addressCtl.field.onChange(addr)
        markInteracted("businessAddress")
        document.getElementById("detailAddress")?.focus()
      },
    }).open()
  }

  const handleSubmitSignup = async () => {
    setSubmitting(true)
    const v = getValues()
    // 간이과세자는 통신판매업 신고 필드가 면제 대상 → 빈 문자열("") 대신 null로 전송.
    // 서버 @Pattern은 null은 통과시키지만 ""은 거부(연도 "^\d{4}$")하므로 이렇게 해야 제출됨.
    const isSimplifiedSubmit = v.businessType === "간이과세자"
    const payload: BrandSignupPayload = {
      ...v,
      businessType: v.businessType as BusinessType,
      sellerContact: formatPhoneNumber(v.sellerContact),
      representativeContact: formatPhoneNumber(v.representativeContact),
      // csNumber는 formatPhoneNumber 미적용 — 유선/안심번호 그룹핑을 망가뜨리므로
      // 입력값(이미 백엔드 형식으로 검증됨)을 그대로 전송.
      csNumber: v.csNumber,
      mailOrderRegImageUrl: isSimplifiedSubmit ? null : v.mailOrderRegImageUrl,
      mailOrderRegNumberYear: isSimplifiedSubmit
        ? null
        : v.mailOrderRegNumberYear,
      mailOrderRegNumberRegion: isSimplifiedSubmit
        ? null
        : v.mailOrderRegNumberRegion,
      mailOrderRegNumberSeq: isSimplifiedSubmit
        ? null
        : v.mailOrderRegNumberSeq,
      agreePrivacyPolicy: !!terms.agreePrivacyPolicy,
      agreeTermsOfService: !!terms.agreeTermsOfService,
      agreeOperationPolicy: !!terms.agreeOperationPolicy,
    }
    try {
      await authService.submitBrandSignup(payload)
      setCompleted({ marketName: v.marketName, appliedAt: new Date() })
      setStep("complete")
    } catch {
      // 서버 에러 메시지는 authInstance 인터셉터가 토스트로 노출
      setSubmitting(false)
    }
  }

  // ── 텍스트 필드 렌더 헬퍼(register 기반, blur 타이밍) ──
  const renderText = (
    name: FieldName,
    label: string,
    opts?: {
      type?: string
      inputMode?: "text" | "numeric" | "tel" | "email"
      placeholder?: string
      help?: string
    }
  ) => {
    const err = errors[name]?.message as string | undefined
    const show = !!touchedFields[name]
    return (
      <FormField
        label={label}
        htmlFor={name}
        error={err}
        showError={show}
        help={opts?.help}
      >
        <input
          id={name}
          type={opts?.type ?? "text"}
          inputMode={opts?.inputMode}
          placeholder={opts?.placeholder}
          disabled={submitting}
          className={authInputClass(show && !!err)}
          {...register(name, rule(name))}
        />
      </FormField>
    )
  }

  const renderPassword = (
    name: FieldName,
    label: string,
    placeholder: string
  ) => {
    const err = errors[name]?.message as string | undefined
    const show = !!touchedFields[name]
    return (
      <FormField label={label} htmlFor={name} error={err} showError={show}>
        <PasswordInput
          id={name}
          placeholder={placeholder}
          hasError={show && !!err}
          disabled={submitting}
          {...register(name, rule(name))}
        />
      </FormField>
    )
  }

  const stepper = (
    <Stepper
      steps={["기본 정보", "사업자 정보", "완료"]}
      current={step === "complete" ? 2 : step - 1}
    />
  )

  const btnPrimary = (
    label: string,
    onClick: () => void,
    disabled: boolean,
    loading = false,
    loadingLabel = "제출 중"
  ) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        "flex h-10 flex-1 items-center justify-center gap-2 rounded-[6px] text-[13px] font-medium transition-colors",
        loading
          ? "cursor-progress bg-sz-n-700 text-white"
          : disabled
            ? "cursor-not-allowed bg-sz-n-100 text-sz-n-400"
            : "bg-sz-auth-action text-white hover:bg-sz-auth-action-hover"
      )}
    >
      {loading && (
        <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/35 border-t-white" />
      )}
      {loading ? loadingLabel : label}
    </button>
  )

  const btnLine = (label: string, onClick: () => void) => (
    <button
      type="button"
      onClick={onClick}
      disabled={submitting}
      className="h-10 flex-[0_0_120px] rounded-[6px] border border-sz-n-300 bg-white text-[13px] font-medium text-sz-n-700 hover:enabled:bg-sz-n-100 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {label}
    </button>
  )

  // ── 완료(E) ──
  if (step === "complete" && completed) {
    return (
      <AuthShell
        width={480}
        subtitle="브랜드 파트너센터 · 입점 신청"
        align="top"
      >
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-sz-success-bg text-2xl text-sz-success-text">
            ✓
          </div>
          <div className="mb-2 text-[16px] font-semibold text-sz-n-900">
            입점 신청이 완료되었습니다
          </div>
          <div className="mb-5 text-[12px] leading-relaxed text-sz-n-600">
            신청서가 정상적으로 접수되었습니다.
            <br />
            검토 후 영업일 기준 3~5일 이내에 등록하신 이메일로 결과를 안내해
            드립니다.
          </div>
          <div className="mb-5 overflow-hidden rounded-[6px] border border-sz-n-200 text-left">
            <InfoRow label="브랜드명" value={completed.marketName} />
            <InfoRow
              label="신청 일시"
              value={completed.appliedAt.toLocaleString("ko-KR")}
            />
            <InfoRow label="결과 안내" value="가입 시 등록한 이메일" />
            <InfoRow label="처리 예상" value="영업일 기준 3~5일 이내" />
          </div>
          <div className="mb-5 flex gap-2 rounded-[6px] bg-sz-info-bg px-3.5 py-3 text-left text-[12px] leading-relaxed text-sz-n-700">
            <span className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-sz-info-text text-[10px] font-bold text-white">
              i
            </span>
            <span>
              심사 결과는 <b>이메일·문자</b>로 안내합니다. 승인 완료 후
              파트너센터에서 상품 등록·운영을 시작할 수 있습니다.
            </span>
          </div>
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="h-10 w-full rounded-[6px] bg-sz-auth-action text-[13px] font-medium text-white hover:bg-sz-auth-action-hover"
          >
            로그인으로 이동
          </button>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell width={480} subtitle="브랜드 파트너센터 · 입점 신청" align="top">
      {stepper}
      <form onSubmit={e => e.preventDefault()} noValidate>
        {/* ── Step 1 ── */}
        {step === 1 && (
          <>
            <SectionTitle>계정 정보</SectionTitle>
            {renderText("email", "이메일", {
              type: "email",
              placeholder: "brand@example.com",
            })}
            {renderPassword(
              "password",
              "비밀번호",
              "8~16자 영문·숫자·특수문자 조합"
            )}
            {renderPassword(
              "passwordConfirm",
              "비밀번호 재입력",
              "비밀번호를 다시 입력하세요"
            )}

            <div className="mt-6" />
            <SectionTitle>브랜드 담당자 정보</SectionTitle>
            {renderText("sellerName", "판매 담당자 이름", {
              placeholder: "담당자 이름",
            })}
            {renderText("sellerContact", "판매 담당자 연락처", {
              type: "tel",
              inputMode: "tel",
              placeholder: "010-0000-0000 ('-' 포함)",
            })}

            <div className="mt-6" />
            <SectionTitle>브랜드 정보</SectionTitle>
            {renderText("marketName", "브랜드명", {
              placeholder: "공백·특수문자 제외",
            })}
            {renderText("csNumber", "고객센터 전화번호", {
              type: "tel",
              inputMode: "tel",
              placeholder: "'-' 포함 8~12자리 숫자",
              help: "소비자 앱 상세에 노출됩니다. 존재하지 않는 번호 입력 시 서비스 이용이 제한될 수 있습니다.",
            })}

            <div className="mt-6 flex gap-2.5">
              {btnLine("취소", goPrev)}
              {btnPrimary("다음", goNext, !isStepValid)}
            </div>
          </>
        )}

        {/* ── Step 2 ── */}
        {step === 2 && (
          <>
            <SectionTitle>사업자 유형</SectionTitle>
            <FormField
              label="사업자 구분"
              error={bizTypeCtl.fieldState.error?.message}
              showError={interacted.has("businessType")}
            >
              <Select
                // 항상 controlled 유지: 빈 값이면 sentinel을 표시(undefined 전달 시
                // Radix가 uncontrolled로 전환돼 표시/값이 어긋나는 버그 방지)
                value={bizTypeCtl.field.value || BUSINESS_TYPE_PLACEHOLDER}
                onValueChange={v => {
                  // "선택하세요"를 고르면 미선택("")으로 처리 → required 오류 노출
                  bizTypeCtl.field.onChange(
                    v === BUSINESS_TYPE_PLACEHOLDER ? "" : v
                  )
                  markInteracted("businessType")
                }}
                // 값 선택 없이 열었다 닫아도 required 오류가 뜨도록 닫힘 시점에 마킹
                onOpenChange={open => {
                  if (!open) markInteracted("businessType")
                }}
                disabled={submitting}
              >
                <SelectTrigger
                  className={authInputClass(
                    interacted.has("businessType") &&
                      !!bizTypeCtl.fieldState.error,
                    cn(
                      "font-normal",
                      !bizTypeCtl.field.value && "text-sz-n-400"
                    )
                  )}
                >
                  <SelectValue placeholder={BUSINESS_TYPE_PLACEHOLDER} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={BUSINESS_TYPE_PLACEHOLDER}>
                    {BUSINESS_TYPE_PLACEHOLDER}
                  </SelectItem>
                  {BUSINESS_TYPES.map(t => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <div className="mt-6" />
            <SectionTitle>사업자 정보</SectionTitle>
            {renderText("representativeName", "대표자명", {
              placeholder: "공동대표는 쉼표로 나열",
            })}
            {renderText("representativeContact", "대표자 연락처", {
              type: "tel",
              inputMode: "tel",
              placeholder: "010-0000-0000",
            })}
            {renderText("companyName", "사업자등록증 상호명", {
              placeholder: "사업자등록증 상 상호명",
            })}
            {renderText("businessRegistrationNumber", "사업자등록번호", {
              placeholder: "000-00-00000",
            })}
            {renderText("businessCondition", "업태", {
              placeholder: "사업자등록증 대표 업태 한 가지",
            })}

            <FormField
              label="사업장 주소"
              error={addressCtl.fieldState.error?.message}
              showError={interacted.has("businessAddress")}
            >
              <AddressField
                id="businessAddress"
                value={addressCtl.field.value}
                onChange={v => {
                  addressCtl.field.onChange(v)
                  markInteracted("businessAddress")
                }}
                // 빈 값으로 포커스만 했다 이탈해도 required 오류가 뜨도록 마킹
                onBlur={() => {
                  addressCtl.field.onBlur()
                  markInteracted("businessAddress")
                }}
                onSearchClick={handleAddressSearch}
                hasError={
                  interacted.has("businessAddress") &&
                  !!addressCtl.fieldState.error
                }
                placeholder="사업자등록증 기재 주소"
                disabled={submitting}
              />
            </FormField>
            {renderText("detailAddress", "상세주소", {
              placeholder: "상세주소",
            })}
            {renderText("taxEmail", "이메일 (tax 확인용)", {
              type: "email",
              placeholder: "세금계산서·정산 확인용 메일 주소",
            })}

            <FileUploadField
              label="사업자등록증 사본"
              value={licenseCtl.field.value}
              onChange={url => {
                licenseCtl.field.onChange(url)
                markInteracted("businessLicenseImageUrl")
              }}
              onInteract={() => markInteracted("businessLicenseImageUrl")}
              error={licenseCtl.fieldState.error?.message}
              showError={interacted.has("businessLicenseImageUrl")}
              disabled={submitting}
            />
            {isSimplified && (
              <div className="mb-4 flex gap-2 rounded-[6px] bg-sz-info-bg px-3 py-2.5 text-[11px] leading-relaxed text-sz-n-700">
                <span>ⓘ</span>
                <span>
                  <b>간이과세자</b>는 통신판매업 신고 면제 대상 → 신고증
                  사본·신고번호 <b>유효성 검사 제외</b>. 미첨부 상태로 다음 단계
                  진행이 가능합니다.
                </span>
              </div>
            )}

            <FileUploadField
              label="통신판매업신고증 사본"
              value={mailImgCtl.field.value}
              onChange={url => {
                mailImgCtl.field.onChange(url)
                markInteracted("mailOrderRegImageUrl")
              }}
              onInteract={() => markInteracted("mailOrderRegImageUrl")}
              error={mailImgCtl.fieldState.error?.message}
              showError={interacted.has("mailOrderRegImageUrl")}
              exempt={isSimplified}
              exemptHint="간이과세자 — 첨부 불필요"
              disabled={submitting}
            />

            <div className="mt-6" />
            <SectionTitle>통신판매업신고번호</SectionTitle>
            <div className="mb-4">
              <SplitNumberField
                year={mailYearCtl.field.value}
                region={mailRegionCtl.field.value}
                seq={mailSeqCtl.field.value}
                onYearChange={v => {
                  mailYearCtl.field.onChange(v)
                  markInteracted("mailOrderRegNumber")
                }}
                onRegionChange={v => {
                  mailRegionCtl.field.onChange(v)
                  markInteracted("mailOrderRegNumber")
                }}
                onSeqChange={v => {
                  mailSeqCtl.field.onChange(v)
                  markInteracted("mailOrderRegNumber")
                }}
                exempt={isSimplified}
                disabled={submitting}
                hasError={
                  interacted.has("mailOrderRegNumber") &&
                  !!(
                    mailYearCtl.fieldState.error ||
                    mailRegionCtl.fieldState.error ||
                    mailSeqCtl.fieldState.error
                  )
                }
              />
              {isSimplified ? (
                <p className="mt-1.5 text-[11px] text-sz-n-500">
                  간이과세자 — 기재 불필요 (유효성 검사 제외)
                </p>
              ) : (
                interacted.has("mailOrderRegNumber") &&
                (mailYearCtl.fieldState.error ||
                  mailRegionCtl.fieldState.error ||
                  mailSeqCtl.fieldState.error) && (
                  <p
                    role="alert"
                    className="mt-1.5 text-[12px] text-sz-danger-text"
                  >
                    {mailYearCtl.fieldState.error?.message ||
                      mailRegionCtl.fieldState.error?.message ||
                      mailSeqCtl.fieldState.error?.message}
                  </p>
                )
              )}
            </div>

            <div className="mt-6" />
            <SectionTitle>정산 정보</SectionTitle>
            {isCorporate && (
              <div className="mb-4 flex gap-2 rounded-[6px] bg-sz-warning-bg px-3 py-2.5 text-[11px] font-medium leading-relaxed text-sz-warning-text">
                <span>⚠</span>
                <span>
                  법인 사업자는 반드시 <b>법인 명의 계좌</b>만 등록 가능합니다.
                </span>
              </div>
            )}
            <FormField
              label="은행명"
              error={bankCtl.fieldState.error?.message}
              showError={interacted.has("bankName")}
            >
              <Select
                // 항상 controlled 유지: 빈 값이면 sentinel을 표시(undefined 전달 시
                // Radix가 uncontrolled로 전환돼 표시/값이 어긋나는 버그 방지)
                value={bankCtl.field.value || BANK_PLACEHOLDER}
                onValueChange={v => {
                  // "은행 선택"을 고르면 미선택("")으로 처리 → required 오류 노출
                  bankCtl.field.onChange(v === BANK_PLACEHOLDER ? "" : v)
                  markInteracted("bankName")
                }}
                // 값 선택 없이 열었다 닫아도 required 오류가 뜨도록 닫힘 시점에 마킹
                onOpenChange={open => {
                  if (!open) markInteracted("bankName")
                }}
                disabled={submitting}
              >
                <SelectTrigger
                  className={authInputClass(
                    interacted.has("bankName") && !!bankCtl.fieldState.error,
                    cn("font-normal", !bankCtl.field.value && "text-sz-n-400")
                  )}
                >
                  <SelectValue placeholder="은행 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={BANK_PLACEHOLDER}>
                    {BANK_PLACEHOLDER}
                  </SelectItem>
                  {BANKS.map(b => (
                    <SelectItem key={b} value={b}>
                      {b}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            {renderText("accountHolder", "예금주명", {
              placeholder: isCorporate
                ? "법인 명의 예금주명을 입력해 주세요"
                : "예금주명을 입력해 주세요",
            })}
            {renderText("accountNumber", "계좌번호", {
              placeholder: "'-' 포함 입력",
            })}
            <FileUploadField
              label="통장 사본"
              value={bankbookCtl.field.value}
              onChange={url => {
                bankbookCtl.field.onChange(url)
                markInteracted("bankbookImageUrl")
              }}
              onInteract={() => markInteracted("bankbookImageUrl")}
              error={bankbookCtl.fieldState.error?.message}
              showError={interacted.has("bankbookImageUrl")}
              disabled={submitting}
            />

            <div className="mt-6 flex gap-2.5">
              {btnLine("이전", goPrev)}
              {btnPrimary("다음", goNext, !isStepValid)}
            </div>
          </>
        )}

        {/* ── Step 3 ── */}
        {step === 3 && (
          <>
            <TermsAgreement
              terms={termsWithView}
              checked={terms}
              onChange={setTerms}
            />
            <div className="mt-6 flex gap-2.5">
              {btnLine("이전", goPrev)}
              {btnPrimary(
                "신청하기",
                handleSubmitSignup,
                !allTermsAgreed,
                submitting
              )}
            </div>
          </>
        )}
      </form>

      {/* 약관 원문 보기 모달 */}
      {viewingTerm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setViewingTerm(null)}
        >
          <div
            className="flex max-h-[80vh] w-full max-w-[480px] flex-col overflow-hidden rounded-[8px] bg-white shadow-lg"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-sz-n-200 px-5 py-3.5">
              <h3 className="text-[14px] font-semibold text-sz-n-900">
                {viewingTerm.label}
              </h3>
              <button
                type="button"
                onClick={() => setViewingTerm(null)}
                aria-label="닫기"
                className="flex h-7 w-7 items-center justify-center rounded text-sz-n-500 hover:bg-sz-n-100 hover:text-sz-n-900"
              >
                ✕
              </button>
            </div>
            <div className="overflow-y-auto whitespace-pre-line px-5 py-4 text-[13px] leading-relaxed text-sz-n-700">
              {viewingTerm.content}
            </div>
            <div className="border-t border-sz-n-200 px-5 py-3">
              <button
                type="button"
                onClick={() => setViewingTerm(null)}
                className="h-10 w-full rounded-[6px] bg-sz-auth-action text-[13px] font-medium text-white hover:bg-sz-auth-action-hover"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthShell>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-sz-n-100 px-4 py-2.5 last:border-b-0">
      <span className="text-[12px] text-sz-n-500">{label}</span>
      <span className="text-[12px] font-medium text-sz-n-900">{value}</span>
    </div>
  )
}
