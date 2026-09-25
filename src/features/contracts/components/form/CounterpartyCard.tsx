import DetailCard from "@/common/components/DetailCard/DetailCard"
import StatusBadge from "@/common/components/StatusBadge/StatusBadge"
import FormRow from "@/features/contracts/components/shared/FormRow"
import {
  ERR_CLASS,
  HINT_CLASS,
  INPUT_CLASS,
  INPUT_ERROR_CLASS,
  SELECT_CLASS,
} from "@/features/contracts/components/shared/styles"
import { FORM_SELECT_CHEVRON_STYLE } from "@/features/contracts/constants/params"
import { TITLE_MAX_LENGTH } from "@/features/contracts/constants/rules"
import type { ContractFormApi } from "@/features/contracts/hooks/useContractForm"
import type {
  ContractCounterpartyOption,
  ContractDetailResponse,
} from "@/features/contracts/types"
import { relativeSavedText } from "@/features/contracts/utils/format"
import { toneToVariant } from "@/features/contracts/utils/statusBadge"
import { cn } from "@/lib/utils"

interface CounterpartyCardProps {
  form: ContractFormApi
  detail: ContractDetailResponse
  counterparties: Array<ContractCounterpartyOption>
  /** 마지막 임시저장 시각 — 카드 헤더 메타 */
  savedAt: string | null
}

/** 시안 B1 「계약 상대 · 공구 식별」 — 상대(연결됨만) + 공구명(내부 식별명) */
export default function CounterpartyCard(props: CounterpartyCardProps) {
  const { form, detail, counterparties, savedAt } = props
  const { values, errors, set } = form
  const isFixed = detail.counterparty.fixed
  const savedText = relativeSavedText(savedAt)

  /*
    상세가 들고 있던 상대가 선택지(연결됨 전량)에 없을 수 있다 — 그 사이 연결이 끊긴 경우다.
    값을 잃지 않도록 옵션에 남겨 두고, 검토 요청 시 서버가 COUNTERPARTY_NOT_CONNECTED로 막는다.
  */
  const options =
    values.creatorId !== null &&
    !counterparties.some(item => item.creatorId === values.creatorId)
      ? [
          {
            creatorId: values.creatorId,
            showroomName: detail.counterparty.showroomName ?? "(연결 없음)",
          },
          ...counterparties,
        ]
      : counterparties

  return (
    <DetailCard
      title="계약 상대 · 공구 식별"
      note={
        <span className="flex items-center gap-1.5">
          <StatusBadge variant={toneToVariant(detail.statusTone)}>
            {detail.statusLabel}
          </StatusBadge>
          {savedText && <span>· 임시저장 · {savedText}</span>}
        </span>
      }
    >
      <div id="contract-card-identity">
        <FormRow label="계약 상대" required>
          <select
            className={cn(SELECT_CLASS, "w-[280px]")}
            style={FORM_SELECT_CHEVRON_STYLE}
            value={values.creatorId ?? ""}
            disabled={isFixed}
            onChange={event =>
              set({
                creatorId:
                  event.target.value === "" ? null : Number(event.target.value),
              })
            }
          >
            <option value="">상대를 선택하세요</option>
            {options.map(item => (
              <option key={item.creatorId} value={item.creatorId}>
                {item.showroomName}
              </option>
            ))}
          </select>
          <div className={HINT_CLASS}>
            {isFixed ? (
              <>
                연결·소통 스레드에서 진입해{" "}
                <b className="text-sz-n-700">자동 지정</b>됐습니다. 이
                계약에서는 변경할 수 없습니다.
              </>
            ) : (
              <>
                <b className="text-sz-n-700">연결됨</b> 상태인 상대만 선택할 수
                있습니다. 연결·소통 스레드에서 들어오면 자동 지정되며 변경할 수
                없습니다.
              </>
            )}
          </div>
        </FormRow>

        <FormRow label="공구명" required>
          <input
            className={cn(
              INPUT_CLASS,
              "w-[420px] max-w-full",
              errors.title && INPUT_ERROR_CLASS
            )}
            placeholder="예: 여름 수분 세럼 공구"
            value={values.title}
            maxLength={TITLE_MAX_LENGTH}
            onChange={event => set({ title: event.target.value })}
          />
          {errors.title && <div className={ERR_CLASS}>{errors.title}</div>}
          <div className={HINT_CLASS}>
            관리용 <b className="text-sz-n-700">내부 식별명</b>(2~40자)이며
            공구로 상속됩니다. 소비자에게 보이는 제목은 인플루언서가 공구
            게시물에서 작성합니다.
          </div>
        </FormRow>
      </div>
    </DetailCard>
  )
}
