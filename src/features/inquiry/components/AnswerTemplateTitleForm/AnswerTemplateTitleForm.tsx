import type { Control } from "react-hook-form"
import FormController from "@/common/components/Form/FormController"
import FormItem from "@/common/components/Form/FormItem"
import FormInput from "@/common/components/Form/FormInput"
import type { AnswerTemplateUpsertRequest } from "@/features/inquiry/services/answerTemplateService"

interface AnswerTemplateTitleFormProps {
  control: Control<AnswerTemplateUpsertRequest>
}

export default function AnswerTemplateTitleForm(
  props: AnswerTemplateTitleFormProps
) {
  const { control } = props

  return (
    <FormController
      control={control}
      name="title"
      rules={{
        required: "템플릿 제목을 입력해 주세요.",
        maxLength: {
          value: 100,
          message: "템플릿 제목은 100자 이내로 입력해 주세요.",
        },
      }}
      render={({ field, fieldState }) => (
        <FormItem label="템플릿 제목" required error={fieldState.error?.message}>
          <FormInput
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            maxLength={100}
            placeholder="템플릿 제목을 입력해 주세요."
          />
        </FormItem>
      )}
    />
  )
}
