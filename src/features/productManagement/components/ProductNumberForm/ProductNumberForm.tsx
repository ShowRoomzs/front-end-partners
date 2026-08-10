import FormDisplay from "@/common/components/Form/FormDisplay"
import FormItem from "@/common/components/Form/FormItem"
import type { ProductDetailResponse } from "@/features/productManagement/services/productService"

interface ProductNumberFormProps {
  productDetail: ProductDetailResponse | undefined
}

export default function ProductNumberForm(props: ProductNumberFormProps) {
  const { productDetail } = props

  return (
    <FormItem label="상품번호">
      <FormDisplay value={productDetail?.productNumber || "자동입력됩니다."} />
    </FormItem>
  )
}
