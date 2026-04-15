import { useQuery } from "@tanstack/react-query"
import { INQUIRY_QUERY_KEYS } from "@/features/inquiry/constants/queryKeys"
import {
  answerTemplateService,
  type AnswerTemplateListParams,
} from "@/features/inquiry/services/answerTemplateService"

export function useGetAnswerTemplateList(params: AnswerTemplateListParams) {
  return useQuery({
    queryKey: [INQUIRY_QUERY_KEYS.ANSWER_TEMPLATE_LIST, params],
    queryFn: () => answerTemplateService.getAnswerTemplateList(params),
  })
}
