import SubNav, {
  type BasicInfoTabKey,
} from "@/features/storeManagement/components/SubNav/SubNav"
import AccountTab from "@/features/storeManagement/components/tabs/AccountTab"
import BusinessInfoTab from "@/features/storeManagement/components/tabs/BusinessInfoTab"
import ManagerCsTab from "@/features/storeManagement/components/tabs/ManagerCsTab"
import SettlementAccountTab from "@/features/storeManagement/components/tabs/SettlementAccountTab"
import { useSearchParams } from "react-router-dom"

const TAB_KEYS: Array<BasicInfoTabKey> = [
  "business",
  "settlement",
  "manager",
  "account",
]

/** 시안 GNB #9 "기본정보 관리" — 서브탭은 GNB가 아니라 쿼리파라미터로 이 페이지 안에서만 전환된다 */
export default function BasicInfoPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = searchParams.get("tab")
  const active: BasicInfoTabKey = TAB_KEYS.includes(tabParam as BasicInfoTabKey)
    ? (tabParam as BasicInfoTabKey)
    : "business"

  const handleChangeTab = (key: BasicInfoTabKey) => {
    setSearchParams(key === "business" ? {} : { tab: key })
  }

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-[20px] font-semibold text-sz-n-900">
          기본정보 관리
        </h1>
        <p className="mt-0.5 text-[12px] text-sz-n-600">
          사업자 정보, 정산 계좌 등 브랜드 계정 정보를 확인하고 관리합니다.
        </p>
      </div>

      <div className="flex items-start gap-[22px]">
        <SubNav active={active} onChange={handleChangeTab} />
        <div className="min-w-0 flex-1">
          {active === "business" && <BusinessInfoTab />}
          {active === "settlement" && <SettlementAccountTab />}
          {active === "manager" && <ManagerCsTab />}
          {active === "account" && <AccountTab />}
        </div>
      </div>
    </div>
  )
}
