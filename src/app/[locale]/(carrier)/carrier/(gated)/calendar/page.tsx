import { redirect } from "next/navigation";

// The rides calendar now lives on the dashboard itself (the whole point of
// this feature was to stop it being a separate, buried page) — this route
// just forwards anyone with the old URL bookmarked.
export default async function CalendarPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/carrier/dashboard`);
}
