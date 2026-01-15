import { useForm, useFieldArray } from "react-hook-form"
import Section from "@/common/components/Section/Section"
import type { CategoryValue } from "@/common/components/Form/FormCategorySelector"
import type { OptionItem } from "@/common/components/Form/FormOptionTable"
import type { OptionCombination } from "@/common/components/Form/FormOptionCombinationTable"
import { Button } from "@/components/ui/button"
import {
  productService,
  type AddProductRequest,
  type ProductNotice,
} from "@/features/productManagement/services/productService"
import { useCallback, useEffect, useState } from "react"
import toast from "react-hot-toast"
import type { AxiosError } from "axios"
import { useNavigate, useParams } from "react-router-dom"
import {
  confirm,
  type ConfirmOptions,
} from "@/common/components/ConfirmModal/confirm"
import Form from "@/common/components/Form/Form"
import { useGetProductDetail } from "@/features/productManagement/hooks/useGetProductDetail"
import { useGetCategory } from "@/common/hooks/useGetCategory"
import { getCategoryHierarchy } from "@/common/utils/getCategoryHierarchy"
import { useCustomBlocker } from "@/common/hooks/useCustomBlocker"
import DiscountPriceForm from "@/features/productManagement/components/DiscountPriceForm/DiscountPriceForm"
import DiscountRateForm from "@/features/productManagement/components/DiscountRateForm/DiscountRateForm"
import IsDisplayForm from "@/features/productManagement/components/IsDisplayForm/IsDisplayForm"
import IsOutOfStockForm from "@/features/productManagement/components/IsOutOfStockForm/IsOutOfStockForm"
import CategoryForm from "@/features/productManagement/components/CategoryForm/CategoryForm"
import ProductNameForm from "@/features/productManagement/components/ProductNameForm/ProductNameForm"
import ProductNumberForm from "@/features/productManagement/components/ProductNumberForm/ProductNumberForm"
import SellerProductCodeForm from "@/features/productManagement/components/SellerProductCodeForm/SellerProductCodeForm"
import PurchasePriceForm from "@/features/productManagement/components/PurchasePriceForm/PurchasePriceForm"
import RegularPriceForm from "@/features/productManagement/components/RegularPriceForm/RegularPriceForm"
import IsDiscountForm from "@/features/productManagement/components/IsDiscountForm/IsDiscountForm"
import TitleImageForm from "@/features/productManagement/components/TitleImageForm/TitleImageForm"
import CoverImagesForm from "@/features/productManagement/components/CoverImagesForm/CoverImagesForm"
import ProductNoticeForm from "@/features/productManagement/components/ProductNoticeForm/ProductNoticeForm"
import DescriptionForm from "@/features/productManagement/components/DescriptionForm/DescriptionForm"
import OptionGroupsForm from "@/features/productManagement/components/OptionGroupsForm/OptionGroupsForm"
import OptionCombinationsForm from "@/features/productManagement/components/OptionCombinationsForm/OptionCombinationsForm"

interface OptionGroup {
  id: string | number
  name: string
  items: Array<OptionItem>
}

export interface ProductFormData {
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
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const { productId } = useParams<{ productId?: string }>()
  const { data: productDetail } = useGetProductDetail(Number(productId))
  const { categoryMap } = useGetCategory()
  const isEdit = !!productId

  const getDefaultCancelConfirmOptions = useCallback(
    (isEdit: boolean): ConfirmOptions => {
      return {
        title: `상품 ${isEdit ? "수정" : "등록"} 취소`,
        content: `${isEdit ? "수정" : "작성"} 중인 내용이 저장되지 않습니다.\n취소하시겠습니까?`,
        type: "warn",
        cancelText: "돌아가기",
        confirmText: "취소",
      }
    },
    []
  )

  const { control, handleSubmit, setValue, getValues, formState, reset } =
    useForm<ProductFormData>({
      reValidateMode: "onSubmit",
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
            items: [{ id: crypto.randomUUID(), name: "", price: null }],
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

  useCustomBlocker({
    condition: formState.isDirty,
    confirmOption: getDefaultCancelConfirmOptions(isEdit),
  })

  const initializeForm = useCallback(() => {
    if (!productDetail || !categoryMap) {
      return
    }
    const discountRate = productDetail.regularPrice - productDetail.salePrice

    const optionGroups: Array<OptionGroup> = productDetail.optionGroups.map(
      group => ({
        id: group.optionGroupId,
        name: group.name,
        items: group.options.map(option => ({
          id: option.optionId,
          name: option.name,
          price: option.price || 0,
        })),
      })
    )
    const optionCombinations: Array<OptionCombination> =
      productDetail.variants.map(variant => ({
        id: variant.variantId.toString(),
        combination: variant.name.split("/").map(v => v.trim()),
        price: variant.salePrice.toString(),
        stock: variant.stock.toString(),
        isDisplayed: variant.isDisplay,
        isRepresentative: variant.isRepresentative,
      }))
    reset({
      isDisplay: productDetail.isDisplay,
      isOutOfStockForced: productDetail.isOutOfStockForced,
      category: getCategoryHierarchy(productDetail.categoryId, categoryMap),
      productName: productDetail.name,
      sellerProductCode: productDetail.sellerProductCode,
      purchasePrice: productDetail.purchasePrice,
      regularPrice: productDetail.regularPrice,
      discountRate: discountRate,
      isDiscount: discountRate > 0,
      optionGroups: optionGroups,
      optionCombinations: optionCombinations,
      titleImage: productDetail.representativeImageUrl,
      coverImages: productDetail.coverImageUrls,
      description: productDetail.description,
      productNotice: productDetail.productNotice,
    })
  }, [categoryMap, productDetail, reset])

  useEffect(() => {
    initializeForm()
  }, [initializeForm])

  const { fields, append, remove } = useFieldArray({
    control,
    name: "optionGroups",
  })

  const handleMoveToCombinations = () => {
    const optionGroups = getValues("optionGroups")

    if (optionGroups.length === 0) {
      toast.error("옵션을 입력해 주세요.")
      return
    }

    for (const group of optionGroups) {
      const index = optionGroups.indexOf(group)
      if (!group.name) {
        toast.error(`옵션${index + 1} 그룹명을 입력해 주세요.`)
        return
      }
      const hasSameGroupName = optionGroups.some(
        curGroup => curGroup.name === group.name && curGroup.id !== group.id
      )
      if (hasSameGroupName) {
        toast.error("동일한 옵션명은 사용할 수 없습니다.")
        return
      }
      const filledItems = group.items.filter(item => item.name)

      if (filledItems.length === 0) {
        toast.error(`"${group.name}" 옵션 항목을 입력해 주세요.`)
        return
      }
      const hasSameItemName = group.items.some(item =>
        group.items.some(
          curItem => curItem.name === item.name && curItem.id !== item.id
        )
      )
      if (hasSameItemName) {
        toast.error("동일한 옵션 항목명은 사용할 수 없습니다.")
        return
      }
    }

    const validItems = optionGroups.map(group =>
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

    setValue("optionCombinations", newCombinations)
  }

  const onSubmit = useCallback(
    async (data: ProductFormData) => {
      try {
        setIsLoading(true)
        const regularPriceNum = Number(data.regularPrice)
        const discountRateNum = Number(data.discountRate)
        const finalSalePrice = data.isDiscount
          ? Math.max(regularPriceNum - discountRateNum, 0)
          : regularPriceNum

        const apiData: AddProductRequest = {
          isDisplay: data.isDisplay,
          isOutOfStockForced: data.isOutOfStockForced,
          categoryId: data.category.detail as number,
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
            options: group.items
              .filter(item => item.name)
              .map(item => ({ name: item.name, price: Number(item.price) })),
          })),
          variants: data.optionCombinations.map(combo => ({
            optionNames: combo.combination,
            salePrice: Number(combo.price),
            stock: Number(combo.stock),
            isDisplay: combo.isDisplayed,
            isRepresentative: combo.isRepresentative,
          })),
        }
        const apiCall = isEdit
          ? productService.updateProduct(Number(productId), apiData)
          : productService.addProduct(apiData)

        await apiCall
        toast.success(
          isEdit ? "상품 정보를 수정했습니다." : "상품 정보를 등록했습니다."
        )
        navigate("/product/list") // TODO : path 상수로 관리
      } catch (error) {
        throw error as AxiosError
      } finally {
        setIsLoading(false)
      }
    },
    [isEdit, navigate, productId]
  )

  const handleClickCancel = useCallback(async () => {
    if (!formState.isDirty) {
      navigate("/product/list")
      return
    }

    const result = await confirm(getDefaultCancelConfirmOptions(isEdit))

    if (result) {
      navigate("/product/list")
    }
  }, [formState.isDirty, getDefaultCancelConfirmOptions, isEdit, navigate])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLFormElement>) => {
      if (e.key === "Enter") {
        e.preventDefault()
      }
    },
    []
  )

  return (
    <Form
      handleSubmit={handleSubmit}
      onSubmit={onSubmit}
      onKeyDown={handleKeyDown}
    >
      <Section title="표시 여부">
        <IsDisplayForm control={control} />
        <IsOutOfStockForm control={control} />
      </Section>

      <Section title="카테고리(한 개만 지정 가능)">
        <CategoryForm control={control} />
      </Section>

      <Section title="기본 정보">
        <ProductNameForm control={control} />
        <ProductNumberForm productDetail={productDetail} />
        <SellerProductCodeForm control={control} />
      </Section>

      <Section title="가격 설정">
        <PurchasePriceForm control={control} />
        <RegularPriceForm control={control} />
        <IsDiscountForm control={control} />
        <DiscountRateForm control={control} />
        <DiscountPriceForm control={control} />
      </Section>

      <Section required title="옵션 설정">
        <OptionGroupsForm
          control={control}
          fields={fields}
          remove={remove}
          append={append}
          onMoveToCombinations={handleMoveToCombinations}
        />
      </Section>

      <Section required title="옵션 조합">
        <OptionCombinationsForm control={control} />
      </Section>

      <Section title="상품 이미지">
        <TitleImageForm control={control} />
        <CoverImagesForm control={control} />
      </Section>

      <Section title="상품정보고시">
        <ProductNoticeForm control={control} />
      </Section>

      <Section title="에디터">
        <DescriptionForm control={control} />
      </Section>

      <div className="flex gap-3 justify-end mt-6">
        <Button type="button" variant={"outline"} onClick={handleClickCancel}>
          취소
        </Button>
        <Button isLoading={isLoading} type="submit">
          {isEdit ? "수정하기" : "등록하기"}
        </Button>
      </div>
    </Form>
  )
}
