import { forwardRef } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Trash2 } from "lucide-react"
import { confirm } from "@/common/components/ConfirmModal"

export interface OptionCombination {
  id: string
  combination: Array<string>
  price: string
  stock: string
  isDisplayed: boolean
  isRepresentative: boolean
}

interface FormOptionCombinationTableProps {
  combinations: Array<OptionCombination>
  onChange?: (combinations: Array<OptionCombination>) => void
  disabled?: boolean
}

const FormOptionCombinationTable = forwardRef<
  HTMLDivElement,
  FormOptionCombinationTableProps
>((props, ref) => {
  const { combinations, onChange, disabled = false } = props

  const optionHeaders =
    combinations.length > 0
      ? combinations[0].combination.map((_, index) => `옵션 ${index + 1}`)
      : []

  const handleCombinationChange = (
    id: string,
    field: keyof OptionCombination,
    value: string | boolean
  ) => {
    onChange?.(
      combinations.map(comb =>
        comb.id === id ? { ...comb, [field]: value } : comb
      )
    )
  }

  const handleRemoveCombination = async (id: string) => {
    const result = await confirm({
      title: "해당 옵션 조합 삭제",
      content: "해당 옵션 조합을 삭제하시겠습니까?",
      cancelText: "아니요",
      confirmText: "예",
    })
    if (!result) {
      return
    }
    onChange?.(combinations.filter(comb => comb.id !== id))
  }

  if (combinations.length === 0) {
    return (
      <div
        ref={ref}
        className="rounded-md border border-gray-300 p-8 text-center text-gray-500"
      >
        옵션을 입력하면 자동으로 조합이 생성됩니다.
      </div>
    )
  }

  return (
    <div ref={ref}>
      <div className="mb-2">
        <h3 className="text-sm font-medium text-gray-900">옵션 목록</h3>
      </div>
      <div className="rounded-md border border-gray-300">
        <Table>
          <TableHeader>
            <TableRow>
              {optionHeaders.map((header, index) => (
                <TableHead key={index} className="text-center border-r">
                  {header}
                </TableHead>
              ))}
              <TableHead className="text-center border-r">옵션가</TableHead>
              <TableHead className="text-center border-r">재고 수량</TableHead>
              <TableHead className="text-center border-r">진열 여부</TableHead>
              <TableHead className="text-center border-r">
                대표 옵션 여부
              </TableHead>
              <TableHead className="text-center">삭제</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {combinations.map(combination => (
              <TableRow key={combination.id}>
                {combination.combination.map((item, index) => (
                  <TableCell key={index} className="text-center border-r">
                    <span className="text-sm">{item}</span>
                  </TableCell>
                ))}
                <TableCell className="border-r">
                  <div className="flex items-center gap-2 px-3">
                    <span className="text-muted-foreground">+</span>
                    <Input
                      value={combination.price}
                      onChange={e =>
                        handleCombinationChange(
                          combination.id,
                          "price",
                          e.target.value
                        )
                      }
                      type="number"
                    />
                  </div>
                </TableCell>
                <TableCell className="border-r">
                  <Input
                    value={combination.stock}
                    onChange={e =>
                      handleCombinationChange(
                        combination.id,
                        "stock",
                        e.target.value
                      )
                    }
                    disabled={disabled}
                    type="number"
                    placeholder="0"
                  />
                </TableCell>
                <TableCell className="text-center border-r">
                  <div className="flex justify-center">
                    <Switch
                      checked={combination.isDisplayed}
                      onCheckedChange={checked =>
                        handleCombinationChange(
                          combination.id,
                          "isDisplayed",
                          checked
                        )
                      }
                      disabled={disabled}
                    />
                  </div>
                </TableCell>
                <TableCell className="text-center border-r">
                  <RadioGroup
                    value={combinations.find(c => c.isRepresentative)?.id ?? ""}
                    onValueChange={newRepId => {
                      const updated = combinations.map(c => ({
                        ...c,
                        isRepresentative: c.id === newRepId,
                      }))
                      onChange?.(updated)
                    }}
                    disabled={disabled}
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <RadioGroupItem
                        value={combination.id}
                        id={`rep-${combination.id}`}
                      />
                      <Label
                        htmlFor={`rep-${combination.id}`}
                        className="cursor-pointer"
                      >
                        지정
                      </Label>
                    </div>
                  </RadioGroup>
                </TableCell>
                <TableCell className="text-center">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveCombination(combination.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
})

FormOptionCombinationTable.displayName = "FormOptionCombinationTable"

export default FormOptionCombinationTable
