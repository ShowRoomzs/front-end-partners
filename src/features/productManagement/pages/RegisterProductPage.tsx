import { useForm, Controller, useFieldArray } from 'react-hook-form'
import Section from '@/common/components/Section/Section'
import FormItem from '@/common/components/Form/FormItem'
import FormInput from '@/common/components/Form/FormInput'
import FormCategorySelector from '@/common/components/Form/FormCategorySelector'
import FormDisplay from '@/common/components/Form/FormDisplay'
import FormRadioGroup from '@/common/components/Form/FormRadioGroup'
import FormOptionTable, {
  type OptionItem,
} from '@/common/components/Form/FormOptionTable'
import FormOptionCombinationTable, {
  type OptionCombination,
} from '@/common/components/Form/FormOptionCombinationTable'
import { Button } from '@/components/ui/button'
import { Trash2, ArrowDown } from 'lucide-react'

interface OptionGroup {
  id: string
  name: string
  items: Array<OptionItem>
}

interface ProductFormData {
  displayStatus: string
  productName: string
  category: {
    main: string
    sub: string
    detail: string
  }
  optionGroups: Array<OptionGroup>
  optionCombinations: Array<OptionCombination>
  representativeOption: string
}

// 임시 카테고리 데이터
const categoryData = {
  mainCategories: [
    { label: '패션 의류', value: 'fashion' },
    { label: '뷰티', value: 'beauty' },
  ],
  subCategories: {
    fashion: [
      { label: '아우터', value: 'outer' },
      { label: '상의', value: 'top' },
    ],
    beauty: [
      { label: '스킨케어', value: 'skincare' },
      { label: '메이크업', value: 'makeup' },
    ],
  },
  detailCategories: {
    outer: [
      { label: '코트', value: 'coat' },
      { label: '자켓', value: 'jacket' },
    ],
    top: [
      { label: '티셔츠', value: 'tshirt' },
      { label: '셔츠', value: 'shirt' },
    ],
    skincare: [
      { label: '토너', value: 'toner' },
      { label: '세럼', value: 'serum' },
    ],
    makeup: [
      { label: '파운데이션', value: 'foundation' },
      { label: '립스틱', value: 'lipstick' },
    ],
  },
}

export default function RegisterProductPage() {
  const { control, handleSubmit, setValue, getValues } =
    useForm<ProductFormData>({
      defaultValues: {
        displayStatus: 'DISPLAY',
        productName: '',
        category: {
          main: '',
          sub: '',
          detail: '',
        },
        optionGroups: [
          {
            id: crypto.randomUUID(),
            name: '',
            items: [{ id: crypto.randomUUID(), name: '', price: '' }],
          },
        ],
        optionCombinations: [],
        representativeOption: '',
      },
    })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'optionGroups',
  })

  const handleAddOptionGroup = () => {
    append({
      id: crypto.randomUUID(),
      name: '',
      items: [{ id: crypto.randomUUID(), name: '', price: '' }],
    })
  }

  const handleMoveToCombinations = () => {
    const optionGroups = getValues('optionGroups')

    const validGroups = optionGroups.filter(
      group =>
        group.name &&
        group.items.length > 0 &&
        group.items.some(item => item.name)
    )

    if (validGroups.length === 0) {
      alert('옵션을 입력해주세요.')
      return
    }

    const validItems = validGroups.map(group =>
      group.items.filter(item => item.name)
    )

    const cartesianProduct = (
      arrays: Array<Array<OptionItem>>
    ): Array<Array<OptionItem>> => {
      if (arrays.length === 0) return []
      if (arrays.length === 1) return arrays[0].map(item => [item])

      const result: Array<Array<OptionItem>> = []
      const restProduct = cartesianProduct(arrays.slice(1))

      for (const item of arrays[0]) {
        for (const rest of restProduct) {
          result.push([item, ...rest])
        }
      }

      return result
    }

    const combinations = cartesianProduct(validItems)

    const newCombinations = combinations.map(combo => ({
      id: crypto.randomUUID(),
      combination: combo.map(item => item.name),
      price: combo
        .reduce((sum, item) => sum + Number(item.price || 0), 0)
        .toString(),
      stock: '0',
      isDisplayed: true,
    }))

    const currentCombinations = getValues('optionCombinations') || []
    setValue('optionCombinations', [...currentCombinations, ...newCombinations])

    // 옵션 설정 초기화
    setValue('optionGroups', [
      {
        id: crypto.randomUUID(),
        name: '',
        items: [{ id: crypto.randomUUID(), name: '', price: '' }],
      },
    ])
  }

  const onSubmit = (data: ProductFormData) => {
    // eslint-disable-next-line no-console
    console.log('Form data:', data)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Section title="표시 여부" required>
        <Controller
          name="displayStatus"
          control={control}
          rules={{ required: '진열상태를 선택해주세요' }}
          render={({ field, fieldState }) => (
            <FormItem
              label="진열상태"
              required
              error={fieldState.error?.message}
            >
              <FormRadioGroup
                options={[
                  { label: '진열', value: 'DISPLAY' },
                  { label: '미진열', value: 'HIDDEN' },
                ]}
                value={field.value}
                onChange={field.onChange}
              />
            </FormItem>
          )}
        />
      </Section>

      <Section title="카테고리(한 개만 지정 가능)" required>
        <Controller
          name="category"
          control={control}
          rules={{ required: '카테고리를 선택해주세요' }}
          render={({ field, fieldState }) => (
            <FormItem
              label="카테고리"
              required
              error={fieldState.error?.message}
            >
              <FormCategorySelector
                categoryData={categoryData}
                value={field.value}
                onChange={field.onChange}
              />
            </FormItem>
          )}
        />
      </Section>

      <Section title="기본 정보" required>
        <Controller
          name="productName"
          control={control}
          rules={{
            required: '상품명을 입력해주세요',
            maxLength: {
              value: 100,
              message: '상품명은 최대 100자까지 입력 가능합니다',
            },
          }}
          render={({ field, fieldState }) => (
            <FormItem label="상품명" required error={fieldState.error?.message}>
              <FormInput
                placeholder="상품명을 입력해주세요(특수문자 입력은 피해주세요)"
                maxLength={100}
                onChange={field.onChange}
                onBlur={field.onBlur}
              />
            </FormItem>
          )}
        />

        <FormItem label="상품번호">
          <FormDisplay value="자동입력됩니다." />
        </FormItem>
      </Section>

      <Section title="옵션 설정">
        <div className="space-y-6">
          {fields.map((field, index) => (
            <div key={field.id} className="relative">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-900">
                  옵션 {index + 1}
                </h3>
                {fields.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    옵션 삭제
                  </Button>
                )}
              </div>
              <Controller
                name={`optionGroups.${index}.name`}
                control={control}
                render={({ field: nameField }) => (
                  <Controller
                    name={`optionGroups.${index}.items`}
                    control={control}
                    render={({ field: itemsField }) => (
                      <FormOptionTable
                        optionName={nameField.value}
                        onOptionNameChange={nameField.onChange}
                        options={itemsField.value}
                        onChange={itemsField.onChange}
                      />
                    )}
                  />
                )}
              />
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            onClick={handleAddOptionGroup}
          >
            + 새로운 옵션 추가
          </Button>

          <div className="pt-4 border-t">
            <Button
              type="button"
              variant="default"
              onClick={handleMoveToCombinations}
              className="w-full"
            >
              <ArrowDown className="h-4 w-4 mr-2" />
              옵션 목록으로 이동
            </Button>
          </div>
        </div>
      </Section>

      <Section title="옵션 조합">
        <Controller
          name="optionCombinations"
          control={control}
          render={({ field: combinationsField }) => (
            <Controller
              name="representativeOption"
              control={control}
              render={({ field: representativeField }) => (
                <FormOptionCombinationTable
                  combinations={combinationsField.value}
                  onChange={combinationsField.onChange}
                  representativeOption={representativeField.value}
                  onRepresentativeChange={representativeField.onChange}
                />
              )}
            />
          )}
        />
      </Section>

      <div className="flex gap-3 justify-end mt-6">
        <button
          type="button"
          className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          취소
        </button>
        <button
          type="submit"
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          등록하기
        </button>
      </div>
    </form>
  )
}
