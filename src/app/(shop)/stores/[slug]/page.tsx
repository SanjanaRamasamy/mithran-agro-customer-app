import { redirect } from "next/navigation";

export default async function StoreProfileRedirect({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(`/farms/${encodeURIComponent(slug)}`);
}
