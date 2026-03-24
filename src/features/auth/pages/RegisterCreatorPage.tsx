import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useForm, Controller, type RegisterOptions } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { CREATOR_VALIDATION_RULES } from "../constants/validationRules"
import {
  authService,
  type CreatorRegisterData,
} from "@/features/auth/services/authService"
import { formatPhoneNumber } from "@/features/auth/utils/formatPhoneNumber"
import toast from "react-hot-toast"

const SNS_OPTIONS: { value: CreatorRegisterData["snsType"]; label: string }[] =
  [
    { value: "INSTAGRAM", label: "Instagram" },
    { value: "YOUTUBE", label: "YouTube" },
    { value: "X", label: "X (Twitter)" },
    { value: "TIKTOK", label: "TikTok" },
  ]

export default function RegisterCreatorPage() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    getValues,
  } = useForm<CreatorRegisterData>({
    mode: "onChange",
    reValidateMode: "onChange",
  })

  const onSubmit = async () => {
    const formData = getValues()
    const body: CreatorRegisterData = {
      ...formData,
      sellerContact: formatPhoneNumber(formData.sellerContact),
    }
    const res = await authService.creatorRegister(body)
    toast.success(res.message)
    navigate("/")
  }

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-12">
      <div className="flex items-center">
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center text-sm font-medium">
            1
          </div>
          <span className="mt-2 text-sm font-medium text-black">기본 정보</span>
        </div>
        <div className="w-32 h-px bg-gray-300 mx-4" />
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 rounded-full border-2 border-gray-300 bg-white text-gray-400 flex items-center justify-center text-sm font-medium">
            2
          </div>
          <span className="mt-2 text-sm text-gray-400">사업자 정보</span>
        </div>
        <div className="w-32 h-px bg-gray-300 mx-4" />
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 rounded-full border-2 border-gray-300 bg-white text-gray-400 flex items-center justify-center text-sm font-medium">
            3
          </div>
          <span className="mt-2 text-sm text-gray-400">완료</span>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-white py-12">
      <div className="max-w-3xl mx-auto px-8">
        {renderStepIndicator()}

        <h2 className="text-2xl font-bold mb-8">계정 정보</h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <Input
              type="email"
              placeholder="이메일"
              {...register(
                "email",
                CREATOR_VALIDATION_RULES.email as RegisterOptions<
                  CreatorRegisterData,
                  "email"
                >
              )}
              className={errors.email ? "border-red-500" : ""}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-500">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="비밀번호 (8~16자 이내의 영문자, 숫자, 특수문자 조합)"
                {...register(
                  "password",
                  CREATOR_VALIDATION_RULES.password as RegisterOptions<
                    CreatorRegisterData,
                    "password"
                  >
                )}
                className={errors.password ? "border-red-500 pr-10" : "pr-10"}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-500">
                {errors.password.message}
              </p>
            )}
          </div>

          <div>
            <div className="relative">
              <Input
                type={showPasswordConfirm ? "text" : "password"}
                placeholder="비밀번호 재입력"
                {...register(
                  "passwordConfirm",
                  CREATOR_VALIDATION_RULES.passwordConfirm as RegisterOptions<
                    CreatorRegisterData,
                    "passwordConfirm"
                  >
                )}
                className={
                  errors.passwordConfirm ? "border-red-500 pr-10" : "pr-10"
                }
              />
              <button
                type="button"
                onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPasswordConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.passwordConfirm && (
              <p className="mt-1 text-sm text-red-500">
                {errors.passwordConfirm.message}
              </p>
            )}
          </div>

          <h2 className="text-2xl font-bold mt-10 mb-8">셀러 정보</h2>

          <div>
            <Input
              type="text"
              placeholder="마켓명 (공백, 특수문자, 한/영 혼용 사용불가)"
              {...register(
                "marketName",
                CREATOR_VALIDATION_RULES.marketName as RegisterOptions<
                  CreatorRegisterData,
                  "marketName"
                >
              )}
              className={errors.marketName ? "border-red-500" : ""}
            />
            {errors.marketName && (
              <p className="mt-1 text-sm text-red-500">
                {errors.marketName.message}
              </p>
            )}
          </div>

          <div>
            <Controller
              name="snsType"
              control={control}
              rules={
                CREATOR_VALIDATION_RULES.snsType as RegisterOptions<
                  CreatorRegisterData,
                  "snsType"
                >
              }
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger
                    className={`w-full h-10 ${errors.snsType ? "border-red-500" : ""}`}
                  >
                    <SelectValue placeholder="현재 팔로워가 가장 많은 플랫폼을 선택해 주세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {SNS_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.snsType && (
              <p className="mt-1 text-sm text-red-500">
                {errors.snsType.message}
              </p>
            )}
          </div>

          <div>
            <Input
              type="text"
              placeholder="활동명을 입력해주세요"
              {...register(
                "activityName",
                CREATOR_VALIDATION_RULES.activityName as RegisterOptions<
                  CreatorRegisterData,
                  "activityName"
                >
              )}
              className={errors.activityName ? "border-red-500" : ""}
            />
            {errors.activityName && (
              <p className="mt-1 text-sm text-red-500">
                {errors.activityName.message}
              </p>
            )}
          </div>

          <div>
            <Input
              type="url"
              placeholder="사이트를 입력해주세요"
              {...register(
                "snsUrl",
                CREATOR_VALIDATION_RULES.snsUrl as RegisterOptions<
                  CreatorRegisterData,
                  "snsUrl"
                >
              )}
              className={errors.snsUrl ? "border-red-500" : ""}
            />
            {errors.snsUrl && (
              <p className="mt-1 text-sm text-red-500">
                {errors.snsUrl.message}
              </p>
            )}
          </div>

          <div>
            <Input
              type="text"
              placeholder="크리에이터 이름(닉네임)"
              {...register(
                "sellerName",
                CREATOR_VALIDATION_RULES.sellerName as RegisterOptions<
                  CreatorRegisterData,
                  "sellerName"
                >
              )}
              className={errors.sellerName ? "border-red-500" : ""}
            />
            {errors.sellerName && (
              <p className="mt-1 text-sm text-red-500">
                {errors.sellerName.message}
              </p>
            )}
          </div>

          <div>
            <Input
              type="tel"
              placeholder="크리에이터 연락처(문자 수신 가능한 핸드폰 번호)"
              {...register(
                "sellerContact",
                CREATOR_VALIDATION_RULES.sellerContact as RegisterOptions<
                  CreatorRegisterData,
                  "sellerContact"
                >
              )}
              className={errors.sellerContact ? "border-red-500" : ""}
            />
            {errors.sellerContact && (
              <p className="mt-1 text-sm text-red-500">
                {errors.sellerContact.message}
              </p>
            )}
          </div>

          <div className="flex gap-4 pt-8">
            <Button
              type="button"
              variant="outline"
              className="flex-1 h-12"
              onClick={() => navigate("/register")}
            >
              이전
            </Button>
            <Button
              type="submit"
              disabled={Object.keys(errors).length > 0 || isSubmitting}
              className="flex-1 h-12 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  검증 중...
                </>
              ) : (
                "다음"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
