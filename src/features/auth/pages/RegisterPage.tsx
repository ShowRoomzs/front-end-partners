import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, type RegisterOptions } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

import { VALIDATION_RULES } from '../constants/validationRules'
import {
  authService,
  type RegisterData,
} from '@/features/auth/services/authService'
import { formatPhoneNumber } from '@/features/auth/utils/formatPhoneNumber'
import { useCookie } from '@/common/hooks/useCookie'
import { COOKIE_NAME } from '@/common/constants'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)
  const [, setAccessToken] = useCookie<string>(COOKIE_NAME.ACCESS_TOKEN)
  const [, setRefreshToken] = useCookie<string>(COOKIE_NAME.REFRESH_TOKEN)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    getValues,
  } = useForm<RegisterData>({
    mode: 'onChange',
    reValidateMode: 'onChange',
  })

  const onSubmit = async () => {
    const formData = getValues()
    const body: RegisterData = {
      ...formData,
      sellerContact: formatPhoneNumber(formData.sellerContact),
      csNumber: formatPhoneNumber(formData.csNumber),
    }
    const res = await authService.register(body)
    const { accessToken, refreshToken } = res
    if (accessToken && refreshToken) {
      setAccessToken(accessToken)
      setRefreshToken(refreshToken)
      navigate('/')
    }
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              이메일
            </label>
            <Input
              type="email"
              placeholder="이메일"
              {...register(
                'email',
                VALIDATION_RULES.email as RegisterOptions<RegisterData, 'email'>
              )}
              className={errors.email ? 'border-red-500' : ''}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-500">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              비밀번호 (8~16자 이내의 영문자, 숫자, 특수문자 조합)
            </label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="비밀번호 (8~16자 이내의 영문자, 숫자, 특수문자 조합)"
                {...register(
                  'password',
                  VALIDATION_RULES.password as RegisterOptions<
                    RegisterData,
                    'password'
                  >
                )}
                className={errors.password ? 'border-red-500 pr-10' : 'pr-10'}
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              비밀번호 재입력
            </label>
            <div className="relative">
              <Input
                type={showPasswordConfirm ? 'text' : 'password'}
                placeholder="비밀번호 재입력"
                {...register(
                  'passwordConfirm',
                  VALIDATION_RULES.passwordConfirm as RegisterOptions<
                    RegisterData,
                    'passwordConfirm'
                  >
                )}
                className={
                  errors.passwordConfirm ? 'border-red-500 pr-10' : 'pr-10'
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              판매 담당자 이름
            </label>
            <Input
              type="text"
              placeholder="판매 담당자 이름"
              {...register(
                'sellerName',
                VALIDATION_RULES.sellerName as RegisterOptions<
                  RegisterData,
                  'sellerName'
                >
              )}
              className={errors.sellerName ? 'border-red-500' : ''}
            />
            {errors.sellerName && (
              <p className="mt-1 text-sm text-red-500">
                {errors.sellerName.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              판매 담당자 연락처 (문자 수신 가능한 핸드폰 번호)
            </label>
            <Input
              type="tel"
              placeholder="판매 담당자 연락처 (문자 수신 가능한 핸드폰 번호)"
              {...register(
                'sellerContact',
                VALIDATION_RULES.sellerContact as RegisterOptions<
                  RegisterData,
                  'sellerContact'
                >
              )}
              className={errors.sellerContact ? 'border-red-500' : ''}
            />
            {errors.sellerContact && (
              <p className="mt-1 text-sm text-red-500">
                {errors.sellerContact.message}
              </p>
            )}
          </div>

          <h2 className="text-2xl font-bold mt-10 mb-8">마켓 정보</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              마켓명 (공백, 특수문자, 한/영 혼용 사용불가)
            </label>
            <Input
              type="text"
              placeholder="마켓명 (공백, 특수문자, 한/영 혼용 사용불가)"
              {...register(
                'marketName',
                VALIDATION_RULES.marketName as RegisterOptions<
                  RegisterData,
                  'marketName'
                >
              )}
              className={errors.marketName ? 'border-red-500' : ''}
            />
            {errors.marketName && (
              <p className="mt-1 text-sm text-red-500">
                {errors.marketName.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              고객센터 전화번호(존재하지 않는 번호 입력 시, 서비스 이용 제한)
            </label>
            <Input
              type="tel"
              placeholder="고객센터 전화번호(존재하지 않는 번호 입력 시, 서비스 이용 제한)"
              {...register(
                'csNumber',
                VALIDATION_RULES.csNumber as RegisterOptions<
                  RegisterData,
                  'csNumber'
                >
              )}
              className={errors.csNumber ? 'border-red-500' : ''}
            />
            {errors.csNumber && (
              <p className="mt-1 text-sm text-red-500">
                {errors.csNumber.message}
              </p>
            )}
          </div>

          <div className="flex gap-4 pt-8">
            <Button
              type="button"
              variant="outline"
              className="flex-1 h-12"
              onClick={() => navigate('/login')}
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
                '다음'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
