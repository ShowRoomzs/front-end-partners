import {
  confirm,
  type ConfirmOptions,
} from "@/common/components/ConfirmModal/confirm"
import Form from "@/common/components/Form/Form"
import type { CategoryValue } from "@/common/components/Form/FormCategorySelector"
import { useCustomBlocker } from "@/common/hooks/useCustomBlocker"
import { useGetCategory } from "@/common/hooks/useGetCategory"
import { queryClient } from "@/common/lib/queryClient"
import { getCategoryHierarchy } from "@/common/utils/getCategoryHierarchy"
import { Button } from "@/components/ui/button"
import { useGetMarketInfo } from "@/features/auth/hooks/useGetMarketInfo"
import CategoryForm from "@/features/productManagement/components/CategoryForm/CategoryForm"
import CoverImagesForm from "@/features/productManagement/components/CoverImagesForm/CoverImagesForm"
import DescriptionForm from "@/features/productManagement/components/DescriptionForm/DescriptionForm"
import OptionCombinationsForm from "@/features/productManagement/components/OptionCombinationsForm/OptionCombinationsForm"
import OptionGroupsForm from "@/features/productManagement/components/OptionGroupsForm/OptionGroupsForm"
import ProductNameForm from "@/features/productManagement/components/ProductNameForm/ProductNameForm"
import ProductNoticeForm from "@/features/productManagement/components/ProductNoticeForm/ProductNoticeForm"
import {
  ProductFormCard,
  ProductSection,
} from "@/features/productManagement/components/ProductFormLayout/ProductFormLayout"
import ProductStatusRail from "@/features/productManagement/components/ProductStatusRail/ProductStatusRail"
import RegularPriceForm from "@/features/productManagement/components/RegularPriceForm/RegularPriceForm"
import SaveButton from "@/features/productManagement/components/SaveButton/SaveButton"
import SellerProductCodeForm from "@/features/productManagement/components/SellerProductCodeForm/SellerProductCodeForm"
import TitleImageForm from "@/features/productManagement/components/TitleImageForm/TitleImageForm"
import {
  DELETE_BLOCKED_TOOLTIP,
  PRODUCT_DISPLAY_STATUS,
  PRODUCT_GROUP_BUY_STATUS,
} from "@/features/productManagement/constants/params"
import { PRODUCT_QUERY_KEYS } from "@/features/productManagement/constants/queryKeys"
import { useGetProductDetail } from "@/features/productManagement/hooks/useGetProductDetail"
import {
  DEFAULT_PRODUCT_NOTICE,
  parseProductNotice,
  productService,
  type AddProductRequest,
  type ProductNotice,
} from "@/features/productManagement/services/productService"
import type {
  OptionCombination,
  OptionGroup,
} from "@/features/productManagement/types"
import {
  getProductBanner,
  getSaveHint,
  isDeleteBlocked,
  isProductLocked,
} from "@/features/productManagement/utils/productPermission"
import { cn } from "@/lib/utils"
import type { AxiosError } from "axios"
import { useCallback, useEffect, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import toast from "react-hot-toast"
import { useNavigate, useParams } from "react-router-dom"

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

function createEmptyOptionGroup(): OptionGroup {
  return {
    id: crypto.randomUUID(),
    name: "",
    items: [{ id: crypto.randomUUID(), name: "" }],
  }
}

export default function RegisterProductPage() {
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const { productId } = useParams<{ productId?: string }>()
  const { data: productDetail } = useGetProductDetail(Number(productId))
  const { categoryMap } = useGetCategory()
  const { data: marketInfo } = useGetMarketInfo()
  const isEdit = !!productId

  /**
   * 이미 사용자에게 물어본 이탈은 블로커가 다시 붙잡지 않도록 표시한다.
   *
   * 취소·삭제는 자체 confirm()을 띄운 뒤 navigate()를 부르는데, 그 이동을
   * useCustomBlocker가 또 가로채 같은 확인창을 한 번 더 띄우고 있었다
   * (그래서 취소를 두 번 눌러야 나가졌다).
   */
  const bypassBlockerRef = useRef(false)

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
  const saveHint = getSaveHint(
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

  const { control, handleSubmit, formState, setValue, reset } =
    useForm<ProductFormData>({
      reValidateMode: "onSubmit",
      defaultValues: {
        category: { main: null, sub: null, detail: null },
        productName: "",
        sellerProductCode: "",
        regularPrice: 0,
        useOptionGroup: true,
        optionGroups: [createEmptyOptionGroup()],
        optionCombinations: [],
        stock: 0,
        titleImage: "",
        coverImages: [],
        description: "",
        productNotice: { ...DEFAULT_PRODUCT_NOTICE },
      },
    })

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
      })),
    }))

    const variants = productDetail.variants ?? []
    // 옵션 그룹이 없으면 옵션 미사용 상품이다 — 조합 표 대신 단일 재고만 쓴다
    const hasOptionGroups = optionGroups.length > 0

    const optionCombinations: Array<OptionCombination> = variants.map(
      variant => ({
        id: variant.variantId.toString(),
        combination: variant.name.split(",").map(v => v.trim()),
        // 서버는 옵션가가 더해진 절대 판매가를 준다 — 폼은 추가금으로 다룬다
        extraPrice: Math.max(
          0,
          variant.regularPrice - productDetail.regularPrice
        ),
        stock: variant.stock,
        isRepresentative: variant.isRepresentative,
      })
    )

    reset({
      category: getCategoryHierarchy(productDetail.categoryId, categoryMap),
      productName: productDetail.name,
      sellerProductCode: productDetail.sellerProductCode ?? "",
      regularPrice: productDetail.regularPrice,
      useOptionGroup: hasOptionGroups,
      optionGroups: hasOptionGroups ? optionGroups : [createEmptyOptionGroup()],
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
                    // 옵션 항목 단위 가격은 쓰지 않는다 — 가격은 조합(SKU) 단위다
                    .map(item => ({ name: item.name, price: 0 })),
                })),
                variants: data.optionCombinations.map(combo => ({
                  optionNames: combo.combination,
                  // 폼의 옵션가(추가금)를 서버 계약인 절대 판매가로 되돌린다
                  regularPrice:
                    Number(data.regularPrice) + Number(combo.extraPrice),
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
      // 방금 물어봤으니 블로커는 건너뛴다
      bypassBlockerRef.current = true
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
    // 삭제 확인창을 이미 거쳤으니 이탈 확인창을 또 띄우지 않는다
    bypassBlockerRef.current = true
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

  /**
   * 소비자상담 전화번호는 가입 시 등록한 고객센터 번호로 채운다(수정 가능).
   * 신규 등록에서 값이 비어 있을 때만 넣는다 — 수정 화면에서 브랜드가 다른 번호로
   * 바꿔 저장해 둔 걸 덮어쓰면 안 된다.
   */
  useEffect(() => {
    if (isEdit || !marketInfo?.csNumber) {
      return
    }
    setValue("productNotice.customerServicePhone", marketInfo.csNumber)
  }, [isEdit, marketInfo?.csNumber, setValue])

  useCustomBlocker({
    condition: formState.isDirty,
    confirmOption: getDefaultCancelConfirmOptions(isEdit),
    bypassRef: bypassBlockerRef,
  })

  const pageDescription = isEdit
    ? productDetail && (
        <>
          진열 상태:{" "}
          <b className="font-semibold text-sz-n-900">
            {PRODUCT_DISPLAY_STATUS[productDetail.displayStatus]}
          </b>{" "}
          · 공구 상태:{" "}
          <b className="font-semibold text-sz-n-900">
            {PRODUCT_GROUP_BUY_STATUS[productDetail.groupBuyStatus]}
          </b>
        </>
      )
    : "등록 즉시 진열됩니다. 진열/미진열 전환은 이후 운영자만 처리할 수 있습니다."

  return (
    <div>
      <div className="mb-4">
        <div className="text-[20px] font-semibold text-sz-n-900">
          상품 {isEdit ? "수정" : "등록"}
        </div>
        {pageDescription && (
          <div className="mt-0.5 text-[12px] text-sz-n-600">
            {pageDescription}
          </div>
        )}
      </div>

      {/*
        시안 `.form-layout` — 폼 카드 + 300px 우측 레일.
        레일이 없는 등록 화면에서도 같은 격자를 쓴다. 등록·수정이 같은 화면인데
        카드 폭이 300px씩 달라지면 오가는 동안 레이아웃이 튄다.
      */}
      <div className="grid grid-cols-[minmax(0,1fr)_300px] items-start gap-4">
        <div className="min-w-0">
          {/* 배너는 좌측 컬럼 안에 둔다 — 우측 레일까지 덮으면 카드와 좌우가 어긋난다 */}
          {banner && (
            <div
              className={cn(
                "mb-4 flex gap-2 rounded-[6px] px-3.5 py-3 text-[11px] leading-relaxed",
                banner.tone === "warn"
                  ? "bg-sz-warning-bg text-[#6b4d16]"
                  : "bg-sz-info-bg text-sz-info-text"
              )}
            >
              <span>{banner.tone === "warn" ? "⚠" : "ⓘ"}</span>
              <span>{banner.message}</span>
            </div>
          )}

          <Form
            handleSubmit={handleSubmit}
            onSubmit={onSubmit}
            onKeyDown={handleKeyDown}
          >
            {/* 섹션 순서는 시안 B1 그대로 — 기본 정보 → 가격 → 이미지 → 옵션 → 설명 → 고시 */}
            <ProductFormCard>
              <ProductSection title="기본 정보">
                <ProductNameForm control={control} disabled={isLocked} />
                <SellerProductCodeForm control={control} disabled={isLocked} />
                <CategoryForm control={control} disabled={isLocked} />
              </ProductSection>

              <ProductSection title="가격">
                <RegularPriceForm control={control} disabled={isLocked} />
              </ProductSection>

              <ProductSection
                required
                title="상품 이미지"
                description="권장 크기 1000×1000px(1:1 비율) · 제한 개수 대표 1개 · 커버 4개 · 제한 용량 각 1MB 이하 · 허용 확장자 JPG, PNG"
              >
                <TitleImageForm control={control} disabled={isLocked} />
                <CoverImagesForm control={control} disabled={isLocked} />
              </ProductSection>

              <ProductSection title="옵션">
                <OptionGroupsForm
                  control={control}
                  setValue={setValue}
                  disabled={isLocked}
                />
                {/*
                  재고 입력은 **모든 상태에서 항상 활성**이다(§11-9 확정).
                  잠금 계산을 폼 전체에 걸고 재고만 예외 처리하는 순서를 지켜야 한다 —
                  반대로 하면 잠금 상태에서 재고 보충 자체가 막힌다.
                */}
                <OptionCombinationsForm control={control} isLocked={isLocked} />
              </ProductSection>

              <ProductSection required title="상품 설명">
                <DescriptionForm control={control} disabled={isLocked} />
              </ProductSection>

              <ProductSection
                required
                title="상품 정보 제공 고시"
                note="(화장품)"
              >
                <ProductNoticeForm control={control} disabled={isLocked} />
              </ProductSection>

              {/* 시안 `.btn-row` — 삭제는 좌측 끝, 취소·저장은 우측. 버튼 높이 32px */}
              <div className="flex items-center justify-end gap-2.5 p-5">
                {isEdit && (
                  /*
                    툴팁은 버튼이 아니라 감싼 span에 건다.
                    Button은 disabled일 때 pointer-events-none이라 버튼 자신에
                    title을 걸면 hover가 잡히지 않아 "왜 삭제가 막혔는지"가
                    영영 안 보인다 — 차단 이유를 알려주는 게 이 툴팁의 전부다.
                  */
                  <span
                    className="mr-auto"
                    title={deleteBlocked ? DELETE_BLOCKED_TOOLTIP : undefined}
                  >
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      /*
                        시안 `.btn-danger`는 흰 배경 + 빨간 테두리·글자다(solid 아님).
                        solid 빨강인 destructive variant와는 다른 물건이라 여기서만 덧칠한다.
                      */
                      className="border-sz-danger-bg text-sz-danger-text hover:bg-sz-danger-bg hover:text-sz-danger-text"
                      disabled={deleteBlocked}
                      onClick={handleClickDelete}
                    >
                      상품 삭제
                    </Button>
                  </span>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleClickCancel}
                >
                  취소
                </Button>
                <SaveButton control={control} isLoading={isLoading} />
              </div>
            </ProductFormCard>

            {/* 시안 `.save-hint` — 저장을 누르면 무슨 일이 생기는지 경우별 예고 */}
            {saveHint && (
              <p className="mt-3 text-right text-[11px] text-sz-n-600">
                {saveHint}
              </p>
            )}
          </Form>
        </div>

        {/* 우측 레일 자리 — 내용은 수정 화면에서만(신규 등록은 아직 상태·이력이 없다) */}
        <div>
          {isEdit && productDetail && (
            <ProductStatusRail detail={productDetail} />
          )}
        </div>
      </div>
    </div>
  )
}
