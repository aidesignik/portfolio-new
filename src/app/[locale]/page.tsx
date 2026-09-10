import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";

export default async function HomePage() {
  const t = await getTranslations("home");

  return (
    <main className="mx-auto flex max-w-3xl flex-col items-center gap-8 px-4 py-24 text-center">
      <h1 className="text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
        {t("title")}
      </h1>
      <p className="max-w-xl text-lg text-zinc-600">{t("subtitle")}</p>
      <div className="flex flex-col gap-4 sm:flex-row">
        <Link href="/register">
          <Button>{t("ctaClient")}</Button>
        </Link>
        <Link href="/register/carrier">
          <Button variant="secondary">{t("ctaCarrier")}</Button>
        </Link>
      </div>
    </main>
  );
}
