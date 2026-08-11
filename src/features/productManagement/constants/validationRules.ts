import type { CategoryValue } from "@/common/components/Form/FormCategorySelector"
import type {
  OptionCombination,
  OptionItem,
} from "@/features/productManagement/types"
import {
  PRICE_MAX,
  PRODUCT_NAME_MAX_LENGTH,
  PRODUCT_NOTICE_FIELDS,
} from "@/features/productManagement/constants/params"

/** 고시 11필드는 전부 필수라 "정보 누락" 상태가 성립하지 않는다(§11-8) */
const productNoticeRules = Object.fromEntries(
  PRODUCT_NOTICE_FIELDS.map(field => [
    field.key,
    { required: `${field.label}을(를) 입력해 주세요.` },
  ])
) as Record<string, { required: string }>

export const PRODUCT_VALIDATION_RULES = {
  category: {
    validate: (value: CategoryValue | null) =>
      value?.detail !== null || "카테고리를 선택해 주세요",
  },
  productName: {
    required: "상품명을 입력해 주세요",
    maxLength: {
      value: PRODUCT_NAME_MAX_LENGTH,
      message: `상품명은 최대 ${PRODUCT_NAME_MAX_LENGTH}자까지 입력 가능합니다`,
    },
  },
  regularPrice: {
    required: "정가를 입력해 주세요",
    validate: (value: number) => {
      if (Number(value) <= 0) {
        return "정가를 입력해 주세요"
      }
      // 상한 초과는 입력 단계에서 이미 거부되지만, 붙여넣기 등 우회 경로를 위해 한 번 더 막는다
      if (Number(value) > PRICE_MAX) {
        return `정가는 최대 ${PRICE_MAX.toLocaleString()}원까지 입력 가능합니다`
      }
      return true
    },
  },
  optionCombinations: {
    validate: (
      value: Array<OptionCombination>,
      formValues: {
        useOptionGroup: boolean
        optionGroups: Array<{
          name: string
          items: Array<OptionItem>
        }>
      }
    ) => {
      // 옵션 미사용이면 조합 표는 기본 조합 1행뿐이라 검증 대상이 아니다
      if (!formValues.useOptionGroup) {
        return true
      }

      const validOptionGroups = formValues.optionGroups.filter(
        group => group.name && group.items.some(item => item.name)
      )

      if (validOptionGroups.length === 0) {
        return true
      }

      /*
        조합은 그룹·항목을 입력하는 즉시 자동 생성된다(OptionGroupsForm의 effect).
        그래도 0건이면 그룹명이나 항목이 아직 안 채워진 상태다 — 조합을 만들라고
        시키는 대신 무엇이 비었는지 알려준다.
      */
      if (value.length === 0) {
        return "옵션 그룹의 그룹명과 항목을 모두 입력해 주세요"
      }

      const currentOptionNames = validOptionGroups.map(group =>
        group.items
          .filter(item => item.name.trim())
          .map(item => item.name.trim())
      )
      for (const combination of value) {
        if (combination.combination.length !== currentOptionNames.length) {
          return "옵션 설정이 변경되었습니다. 옵션 그룹을 다시 확인해 주세요"
        }

        for (let i = 0; i < combination.combination.length; i++) {
          const comboItem = combination.combination[i].trim()
          if (!currentOptionNames[i].includes(comboItem)) {
            return "옵션 설정이 변경되었습니다. 옵션 그룹을 다시 확인해 주세요"
          }
        }
      }

      return true
    },
  },
  titleImage: {
    required: "대표 이미지를 선택해 주세요.",
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
  productNotice: productNoticeRules,
  description: {
    required: "상세설명을 입력해 주세요.",
  },
} as const
