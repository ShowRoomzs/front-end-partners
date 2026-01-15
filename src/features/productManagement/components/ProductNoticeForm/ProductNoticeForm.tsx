import FormController from "@/common/components/Form/FormController"
import FormInput from "@/common/components/Form/FormInput"
import FormItem from "@/common/components/Form/FormItem"
import { PRODUCT_VALIDATION_RULES } from "@/features/productManagement/constants/validationRules"
import type { ProductFormData } from "@/features/productManagement/pages/RegisterProductPage"
import type { Control } from "react-hook-form"

interface ProductNoticeFormProps {
  control: Control<ProductFormData>
}

export default function ProductNoticeForm(props: ProductNoticeFormProps) {
  const { control } = props

  return (
    <>
      <FormController
        name="productNotice.origin"
        control={control}
        rules={PRODUCT_VALIDATION_RULES.productNotice.origin}
        render={({ field, formState }) => (
          <FormItem
            required
            label="제조국"
            error={formState.errors.productNotice?.origin?.message}
          >
            <FormInput
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
            />
          </FormItem>
        )}
      />
      <FormController
        name="productNotice.material"
        control={control}
        rules={PRODUCT_VALIDATION_RULES.productNotice.material}
        render={({ field, formState }) => (
          <FormItem
            required
            label="소재"
            error={formState.errors.productNotice?.material?.message}
          >
            <FormInput
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
            />
          </FormItem>
        )}
      />
      <FormController
        name="productNotice.color"
        control={control}
        rules={PRODUCT_VALIDATION_RULES.productNotice.color}
        render={({ field, formState }) => (
          <FormItem
            required
            label="색상"
            error={formState.errors.productNotice?.color?.message}
          >
            <FormInput
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
            />
          </FormItem>
        )}
      />
      <FormController
        name="productNotice.size"
        control={control}
        rules={PRODUCT_VALIDATION_RULES.productNotice.size}
        render={({ field, formState }) => (
          <FormItem
            required
            label="치수"
            error={formState.errors.productNotice?.size?.message}
          >
            <FormInput
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
            />
          </FormItem>
        )}
      />
      <FormController
        name="productNotice.manufacturer"
        control={control}
        rules={PRODUCT_VALIDATION_RULES.productNotice.manufacturer}
        render={({ field, formState }) => (
          <FormItem
            required
            label="제조자"
            error={formState.errors.productNotice?.manufacturer?.message}
          >
            <FormInput
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
            />
          </FormItem>
        )}
      />
      <FormController
        name="productNotice.washingMethod"
        control={control}
        rules={PRODUCT_VALIDATION_RULES.productNotice.washingMethod}
        render={({ field, formState }) => (
          <FormItem
            required
            label="세탁 방법"
            error={formState.errors.productNotice?.washingMethod?.message}
          >
            <FormInput
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
            />
          </FormItem>
        )}
      />
      <FormController
        name="productNotice.manufactureDate"
        control={control}
        rules={PRODUCT_VALIDATION_RULES.productNotice.manufactureDate}
        render={({ field, formState }) => (
          <FormItem
            required
            label="제조년월"
            error={formState.errors.productNotice?.manufactureDate?.message}
          >
            <FormInput
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
            />
          </FormItem>
        )}
      />
      <FormController
        name="productNotice.asInfo"
        control={control}
        rules={PRODUCT_VALIDATION_RULES.productNotice.asInfo}
        render={({ field, formState }) => (
          <FormItem
            required
            label="A/S안내 및 연락처"
            error={formState.errors.productNotice?.asInfo?.message}
          >
            <FormInput
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
            />
          </FormItem>
        )}
      />
      <FormController
        name="productNotice.qualityAssurance"
        control={control}
        rules={PRODUCT_VALIDATION_RULES.productNotice.qualityAssurance}
        render={({ field, formState }) => (
          <FormItem
            required
            label="품질 보증 기준"
            error={formState.errors.productNotice?.qualityAssurance?.message}
          >
            <FormInput
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
            />
          </FormItem>
        )}
      />
    </>
  )
}
