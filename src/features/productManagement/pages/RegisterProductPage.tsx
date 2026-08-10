import {
  confirm,
  type ConfirmOptions,
} from "@/common/components/ConfirmModal/confirm"
import Form from "@/common/components/Form/Form"
import type { CategoryValue } from "@/common/components/Form/FormCategorySelector"
import type { OptionCombination } from "@/common/components/Form/FormOptionCombinationTable"
import type { OptionItem } from "@/common/components/Form/FormOptionTable"
import Section from "@/common/components/Section/Section"
import { useCustomBlocker } from "@/common/hooks/useCustomBlocker"
import { useGetCategory } from "@/common/hooks/useGetCategory"
import { queryClient } from "@/common/lib/queryClient"
import { getCategoryHierarchy } from "@/common/utils/getCategoryHierarchy"
import { Button } from "@/components/ui/button"
import CategoryForm from "@/features/productManagement/components/CategoryForm/CategoryForm"
import CoverImagesForm from "@/features/productManagement/components/CoverImagesForm/CoverImagesForm"
import DescriptionForm from "@/features/productManagement/components/DescriptionForm/DescriptionForm"
import OptionCombinationsForm from "@/features/productManagement/components/OptionCombinationsForm/OptionCombinationsForm"
import OptionGroupsForm from "@/features/productManagement/components/OptionGroupsForm/OptionGroupsForm"
import ProductNameForm from "@/features/productManagement/components/ProductNameForm/ProductNameForm"
import ProductNoticeForm from "@/features/productManagement/components/ProductNoticeForm/ProductNoticeForm"
import ProductNumberForm from "@/features/productManagement/components/ProductNumberForm/ProductNumberForm"
import ProductStatusRail from "@/features/productManagement/components/ProductStatusRail/ProductStatusRail"
import RegularPriceForm from "@/features/productManagement/components/RegularPriceForm/RegularPriceForm"
import SellerProductCodeForm from "@/features/productManagement/components/SellerProductCodeForm/SellerProductCodeForm"
import TitleImageForm from "@/features/productManagement/components/TitleImageForm/TitleImageForm"
import { DELETE_BLOCKED_TOOLTIP } from "@/features/productManagement/constants/params"
import { PRODUCT_QUERY_KEYS } from "@/features/productManagement/constants/queryKeys"
import { useGetProductDetail } from "@/features/productManagement/hooks/useGetProductDetail"
import {
  DEFAULT_PRODUCT_NOTICE,
  parseProductNotice,
  productService,
  type AddProductRequest,
  type ProductNotice,
} from "@/features/productManagement/services/productService"
import {
  getProductBanner,
  isDeleteBlocked,
  isProductLocked,
} from "@/features/productManagement/utils/productPermission"
import { cn } from "@/lib/utils"
import type { AxiosError } from "axios"
import { useCallback, useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import toast from "react-hot-toast"
import { useNavigate, useParams } from "react-router-dom"

interface OptionGroup {
  id: string | number
  name: string
  items: Array<OptionItem>
}

export interface ProductFormData {
  category: CategoryValue
  productName: string
  sellerProductCode: string
  regularPrice: number
  /** 옵션 그룹 사용 여부 — 끄면 기본 조합 1개로 통일된다(§11-7) */
  useOptionGroup: boolean
  optionGroups: Array<OptionGroup>
  optionCombinations: Array<OptionCombination>
  /** 옵션 미사용일 때의 단일 재고 */
  stock: number
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

  /**
   * 진행중 공구 잠금 — "진열 AND 진행중"일 때만. 나머지 3종 진열 상태는
   * 소비자에게 노출되지 않아 공구·계약과 어긋날 위험이 없으므로 잠기지 않는다(§11-9).
   */
  const isLocked = isProductLocked(
    productDetail?.displayStatus,
    productDetail?.groupBuyStatus
  )
  const deleteBlocked = isDeleteBlocked(productDetail?.groupBuyStatus)
  const banner = getProductBanner(
    productDetail?.displayStatus,
    productDetail?.groupBuyStatus,
    productDetail?.latestHideInfo?.hideReasonType
  )

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

  const { control, handleSubmit, formState, setValue, reset, watch } =
    useForm<ProductFormData>({
      reValidateMode: "onSubmit",
      defaultValues: {
        category: { main: null, sub: null, detail: null },
        productName: "",
        sellerProductCode: "",
        regularPrice: 0,
        useOptionGroup: true,
        optionGroups: [
          {
            id: crypto.randomUUID(),
            name: "",
            items: [{ id: crypto.randomUUID(), name: "", price: null }],
          },
        ],
        optionCombinations: [],
        stock: 0,
        titleImage: "",
        coverImages: [],
        description: "",
        productNotice: { ...DEFAULT_PRODUCT_NOTICE },
      },
    })

  const useOptionGroup = watch("useOptionGroup")

  const initializeForm = useCallback(() => {
    if (!productDetail || !categoryMap) {
      return
    }

    const optionGroups: Array<OptionGroup> = (
      productDetail.optionGroups ?? []
    ).map(group => ({
      id: group.optionGroupId,
      name: group.name,
      items: group.options.map(option => ({
        id: option.optionId,
        name: option.name,
        price: option.price || 0,
      })),
    }))

    const variants = productDetail.variants ?? []
    // 옵션 그룹이 없으면 옵션 미사용 상품이다 — 조합 표 대신 단일 재고만 쓴다
    const hasOptionGroups = optionGroups.length > 0

    const optionCombinations: Array<OptionCombination> = variants.map(
      variant => ({
        id: variant.variantId.toString(),
        combination: variant.name.split(",").map(v => v.trim()),
        price: variant.regularPrice.toString(),
        stock: variant.stock.toString(),
        isDisplayed: true,
        isRepresentative: variant.isRepresentative,
      })
    )

    reset({
      category: getCategoryHierarchy(productDetail.categoryId, categoryMap),
      productName: productDetail.name,
      sellerProductCode: productDetail.sellerProductCode ?? "",
      regularPrice: productDetail.regularPrice,
      useOptionGroup: hasOptionGroups,
      optionGroups: hasOptionGroups
        ? optionGroups
        : [
            {
              id: crypto.randomUUID(),
              name: "",
              items: [{ id: crypto.randomUUID(), name: "", price: null }],
            },
          ],
      optionCombinations: hasOptionGroups ? optionCombinations : [],
      stock: hasOptionGroups ? 0 : (variants[0]?.stock ?? 0),
      titleImage: productDetail.representativeImageUrl ?? "",
      coverImages: productDetail.coverImageUrls ?? [],
      description: productDetail.description ?? "",
      productNotice: parseProductNotice(productDetail.productNotice),
    })
  }, [categoryMap, productDetail, reset])

  const onSubmit = useCallback(
    async (data: ProductFormData) => {
      try {
        setIsLoading(true)

        const apiData: AddProductRequest = {
          categoryId: data.category.detail as number,
          name: data.productName,
          sellerProductCode: data.sellerProductCode || undefined,
          regularPrice: Number(data.regularPrice),
          representativeImageUrl: data.titleImage,
          coverImageUrls: data.coverImages,
          description: data.description,
          productNotice: data.productNotice,
          ...(data.useOptionGroup
            ? {
                optionGroups: data.optionGroups.map(group => ({
                  name: group.name,
                  options: group.items
                    .filter(item => item.name)
                    .map(item => ({
                      name: item.name,
                      price: Number(item.price ?? 0),
                    })),
                })),
                variants: data.optionCombinations.map(combo => ({
                  optionNames: combo.combination,
                  regularPrice: Number(combo.price),
                  stock: Number(combo.stock),
                  isRepresentative: combo.isRepresentative,
                })),
              }
            : // 옵션 미사용 — variants를 안 보내면 서버가 stock으로 단일 상품을 만든다
              { stock: Number(data.stock) }),
        }

        const apiCall = isEdit
          ? productService.updateProduct(Number(productId), apiData)
          : productService.addProduct(apiData)

        await apiCall
        toast.success(
          isEdit ? "상품 정보를 수정했습니다." : "상품 정보를 등록했습니다."
        )
        queryClient.invalidateQueries({
          queryKey: [PRODUCT_QUERY_KEYS.PRODUCT_LIST],
        })
        reset(data, { keepValues: true })
        setTimeout(() => {
          navigate("/product/list")
        }, 100)
      } catch (error) {
        throw error as AxiosError
      } finally {
        setIsLoading(false)
      }
    },
    [isEdit, navigate, productId, reset]
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

  const handleClickDelete = useCallback(async () => {
    if (!productDetail) {
      return
    }
    const result = await confirm({
      type: "warn",
      title: "상품 삭제",
      content: `${productDetail.name} 상품을 삭제합니다.\n삭제한 상품은 목록·수정 화면 어디에서도 복구할 수 없습니다.\n\n이미 발생한 주문·정산 이력이 있어도 상품 정보 자체는 사라집니다. 계속하시겠습니까?`,
      confirmText: "삭제",
    })
    if (!result) {
      return
    }
    await productService.deleteProduct(productDetail.productId)
    toast.success("상품을 삭제했습니다.")
    queryClient.invalidateQueries({
      queryKey: [PRODUCT_QUERY_KEYS.PRODUCT_LIST],
    })
    navigate("/product/list")
  }, [navigate, productDetail])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLFormElement>) => {
      if (e.key === "Enter") {
        e.preventDefault()
      }
    },
    []
  )

  useEffect(() => {
    initializeForm()
  }, [initializeForm])

  useCustomBlocker({
    condition: formState.isDirty,
    confirmOption: getDefaultCancelConfirmOptions(isEdit),
  })

  return (
    <div>
      <div className="mb-4">
        <div className="text-[20px] font-semibold text-sz-n-900">
          상품 {isEdit ? "수정" : "등록"}
        </div>
        {!isEdit && (
          <div className="mt-0.5 text-[12px] text-sz-n-600">
            등록 즉시 진열됩니다. 진열/미진열 전환은 이후 운영자만 처리할 수
            있습니다.
          </div>
        )}
      </div>

      {banner && (
        <div
          className={cn(
            "mb-4 flex max-w-[820px] gap-2 rounded-[6px] px-3.5 py-3 text-[11px] leading-relaxed",
            banner.tone === "warn"
              ? "bg-sz-warning-bg text-[#6b4d16]"
              : "bg-sz-info-bg text-sz-info-text"
          )}
        >
          <span>{banner.tone === "warn" ? "⚠" : "ⓘ"}</span>
          <span>{banner.message}</span>
        </div>
      )}

      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <Form
            handleSubmit={handleSubmit}
            onSubmit={onSubmit}
            onKeyDown={handleKeyDown}
          >
            <Section title="카테고리(한 개만 지정 가능)">
              <CategoryForm control={control} disabled={isLocked} />
            </Section>

            <Section title="기본 정보">
              <ProductNameForm control={control} disabled={isLocked} />
              <ProductNumberForm productDetail={productDetail} />
              <SellerProductCodeForm control={control} disabled={isLocked} />
            </Section>

            <Section title="가격">
              <RegularPriceForm control={control} disabled={isLocked} />
            </Section>

            <Section required title="옵션 설정">
              <OptionGroupsForm
                control={control}
                setValue={setValue}
                disabled={isLocked}
              />
            </Section>

            <Section
              required
              title={useOptionGroup ? "옵션 목록 (조합 SKU)" : "재고 수량"}
            >
              {/*
                재고 입력은 **모든 상태에서 항상 활성**이다(§11-9 확정).
                잠금 계산을 폼 전체에 걸고 재고만 예외 처리하는 순서를 지켜야 한다 —
                반대로 하면 잠금 상태에서 재고 보충 자체가 막힌다.
              */}
              <OptionCombinationsForm control={control} isLocked={isLocked} />
            </Section>

            <Section required title="상품 이미지">
              <TitleImageForm control={control} disabled={isLocked} />
              <CoverImagesForm control={control} disabled={isLocked} />
            </Section>

            <Section required title="상품 설명">
              <DescriptionForm control={control} disabled={isLocked} />
            </Section>

            <Section required title="상품 정보 제공 고시 (화장품)">
              <ProductNoticeForm control={control} disabled={isLocked} />
            </Section>

            {isLocked && (
              <p className="mt-4 text-right text-[11px] text-sz-n-600">
                저장해도 <b className="text-sz-n-900">재고 수량만</b> 반영됩니다
              </p>
            )}

            <div className="mt-6 flex items-center justify-end gap-3">
              {isEdit && (
                <Button
                  type="button"
                  variant="outline"
                  className="mr-auto text-sz-danger-text"
                  disabled={deleteBlocked}
                  title={deleteBlocked ? DELETE_BLOCKED_TOOLTIP : undefined}
                  onClick={handleClickDelete}
                >
                  상품 삭제
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={handleClickCancel}
              >
                취소
              </Button>
              <Button isLoading={isLoading} type="submit">
                {isEdit ? "수정하기" : "등록하기"}
              </Button>
            </div>
          </Form>
        </div>

        {/* 우측 레일은 수정 화면에서만 — 신규 등록은 아직 상태·이력이 없다 */}
        {isEdit && productDetail && (
          <ProductStatusRail detail={productDetail} />
        )}
      </div>
    </div>
  )
}
