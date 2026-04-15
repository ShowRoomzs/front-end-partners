import type { Control } from "react-hook-form"
import FormController from "@/common/components/Form/FormController"
import FormItem from "@/common/components/Form/FormItem"
import type { AnswerTemplateUpsertRequest } from "@/features/inquiry/services/answerTemplateService"

interface AnswerTemplateContentFormProps {
  control: Control<AnswerTemplateUpsertRequest>
}

export default function AnswerTemplateContentForm(
  props: AnswerTemplateContentFormProps
) {
  const { control } = props

  return (
    <FormController
      control={control}
      name="content"
      rules={{
        required: "답변 내용을 입력해 주세요.",
      }}
      render={({ field, fieldState }) => (
        <FormItem label="답변 내용" required error={fieldState.error?.message}>
          <textarea
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            className="min-h-[220px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none"
            placeholder="답변 내용을 입력해 주세요."
          />
        </FormItem>
      )}
    />
  )
}
