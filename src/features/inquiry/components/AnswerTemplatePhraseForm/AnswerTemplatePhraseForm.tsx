import FormItem from "@/common/components/Form/FormItem"
import { Button } from "@/components/ui/button"
import { ANSWER_TEMPLATE_COMMON_PHRASES } from "@/features/inquiry/constants/answerTemplate"

interface AnswerTemplatePhraseFormProps {
  onAppendPhrase: (phrase: string) => void
}

export default function AnswerTemplatePhraseForm(
  props: AnswerTemplatePhraseFormProps
) {
  const { onAppendPhrase } = props

  return (
    <FormItem label="자주 사용하는 문구">
      <div className="flex flex-wrap gap-2">
        {ANSWER_TEMPLATE_COMMON_PHRASES.map(phrase => (
          <Button
            key={phrase}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onAppendPhrase(phrase)}
          >
            {phrase}
          </Button>
        ))}
      </div>
    </FormItem>
  )
}
