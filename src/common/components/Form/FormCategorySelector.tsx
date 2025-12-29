import { forwardRef } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { SelectOption } from './FormSelect'

interface CategoryData {
  mainCategories: Array<SelectOption>
  subCategories: Record<string, Array<SelectOption>>
  detailCategories: Record<string, Array<SelectOption>>
}

interface FormCategorySelectorProps {
  categoryData: CategoryData
  onChange?: (values: { main: string; sub: string; detail: string }) => void
  value?: {
    main: string
    sub: string
    detail: string
  }
}

const FormCategorySelector = forwardRef<
  HTMLButtonElement,
  FormCategorySelectorProps
>((props, ref) => {
  const { categoryData, onChange, value } = props

  const mainCategory = value?.main || ''
  const subCategory = value?.sub || ''
  const detailCategory = value?.detail || ''

  const subOptions = mainCategory
    ? categoryData.subCategories[mainCategory] || []
    : []
  const detailOptions = subCategory
    ? categoryData.detailCategories[subCategory] || []
    : []

  const handleMainChange = (newMain: string) => {
    onChange?.({ main: newMain, sub: '', detail: '' })
  }

  const handleSubChange = (newSub: string) => {
    onChange?.({ main: mainCategory, sub: newSub, detail: '' })
  }

  const handleDetailChange = (newDetail: string) => {
    onChange?.({ main: mainCategory, sub: subCategory, detail: newDetail })
  }

  return (
    <div className="flex items-center gap-3">
      <Select value={mainCategory} onValueChange={handleMainChange}>
        <SelectTrigger ref={ref} className="flex-1">
          <SelectValue placeholder="대분류 선택" />
        </SelectTrigger>
        <SelectContent position="popper" sideOffset={4}>
          {categoryData.mainCategories.map(option => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <span className="text-muted-foreground">&gt;</span>

      <Select
        value={subCategory}
        onValueChange={handleSubChange}
        disabled={!mainCategory}
      >
        <SelectTrigger className="flex-1">
          <SelectValue placeholder="중분류 선택" />
        </SelectTrigger>
        <SelectContent position="popper" sideOffset={4}>
          {subOptions.map(option => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <span className="text-muted-foreground">&gt;</span>

      <Select
        value={detailCategory}
        onValueChange={handleDetailChange}
        disabled={!subCategory}
      >
        <SelectTrigger className="flex-1">
          <SelectValue placeholder="소분류 선택" />
        </SelectTrigger>
        <SelectContent position="popper" sideOffset={4}>
          {detailOptions.map(option => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
})

FormCategorySelector.displayName = 'FormCategorySelector'

export default FormCategorySelector
