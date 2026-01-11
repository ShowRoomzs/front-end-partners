import { ProfileImageUploader } from "@/common/components"
import FormInput from "@/common/components/Form/FormInput"
import FormItem from "@/common/components/Form/FormItem"
import FormSelect from "@/common/components/Form/FormSelect"
import FormDisplay from "@/common/components/Form/FormDisplay"
import Section from "@/common/components/Section/Section"
import { marketService } from "@/common/services/marketService"
import { Button } from "@/components/ui/button"
import { useGetMarketInfo } from "@/features/auth/hooks/useGetMarketInfo"
import type { MarketInfo, SnsType } from "@/features/auth/services/authService"
import { useCallback, useEffect, useMemo, useState } from "react"
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form"
import { useGetCategory } from "@/common/hooks/useGetCategory"
import { PlusIcon, X } from "lucide-react"
import toast from "react-hot-toast"
import equal from "fast-deep-equal"
import { queryClient } from "@/common/lib/queryClient"
import { QUERY_KEYS } from "@/common/constants/queryKeys"

const SNS_TYPE_OPTIONS = [
  { label: "인스타그램", value: "INSTAGRAM" },
  { label: "유튜브", value: "YOUTUBE" },
]

export default function BasicManagement() {
  const { data: marketInfo } = useGetMarketInfo()
  const { categoryMap } = useGetCategory()
  const { control, reset, setError, clearErrors, handleSubmit, formState } =
    useForm<MarketInfo>({
      defaultValues: marketInfo,
    })
  const { fields, append, remove } = useFieldArray({
    control,
    name: "snsLinks",
  })
  const [successMessage, setSuccessMessage] = useState<string>()

  const marketName = useWatch({ control, name: "marketName" })
  const marketDescription = useWatch({ control, name: "marketDescription" })
  const formData = useWatch({ control })

  const categoryOptions = useMemo(() => {
    if (!categoryMap) return []
    return categoryMap.mainCategories.map(cat => ({
      label: cat.name,
      value: String(cat.categoryId),
    }))
  }, [categoryMap])

  useEffect(() => {
    if (marketInfo) {
      reset(marketInfo)
    }
  }, [marketInfo, reset])

  const onSubmit = useCallback(async (data: MarketInfo) => {
    await marketService.updateMarketInfo(data)
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.MARKET_INFO] })
    setSuccessMessage(undefined)
    toast.success("마켓 정보가 수정되었습니다.")
  }, [])

  const handleClickCheckDuplicate = useCallback(async () => {
    const { available } =
      await marketService.checkMarketNameDuplicate(marketName)

    if (!available) {
      setError("marketName", {
        type: "duplicate",
        message: "이미 사용중인 마켓명입니다.",
      })
      setSuccessMessage(undefined)
    } else {
      clearErrors("marketName")
      setSuccessMessage("사용 가능한 마켓명입니다.")
    }
  }, [marketName, setError, clearErrors])

  const isEnabled = useMemo(() => {
    if (!marketInfo || !formData) return false

    const isMarketNameChanged = marketInfo.marketName !== marketName
    const isDuplicateChecked = isMarketNameChanged ? !!successMessage : true

    return (
      formState.isValid && !equal(marketInfo, formData) && isDuplicateChecked
    )
  }, [formState.isValid, marketInfo, formData, marketName, successMessage])

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      onKeyDown={e => {
        if (e.key === "Enter") {
          e.preventDefault()
        }
      }}
    >
      <Section>
        <Controller
          control={control}
          name="marketName"
          rules={{
            required: "마켓명을 입력해주세요.",
            pattern: {
              value: /^[a-zA-Z가-힣0-9]+$/,
              message: "공백, 특수문자, 한/영 혼용 사용불가",
            },
          }}
          render={({ field, fieldState }) => (
            <FormItem
              label="마켓명"
              required
              error={fieldState.error?.message}
              success={successMessage}
            >
              <div className="flex flex-row gap-4 items-center">
                <FormInput
                  value={field.value}
                  onChange={e => {
                    field.onChange(e)
                    if (fieldState.error?.type === "duplicate") {
                      clearErrors("marketName")
                    }
                    if (successMessage) {
                      setSuccessMessage(undefined)
                    }
                  }}
                  onBlur={field.onBlur}
                />
                <Button
                  type="button"
                  onClick={handleClickCheckDuplicate}
                  variant="outline"
                  disabled={marketInfo?.marketName === field.value}
                >
                  중복확인
                </Button>
              </div>
            </FormItem>
          )}
        />
        <Controller
          control={control}
          name="marketImageUrl"
          render={({ field, fieldState }) => (
            <FormItem
              label="마켓 대표 이미지"
              error={fieldState.error?.message}
            >
              <ProfileImageUploader
                type="MARKET"
                value={field.value}
                onImageChange={field.onChange}
                accept=".jpg, .jpeg, .png, .gif"
                maxStorage={20480}
                recommendSize={{ width: 1300, height: 1300 }}
                additionalInfoText="이미지 신규등록수정은 담당 부서의 검수가 완료되어야 변경 됩니다.(영업일 기준 1~2일 소요)
마켓 대표 이미지는 마켓  프로필 화면과 네이버 쇼핑검색 시 노출 됩니다 상세한 노출 위치는 도움말을 확인해 주세요.  "
              />
            </FormItem>
          )}
        />

        <Controller
          control={control}
          name="marketDescription"
          rules={{
            maxLength: {
              value: 30,
              message: "최대 30자까지 입력 가능합니다.",
            },
          }}
          render={({ field, fieldState }) => (
            <FormItem label="마켓 소개" error={fieldState.error?.message}>
              <div className="relative">
                <FormInput
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  placeholder="마켓 소개를 입력하세요"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                  {marketDescription?.length || 0}/30
                </div>
              </div>
            </FormItem>
          )}
        />

        <Controller
          control={control}
          name="marketUrl"
          render={({ field }) => (
            <FormItem label="마켓 URL" required>
              <FormDisplay value={field.value || ""} />
            </FormItem>
          )}
        />

        <Controller
          control={control}
          name="mainCategory"
          render={({ field, fieldState }) => (
            <FormItem label="대표 카테고리" error={fieldState.error?.message}>
              <FormSelect
                options={categoryOptions}
                placeholder="대분류"
                value={field.value ? String(field.value) : undefined}
                onChange={value => field.onChange(Number(value))}
              />
            </FormItem>
          )}
        />

        <FormItem label="SNS 링크(최대 3개)">
          <Button
            disabled={fields.length >= 3}
            type="button"
            variant="outline"
            onClick={() =>
              append({ snsType: "INSTAGRAM" as SnsType, snsUrl: "" })
            }
          >
            SNS 링크 추가
            <PlusIcon />
          </Button>
        </FormItem>
        <FormItem label="">
          <div className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="flex gap-2 items-start">
                <Controller
                  control={control}
                  name={`snsLinks.${index}.snsType`}
                  rules={{
                    required: "SNS 종류를 선택해주세요.",
                  }}
                  render={({ field: snsTypeField, fieldState }) => (
                    <div className="shrink-0 w-40">
                      <FormSelect
                        options={SNS_TYPE_OPTIONS}
                        placeholder="SNS 종류"
                        value={snsTypeField.value}
                        onChange={snsTypeField.onChange}
                      />
                      {fieldState.error && (
                        <p className="text-xs text-red-500 mt-1">
                          {fieldState.error.message}
                        </p>
                      )}
                    </div>
                  )}
                />

                <Controller
                  control={control}
                  name={`snsLinks.${index}.snsUrl`}
                  rules={{
                    required: "URL을 입력해주세요.",
                    pattern: {
                      value: /^https?:\/\/.+/,
                      message: "올바른 URL 형식이 아닙니다.",
                    },
                  }}
                  render={({ field: urlField, fieldState }) => (
                    <div className="flex-1">
                      <FormInput
                        value={urlField.value}
                        onChange={urlField.onChange}
                        onBlur={urlField.onBlur}
                        placeholder="https://"
                      />
                      {fieldState.error && (
                        <p className="text-xs text-red-500 mt-1">
                          {fieldState.error.message}
                        </p>
                      )}
                    </div>
                  )}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => remove(index)}
                  className="shrink-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </FormItem>

        <div className="flex justify-end gap-2 mt-6">
          <Button type="submit" disabled={!isEnabled}>
            저장
          </Button>
        </div>
      </Section>
    </form>
  )
}
