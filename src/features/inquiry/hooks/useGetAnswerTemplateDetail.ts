import { useQuery } from "@tanstack/react-query"
import { INQUIRY_QUERY_KEYS } from "@/features/inquiry/constants/queryKeys"
import { answerTemplateService } from "@/features/inquiry/services/answerTemplateService"

export function useGetAnswerTemplateDetail(
  templateId: number,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: [INQUIRY_QUERY_KEYS.ANSWER_TEMPLATE_DETAIL, templateId],
    queryFn: () => answerTemplateService.getAnswerTemplateDetail(templateId),
    enabled,
  })
}
