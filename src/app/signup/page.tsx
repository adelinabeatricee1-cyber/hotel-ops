import { getDictionary } from "@/lib/i18n/get-locale";
import { SignupForm } from "./signup-form";

export default async function SignupPage() {
  const { locale, t } = await getDictionary();

  return <SignupForm t={t} locale={locale} />;
}
