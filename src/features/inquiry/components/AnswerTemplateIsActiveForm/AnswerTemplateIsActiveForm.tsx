import type { Control } from "react-hook-form"
import FormController from "@/common/components/Form/FormController"
import FormItem from "@/common/components/Form/FormItem"
import FormRadioGroup from "@/common/components/Form/FormRadioGroup"
import type { AnswerTemplateUpsertRequest } from "@/features/inquiry/services/answerTemplateService"

interface AnswerTemplateIsActiveFormProps {
  control: Control<AnswerTemplateUpsertRequest>
}

const isActiveOptions = [
  {
    label: "사용",
    value: true,
  },
  {
    label: "미사용",
    value: false,
  },
]

export default function AnswerTemplateIsActiveForm(
  props: AnswerTemplateIsActiveFormProps
) {
  const { control } = props

  return (
    <FormController
      control={control}
      name="isActive"
      render={({ field }) => (
        <FormItem label="사용 여부">
          <FormRadioGroup
            value={field.value}
            options={isActiveOptions}
            onChange={field.onChange}
          />
        </FormItem>
      )}
    />
  )
}
