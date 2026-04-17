import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { useForm } from "react-hook-form"
import toast from "react-hot-toast"
import Section from "@/common/components/Section/Section"
import Form from "@/common/components/Form/Form"
import { Button } from "@/components/ui/button"
import { useCustomBlocker } from "@/common/hooks/useCustomBlocker"
import {
  confirm,
  type ConfirmOptions,
} from "@/common/components/ConfirmModal/confirm"
import {
  answerTemplateService,
  type AnswerTemplateUpsertRequest,
} from "@/features/inquiry/services/answerTemplateService"
import { useGetAnswerTemplateDetail } from "@/features/inquiry/hooks/useGetAnswerTemplateDetail"
import { queryClient } from "@/common/lib/queryClient"
import { INQUIRY_QUERY_KEYS } from "@/features/inquiry/constants/queryKeys"
import AnswerTemplateTitleForm from "@/features/inquiry/components/AnswerTemplateTitleForm/AnswerTemplateTitleForm"
import AnswerTemplateCategoryForm from "@/features/inquiry/components/AnswerTemplateCategoryForm/AnswerTemplateCategoryForm"
import AnswerTemplateContentForm from "@/features/inquiry/components/AnswerTemplateContentForm/AnswerTemplateContentForm"
import AnswerTemplatePhraseForm from "@/features/inquiry/components/AnswerTemplatePhraseForm/AnswerTemplatePhraseForm"
import AnswerTemplateIsActiveForm from "@/features/inquiry/components/AnswerTemplateIsActiveForm/AnswerTemplateIsActiveForm"

export default function AnswerTemplateWritePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const bypassBlockerRef = useRef(false)

  const templateId = useMemo(() => {
    const value = searchParams.get("templateId")
    if (!value) {
      return null
    }
    const parsed = Number(value)
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return null
    }
    return parsed
  }, [searchParams])
  const isEdit = templateId !== null

  const { data: templateDetail } = useGetAnswerTemplateDetail(
    templateId ?? 0,
    isEdit
  )

  const getDefaultCancelConfirmOptions = useCallback(
    (isEdit: boolean): ConfirmOptions => {
      return {
        title: `답변 템플릿 ${isEdit ? "수정" : "등록"} 취소`,
        content: `${isEdit ? "수정" : "작성"} 중인 내용이 저장되지 않습니다.\n취소하시겠습니까?`,
        type: "warn",
        cancelText: "돌아가기",
        confirmText: "취소",
      }
    },
    []
  )

  const { control, handleSubmit, formState, reset, getValues, setValue } =
    useForm<AnswerTemplateUpsertRequest>({
      reValidateMode: "onSubmit",
      defaultValues: {
        title: "",
        category: "PRODUCT",
        content: "",
        isActive: true,
      },
    })

  useEffect(() => {
    if (!templateDetail) {
      return
    }

    reset({
      title: templateDetail.title,
      category: templateDetail.category,
      content: templateDetail.content,
      isActive: templateDetail.isActive,
    })
  }, [reset, templateDetail])

  const handleAppendPhrase = useCallback(
    (phrase: string) => {
      const currentContent = getValues("content")
      const nextContent = currentContent
        ? `${currentContent}\n${phrase}`
        : phrase
      setValue("content", nextContent, { shouldDirty: true })
    },
    [getValues, setValue]
  )

  const moveToList = useCallback(
    (formData: AnswerTemplateUpsertRequest) => {
      // blocker가 다시 뜨지 않도록 dirty 상태를 먼저 정리
      bypassBlockerRef.current = true
      reset(formData)
      setTimeout(() => {
        navigate("/inquiry/template")
      }, 0)
    },
    [navigate, reset]
  )

  const handleClickCancel = useCallback(async () => {
    if (!formState.isDirty) {
      navigate("/inquiry/template")
      return
    }

    const result = await confirm(getDefaultCancelConfirmOptions(isEdit))

    if (result) {
      moveToList(getValues())
    }
  }, [
    formState.isDirty,
    getDefaultCancelConfirmOptions,
    getValues,
    isEdit,
    moveToList,
    navigate,
  ])

  const onSubmit = useCallback(
    async (data: AnswerTemplateUpsertRequest) => {
      try {
        setIsLoading(true)

        if (isEdit && templateId !== null) {
          await answerTemplateService.updateAnswerTemplate(templateId, data)
        } else {
          await answerTemplateService.createAnswerTemplate(data)
        }

        await queryClient.invalidateQueries({
          queryKey: [INQUIRY_QUERY_KEYS.ANSWER_TEMPLATE_LIST],
        })
        toast.success(
          isEdit ? "답변 템플릿을 수정했습니다." : "답변 템플릿을 등록했습니다."
        )
        moveToList(data)
      } finally {
        setIsLoading(false)
      }
    },
    [isEdit, moveToList, templateId]
  )

  useCustomBlocker({
    condition: formState.isDirty,
    bypassRef: bypassBlockerRef,
    confirmOption: getDefaultCancelConfirmOptions(isEdit),
  })

  const isDisabled =
    Object.keys(formState.errors).length > 0 ||
    isLoading ||
    !formState.isValid ||
    !formState.isDirty

  return (
    <Form handleSubmit={handleSubmit} onSubmit={onSubmit}>
      <Section title="템플릿 제목" required>
        <AnswerTemplateTitleForm control={control} />
      </Section>

      <Section title="카테고리" required>
        <AnswerTemplateCategoryForm control={control} />
      </Section>

      <Section title="답변 내용" required>
        <AnswerTemplateContentForm control={control} />
      </Section>

      <Section title="자주 사용하는 문구">
        <AnswerTemplatePhraseForm onAppendPhrase={handleAppendPhrase} />
      </Section>

      <Section title="사용 여부">
        <AnswerTemplateIsActiveForm control={control} />
      </Section>

      <div className="flex gap-3 justify-end mt-6">
        <Button type="button" variant="outline" onClick={handleClickCancel}>
          취소
        </Button>
        <Button disabled={isDisabled} isLoading={isLoading} type="submit">
          {isEdit ? "수정하기" : "등록하기"}
        </Button>
      </div>
    </Form>
  )
}
