import DetailCard from "@/common/components/DetailCard/DetailCard"
import Notice from "@/common/components/Notice/Notice"
import ConsentCheck from "@/features/contracts/components/shared/ConsentCheck"
import FormRow from "@/features/contracts/components/shared/FormRow"
import SegmentedControl from "@/features/contracts/components/shared/SegmentedControl"
import {
  ERR_CLASS,
  HINT_CLASS,
  INPUT_CLASS,
  INPUT_ERROR_CLASS,
} from "@/features/contracts/components/shared/styles"
import { FIXED_FEE_TRIGGER_OPTIONS } from "@/features/contracts/constants/labels"
import type { ContractFormApi } from "@/features/contracts/hooks/useContractForm"
import {
  formatIntegerInput,
  parseIntegerInput,
} from "@/features/contracts/utils/numberInput"
import { cn } from "@/lib/utils"

interface FixedFeeCardProps {
  form: ContractFormApi
}

/**
 * 시안 B1~B3 「고정 지급비」 — 금액 + 지급 시점만 계약서에 기재된다(§25-6-4).
 * 0원 초과면 접히지 않는 고지 블록 + 확인 체크(필수)가 나타난다 — 플랫폼이 중개도 보증도
 * 하지 않는다는 사실을 계약 전에 알려야 한다.
 */
export default function FixedFeeCard(props: FixedFeeCardProps) {
  const { form } = props
  const { values, errors, set } = form
  const showConsent =
    values.fixedFeeAmount !== null && values.fixedFeeAmount > 0

  return (
    <DetailCard title="고정 지급비" note="매출과 무관한 별도 지급액 · 0원 허용">
      <div id="contract-card-fixed-fee">
        <FormRow label="고정 지급비" required>
          <div className="flex flex-wrap items-center gap-2">
            <input
              className={cn(
                INPUT_CLASS,
                "w-[170px] text-right",
                errors.fixedFeeAmount && INPUT_ERROR_CLASS
              )}
              inputMode="numeric"
              placeholder="0"
              value={formatIntegerInput(values.fixedFeeAmount)}
              onChange={event => {
                const amount = parseIntegerInput(event.target.value)
                set({
                  fixedFeeAmount: amount,
                  // 0원으로 돌아가면 고지도 사라진다 — 체크값을 남겨 두면 다시 올렸을 때 동의 없이 통과한다
                  fixedFeeNoticeAgreed:
                    amount !== null && amount > 0
                      ? values.fixedFeeNoticeAgreed
                      : false,
                })
              }}
            />
            <span className="text-[12px] text-sz-n-600">원</span>
          </div>
          {errors.fixedFeeAmount && (
            <div className={ERR_CLASS}>{errors.fixedFeeAmount}</div>
          )}
          <div className={HINT_CLASS}>
            0원이면 지급하지 않습니다. 최대 1,000만원까지 입력할 수 있습니다.
          </div>
        </FormRow>

        <FormRow label="지급 시점" required>
          <SegmentedControl
            compact
            options={FIXED_FEE_TRIGGER_OPTIONS}
            value={values.fixedFeeTrigger}
            onChange={fixedFeeTrigger => set({ fixedFeeTrigger })}
          />
          <div className={HINT_CLASS}>
            브랜드가 <b className="text-sz-n-700">인플루언서에게 직접 지급</b>
            하는 시점입니다. 계약서에 기재되며 플랫폼은 대금을 보관하거나
            중개하지 않습니다.
          </div>
        </FormRow>

        {showConsent && (
          <Notice tone="consent" className="mt-3 flex flex-col gap-2">
            <div>
              <b className="font-semibold text-sz-n-900">
                고정 지급비는 브랜드가 직접 지급합니다
              </b>
            </div>
            <div className="leading-[1.8]">
              · 이 금액과 지급 시점은{" "}
              <b className="font-semibold text-sz-n-900">계약서에 기재</b>되며,
              플랫폼은{" "}
              <b className="font-semibold text-sz-n-900">
                대금을 보관하거나 중개하지 않습니다
              </b>
              <br />· 실제 지급·정산은{" "}
              <b className="font-semibold text-sz-n-900">
                브랜드와 인플루언서가 직접
              </b>{" "}
              처리합니다 — 지급 여부를 플랫폼이 확인하거나 보증하지 않습니다
              <br />· 미지급 분쟁이 생기면{" "}
              <b className="font-semibold text-sz-n-900">
                연결·소통 이슈 스레드
              </b>
              에서 운영자 중재를 요청할 수 있습니다(계약서가 근거가 됩니다)
            </div>
            <ConsentCheck
              required
              checked={values.fixedFeeNoticeAgreed}
              onChange={fixedFeeNoticeAgreed => set({ fixedFeeNoticeAgreed })}
            >
              위 내용을 확인했습니다
            </ConsentCheck>
          </Notice>
        )}
      </div>
    </DetailCard>
  )
}
