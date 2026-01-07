import FormField from "@/common/components/Form/FormField"
import Section from "@/common/components/Section/Section"
import type { BaseParams } from "@/common/types/page"
import { Label } from "@/components/ui/label"
import { RadioGroupItem } from "@/components/ui/radio-group"
import { RadioGroup } from "@radix-ui/react-radio-group"
import { useCallback } from "react"

type FilterType = "radio" | "radioWithAll" | "category" // TODO : 추가

type FilterOption<P> = {
  [K in keyof P]: {
    type: FilterType
    label: string
    key: K

    options?: Array<{ label: string; value: string }> // radio 및 checkbox 옵션
    placeholder?: string // input placeholder
  }
}[keyof P]

interface FilterCardProps<P> {
  options: Array<FilterOption<P>>
  params: P
  setParams: (key: keyof P, value: P[keyof P]) => void
  onSubmit?: () => void
  onReset?: () => void
}

export default function FilterCard<P extends BaseParams>(
  props: FilterCardProps<P>
) {
  const { options, params, setParams, onReset, onSubmit } = props

  const renderContent = useCallback(
    (option: FilterOption<P>) => {
      switch (option.type) {
        case "radioWithAll":
          return (
            <RadioGroup
              value={params[option.key] as string}
              onValueChange={() => {}}
              className="flex gap-6"
            >
              {option.options?.map(o => (
                <div className="flex items-center gap-2">
                  <RadioGroupItem value={o.value} id={o.value} />
                  <Label htmlFor={o.value} className="cursor-pointer">
                    {o.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          )
      }
    },
    [params]
  )

  const renderField = useCallback(
    (option: FilterOption<P>) => {
      return <FormField label={option.label}>{renderContent(option)}</FormField>
    },
    [renderContent]
  )

  return (
    <Section className="shrink-0">
      <div className="space-y-4">{options.map(renderField)}</div>
    </Section>
  )
}
