import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useForm, Controller, useWatch } from "react-hook-form"
import { Search } from "lucide-react"
import Section from "@/common/components/Section/Section"
import FormItem from "@/common/components/Form/FormItem"
import FormInput from "@/common/components/Form/FormInput"
import FormRadioGroup from "@/common/components/Form/FormRadioGroup"
import FormDateRangePicker, {
  type DateRange,
} from "@/common/components/Form/FormDateRangePicker"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import Form from "@/common/components/Form/Form"
import FormController from "@/common/components/Form/FormController"
import toast from "react-hot-toast"
import type { ProductListParams } from "@/features/productManagement/services/productService"
import { useGetProductList } from "@/features/productManagement/hooks/useGetProductList"

interface CouponFormData {
  name: string
  targetType: "GENERAL" | "NEW"
  issueType: "DOWNLOAD" | "AUTO"
  quantityLimitType: "UNLIMITED" | "LIMITED"
  totalQuantity: number
  perPersonQuantity: number
  discountType: "FIXED" | "RATE"
  discountValue: number
  minOrderAmount: number
  isDuplicatable: "true" | "false"
  issuePeriod: DateRange
  validDays: number
  targetProductType: "ALL" | "SPECIFIC"
}

const TARGET_TYPE_OPTIONS = [
  { label: "일반", value: "GENERAL" as const },
  { label: "첫구매", value: "NEW" as const },
]

const TARGET_TYPE_DESC: Record<string, string> = {
  GENERAL: "스토어에 방문하는 모든 고객에게 쿠폰을 사용할 수 있습니다.",
  NEW: "신규 가입한 고객에게만 쿠폰을 사용할 수 있습니다.",
}

const ISSUE_TYPE_OPTIONS = [
  { label: "다운로드", value: "DOWNLOAD" as const },
  { label: "자동지급", value: "AUTO" as const },
]

const ISSUE_TYPE_DESC: Record<string, string> = {
  DOWNLOAD: "고객이 직접 쿠폰 다운로드 버튼을 눌러 발급받는 방식입니다.",
  AUTO: "조건을 충족한 고객에게 쿠폰이 자동으로 발급되는 방식입니다.",
}

const DUPLICATE_OPTIONS = [
  { label: "가능", value: "true" as const },
  { label: "불가", value: "false" as const },
]

const DUPLICATE_DESC: Record<string, string> = {
  true: "다른 쿠폰과 함께 사용이 가능합니다.",
  false: "다른 쿠폰과 함께 사용이 불가능합니다.",
}

const TARGET_PRODUCT_OPTIONS = [
  { label: "전체", value: "ALL" as const },
  { label: "특정 상품", value: "SPECIFIC" as const },
]

const TARGET_PRODUCT_DESC: Record<string, string> = {
  ALL: "스토어의 모든 상품에 쿠폰이 적용됩니다.",
}
const INITIAL_PRODUCT_LIST_PARAMS: ProductListParams = {
  page: 1,
  size: 100,
  keyword: "",
  keywordType: null,
  displayStatus: "ALL",
  stockStatus: "ALL",
}
export default function RegisterDirect() {
  const navigate = useNavigate()

  const { control, handleSubmit } = useForm<CouponFormData>({
    defaultValues: {
      name: "",
      targetType: "GENERAL",
      issueType: "DOWNLOAD",
      quantityLimitType: "UNLIMITED",
      totalQuantity: undefined,
      perPersonQuantity: 1,
      discountType: "FIXED",
      discountValue: undefined,
      minOrderAmount: undefined,
      isDuplicatable: "true",
      issuePeriod: { from: null, to: null },
      validDays: undefined,
      targetProductType: "ALL",
    },
  })

  const nameValue = useWatch({ control, name: "name" })
  const targetType = useWatch({ control, name: "targetType" })
  const issueType = useWatch({ control, name: "issueType" })
  const quantityLimitType = useWatch({ control, name: "quantityLimitType" })
  const discountType = useWatch({ control, name: "discountType" })
  const isDuplicatable = useWatch({ control, name: "isDuplicatable" })
  const targetProductType = useWatch({ control, name: "targetProductType" })
  const [localProductSearch, setLocalProductSearch] = useState("")
  const [productSearch, setProductSearch] = useState("")
  const { data: productList } = useGetProductList({
    ...INITIAL_PRODUCT_LIST_PARAMS,
    keyword: productSearch,
  })

  const onSubmit = () => {
    toast.success("쿠폰이 등록되었습니다.")
  }

  return (
    <div className="p-6">
      <p className="text-sm text-red-500 mb-6">* 필수항목</p>

      <Form handleSubmit={handleSubmit} onSubmit={onSubmit}>
        <Section>
          {/* 쿠폰 이름 */}
          <FormController
            control={control}
            name="name"
            rules={{ required: "쿠폰 이름을 입력해주세요." }}
            render={({ field, fieldState }) => (
              <FormItem
                label="쿠폰 이름"
                required
                error={fieldState.error?.message}
                htmlFor="coupon-name"
              >
                <div className="relative">
                  <FormInput
                    id="coupon-name"
                    placeholder="쿠폰명을 입력해주세요"
                    maxLength={20}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                    {(nameValue ?? "").length}/20
                  </span>
                </div>
              </FormItem>
            )}
          />

          {/* 쿠폰 타겟팅 대상 */}
          <FormController
            control={control}
            name="targetType"
            rules={{ required: "쿠폰 타겟팅 대상을 선택해주세요." }}
            render={({ field, fieldState }) => (
              <FormItem
                label="쿠폰 타겟팅 대상"
                required
                error={fieldState.error?.message}
              >
                <div className="space-y-1.5">
                  <FormRadioGroup
                    options={TARGET_TYPE_OPTIONS}
                    value={field.value}
                    onChange={field.onChange}
                  />
                  {targetType && (
                    <p className="text-xs text-gray-500">
                      {TARGET_TYPE_DESC[targetType]}
                    </p>
                  )}
                </div>
              </FormItem>
            )}
          />

          {/* 발급 방식 */}
          <FormController
            control={control}
            name="issueType"
            rules={{ required: "발급 방식을 선택해주세요." }}
            render={({ field, fieldState }) => (
              <FormItem
                label="발급 방식"
                required
                error={fieldState.error?.message}
              >
                <div className="space-y-1.5">
                  <FormRadioGroup
                    options={ISSUE_TYPE_OPTIONS}
                    value={field.value}
                    onChange={field.onChange}
                  />
                  {issueType && (
                    <p className="text-xs text-gray-500">
                      {ISSUE_TYPE_DESC[issueType]}
                    </p>
                  )}
                </div>
              </FormItem>
            )}
          />

          {/* 발급 수량 제한 */}
          <FormController
            control={control}
            name="quantityLimitType"
            rules={{ required: "발급 수량 제한을 선택해주세요." }}
            render={({ field, fieldState }) => (
              <FormItem
                label="발급 수량 제한"
                required
                error={fieldState.error?.message}
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-4">
                    <RadioGroup
                      value={field.value}
                      onValueChange={field.onChange}
                      className="flex gap-4"
                    >
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="UNLIMITED" id="qty-unlimited" />
                        <Label htmlFor="qty-unlimited" className="font-normal">
                          무제한
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="LIMITED" id="qty-limited" />
                        <Label htmlFor="qty-limited" className="font-normal">
                          제한
                        </Label>
                      </div>
                    </RadioGroup>

                    {quantityLimitType === "LIMITED" && (
                      <Controller
                        control={control}
                        name="totalQuantity"
                        rules={{ required: "총 발급 수량을 입력해주세요." }}
                        render={({ field: qtyField }) => (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">
                              총 발급 수량
                            </span>
                            <div className="w-32">
                              <FormInput
                                type="number"
                                min={1}
                                value={qtyField.value}
                                onChange={val => qtyField.onChange(Number(val))}
                              />
                            </div>
                            <span className="text-sm text-gray-700">개</span>
                          </div>
                        )}
                      />
                    )}
                  </div>

                  <Controller
                    control={control}
                    name="perPersonQuantity"
                    render={({ field: ppField }) => (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">
                          인당 발급 수량
                        </span>
                        <div className="w-24">
                          <FormInput
                            type="number"
                            min={1}
                            value={ppField.value}
                            onChange={val => ppField.onChange(Number(val))}
                          />
                        </div>
                        <span className="text-sm text-gray-700">개</span>
                      </div>
                    )}
                  />
                </div>
              </FormItem>
            )}
          />

          {/* 할인 설정 */}
          <FormController
            control={control}
            name="discountType"
            rules={{ required: "할인 설정을 선택해주세요." }}
            render={({ field, fieldState }) => (
              <FormItem
                label="할인 설정"
                required
                error={fieldState.error?.message}
              >
                <div className="flex items-center gap-4">
                  <RadioGroup
                    value={field.value}
                    onValueChange={field.onChange}
                    className="flex gap-4"
                  >
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="FIXED" id="discount-fixed" />
                      <Label htmlFor="discount-fixed" className="font-normal">
                        정액 할인
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="RATE" id="discount-rate" />
                      <Label htmlFor="discount-rate" className="font-normal">
                        정률 할인
                      </Label>
                    </div>
                  </RadioGroup>

                  <Controller
                    control={control}
                    name="discountValue"
                    rules={{ required: "할인 금액을 입력해주세요." }}
                    render={({ field: dvField }) => (
                      <div className="flex items-center gap-2">
                        <div className="w-40">
                          <FormInput
                            type="number"
                            min={0}
                            placeholder={
                              discountType === "RATE" ? "할인율" : "할인 금액"
                            }
                            value={dvField.value}
                            onChange={val => dvField.onChange(Number(val))}
                          />
                        </div>
                        <span className="text-sm text-gray-700">
                          {discountType === "RATE" ? "%" : "원"}
                        </span>
                      </div>
                    )}
                  />
                </div>
              </FormItem>
            )}
          />

          {/* 최소주문금액 */}
          <FormController
            control={control}
            name="minOrderAmount"
            render={({ field, fieldState }) => (
              <FormItem label="최소주문금액" error={fieldState.error?.message}>
                <div className="flex items-center gap-2">
                  <div className="w-48">
                    <FormInput
                      type="number"
                      min={0}
                      placeholder="최소 주문 금액"
                      value={field.value}
                      onChange={val => field.onChange(Number(val))}
                    />
                  </div>
                  <span className="text-sm text-gray-700">원 이상</span>
                </div>
              </FormItem>
            )}
          />

          {/* 중복 사용 여부 */}
          <FormController
            control={control}
            name="isDuplicatable"
            rules={{ required: "중복 사용 여부를 선택해주세요." }}
            render={({ field, fieldState }) => (
              <FormItem
                label="중복 사용 여부"
                error={fieldState.error?.message}
              >
                <div className="space-y-1.5">
                  <FormRadioGroup
                    options={DUPLICATE_OPTIONS}
                    value={field.value}
                    onChange={field.onChange}
                  />
                  {isDuplicatable && (
                    <p className="text-xs text-gray-500">
                      {DUPLICATE_DESC[isDuplicatable]}
                    </p>
                  )}
                </div>
              </FormItem>
            )}
          />

          {/* 쿠폰 발급 기간 */}
          <FormController
            control={control}
            name="issuePeriod"
            rules={{
              validate: value =>
                !!(value?.from && value?.to) ||
                "쿠폰 발급 기간을 선택해주세요.",
            }}
            render={({ field, fieldState }) => (
              <FormItem
                label="쿠폰 발급 기간"
                required
                error={fieldState.error?.message}
              >
                <FormDateRangePicker
                  value={field.value}
                  onChange={field.onChange}
                />
              </FormItem>
            )}
          />

          {/* 쿠폰 유효기간 */}
          <FormController
            control={control}
            name="validDays"
            render={({ field, fieldState }) => (
              <FormItem label="쿠폰 유효기간" error={fieldState.error?.message}>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">발급일로부터</span>
                  <div className="w-24">
                    <FormInput
                      type="number"
                      min={1}
                      placeholder="일수"
                      value={field.value}
                      onChange={val => field.onChange(Number(val))}
                    />
                  </div>
                  <span className="text-sm text-gray-700">일</span>
                </div>
              </FormItem>
            )}
          />

          {/* 쿠폰 적용 상품 */}
          <FormController
            control={control}
            name="targetProductType"
            rules={{ required: "쿠폰 적용 상품을 선택해주세요." }}
            render={({ field, fieldState }) => (
              <FormItem
                label="쿠폰 적용 상품"
                required
                error={fieldState.error?.message}
              >
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <FormRadioGroup
                      options={TARGET_PRODUCT_OPTIONS}
                      value={field.value}
                      onChange={field.onChange}
                    />
                    {targetProductType === "ALL" && (
                      <p className="text-xs text-gray-500">
                        {TARGET_PRODUCT_DESC["ALL"]}
                      </p>
                    )}
                  </div>

                  {targetProductType === "SPECIFIC" && (
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1 max-w-md">
                        <Search
                          size={16}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        />
                        <input
                          type="text"
                          placeholder="상품명을 검색해 주세요"
                          value={localProductSearch}
                          onChange={e => setLocalProductSearch(e.target.value)}
                          className="w-full pl-9 pr-3 h-10 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                        />
                      </div>
                      <Button
                        type="button"
                        className="bg-blue-500 hover:bg-blue-600 px-5"
                        onClick={() => setProductSearch(localProductSearch)}
                      >
                        검색
                      </Button>
                    </div>
                  )}
                  {targetProductType === "SPECIFIC" &&
                    productSearch &&
                    productList && (
                      <div className="w-full border border-gray-200 rounded-md overflow-hidden">
                        <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200 text-sm text-gray-600">
                          검색 결과 {productList.content.length}건
                        </div>
                        {productList.content.length === 0 ? (
                          <div className="px-4 py-6 text-center text-sm text-gray-400">
                            검색 결과가 없습니다.
                          </div>
                        ) : (
                          <ul className="max-h-60 overflow-y-auto">
                            {productList.content.map(product => (
                              <li
                                key={product.productId}
                                className="flex items-center justify-between px-4 py-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50"
                              >
                                <span className="text-sm text-gray-800">
                                  <span className="text-gray-500 mr-2">
                                    {product.productNumber}
                                  </span>
                                  {product.name}
                                </span>
                                <Button
                                  type="button"
                                  size="sm"
                                  className="bg-blue-500 hover:bg-blue-600 px-4"
                                >
                                  추가
                                </Button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                </div>
              </FormItem>
            )}
          />
        </Section>

        <div className="flex justify-end gap-3 mt-2">
          <Button
            type="button"
            variant="outline"
            className="px-8"
            onClick={() => navigate(-1)}
          >
            취소
          </Button>
          <Button type="submit" className="px-8 bg-blue-500 hover:bg-blue-600">
            쿠폰 등록
          </Button>
        </div>
      </Form>
    </div>
  )
}
