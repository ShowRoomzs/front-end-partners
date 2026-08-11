import { forwardRef, useMemo, useCallback } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { type CategoryMap } from "@/common/hooks/useGetCategory"

export interface CategoryValue {
  main: number | null
  sub: number | null
  detail: number | null
}

interface FormCategorySelectorProps {
  categoryMap: CategoryMap | null
  onChange?: (data: CategoryValue) => void
  value?: CategoryValue
  /** 전체 잠금 — 상위 선택 여부와 무관하게 3단 모두 막는다 */
  disabled?: boolean
}

const FormCategorySelector = forwardRef<
  HTMLButtonElement,
  FormCategorySelectorProps
>((props, ref) => {
  const { onChange, value, categoryMap, disabled = false } = props

  const mainCategoryId = value?.main
  const subCategoryId = value?.sub

  const subCategories = useMemo(() => {
    if (!categoryMap || !mainCategoryId) return []

    return categoryMap.byParentId.get(mainCategoryId) || []
  }, [categoryMap, mainCategoryId])

  const detailCategories = useMemo(() => {
    if (!categoryMap || !subCategoryId) return []

    return categoryMap.byParentId.get(subCategoryId) || []
  }, [categoryMap, subCategoryId])

  const handleChangeMain = useCallback(
    (mainStr: string) => {
      if (!mainStr) return
      onChange?.({
        main: Number(mainStr),
        sub: null,
        detail: null,
      })
    },
    [onChange]
  )

  const handleChangeSub = useCallback(
    (subStr: string) => {
      if (!subStr) return
      onChange?.({
        main: value?.main as number,
        sub: Number(subStr),
        detail: null,
      })
    },
    [onChange, value]
  )

  const handleChangeDetail = useCallback(
    (detailStr: string) => {
      if (!detailStr) return
      onChange?.({
        main: value?.main as number,
        sub: value?.sub as number,
        detail: Number(detailStr),
      })
    },
    [onChange, value]
  )

  if (!categoryMap) {
    return (
      <div className="text-sm text-muted-foreground">카테고리 로딩 중...</div>
    )
  }

  // 시안 `.two-col` — 셀렉트 3개가 12px 간격으로 나란히 놓일 뿐, 사이에 구분자가 없다
  return (
    <div className="flex items-center gap-3">
      <Select
        value={value?.main?.toString()}
        onValueChange={handleChangeMain}
        disabled={disabled}
      >
        <SelectTrigger ref={ref} className="max-w-[150px] flex-1">
          <SelectValue placeholder="대분류 선택" />
        </SelectTrigger>
        <SelectContent position="popper" sideOffset={4}>
          {categoryMap.mainCategories.map(category => (
            <SelectItem
              key={category.categoryId}
              value={category.categoryId.toString()}
            >
              {category.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={value?.sub?.toString()}
        onValueChange={handleChangeSub}
        disabled={disabled || !value?.main}
      >
        <SelectTrigger className="max-w-[150px] flex-1">
          <SelectValue placeholder="중분류 선택" />
        </SelectTrigger>
        <SelectContent position="popper" sideOffset={4}>
          {subCategories.map(category => (
            <SelectItem
              key={category.categoryId}
              value={category.categoryId.toString()}
            >
              {category.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={value?.detail?.toString() ?? ""}
        onValueChange={handleChangeDetail}
        disabled={disabled || !value?.sub}
      >
        <SelectTrigger className="max-w-[150px] flex-1">
          <SelectValue placeholder="소분류 선택" />
        </SelectTrigger>
        <SelectContent position="popper" sideOffset={4}>
          {detailCategories.map(category => (
            <SelectItem
              key={category.categoryId}
              value={category.categoryId.toString()}
            >
              {category.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
})

FormCategorySelector.displayName = "FormCategorySelector"

export default FormCategorySelector
