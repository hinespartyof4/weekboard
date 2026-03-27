import type { Metadata } from "next";

import { InviteCard } from "@/components/invitations/invite-card";
import { getInvitePageData } from "@/lib/invitations/queries";

export const metadata: Metadata = {
  title: "Household Invite",
};

type InvitePageProps = {
  params: Promise<{
    token: string;
  }>;
};

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params;
  const data = await getInvitePageData(token);

  return (
    <main className="page-shell py-12">
      <InviteCard data={data} />
    </main>
  );
}
