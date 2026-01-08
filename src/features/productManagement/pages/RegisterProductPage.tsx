import { useForm, Controller, useFieldArray, useWatch } from "react-hook-form"
import Section from "@/common/components/Section/Section"
import FormItem from "@/common/components/Form/FormItem"
import FormInput from "@/common/components/Form/FormInput"
import FormCategorySelector, {
  type CategoryValue,
} from "@/common/components/Form/FormCategorySelector"
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
import FormEditor from "@/common/components/Form/FormEditor"
import {
  productService,
  type ProductNotice,
} from "@/features/productManagement/services/productService"
import { PRODUCT_VALIDATION_RULES } from "@/features/productManagement/constants/validationRules"
import { useCallback } from "react"
import toast from "react-hot-toast"

interface OptionGroup {
  id: string
  name: string
  items: Array<OptionItem>
}

interface ProductFormData {
  isDisplay: boolean
  isOutOfStockForced: boolean
  category: CategoryValue
  productName: string
  sellerProductCode: string
  purchasePrice: number
  isDiscount: boolean
  regularPrice: number
  discountRate: number
  optionGroups: Array<OptionGroup>
  optionCombinations: Array<OptionCombination>
  titleImage: string
  coverImages: Array<string>
  description: string
  productNotice: ProductNotice
}

export default function RegisterProductPage() {
  const { control, handleSubmit, setValue, getValues } =
    useForm<ProductFormData>({
      defaultValues: {
        isDisplay: true,
        isOutOfStockForced: false,
        category: {
          main: null,
          sub: null,
          detail: null,
        },
        productName: "",
        sellerProductCode: "",
        purchasePrice: 0,
        isDiscount: false,
        regularPrice: 0,
        discountRate: 0,
        optionGroups: [
          {
            id: crypto.randomUUID(),
            name: "",
            items: [{ id: crypto.randomUUID(), name: "", price: "" }],
          },
        ],
        optionCombinations: [],
        titleImage: "",
        coverImages: [],
        description: "",
        productNotice: {
          origin: "제품 상세 참고",
          material: "제품 상세 참고",
          color: "제품 상세 참고",
          size: "제품 상세 참고",
          manufacturer: "제품 상세 참고",
          washingMethod: "제품 상세 참고",
          manufactureDate: "제품 상세 참고",
          asInfo: "제품 상세 참고",
          qualityAssurance: "제품 상세 참고",
        },
      },
    })

  const { fields, append, remove } = useFieldArray({
    control,
    name: "optionGroups",
  })

  const regularPrice = useWatch({
    control,
    name: "regularPrice",
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
    defaultValue: false,
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

    const newCombinations = combinations.map((combo, index) => ({
      id: crypto.randomUUID(),
      combination: combo.map(item => item.name),
      price: combo
        .reduce((sum, item) => sum + Number(item.price || 0), 0)
        .toString(),
      stock: "0",
      isDisplayed: true,
      isRepresentative: index === 0,
    }))

    // const currentCombinations = getValues("optionCombinations") || []
    setValue("optionCombinations", newCombinations)
  }

  const getDiscountedPrice = () => {
    const regularPriceNum = Number(regularPrice)
    const discountRateNum = Number(discountRate)
    if (isDiscount) {
      return Math.max(regularPriceNum - discountRateNum, 0).toLocaleString()
    }

    return regularPriceNum.toLocaleString()
  }

  const onSubmit = useCallback(async (data: ProductFormData) => {
    if (!data.category.detail) {
      toast.error("카테고리를 선택해 주세요")
      return
    }

    const regularPriceNum = Number(data.regularPrice)
    const discountRateNum = Number(data.discountRate)
    const finalSalePrice = data.isDiscount
      ? Math.max(regularPriceNum - discountRateNum, 0)
      : regularPriceNum

    const apiData = {
      isDisplay: data.isDisplay,
      isOutOfStockForced: data.isOutOfStockForced,
      categoryId: data.category.detail,
      name: data.productName,
      sellerProductCode: data.sellerProductCode,
      purchasePrice: Number(data.purchasePrice),
      regularPrice: regularPriceNum,
      salePrice: finalSalePrice,
      isDiscount: data.isDiscount,
      representativeImageUrl: data.titleImage,
      coverImageUrls: data.coverImages,
      description: data.description,
      productNotice: data.productNotice,
      optionGroups: data.optionGroups.map(group => ({
        name: group.name,
        options: group.items.map(item => item.name),
      })),
      variants: data.optionCombinations.map(combo => ({
        optionNames: combo.combination,
        salePrice: Number(combo.price),
        stock: Number(combo.stock),
        isDisplay: combo.isDisplayed,
        isRepresentative: combo.isRepresentative,
      })),
    }

    await productService.addProduct(apiData)
    toast.success("상품 등록 완료")
  }, [])

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      onKeyDown={e => {
        if (e.key === "Enter") {
          e.preventDefault()
        }
      }}
    >
      <Section title="표시 여부">
        <Controller
          name="isDisplay"
          control={control}
          render={({ field, fieldState }) => (
            <FormItem
              label="진열상태"
              required
              error={fieldState.error?.message}
            >
              <FormRadioGroup<boolean>
                options={[
                  { label: "진열", value: true },
                  { label: "미진열", value: false },
                ]}
                value={field.value}
                onChange={field.onChange}
              />
            </FormItem>
          )}
        />
        <Controller
          name="isOutOfStockForced"
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
          rules={PRODUCT_VALIDATION_RULES.category}
          render={({ field, fieldState }) => (
            <FormItem
              label="카테고리"
              required
              error={fieldState.error?.message}
            >
              <FormCategorySelector
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
          rules={PRODUCT_VALIDATION_RULES.productName}
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
          name="sellerProductCode"
          control={control}
          render={({ field }) => (
            <FormItem label="판매자상품코드">
              <FormInput
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
              />
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
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
              />
            </FormItem>
          )}
        />
        <Controller
          name="regularPrice"
          control={control}
          rules={PRODUCT_VALIDATION_RULES.regularPrice}
          render={({ field, fieldState }) => (
            <FormItem required label="판매가" error={fieldState.error?.message}>
              <FormInput
                type="number"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                min={0}
              />
            </FormItem>
          )}
        />
        <Controller
          name="isDiscount"
          control={control}
          render={({ field }) => (
            <FormItem label="할인">
              <FormRadioGroup<boolean>
                options={[
                  { label: "설정", value: true },
                  { label: "설정 안함", value: false },
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
                disabled={!isDiscount}
                type="number"
                value={field.value}
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
      <Section required title="옵션 설정">
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

      <Section required title="옵션 조합">
        <Controller
          name="optionCombinations"
          control={control}
          render={({ field }) => (
            <FormOptionCombinationTable
              combinations={field.value}
              onChange={field.onChange}
            />
          )}
        />
      </Section>
      <Section title="이미지 설정">
        <Controller
          name="titleImage"
          control={control}
          rules={PRODUCT_VALIDATION_RULES.titleImage}
          render={({ field: titleImageField, formState }) => (
            <FormItem
              required
              label="대표 이미지"
              error={formState.errors.titleImage?.message}
            >
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
          rules={PRODUCT_VALIDATION_RULES.coverImages}
          render={({ field: coverImageField, formState }) => (
            <FormItem
              required
              label="커버 이미지"
              error={formState.errors.coverImages?.message}
            >
              <FormImageUploader
                value={coverImageField.value}
                onImagesChange={coverImageField.onChange}
                accept=".jpg, .jpeg, .png, .gif"
                type="PRODUCT"
                maxLength={4}
                maxStorage={1024}
                recommendSize={{ width: 640, height: 640 }}
              />
            </FormItem>
          )}
        />
      </Section>

      <Section title="상품정보고시">
        <Controller
          name="productNotice.origin"
          control={control}
          rules={PRODUCT_VALIDATION_RULES.productNotice.origin}
          render={({ field, formState }) => (
            <FormItem
              required
              label="제조국"
              error={formState.errors.productNotice?.origin?.message}
            >
              <FormInput
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
              />
            </FormItem>
          )}
        />
        <Controller
          name="productNotice.material"
          control={control}
          rules={PRODUCT_VALIDATION_RULES.productNotice.material}
          render={({ field, formState }) => (
            <FormItem
              required
              label="소재"
              error={formState.errors.productNotice?.material?.message}
            >
              <FormInput
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
              />
            </FormItem>
          )}
        />
        <Controller
          name="productNotice.color"
          control={control}
          rules={PRODUCT_VALIDATION_RULES.productNotice.color}
          render={({ field, formState }) => (
            <FormItem
              required
              label="색상"
              error={formState.errors.productNotice?.color?.message}
            >
              <FormInput
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
              />
            </FormItem>
          )}
        />
        <Controller
          name="productNotice.size"
          control={control}
          rules={PRODUCT_VALIDATION_RULES.productNotice.size}
          render={({ field, formState }) => (
            <FormItem
              required
              label="치수"
              error={formState.errors.productNotice?.size?.message}
            >
              <FormInput
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
              />
            </FormItem>
          )}
        />
        <Controller
          name="productNotice.manufacturer"
          control={control}
          rules={PRODUCT_VALIDATION_RULES.productNotice.manufacturer}
          render={({ field, formState }) => (
            <FormItem
              required
              label="제조자"
              error={formState.errors.productNotice?.manufacturer?.message}
            >
              <FormInput
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
              />
            </FormItem>
          )}
        />
        <Controller
          name="productNotice.washingMethod"
          control={control}
          rules={PRODUCT_VALIDATION_RULES.productNotice.washingMethod}
          render={({ field, formState }) => (
            <FormItem
              required
              label="세탁 방법"
              error={formState.errors.productNotice?.washingMethod?.message}
            >
              <FormInput
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
              />
            </FormItem>
          )}
        />
        <Controller
          name="productNotice.manufactureDate"
          control={control}
          rules={PRODUCT_VALIDATION_RULES.productNotice.manufactureDate}
          render={({ field, formState }) => (
            <FormItem
              required
              label="제조년월"
              error={formState.errors.productNotice?.manufactureDate?.message}
            >
              <FormInput
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
              />
            </FormItem>
          )}
        />
        <Controller
          name="productNotice.asInfo"
          control={control}
          rules={PRODUCT_VALIDATION_RULES.productNotice.asInfo}
          render={({ field, formState }) => (
            <FormItem
              required
              label="A/S안내 및 연락처"
              error={formState.errors.productNotice?.asInfo?.message}
            >
              <FormInput
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
              />
            </FormItem>
          )}
        />
        <Controller
          name="productNotice.qualityAssurance"
          control={control}
          rules={PRODUCT_VALIDATION_RULES.productNotice.qualityAssurance}
          render={({ field, formState }) => (
            <FormItem
              required
              label="품질 보증 기준"
              error={formState.errors.productNotice?.qualityAssurance?.message}
            >
              <FormInput
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
              />
            </FormItem>
          )}
        />
      </Section>

      <Section title="에디터">
        <Controller
          name="description"
          control={control}
          rules={PRODUCT_VALIDATION_RULES.description}
          render={({ field, formState }) => (
            <FormItem
              required
              label="상세설명"
              error={formState.errors.description?.message}
            >
              <FormEditor
                value={field.value}
                onChange={field.onChange}
                imageUploadType="PRODUCT"
                placeholder="상품 상세설명을 입력하세요..."
              />
            </FormItem>
          )}
        />
      </Section>

      <div className="flex gap-3 justify-end mt-6">
        <Button variant={"outline"}>취소</Button>
        <Button type="submit">등록하기</Button>
      </div>
    </form>
  )
}
