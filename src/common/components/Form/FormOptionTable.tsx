import { forwardRef } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Trash2 } from 'lucide-react'

export interface OptionItem {
  id: string
  name: string
  price: string
}

interface FormOptionTableProps {
  optionName?: string
  onOptionNameChange?: (name: string) => void
  options: Array<OptionItem>
  onChange?: (options: Array<OptionItem>) => void
  disabled?: boolean
}

const FormOptionTable = forwardRef<HTMLDivElement, FormOptionTableProps>(
  (props, ref) => {
    const {
      optionName = '',
      onOptionNameChange,
      options = [],
      onChange,
      disabled = false,
    } = props

    const handleAddItem = () => {
      const newOption: OptionItem = {
        id: crypto.randomUUID(),
        name: '',
        price: '',
      }
      onChange?.([...options, newOption])
    }

    const handleRemoveItem = (id: string) => {
      if (options.length <= 1) return
      onChange?.(options.filter(opt => opt.id !== id))
    }

    const handleChangeItem = (
      id: string,
      field: keyof OptionItem,
      value: string
    ) => {
      onChange?.(
        options.map(opt => (opt.id === id ? { ...opt, [field]: value } : opt))
      )
    }

    return (
      <div
        ref={ref}
        className="space-y-4 border border-gray-300 rounded-md p-3"
      >
        <div className="flex items-center gap-3">
          <Input
            value={optionName}
            onChange={e => onOptionNameChange?.(e.target.value)}
            placeholder="옵션명 (예: 색상, 사이즈)"
            disabled={disabled}
            className="max-w-md"
          />
          <Button
            type="button"
            variant="outline"
            onClick={handleAddItem}
            disabled={disabled}
          >
            + 새 옵션 항목 추가하기
          </Button>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20 text-center">순서</TableHead>
                <TableHead>옵션 항목</TableHead>
                <TableHead className="w-48">옵션가</TableHead>
                <TableHead className="w-20 text-center">삭제</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {options.map((option, index) => (
                <TableRow key={option.id}>
                  <TableCell className="text-center">{index + 1}</TableCell>
                  <TableCell>
                    <Input
                      value={option.name}
                      onChange={e =>
                        handleChangeItem(option.id, 'name', e.target.value)
                      }
                      placeholder="옵션 항목명 (예: 빨강, s)"
                      disabled={disabled}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">+</span>
                      <Input
                        value={option.price}
                        onChange={e =>
                          handleChangeItem(option.id, 'price', e.target.value)
                        }
                        placeholder="0"
                        disabled={disabled}
                        type="number"
                      />
                    </div>
                  </TableCell>
                  <TableCell className="flex items-center justify-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveItem(option.id)}
                      disabled={disabled || options.length <= 1}
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
  }
)

FormOptionTable.displayName = 'FormOptionTable'

export default FormOptionTable
