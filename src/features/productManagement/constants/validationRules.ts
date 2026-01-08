import type { CategoryValue } from "@/common/components/Form/FormCategorySelector"

export const PRODUCT_VALIDATION_RULES = {
  category: {
    validate: (value: CategoryValue) =>
      value.detail !== null || "카테고리를 선택해 주세요",
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
  titleImage: {
    required: "대표 이미지를 선택해 주세요.",
  },
  coverImages: {
    required: "커버 이미지를 선택해 주세요.",
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
