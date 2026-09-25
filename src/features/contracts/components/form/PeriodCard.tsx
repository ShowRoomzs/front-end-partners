import DetailCard from "@/common/components/DetailCard/DetailCard"
import Notice from "@/common/components/Notice/Notice"
import DateTimePickerModal from "@/features/contracts/components/DateTimePickerModal/DateTimePickerModal"
import DateTriggerButton from "@/features/contracts/components/shared/DateTriggerButton"
import FormRow from "@/features/contracts/components/shared/FormRow"
import {
  ERR_CLASS,
  HINT_CLASS,
} from "@/features/contracts/components/shared/styles"
import {
  DEFAULT_END_TIME,
  DEFAULT_START_TIME,
  LEAD_DAYS,
  MAX_PERIOD_DAYS,
  MIN_PERIOD_DAYS,
  WARNING_PERIOD_DAYS,
} from "@/features/contracts/constants/rules"
import type { ContractFormApi } from "@/features/contracts/hooks/useContractForm"
import {
  endBounds,
  inclusiveDays,
  startLowerBound,
} from "@/features/contracts/utils/datetime"
import dayjs from "dayjs"
import { useState } from "react"

interface PeriodCardProps {
  form: ContractFormApi
}

type OpenModal = "start" | "end" | null

/**
 * 시안 B1 「공구 기간」 — 시작·종료는 달력 모달에서만 고른다(C1·C2).
 * 시작을 고르면 곧바로 종료 모달이 열린다 — 종료의 잠금 범위가 시작값에 의존하기 때문이다.
 */
export default function PeriodCard(props: PeriodCardProps) {
  const { form } = props
  const { values, errors, setPeriod } = form
  const [openModal, setOpenModal] = useState<OpenModal>(null)

  const today = dayjs()
  const start = values.groupBuyStartAt ? dayjs(values.groupBuyStartAt) : null
  const end = values.groupBuyEndAt ? dayjs(values.groupBuyEndAt) : null
  const days = start && end ? inclusiveDays(start, end) : null

  const startMin = startLowerBound(today)
  const bounds = start ? endBounds(start) : null

  return (
    <DetailCard title="공구 기간" note="계약 단위 · 공구가 상속">
      <div id="contract-card-period">
        <FormRow label="시작 일시" required>
          <DateTriggerButton
            value={start ? start.format("YYYY.MM.DD HH:mm") : null}
            placeholder="시작 일시를 선택하세요"
            onClick={() => setOpenModal("start")}
          />
        </FormRow>
        <FormRow label="종료 일시" required>
          <DateTriggerButton
            value={end ? end.format("YYYY.MM.DD HH:mm") : null}
            placeholder={
              start ? "종료 일시를 선택하세요" : "시작 일시를 먼저 선택하세요"
            }
            disabled={!start}
            trailing={days !== null ? `${days}일` : null}
            onClick={() => setOpenModal("end")}
          />
          {errors.groupBuyPeriod && (
            <div className={ERR_CLASS}>{errors.groupBuyPeriod}</div>
          )}
          {days !== null && days > WARNING_PERIOD_DAYS && (
            <div className={HINT_CLASS}>
              기간이{" "}
              <b className="text-sz-n-700">
                {WARNING_PERIOD_DAYS}일을 넘습니다
              </b>{" "}
              — 막지는 않지만 검토 요청 시 확인을 받습니다(경고).
            </div>
          )}
          <Notice tone="info" className="mt-2">
            체결 후 <b className="font-semibold">게시물 등록·오픈 승인</b>이
            필요해 시작일은 검토 요청일 +{" "}
            <b className="font-semibold">{LEAD_DAYS}일 이후</b>부터, 기간은{" "}
            <b className="font-semibold">
              {MIN_PERIOD_DAYS}~{MAX_PERIOD_DAYS}일
            </b>
            만 선택할 수 있습니다. 달력에서{" "}
            <b className="font-semibold">
              선택할 수 없는 날짜는 아예 잠깁니다.
            </b>
          </Notice>
        </FormRow>
      </div>

      {openModal === "start" && (
        <DateTimePickerModal
          title="시작 일시"
          minDate={startMin}
          maxDate={null}
          value={start}
          marker={today}
          note={
            <>
              <b className="font-semibold text-sz-n-700">
                {startMin.format("YYYY.MM.DD")}부터
              </b>{" "}
              선택할 수 있습니다 — 검토 요청일(
              <b className="font-semibold text-sz-n-700">
                {today.format("MM.DD")} ·
              </b>{" "}
              점 표시) 이후 서명·게시물 등록·오픈 승인에 최소 {LEAD_DAYS}일이
              필요합니다.
            </>
          }
          defaultTime={DEFAULT_START_TIME}
          timeLabel="시작 시각"
          submitLabel="다음"
          renderSummary={value =>
            value ? (
              <>
                {value.format("YYYY.MM.DD")}{" "}
                <span className="font-semibold text-sz-accent-600">
                  {value.format("HH:mm")}
                </span>
              </>
            ) : (
              "시작 일시를 선택하세요"
            )
          }
          onCancel={() => setOpenModal(null)}
          onSubmit={value => {
            setPeriod(value.format(), values.groupBuyEndAt)
            // 시작이 정해지면 바로 종료를 고른다 — 종료 범위는 시작에 매여 있다
            setOpenModal("end")
          }}
        />
      )}

      {openModal === "end" && start && bounds && (
        <DateTimePickerModal
          title="종료 일시"
          minDate={bounds.min}
          maxDate={bounds.max}
          value={end}
          rangeStart={start}
          onChangeAnchor={() => setOpenModal("start")}
          marker={today}
          note={
            <>
              선택 가능{" "}
              <b className="font-semibold text-sz-n-700">
                {bounds.min.format("YYYY.MM.DD")} ~{" "}
                {bounds.max.format("YYYY.MM.DD")}
              </b>{" "}
              — 공구 기간은 {MIN_PERIOD_DAYS}일 이상 {MAX_PERIOD_DAYS}일
              이하입니다. 점 표시는 검토 요청일({today.format("MM.DD")})입니다.
            </>
          }
          defaultTime={DEFAULT_END_TIME}
          timeLabel="종료 시각"
          submitLabel="적용"
          renderSummary={value =>
            value ? (
              <>
                {start.format("MM.DD")} ~ {value.format("MM.DD")} ·{" "}
                <span className="font-semibold text-sz-accent-600">
                  {inclusiveDays(start, value)}일
                </span>
              </>
            ) : (
              "종료 일시를 선택하세요"
            )
          }
          onCancel={() => setOpenModal(null)}
          onSubmit={value => {
            setPeriod(start.format(), value.format())
            setOpenModal(null)
          }}
        />
      )}
    </DetailCard>
  )
}
