import type { Control } from "react-hook-form"
import { parseMapToOptions } from "@/common/utils/parseMapToOptions"
import FormController from "@/common/components/Form/FormController"
import FormItem from "@/common/components/Form/FormItem"
import FormSelect from "@/common/components/Form/FormSelect"
import {
  ANSWER_TEMPLATE_CATEGORY,
  type AnswerTemplateCategory,
} from "@/features/inquiry/constants/answerTemplate"
import type { AnswerTemplateUpsertRequest } from "@/features/inquiry/services/answerTemplateService"

interface AnswerTemplateCategoryFormProps {
  control: Control<AnswerTemplateUpsertRequest>
}

const categoryOptions = parseMapToOptions(ANSWER_TEMPLATE_CATEGORY)

export default function AnswerTemplateCategoryForm(
  props: AnswerTemplateCategoryFormProps
) {
  const { control } = props

  return (
    <FormController
      control={control}
      name="category"
      rules={{
        required: "카테고리를 선택해 주세요.",
      }}
      render={({ field, fieldState }) => (
        <FormItem label="카테고리" required error={fieldState.error?.message}>
          <FormSelect
            value={field.value}
            options={categoryOptions}
            placeholder="카테고리를 선택해 주세요."
            onChange={value => field.onChange(value as AnswerTemplateCategory)}
          />
        </FormItem>
      )}
    />
  )
}
