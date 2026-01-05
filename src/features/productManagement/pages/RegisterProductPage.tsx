import { useForm, Controller, useFieldArray, useWatch } from "react-hook-form"
import Section from "@/common/components/Section/Section"
import FormItem from "@/common/components/Form/FormItem"
import FormInput from "@/common/components/Form/FormInput"
import FormCategorySelector from "@/common/components/Form/FormCategorySelector"
import FormDisplay from "@/common/components/Form/FormDisplay"
import FormRadioGroup from "@/common/components/Form/FormRadioGroup"
import FormOptionTable, {
  type OptionItem,
} from "@/common/components/Form/FormOptionTable"
import FormOptionCombinationTable, {
  type OptionCombination,
} from "@/common/components/Form/FormOptionCombinationTable"
import { Button } from "@/components/ui/button"
import { Trash2, ArrowDown } from "lucide-react"
import FormCheckbox from "@/common/components/Form/FormCheckbox"
import FormImageUploader from "@/common/components/Form/FormImageUploader"

interface OptionGroup {
  id: string
  name: string
  items: Array<OptionItem>
}

interface ProductFormData {
  displayStatus: string
  forceSoldOut: boolean
  productName: string
  sellerProductNumber: string
  purchasePrice: number
  isDiscount: string
  salePrice: number
  discountRate: number
  category: {
    main: string
    sub: string
    detail: string
  }
  optionGroups: Array<OptionGroup>
  optionCombinations: Array<OptionCombination>
  representativeOption: string
  titleImage: string
  coverImages: Array<string>
}

// 임시 카테고리 데이터
const categoryData = {
  mainCategories: [
    { label: "패션 의류", value: "fashion" },
    { label: "뷰티", value: "beauty" },
  ],
  subCategories: {
    fashion: [
      { label: "아우터", value: "outer" },
      { label: "상의", value: "top" },
    ],
    beauty: [
      { label: "스킨케어", value: "skincare" },
      { label: "메이크업", value: "makeup" },
    ],
  },
  detailCategories: {
    outer: [
      { label: "코트", value: "coat" },
      { label: "자켓", value: "jacket" },
    ],
    top: [
      { label: "티셔츠", value: "tshirt" },
      { label: "셔츠", value: "shirt" },
    ],
    skincare: [
      { label: "토너", value: "toner" },
      { label: "세럼", value: "serum" },
    ],
    makeup: [
      { label: "파운데이션", value: "foundation" },
      { label: "립스틱", value: "lipstick" },
    ],
  },
}

export default function RegisterProductPage() {
  const { control, handleSubmit, setValue, getValues } =
    useForm<ProductFormData>({
      defaultValues: {
        displayStatus: "DISPLAY",
        productName: "",
        category: {
          main: "",
          sub: "",
          detail: "",
        },
        optionGroups: [
          {
            id: crypto.randomUUID(),
            name: "",
            items: [{ id: crypto.randomUUID(), name: "", price: "" }],
          },
        ],
        optionCombinations: [],
        representativeOption: "",
      },
    })

  const { fields, append, remove } = useFieldArray({
    control,
    name: "optionGroups",
  })

  const salePrice = useWatch({
    control,
    name: "salePrice",
    defaultValue: 0,
  })

  const discountRate = useWatch({
    control,
    name: "discountRate",
    defaultValue: 0,
  })

  const isDiscount = useWatch({
    control,
    name: "isDiscount",
    defaultValue: "false",
  })

  const handleAddOptionGroup = () => {
    append({
      id: crypto.randomUUID(),
      name: "",
      items: [{ id: crypto.randomUUID(), name: "", price: "" }],
    })
  }

  const handleMoveToCombinations = () => {
    const optionGroups = getValues("optionGroups")

    const validGroups = optionGroups.filter(
      group =>
        group.name &&
        group.items.length > 0 &&
        group.items.some(item => item.name)
    )

    if (validGroups.length === 0) {
      alert("옵션을 입력해주세요.")
      return
    }

    const validItems = validGroups.map(group =>
      group.items.filter(item => item.name)
    )

    const cartesianProduct = (
      arrays: Array<Array<OptionItem>>
    ): Array<Array<OptionItem>> => {
      if (arrays.length === 0) return []
      if (arrays.length === 1) return arrays[0].map(item => [item])

      const result: Array<Array<OptionItem>> = []
      const restProduct = cartesianProduct(arrays.slice(1))

      for (const item of arrays[0]) {
        for (const rest of restProduct) {
          result.push([item, ...rest])
        }
      }

      return result
    }

    const combinations = cartesianProduct(validItems)

    const newCombinations = combinations.map(combo => ({
      id: crypto.randomUUID(),
      combination: combo.map(item => item.name),
      price: combo
        .reduce((sum, item) => sum + Number(item.price || 0), 0)
        .toString(),
      stock: "0",
      isDisplayed: true,
    }))

    const currentCombinations = getValues("optionCombinations") || []
    setValue("optionCombinations", [...currentCombinations, ...newCombinations])

    // 옵션 설정 초기화
    setValue("optionGroups", [
      {
        id: crypto.randomUUID(),
        name: "",
        items: [{ id: crypto.randomUUID(), name: "", price: "" }],
      },
    ])
  }

  const getDiscountedPrice = () => {
    const salePriceNum = Number(salePrice)
    const discountRateNum = Number(discountRate)
    if (isDiscount === "true") {
      return Math.max(salePriceNum - discountRateNum, 0).toLocaleString()
    }

    return salePriceNum.toLocaleString()
  }

  const onSubmit = (data: ProductFormData) => {
    // eslint-disable-next-line no-console
    console.log("Form data:", data)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Section title="표시 여부">
        <Controller
          name="displayStatus"
          control={control}
          rules={{ required: "진열상태를 선택해주세요" }}
          render={({ field, fieldState }) => (
            <FormItem
              label="진열상태"
              required
              error={fieldState.error?.message}
            >
              <FormRadioGroup
                options={[
                  { label: "진열", value: "DISPLAY" },
                  { label: "미진열", value: "HIDDEN" },
                ]}
                value={field.value}
                onChange={field.onChange}
              />
            </FormItem>
          )}
        />
        <Controller
          name="forceSoldOut"
          control={control}
          render={({ field, fieldState }) => (
            <FormItem
              tooltipInfo={
                "강제 품절을 체크하면 해당 상품은 고객에게 품절로 노출되며,\n구매가 불가능하게 됩니다."
              }
              label="강제품절처리"
              error={fieldState.error?.message}
            >
              <FormCheckbox
                label="품절"
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </FormItem>
          )}
        />
      </Section>

      <Section title="카테고리(한 개만 지정 가능)">
        <Controller
          name="category"
          control={control}
          rules={{ required: "카테고리를 선택해주세요" }}
          render={({ field, fieldState }) => (
            <FormItem
              label="카테고리"
              required
              error={fieldState.error?.message}
            >
              <FormCategorySelector
                categoryData={categoryData}
                value={field.value}
                onChange={field.onChange}
              />
            </FormItem>
          )}
        />
      </Section>

      <Section title="기본 정보">
        <Controller
          name="productName"
          control={control}
          rules={{
            required: "상품명을 입력해 주세요",
            maxLength: {
              value: 100,
              message: "상품명은 최대 100자까지 입력 가능합니다",
            },
          }}
          render={({ field, fieldState }) => (
            <FormItem label="상품명" required error={fieldState.error?.message}>
              <FormInput
                placeholder="상품명을 입력해 주세요(특수문자 입력은 피해 주세요)"
                maxLength={100}
                onChange={field.onChange}
                onBlur={field.onBlur}
              />
            </FormItem>
          )}
        />

        <FormItem label="상품번호">
          <FormDisplay value="자동입력됩니다." />
        </FormItem>
        <Controller
          name="sellerProductNumber"
          control={control}
          render={({ field }) => (
            <FormItem label="판매자상품코드">
              <FormInput onChange={field.onChange} onBlur={field.onBlur} />
            </FormItem>
          )}
        />
      </Section>
      <Section title="가격 설정">
        <Controller
          name="purchasePrice"
          control={control}
          render={({ field }) => (
            <FormItem label="매입가">
              <FormInput
                type="number"
                onChange={field.onChange}
                onBlur={field.onBlur}
              />
            </FormItem>
          )}
        />
        <Controller
          name="salePrice"
          control={control}
          render={({ field }) => (
            <FormItem label="판매가">
              <FormInput
                type="number"
                onChange={field.onChange}
                onBlur={field.onBlur}
              />
            </FormItem>
          )}
        />
        <Controller
          name="isDiscount"
          control={control}
          render={({ field }) => (
            <FormItem label="할인">
              <FormRadioGroup
                options={[
                  { label: "설정", value: "true" },
                  { label: "설정 안함", value: "false" },
                ]}
                value={field.value}
                onChange={field.onChange}
              />
            </FormItem>
          )}
        />
        <Controller
          name="discountRate"
          control={control}
          render={({ field }) => (
            <FormItem label="">
              <FormInput
                disabled={isDiscount === "false"}
                type="number"
                onChange={field.onChange}
                onBlur={field.onBlur}
              />
            </FormItem>
          )}
        />
        <FormItem label="할인 판매가">
          <FormDisplay value={getDiscountedPrice()} />
        </FormItem>
      </Section>
      <Section title="옵션 설정">
        <div className="space-y-6">
          {fields.map((field, index) => (
            <div key={field.id} className="relative">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-900">
                  옵션 {index + 1}
                </h3>
                {fields.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    옵션 삭제
                  </Button>
                )}
              </div>
              <Controller
                name={`optionGroups.${index}.name`}
                control={control}
                render={({ field: nameField }) => (
                  <Controller
                    name={`optionGroups.${index}.items`}
                    control={control}
                    render={({ field: itemsField }) => (
                      <FormOptionTable
                        optionName={nameField.value}
                        onOptionNameChange={nameField.onChange}
                        options={itemsField.value}
                        onChange={itemsField.onChange}
                      />
                    )}
                  />
                )}
              />
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            onClick={handleAddOptionGroup}
          >
            + 새로운 옵션 추가
          </Button>

          <div className="pt-4 border-t">
            <Button
              type="button"
              variant="default"
              onClick={handleMoveToCombinations}
              className="w-full"
            >
              <ArrowDown className="h-4 w-4 mr-2" />
              옵션 목록으로 이동
            </Button>
          </div>
        </div>
      </Section>

      <Section title="옵션 조합">
        <Controller
          name="optionCombinations"
          control={control}
          render={({ field: combinationsField }) => (
            <Controller
              name="representativeOption"
              control={control}
              render={({ field: representativeField }) => (
                <FormOptionCombinationTable
                  combinations={combinationsField.value}
                  onChange={combinationsField.onChange}
                  representativeOption={representativeField.value}
                  onRepresentativeChange={representativeField.onChange}
                />
              )}
            />
          )}
        />
      </Section>
      <Section title="이미지 설정">
        <Controller
          name="titleImage"
          control={control}
          render={({ field: titleImageField }) => (
            <FormItem label="대표 이미지">
              <FormImageUploader
                value={titleImageField.value}
                onImagesChange={titleImageField.onChange}
                accept=".jpg, .jpeg, .png, .gif"
                type="PRODUCT"
                maxLength={1}
                maxStorage={1024}
                recommendSize={{ width: 640, height: 768 }}
              />
            </FormItem>
          )}
        />
        <Controller
          name="coverImages"
          control={control}
          render={({ field: coverImageField }) => (
            <FormItem label="커버 이미지">
              <FormImageUploader
                value={coverImageField.value}
                onImagesChange={coverImageField.onChange}
                accept=".jpg, .jpeg, .png, .gif"
                type="PRODUCT"
                maxLength={4}
                maxStorage={1024}
                recommendSize={{ width: 640, height: 640 }}
                requiredSquare
              />
            </FormItem>
          )}
        />
      </Section>
      <div className="flex gap-3 justify-end mt-6">
        <button
          type="button"
          className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          취소
        </button>
        <button
          type="submit"
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          등록하기
        </button>
      </div>
    </form>
  )
}
