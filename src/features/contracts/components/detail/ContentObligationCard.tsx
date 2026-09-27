import DetailCard, { FieldRow } from "@/common/components/DetailCard/DetailCard"
import { FSUB_CLASS } from "@/features/contracts/components/shared/styles"
import { SECONDARY_USE_PERIOD_LABEL } from "@/features/contracts/constants/labels"
import type { ContractContent } from "@/features/contracts/types"
import dayjs from "dayjs"

interface ContentObligationCardProps {
  content: ContractContent
}

/** 「콘텐츠 의무」 읽기 전용 — 게시 포맷·수량 · 게시 완료 기한 · 2차 활용 · 사전 검수 · 비고 */
export default function ContentObligationCard(
  props: ContentObligationCardProps
) {
  const { content } = props
  // 0개인 포맷은 빼고 적는다 — 「릴스 0 · 스토리 0」은 약속이 아니라 군더더기다(시안은 올리는 포맷만 나열)
  const formats =
    [
      content.feedCount ? `피드 ${content.feedCount}` : null,
      content.reelsCount ? `릴스 ${content.reelsCount}` : null,
      content.storyCount ? `스토리 ${content.storyCount}` : null,
    ]
      .filter(Boolean)
      .join(" · ") || "—"

  return (
    <DetailCard title="콘텐츠 의무">
      <FieldRow label="게시 포맷·수량">{formats}</FieldRow>
      <FieldRow label="게시 완료 기한">
        <span className="tabular-nums">
          {content.dueDate ? dayjs(content.dueDate).format("YYYY.MM.DD") : "—"}
        </span>
        <div className={FSUB_CLASS}>{formats} 전부를 이 날짜까지 게시</div>
      </FieldRow>
      <FieldRow label="2차 활용권">
        {content.secondaryUseAllowed === null
          ? "—"
          : content.secondaryUseAllowed
            ? "허용"
            : "불허"}
        {content.secondaryUseAllowed && (
          <div className={FSUB_CLASS}>허용 범위는 비고 참조</div>
        )}
      </FieldRow>
      {content.secondaryUseAllowed && (
        <FieldRow label="2차 활용 기간">
          {content.secondaryUsePeriodType
            ? content.secondaryUsePeriodType === "FIXED"
              ? `기간 지정 · ${content.secondaryUseMonths ?? "—"}개월`
              : SECONDARY_USE_PERIOD_LABEL.UNLIMITED
            : "—"}
        </FieldRow>
      )}
      <FieldRow label="브랜드 사전 검수">
        {content.brandPreReview === null
          ? "—"
          : content.brandPreReview
            ? "있음"
            : "없음"}
        {content.brandPreReview && (
          <div className={FSUB_CLASS}>게시 전 초안을 스레드로 확인</div>
        )}
      </FieldRow>
      {content.note && (
        <FieldRow label="비고">
          <span className="whitespace-pre-line">{content.note}</span>
        </FieldRow>
      )}
    </DetailCard>
  )
}
