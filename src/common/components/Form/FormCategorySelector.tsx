import { forwardRef, useMemo, useState, useEffect } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { CategoryMap } from "@/common/hooks/useGetCategory"

interface FormCategorySelectorProps {
  categoryMap: CategoryMap | null
  onChange?: (data: {
    main: number | null
    sub: number | null
    detail: number | null
  }) => void
  value?: number
}

const FormCategorySelector = forwardRef<
  HTMLButtonElement,
  FormCategorySelectorProps
>((props, ref) => {
  const { categoryMap, onChange, value } = props

  const initialState = useMemo(() => {
    if (!value || !categoryMap) {
      return { main: null, sub: null, detail: null }
    }

    const detail = categoryMap.byId.get(value)
    if (!detail) return { main: null, sub: null, detail: null }

    const sub = detail.parentId ? categoryMap.byId.get(detail.parentId) : null
    const main = sub?.parentId ? categoryMap.byId.get(sub.parentId) : null

    return {
      main: main?.categoryId ?? null,
      sub: sub?.categoryId ?? null,
      detail: detail.categoryId,
    }
  }, [value, categoryMap])

  const [selectedMain, setSelectedMain] = useState<number | null>(
    initialState.main
  )
  const [selectedSub, setSelectedSub] = useState<number | null>(
    initialState.sub
  )
  const [selectedDetail, setSelectedDetail] = useState<number | null>(
    initialState.detail
  )
  const [prevValue, setPrevValue] = useState<number | undefined>(value)

  // value prop이 외부에서 변경되었을 때만 내부 상태 동기화
  useEffect(() => {
    if (value !== prevValue) {
      setPrevValue(value)
      setSelectedMain(initialState.main)
      setSelectedSub(initialState.sub)
      setSelectedDetail(initialState.detail)
    }
  }, [value, prevValue, initialState])

  const subCategories = useMemo(() => {
    if (!selectedMain || !categoryMap) return []
    return categoryMap.byParentId.get(selectedMain) || []
  }, [selectedMain, categoryMap])

  const detailCategories = useMemo(() => {
    if (!selectedSub || !categoryMap) return []
    return categoryMap.byParentId.get(selectedSub) || []
  }, [selectedSub, categoryMap])

  const handleMainChange = (mainStr: string) => {
    const main = Number(mainStr)
    setSelectedMain(main)
    setSelectedSub(null)
    setSelectedDetail(null)
    onChange?.({ main, sub: null, detail: null })
  }

  const handleSubChange = (subStr: string) => {
    const sub = Number(subStr)
    setSelectedSub(sub)
    setSelectedDetail(null)
    onChange?.({ main: selectedMain, sub, detail: null })
  }

  const handleDetailChange = (detailStr: string) => {
    const detail = Number(detailStr)
    setSelectedDetail(detail)
    onChange?.({ main: selectedMain, sub: selectedSub, detail })
  }
  if (!categoryMap) {
    return (
      <div className="text-sm text-muted-foreground">카테고리 로딩 중...</div>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <Select
        value={selectedMain?.toString() ?? ""}
        onValueChange={handleMainChange}
      >
        <SelectTrigger ref={ref} className="flex-1">
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

      <span className="text-muted-foreground">&gt;</span>

      <Select
        value={selectedSub?.toString() ?? ""}
        onValueChange={handleSubChange}
        disabled={!selectedMain}
      >
        <SelectTrigger className="flex-1">
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

      <span className="text-muted-foreground">&gt;</span>

      <Select
        value={selectedDetail?.toString() ?? ""}
        onValueChange={handleDetailChange}
        disabled={!selectedSub}
      >
        <SelectTrigger className="flex-1">
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
