import type { CategoryValue } from "@/common/components/Form/FormCategorySelector"
import type { OptionItem } from "@/common/components/Form/FormOptionTable"
import type { OptionCombination } from "@/common/components/Form/FormOptionCombinationTable"

export const PRODUCT_VALIDATION_RULES = {
  category: {
    validate: (value: CategoryValue | null) =>
      value?.detail !== null || "카테고리를 선택해 주세요",
  },
  productName: {
    required: "상품명을 입력해 주세요",
    maxLength: {
      value: 100,
      message: "상품명은 최대 100자까지 입력 가능합니다",
    },
  },
  regularPrice: {
    required: "판매가를 입력해 주세요",
    validate: (value: number) =>
      value >= 100 || "판매가는 100원 이상이어야 합니다",
  },
  optionCombinations: {
    validate: (
      value: Array<OptionCombination>,
      formValues: {
        optionGroups: Array<{
          name: string
          items: Array<OptionItem>
        }>
      }
    ) => {
      const validOptionGroups = formValues.optionGroups.filter(
        group => group.name && group.items.some(item => item.name)
      )

      if (validOptionGroups.length === 0) {
        return true
      }

      if (value.length === 0) {
        return "'옵션 목록으로 이동' 버튼을 눌러주세요"
      }

      const validItems = validOptionGroups.map(group =>
        group.items.filter(item => item.name.trim())
      )

      const expectedCombinationCount = validItems.reduce(
        (acc, items) => acc * items.length,
        1
      )

      if (value.length !== expectedCombinationCount) {
        return "옵션 설정이 변경되었습니다. '옵션 목록으로 이동' 버튼을 눌러주세요"
      }

      const currentOptionNames = validOptionGroups.map(group =>
        group.items
          .filter(item => item.name.trim())
          .map(item => item.name.trim())
      )
      for (const combination of value) {
        if (combination.combination.length !== currentOptionNames.length) {
          return "옵션 설정이 변경되었습니다. '옵션 목록으로 이동' 버튼을 눌러주세요"
        }

        for (let i = 0; i < combination.combination.length; i++) {
          const comboItem = combination.combination[i].trim()
          if (!currentOptionNames[i].includes(comboItem)) {
            return "옵션 설정이 변경되었습니다. '옵션 목록으로 이동' 버튼을 눌러주세요"
          }
        }
      }

      return true
    },
  },
  titleImage: {
    required: "대표 이미지를 선택해 주세요.",
  },
  coverImages: {
    required: "커버 이미지를 선택해 주세요.",
  },
  optionGroupName: {
    required: "옵션명을 입력해 주세요",
  },
  optionGroupItems: {
    validate: (value: Array<OptionItem>) => {
      if (!value || value.length === 0) {
        return "옵션 항목을 추가해 주세요"
      }
      const hasFilledItem = value.some(item => item.name.trim() !== "")
      if (!hasFilledItem) {
        return "옵션 항목을 입력해 주세요"
      }
      return true
    },
  },
  productNotice: {
    origin: {
      required: "제조국을 입력해 주세요.",
    },
    material: {
      required: "소재를 입력해 주세요.",
    },
    color: {
      required: "색상을 입력해 주세요.",
    },
    size: {
      required: "치수를 입력해 주세요.",
    },
    manufacturer: {
      required: "제조자를 입력해 주세요.",
    },
    washingMethod: {
      required: "세탁 방법을 입력해 주세요.",
    },
    manufactureDate: {
      required: "제조년월을 입력해 주세요.",
    },
    asInfo: {
      required: "A/S안내 및 연락처를 입력해 주세요.",
    },
    qualityAssurance: {
      required: "품질 보증 기준을 입력해 주세요.",
    },
  },
  description: {
    required: "상세설명을 입력해 주세요.",
  },
} as const
