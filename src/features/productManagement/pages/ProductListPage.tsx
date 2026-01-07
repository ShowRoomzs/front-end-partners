import { useState } from "react"
import Section from "@/common/components/Section/Section"
import FormCategorySelector from "@/common/components/Form/FormCategorySelector"
import FormField from "@/common/components/Form/FormField"
import { useGetCategory } from "@/common/hooks/useGetCategory"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

export default function ProductListPage() {
  const [displayStatus, setDisplayStatus] = useState<string>("all")
  const [stockStatus, setStockStatus] = useState<string>("all")

  return (
    <div>
      <Section>
        <div className="space-y-6">
          {/* 카테고리 선택 */}
          <FormField label="카테고리">
            <FormCategorySelector
              categoryMap={null}
              value={undefined}
              onChange={() => {}}
            />
          </FormField>

          {/* 진열상태 */}
          <FormField label="진열상태">
            <RadioGroup
              value={displayStatus}
              onValueChange={setDisplayStatus}
              className="flex gap-6"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="all" id="display-all" />
                <Label htmlFor="display-all" className="cursor-pointer">
                  전체
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="display" id="display-yes" />
                <Label htmlFor="display-yes" className="cursor-pointer">
                  진열
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="hidden" id="display-no" />
                <Label htmlFor="display-no" className="cursor-pointer">
                  미진열
                </Label>
              </div>
            </RadioGroup>
          </FormField>

          {/* 품절상태 */}
          <FormField label="품절상태">
            <RadioGroup
              value={stockStatus}
              onValueChange={setStockStatus}
              className="flex gap-6"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="all" id="stock-all" />
                <Label htmlFor="stock-all" className="cursor-pointer">
                  전체
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="out-of-stock" id="stock-out" />
                <Label htmlFor="stock-out" className="cursor-pointer">
                  품절
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="in-stock" id="stock-in" />
                <Label htmlFor="stock-in" className="cursor-pointer">
                  품절 아님
                </Label>
              </div>
            </RadioGroup>
          </FormField>

          <div className="flex flex-row gap-4 justify-start">
            <Button variant="default" size="default" className="px-8">
              검색하기
            </Button>
            <Button variant="outline" size="default" className="px-8">
              초기화
            </Button>
          </div>
        </div>
      </Section>
    </div>
  )
}
