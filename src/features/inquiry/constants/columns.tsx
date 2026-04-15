import type { Columns } from "@/common/components/Table/types"
import { formatDate } from "@/common/utils/formatDate"
import type { AnswerTemplateItem } from "@/features/inquiry/services/answerTemplateService"

export const ANSWER_TEMPLATE_COLUMNS: Columns<AnswerTemplateItem> = [
  {
    key: "title",
    label: "템플릿 제목",
  },
  {
    key: "categoryName",
    label: "카테고리",
  },
  {
    key: "isActive",
    label: "사용 여부",
    align: "center",
    render: value => ((value as boolean) ? "사용" : "미사용"),
  },
  {
    key: "createdAt",
    label: "등록일",
    render: value => formatDate(new Date(value as string)),
  },
  {
    key: "modifiedAt",
    label: "수정일",
    render: value => formatDate(new Date(value as string)),
  },
]
