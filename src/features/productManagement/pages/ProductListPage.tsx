import { useState } from "react"
import Section from "@/common/components/Section/Section"
import FormCategorySelector from "@/common/components/Form/FormCategorySelector"
import FormField from "@/common/components/Form/FormField"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import Table from "@/common/components/Table/Table"
import { PRODUCT_LIST_COLUMNS } from "@/features/productManagement/constants/columns"
import ListViewWrapper from "@/common/components/ListViewWrapper/ListViewWrapper"

export default function ProductListPage() {
  const [displayStatus, setDisplayStatus] = useState<string>("all")
  const [stockStatus, setStockStatus] = useState<string>("all")

  return (
    <ListViewWrapper>
      <Section className="shrink-0">
        <div className="space-y-4">
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
        </div>
        <div className="absolute right-4 top-4 flex flex-row gap-4">
          <Button variant="default" size="default" className="px-8">
            검색하기
          </Button>
          <Button variant="outline" size="default" className="px-8">
            초기화
          </Button>
        </div>
      </Section>
      <Table
        pageInfo={{
          page: 0,
          size: 10,
          totalElements: 100,
          totalPages: 10,
          onPageChange: () => {
            console.log("page change")
          },
        }}
        columns={PRODUCT_LIST_COLUMNS}
        showCheckbox
        data={[
          {
            id: "1",
            name: "Product 1",
            price: 10000,
            stock: 100,
            display: true,
            stockStatus: "in-stock",
            displayStatus: "display",
            category: "Category 1",
            createdAt: "2021-01-01",
          },
          {
            id: "1",
            name: "Product 1",
            price: 10000,
            stock: 100,
            display: true,
            stockStatus: "in-stock",
            displayStatus: "display",
            category: "Category 1",
            createdAt: "2021-01-01",
          },
          {
            id: "1",
            name: "Product 1",
            price: 10000,
            stock: 100,
            display: true,
            stockStatus: "in-stock",
            displayStatus: "display",
            category: "Category 1",
            createdAt: "2021-01-01",
          },
          {
            id: "1",
            name: "Product 1",
            price: 10000,
            stock: 100,
            display: true,
            stockStatus: "in-stock",
            displayStatus: "display",
            category: "Category 1",
            createdAt: "2021-01-01",
          },
          {
            id: "1",
            name: "Product 1",
            price: 10000,
            stock: 100,
            display: true,
            stockStatus: "in-stock",
            displayStatus: "display",
            category: "Category 1",
            createdAt: "2021-01-01",
          },
          {
            id: "1",
            name: "Product 1",
            price: 10000,
            stock: 100,
            display: true,
            stockStatus: "in-stock",
            displayStatus: "display",
            category: "Category 1",
            createdAt: "2021-01-01",
          },
          {
            id: "1",
            name: "Product 1",
            price: 10000,
            stock: 100,
            display: true,
            stockStatus: "in-stock",
            displayStatus: "display",
            category: "Category 1",
            createdAt: "2021-01-01",
          },
          {
            id: "1",
            name: "Product 1",
            price: 10000,
            stock: 100,
            display: true,
            stockStatus: "in-stock",
            displayStatus: "display",
            category: "Category 1",
            createdAt: "2021-01-01",
          },
          {
            id: "1",
            name: "Product 1",
            price: 10000,
            stock: 100,
            display: true,
            stockStatus: "in-stock",
            displayStatus: "display",
            category: "Category 1",
            createdAt: "2021-01-01",
          },
          {
            id: "1",
            name: "Product 1",
            price: 10000,
            stock: 100,
            display: true,
            stockStatus: "in-stock",
            displayStatus: "display",
            category: "Category 1",
            createdAt: "2021-01-01",
          },
          {
            id: "1",
            name: "Product 1",
            price: 10000,
            stock: 100,
            display: true,
            stockStatus: "in-stock",
            displayStatus: "display",
            category: "Category 1",
            createdAt: "2021-01-01",
          },
          {
            id: "1",
            name: "Product 1",
            price: 10000,
            stock: 100,
            display: true,
            stockStatus: "in-stock",
            displayStatus: "display",
            category: "Category 1",
            createdAt: "2021-01-01",
          },
          {
            id: "1",
            name: "Product 1",
            price: 10000,
            stock: 100,
            display: true,
            stockStatus: "in-stock",
            displayStatus: "display",
            category: "Category 1",
            createdAt: "2021-01-01",
          },
          {
            id: "1",
            name: "Product 1",
            price: 10000,
            stock: 100,
            display: true,
            stockStatus: "in-stock",
            displayStatus: "display",
            category: "Category 1",
            createdAt: "2021-01-01",
          },
          {
            id: "1",
            name: "Product 1",
            price: 10000,
            stock: 100,
            display: true,
            stockStatus: "in-stock",
            displayStatus: "display",
            category: "Category 1",
            createdAt: "2021-01-01",
          },
          {
            id: "1",
            name: "Product 1",
            price: 10000,
            stock: 100,
            display: true,
            stockStatus: "in-stock",
            displayStatus: "display",
            category: "Category 1",
            createdAt: "2021-01-01",
          },
          {
            id: "1",
            name: "Product 1",
            price: 10000,
            stock: 100,
            display: true,
            stockStatus: "in-stock",
            displayStatus: "display",
            category: "Category 1",
            createdAt: "2021-01-01",
          },
          {
            id: "1",
            name: "Product 1",
            price: 10000,
            stock: 100,
            display: true,
            stockStatus: "in-stock",
            displayStatus: "display",
            category: "Category 1",
            createdAt: "2021-01-01",
          },
          {
            id: "1",
            name: "Product 1",
            price: 10000,
            stock: 100,
            display: true,
            stockStatus: "in-stock",
            displayStatus: "display",
            category: "Category 1",
            createdAt: "2021-01-01",
          },
          {
            id: "1",
            name: "Product 1",
            price: 10000,
            stock: 100,
            display: true,
            stockStatus: "in-stock",
            displayStatus: "display",
            category: "Category 1",
            createdAt: "2021-01-01",
          },
          {
            id: "1",
            name: "Product 1",
            price: 10000,
            stock: 100,
            display: true,
            stockStatus: "in-stock",
            displayStatus: "display",
            category: "Category 1",
            createdAt: "2021-01-01",
          },
          {
            id: "1",
            name: "Product 1",
            price: 10000,
            stock: 100,
            display: true,
            stockStatus: "in-stock",
            displayStatus: "display",
            category: "Category 1",
            createdAt: "2021-01-01",
          },
        ]}
      />
    </ListViewWrapper>
  )
}
