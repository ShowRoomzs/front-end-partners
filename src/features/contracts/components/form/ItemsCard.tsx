import DetailCard from "@/common/components/DetailCard/DetailCard"
import {
  ERR_CLASS,
  HINT_CLASS,
  INPUT_CLASS,
  INPUT_ERROR_CLASS,
  SELECT_CLASS,
} from "@/features/contracts/components/shared/styles"
import SuffixInput from "@/features/contracts/components/shared/SuffixInput"
import { FORM_SELECT_CHEVRON_STYLE } from "@/features/contracts/constants/params"
import { REWARD_RATE_MAX } from "@/features/contracts/constants/rules"
import type { ContractFormApi } from "@/features/contracts/hooks/useContractForm"
import type { ContractProductOption } from "@/features/contracts/types"
import type { ContractItemValues } from "@/features/contracts/utils/contractForm"
import { findProduct } from "@/features/contracts/utils/contractForm"
import { formatNumber, unitReward } from "@/features/contracts/utils/format"
import {
  formatIntegerInput,
  parseIntegerInput,
  parseRateInput,
  sanitizeRateInput,
} from "@/features/contracts/utils/numberInput"
import { cn } from "@/lib/utils"
import { useState } from "react"

interface ItemsCardProps {
  form: ContractFormApi
  products: Array<ContractProductOption>
}

/** 시안 `.it-h`/`.it-r` 컬럼 폭 — 상품 300 · 정가 78 · 공구가 96 · 리워드율 62 · 예상 리워드 82 · 최소 물량 80 · 삭제 26 */
const COL = {
  product: "w-[300px] shrink-0 min-w-0",
  list: "w-[78px] shrink-0",
  price: "w-[96px] shrink-0",
  rate: "w-[62px] shrink-0",
  est: "w-[82px] shrink-0",
  qty: "w-[80px] shrink-0",
  del: "w-[26px] shrink-0 text-center",
}

const RO_CELL = "pt-[9px] text-[12px] tabular-nums text-sz-n-600"

/**
 * 시안 B1~B3 「계약 상품 항목」 — 공구가·리워드율·최소 물량의 출생지(§25-6-3).
 * 상품을 고르기 전에는 나머지 칸이 잠기고, 상품을 바꾸면 그 행이 초기화된다.
 * 정가를 읽기 전용으로 병기하고 예상 리워드를 자동 계산해 위반과 오해를 미리 막는다.
 */
export default function ItemsCard(props: ItemsCardProps) {
  const { form, products } = props
  const { values, errors, setItem, changeProduct, addItem, removeItem } = form
  const canRemove = values.items.length > 1

  // 첫 규칙 위반 문구만 표 아래에 보인다(시안 `.err` 한 줄) — 칸은 빨간 테두리로 가리킨다
  const firstError = values.items
    .map(item => errors.items[item.clientKey])
    .find(error => error?.groupBuyPrice || error?.rewardRate)
  const firstErrorText = firstError?.groupBuyPrice ?? firstError?.rewardRate

  return (
    <DetailCard
      title="계약 상품 항목"
      note="공구가·리워드율의 출생지 · 상품별 차등 가능"
    >
      <div id="contract-card-items" className="overflow-x-auto">
        <div className="min-w-[1060px] overflow-hidden rounded-[6px] border border-sz-n-200">
          <div className="flex gap-14 border-b border-sz-n-200 bg-sz-n-50 py-2 pl-3 pr-7 text-[11px] font-semibold text-sz-n-500">
            <div className={COL.product}>상품</div>
            <div className={COL.list}>정가</div>
            <div className={COL.price}>공구가</div>
            <div className={COL.rate}>리워드율</div>
            <div className={COL.est}>예상 리워드</div>
            <div className={COL.qty}>최소 물량</div>
            <div className={COL.del} />
          </div>
          {values.items.map(item => (
            <ItemRow
              key={item.clientKey}
              item={item}
              products={products}
              error={errors.items[item.clientKey]}
              canRemove={canRemove}
              onChangeProduct={productId =>
                changeProduct(item.clientKey, productId)
              }
              onChange={patch => setItem(item.clientKey, patch)}
              onRemove={() => removeItem(item.clientKey)}
            />
          ))}
        </div>
      </div>
      {firstErrorText && <div className={ERR_CLASS}>{firstErrorText}</div>}
      <button
        type="button"
        onClick={addItem}
        className="mt-2 w-full cursor-pointer rounded-[6px] border border-dashed border-sz-n-300 bg-white p-[9px] text-center text-[12px] text-sz-n-600 hover:border-sz-accent-500 hover:bg-sz-accent-50 hover:text-sz-accent-600"
      >
        + 상품 추가
      </button>
      <div className={HINT_CLASS}>
        <b className="text-sz-n-700">진열</b> 상태인 상품만 선택할 수 있습니다.
        공구가는 부가세 포함 소비자 판매가로{" "}
        <b className="text-sz-n-700">정가 이하 · 10원 단위</b>, 리워드율은{" "}
        <b className="text-sz-n-700">0~90%</b>(0.1% 단위)입니다. 예상 리워드는
        1개당 금액이며 정산이 이 리워드율을 그대로 사용합니다.{" "}
        <b className="text-sz-n-700">최소 물량</b>은 브랜드가 그 상품에 대해
        확보를 약속하는 수량입니다.
      </div>
    </DetailCard>
  )
}

interface ItemRowProps {
  item: ContractItemValues
  products: Array<ContractProductOption>
  error: { groupBuyPrice?: string; rewardRate?: string } | undefined
  canRemove: boolean
  onChangeProduct: (productId: number | null) => void
  onChange: (patch: Partial<ContractItemValues>) => void
  onRemove: () => void
}

function ItemRow(props: ItemRowProps) {
  const {
    item,
    products,
    error,
    canRemove,
    onChangeProduct,
    onChange,
    onRemove,
  } = props
  const product = findProduct(products, item.productId)
  const locked = !product
  // 리워드율은 "15." 같은 입력 중간 상태를 문자열로 들고 있어야 한다
  const [rateText, setRateText] = useState(
    item.rewardRate === null ? "" : String(item.rewardRate)
  )
  const estimated = unitReward(item.groupBuyPrice, item.rewardRate)

  return (
    <div className="flex items-start gap-14 border-b border-sz-n-100 py-2.5 pl-3 pr-7 last:border-b-0">
      <div className={COL.product}>
        <select
          className={cn(SELECT_CLASS, "w-full")}
          style={FORM_SELECT_CHEVRON_STYLE}
          value={item.productId ?? ""}
          onChange={event => {
            setRateText("")
            onChangeProduct(
              event.target.value === "" ? null : Number(event.target.value)
            )
          }}
        >
          <option value="">상품을 선택하세요</option>
          {products.map(option => (
            <option key={option.productId} value={option.productId}>
              {option.productName}
            </option>
          ))}
        </select>
      </div>
      <div className={cn(COL.list, RO_CELL)}>
        {product ? formatNumber(product.regularPrice) : "—"}
      </div>
      <div className={COL.price}>
        <input
          className={cn(
            INPUT_CLASS,
            "w-full",
            error?.groupBuyPrice && INPUT_ERROR_CLASS
          )}
          placeholder="0"
          inputMode="numeric"
          disabled={locked}
          value={formatIntegerInput(item.groupBuyPrice)}
          onChange={event =>
            onChange({ groupBuyPrice: parseIntegerInput(event.target.value) })
          }
        />
      </div>
      <div className={COL.rate}>
        <SuffixInput
          suffix="%"
          placeholder="0"
          inputMode="decimal"
          disabled={locked}
          isError={!!error?.rewardRate}
          value={rateText}
          onChange={raw => {
            const text = sanitizeRateInput(raw, REWARD_RATE_MAX)
            setRateText(text)
            onChange({ rewardRate: parseRateInput(text) })
          }}
        />
      </div>
      <div className={cn(COL.est, RO_CELL)}>
        {estimated === null ? "—" : formatNumber(estimated)}
      </div>
      <div className={COL.qty}>
        <SuffixInput
          suffix="개"
          placeholder="0"
          inputMode="numeric"
          disabled={locked}
          value={formatIntegerInput(item.minQuantity)}
          onChange={raw => onChange({ minQuantity: parseIntegerInput(raw) })}
        />
      </div>
      <button
        type="button"
        aria-label="행 삭제"
        disabled={!canRemove}
        onClick={onRemove}
        className={cn(
          COL.del,
          "pt-2 text-[12px]",
          canRemove
            ? "cursor-pointer text-sz-n-400 hover:text-sz-danger-text"
            : "cursor-not-allowed text-sz-n-300"
        )}
      >
        ✕
      </button>
    </div>
  )
}
