import DetailCard from "@/common/components/DetailCard/DetailCard"
import Notice from "@/common/components/Notice/Notice"
import DateTimePickerModal from "@/features/contracts/components/DateTimePickerModal/DateTimePickerModal"
import DateTriggerButton from "@/features/contracts/components/shared/DateTriggerButton"
import FormRow from "@/features/contracts/components/shared/FormRow"
import SegmentedControl from "@/features/contracts/components/shared/SegmentedControl"
import {
  HINT_CLASS,
  INPUT_CLASS,
} from "@/features/contracts/components/shared/styles"
import SuffixInput from "@/features/contracts/components/shared/SuffixInput"
import type { ContractFormApi } from "@/features/contracts/hooks/useContractForm"
import type { SecondaryUsePeriodType } from "@/features/contracts/types"
import {
  formatIntegerInput,
  parseIntegerInput,
} from "@/features/contracts/utils/numberInput"
import { cn } from "@/lib/utils"
import dayjs from "dayjs"
import { useState } from "react"

interface ContentCardProps {
  form: ContractFormApi
}

const BOOL_OPTIONS_ALLOW: Array<{ value: "true" | "false"; label: string }> = [
  { value: "true", label: "허용" },
  { value: "false", label: "불허" },
]
const BOOL_OPTIONS_EXIST: Array<{ value: "true" | "false"; label: string }> = [
  { value: "true", label: "있음" },
  { value: "false", label: "없음" },
]
const PERIOD_OPTIONS: Array<{ value: SecondaryUsePeriodType; label: string }> =
  [
    { value: "FIXED", label: "기간 지정" },
    { value: "UNLIMITED", label: "무기한" },
  ]

/**
 * 시안 B1 「콘텐츠 의무」 — 게시 포맷·수량(합계 1 이상) · 게시 완료 기한(기본 = 공구 종료일) ·
 * 2차 활용권/기간 · 브랜드 사전 검수. 이행 확인은 연결·소통 스레드에서 당사자끼리 한다.
 */
export default function ContentCard(props: ContentCardProps) {
  const { form } = props
  const { values, set } = form
  const [isDueOpen, setIsDueOpen] = useState(false)

  const monthsDisabled =
    !values.secondaryUseAllowed || values.secondaryUsePeriodType === "UNLIMITED"
  const dueDate = values.contentDueDate ? dayjs(values.contentDueDate) : null
  const endDate = values.groupBuyEndAt ? dayjs(values.groupBuyEndAt) : null

  const countInput = (
    label: string,
    key: "contentFeedCount" | "contentReelsCount" | "contentStoryCount"
  ) => (
    <>
      <span className="text-[12px] text-sz-n-600">{label}</span>
      <input
        className={cn(INPUT_CLASS, "w-[62px] px-1.5 text-center")}
        inputMode="numeric"
        placeholder="0"
        value={formatIntegerInput(values[key])}
        onChange={event =>
          set({ [key]: parseIntegerInput(event.target.value) })
        }
      />
    </>
  )

  return (
    <DetailCard
      title="콘텐츠 의무"
      note="인스타그램 고정 · 이행 확인은 연결·소통 스레드에서 당사자끼리"
    >
      <div id="contract-card-content">
        <FormRow label="게시 포맷·수량" required>
          <div className="flex flex-wrap items-center gap-2">
            {countInput("피드", "contentFeedCount")}
            {countInput("릴스", "contentReelsCount")}
            {countInput("스토리", "contentStoryCount")}
            <span className="text-[12px] text-sz-n-600">개</span>
          </div>
          <div className={HINT_CLASS}>
            세 값의 <b className="text-sz-n-700">합계가 1 이상</b>이어야 합니다.
          </div>
        </FormRow>

        <FormRow label="게시 완료 기한" required>
          <DateTriggerButton
            className="min-w-[200px]"
            value={dueDate ? dueDate.format("YYYY.MM.DD") : null}
            placeholder="기한을 선택하세요"
            onClick={() => setIsDueOpen(true)}
          />
          <div className={HINT_CLASS}>
            위{" "}
            <b className="text-sz-n-700">
              게시 포맷·수량 전부를 이 날짜까지 올려야
            </b>{" "}
            합니다. 기본값은 공구 종료일입니다. 게시 여부는 인플루언서가{" "}
            <b className="text-sz-n-700">연결·소통 스레드에 링크를 공유</b>해
            브랜드와 직접 확인합니다.
          </div>
        </FormRow>

        <FormRow label="2차 활용권">
          <SegmentedControl
            options={BOOL_OPTIONS_ALLOW}
            value={values.secondaryUseAllowed ? "true" : "false"}
            onChange={value => set({ secondaryUseAllowed: value === "true" })}
          />
          <div className={HINT_CLASS}>
            브랜드가 게시물을 광고·상세페이지에 재사용하는 권리입니다. 허용
            범위는 비고에 적어주세요.
          </div>
        </FormRow>

        <FormRow label="2차 활용 기간" required={values.secondaryUseAllowed}>
          <div className="flex flex-wrap items-center gap-2">
            <SegmentedControl
              options={PERIOD_OPTIONS}
              value={values.secondaryUsePeriodType}
              disabled={!values.secondaryUseAllowed}
              onChange={secondaryUsePeriodType =>
                set({ secondaryUsePeriodType })
              }
            />
            <SuffixInput
              wrapperClassName="w-24"
              suffix="개월"
              inputMode="numeric"
              placeholder="12"
              disabled={monthsDisabled}
              value={formatIntegerInput(values.secondaryUseMonths)}
              onChange={raw =>
                set({ secondaryUseMonths: parseIntegerInput(raw) })
              }
            />
          </div>
          <div className={HINT_CLASS}>
            2차 활용을 <b className="text-sz-n-700">허용</b>한 경우에만
            입력합니다. <b className="text-sz-n-700">무기한</b>을 고르면 개월
            입력이 비활성됩니다.
          </div>
        </FormRow>

        <FormRow label="브랜드 사전 검수">
          <SegmentedControl
            options={BOOL_OPTIONS_EXIST}
            value={values.brandPreReview ? "true" : "false"}
            onChange={value => set({ brandPreReview: value === "true" })}
          />
          <div className={HINT_CLASS}>
            브랜드가 게시 전에 콘텐츠를 확인하고 수정을 요청할 수 있는지
            여부입니다. <b className="text-sz-n-700">있음</b>이면 인플루언서는
            게시 전 초안을 연결·소통 스레드로 보내고, 브랜드 확인 없이 올린
            콘텐츠는 이행으로 보지 않습니다.
          </div>
        </FormRow>

        <Notice tone="neutral" className="mt-3">
          외부 SNS 연동이 없어 게시 여부는 시스템이 판정하지 않습니다.
          인플루언서가{" "}
          <b className="font-semibold">연결·소통 스레드에 게시물 링크를 공유</b>
          하고 브랜드가 그 자리에서 확인합니다 —{" "}
          <b className="font-semibold">운영자를 거치지 않습니다.</b>
        </Notice>
      </div>

      {isDueOpen && (
        <DateTimePickerModal
          title="게시 완료 기한"
          minDate={dayjs().startOf("day")}
          maxDate={null}
          value={dueDate ?? endDate}
          marker={dayjs()}
          withTime={false}
          note={
            <>
              게시 포맷·수량 전부를 올려야 하는 날짜입니다. 기본값은 공구 종료일
              {endDate ? `(${endDate.format("YYYY.MM.DD")})` : ""}입니다.
            </>
          }
          submitLabel="적용"
          renderSummary={value =>
            value ? value.format("YYYY.MM.DD") : "기한을 선택하세요"
          }
          onCancel={() => setIsDueOpen(false)}
          onSubmit={value => {
            set({ contentDueDate: value.format("YYYY-MM-DD") })
            setIsDueOpen(false)
          }}
        />
      )}
    </DetailCard>
  )
}
