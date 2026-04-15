import type { BaseParams } from "@/common/types/page"
import type { FilterOptionGroup } from "@/common/components/FilterCard/FilterCard"
import { parseMapToOptions } from "@/common/utils/parseMapToOptions"
import type { Option } from "@/common/types/option"
import {
  ANSWER_TEMPLATE_CATEGORY,
  ANSWER_TEMPLATE_INCLUDE_INACTIVE,
  type AnswerTemplateCategory,
  type IncludeInactiveOption,
} from "@/features/inquiry/constants/answerTemplate"

export interface AnswerTemplateListSearchParams extends BaseParams {
  includeInactive: IncludeInactiveOption
  category: AnswerTemplateCategory | "ALL"
  keyword: string
}

const ANSWER_TEMPLATE_CATEGORY_OPTIONS: Array<Option<string | null>> = [
  {
    label: "전체",
    value: "ALL",
  },
  ...Object.entries(ANSWER_TEMPLATE_CATEGORY).map(([key, label]) => ({
    label,
    value: key,
  })),
]

export const ANSWER_TEMPLATE_FILTER_OPTIONS: FilterOptionGroup<AnswerTemplateListSearchParams> =
  {
    카테고리: [
      {
        type: "select",
        key: "category",
        options: ANSWER_TEMPLATE_CATEGORY_OPTIONS,
      },
    ],
    "미사용 포함 여부": [
      {
        type: "radio",
        key: "includeInactive",
        options: parseMapToOptions(ANSWER_TEMPLATE_INCLUDE_INACTIVE),
      },
    ],
    검색어: [
      {
        type: "input",
        key: "keyword",
        placeholder: "템플릿 제목 또는 내용을 입력하세요",
      },
    ],
  }
