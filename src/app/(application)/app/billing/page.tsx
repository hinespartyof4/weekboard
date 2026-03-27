import { BillingOverview } from "@/components/app/billing-overview";
import { getBillingPageData } from "@/lib/billing/queries";

export default async function BillingPage() {
  const data = await getBillingPageData();

  return <BillingOverview data={data} />;
}
