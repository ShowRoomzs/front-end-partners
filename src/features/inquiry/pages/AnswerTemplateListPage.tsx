import { useCallback, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import toast from "react-hot-toast"
import ListViewWrapper from "@/common/components/ListViewWrapper/ListViewWrapper"
import FilterCard from "@/common/components/FilterCard/FilterCard"
import Table from "@/common/components/Table/Table"
import { Button } from "@/components/ui/button"
import { useParams } from "@/common/hooks/useParams"
import { usePaginationInfo } from "@/common/hooks/usePaginationInfo"
import {
  answerTemplateService,
  type AnswerTemplateItem,
  type AnswerTemplateListParams,
} from "@/features/inquiry/services/answerTemplateService"
import { useGetAnswerTemplateList } from "@/features/inquiry/hooks/useGetAnswerTemplateList"
import {
  ANSWER_TEMPLATE_FILTER_OPTIONS,
  type AnswerTemplateListSearchParams,
} from "@/features/inquiry/constants/filter"
import { ANSWER_TEMPLATE_COLUMNS } from "@/features/inquiry/constants/columns"
import { confirm } from "@/common/components/ConfirmModal/confirm"
import { queryClient } from "@/common/lib/queryClient"
import { INQUIRY_QUERY_KEYS } from "@/features/inquiry/constants/queryKeys"

const INITIAL_PARAMS: AnswerTemplateListSearchParams = {
  page: 1,
  size: 10,
  includeInactive: "false",
  category: "ALL",
  keyword: "",
}

export default function AnswerTemplateListPage() {
  const navigate = useNavigate()
  const [checkedKeys, setCheckedKeys] = useState<Array<number>>([])
  const { localParams, params, updateLocalParam, update, reset, updateParam } =
    useParams<AnswerTemplateListSearchParams>(INITIAL_PARAMS)

  const requestParams = useMemo<AnswerTemplateListParams>(() => {
    return {
      page: Number(params.page),
      size: Number(params.size),
      includeInactive: params.includeInactive === "true",
      category: params.category === "ALL" ? null : params.category,
      keyword: params.keyword,
    }
  }, [params])

  const { data: answerTemplateList, isLoading } =
    useGetAnswerTemplateList(requestParams)

  const handlePageChange = useCallback(
    (page: number) => {
      setCheckedKeys([])
      updateParam("page", page)
    },
    [updateParam]
  )

  const pageInfo = usePaginationInfo({
    data: answerTemplateList?.pageInfo,
    onPageChange: handlePageChange,
  })

  const handleSubmit = useCallback(() => {
    update()
    setCheckedKeys([])
  }, [update])

  const hasCheckedKeys = useMemo(() => checkedKeys.length > 0, [checkedKeys])

  const cleanUp = useCallback(async () => {
    setCheckedKeys([])
    await queryClient.invalidateQueries({
      queryKey: [INQUIRY_QUERY_KEYS.ANSWER_TEMPLATE_LIST],
    })
  }, [])

  const handleClickDelete = useCallback(async () => {
    if (!hasCheckedKeys) {
      return
    }

    const result = await confirm({
      type: "warn",
      title: "답변 템플릿 삭제",
      content: "선택한 템플릿을 삭제하시겠습니까?",
    })

    if (!result) {
      return
    }

    await answerTemplateService.deleteAnswerTemplates(checkedKeys)
    toast.success("답변 템플릿 삭제 완료")
    cleanUp()
  }, [checkedKeys, cleanUp, hasCheckedKeys])

  const handleClickRegister = useCallback(() => {
    navigate("/inquiry/template/write")
  }, [navigate])

  const handleClickRow = useCallback(
    (record: AnswerTemplateItem) => {
      navigate(`/inquiry/template/write?templateId=${record.templateId}`)
    },
    [navigate]
  )

  return (
    <ListViewWrapper>
      <FilterCard
        options={ANSWER_TEMPLATE_FILTER_OPTIONS}
        params={localParams}
        onChange={updateLocalParam}
        onSubmit={handleSubmit}
        onReset={reset}
      />
      <Table<AnswerTemplateItem, "templateId">
        onCheckedKeysChange={setCheckedKeys}
        checkedKeys={checkedKeys}
        pageInfo={pageInfo}
        rowKey="templateId"
        columns={ANSWER_TEMPLATE_COLUMNS}
        showCheckbox
        data={answerTemplateList?.content ?? []}
        isLoading={isLoading}
        onRowClick={handleClickRow}
        renderFooter={
          <div className="flex flex-row gap-3">
            <Button onClick={handleClickRegister}>템플릿 등록</Button>
            <Button
              onClick={handleClickDelete}
              disabled={!hasCheckedKeys}
              variant="outline"
            >
              선택 삭제
            </Button>
          </div>
        }
      />
    </ListViewWrapper>
  )
}
