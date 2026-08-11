import { getDictionary } from "@/lib/i18n/get-locale";
import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const { locale, t } = await getDictionary();

  return <LoginForm t={t} locale={locale} showNoProfileError={error === "no-profile"} />;
}
