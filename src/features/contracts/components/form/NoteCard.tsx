import DetailCard from "@/common/components/DetailCard/DetailCard"
import { TEXTAREA_CLASS } from "@/features/contracts/components/shared/styles"
import { NOTE_MAX_LENGTH } from "@/features/contracts/constants/rules"
import type { ContractFormApi } from "@/features/contracts/hooks/useContractForm"

interface NoteCardProps {
  form: ContractFormApi
}

/** 시안 B1 「비고」 — 선택 · 500자. 2차 활용 범위처럼 문장인 합의는 여기에 적는다 */
export default function NoteCard(props: NoteCardProps) {
  const { form } = props
  const { values, set } = form

  return (
    <DetailCard title="비고" note={`선택 · ${NOTE_MAX_LENGTH}자`}>
      <div id="contract-card-note">
        <textarea
          className={TEXTAREA_CLASS}
          placeholder="위에 없는 합의 사항을 적어주세요. 정산·수수료·법적 조항은 표준 조항으로 자동 포함됩니다."
          maxLength={NOTE_MAX_LENGTH}
          value={values.note}
          onChange={event => set({ note: event.target.value })}
        />
        <div className="mt-1.5 text-right text-[11px] text-sz-n-400">
          {values.note.length} / {NOTE_MAX_LENGTH}
        </div>
      </div>
    </DetailCard>
  )
}
