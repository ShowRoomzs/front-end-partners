import { apiInstance } from "@/common/lib/apiInstance"
import type { BaseParams, PageResponse } from "@/common/types/page"
import type {
  AnswerTemplateCategory,
  AnswerTemplateCategoryFilter,
} from "@/features/inquiry/constants/answerTemplate"

export interface AnswerTemplateItem {
  templateId: number
  title: string
  category: AnswerTemplateCategory
  categoryName: string
  content: string
  createdAt: string
  modifiedAt: string
  isActive: boolean
}

export interface AnswerTemplateListParams extends BaseParams {
  includeInactive: boolean
  category: AnswerTemplateCategoryFilter
  keyword: string
}

export type AnswerTemplateListResponse = PageResponse<AnswerTemplateItem>
export type AnswerTemplateDetailResponse = AnswerTemplateItem

export interface AnswerTemplateUpsertRequest {
  title: string
  category: AnswerTemplateCategory
  content: string
  isActive: boolean
}

interface DeleteAnswerTemplatesParams {
  templateIds: Array<number>
}

export const answerTemplateService = {
  getAnswerTemplateList: async (params: AnswerTemplateListParams) => {
    const { data: response } =
      await apiInstance.get<AnswerTemplateListResponse>(
        "/seller/answer-templates",
        {
          params,
        }
      )

    return response
  },
  getAnswerTemplateDetail: async (templateId: number) => {
    const { data: response } =
      await apiInstance.get<AnswerTemplateDetailResponse>(
        `/seller/answer-templates/${templateId}`
      )

    return response
  },
  createAnswerTemplate: async (body: AnswerTemplateUpsertRequest) => {
    const { data: response } = await apiInstance.post(
      "/seller/answer-templates",
      body
    )

    return response
  },
  updateAnswerTemplate: async (
    templateId: number,
    body: AnswerTemplateUpsertRequest
  ) => {
    const { data: response } = await apiInstance.put(
      `/seller/answer-templates/${templateId}`,
      body
    )

    return response
  },
  deleteAnswerTemplates: async (templateIds: Array<number>) => {
    const { data: response } = await apiInstance.delete(
      "/seller/answer-templates",
      {
        data: { templateIds },
      }
    )

    return response
  },
}
