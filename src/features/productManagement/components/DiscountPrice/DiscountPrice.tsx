import FormDisplay from "@/common/components/Form/FormDisplay"
import type { ProductFormData } from "@/features/productManagement/pages/RegisterProductPage"
import { useCallback } from "react"
import { useWatch, type Control } from "react-hook-form"

interface DiscountPriceProps {
  control: Control<ProductFormData>
}

export default function DiscountPrice(props: DiscountPriceProps) {
  const { control } = props

  const regularPrice = useWatch({
    control,
    name: "regularPrice",
    defaultValue: 0,
  })

  const discountRate = useWatch({
    control,
    name: "discountRate",
    defaultValue: 0,
  })

  const isDiscount = useWatch({
    control,
    name: "isDiscount",
    defaultValue: false,
  })

  const getDiscountedPrice = useCallback(() => {
    const regularPriceNum = Number(regularPrice)
    const discountRateNum = Number(discountRate)
    if (isDiscount) {
      return Math.max(regularPriceNum - discountRateNum, 0).toLocaleString()
    }

    return regularPriceNum.toLocaleString()
  }, [discountRate, isDiscount, regularPrice])

  return <FormDisplay value={getDiscountedPrice()} />
}
