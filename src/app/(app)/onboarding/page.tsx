import { requireAdmin } from "@/lib/current-user";
import { OnboardingWizard } from "./onboarding-wizard";

export default async function OnboardingPage() {
  const { hotel } = await requireAdmin();

  return (
    <div>
      <h1 className="text-center text-2xl font-bold text-slate-900">
        Bine ai venit la {hotel.name}!
      </h1>
      <p className="mt-1 text-center text-sm text-slate-500">
        Câțiva pași rapizi ca să pornești aplicația — poți sări peste oricare dintre ei.
      </p>
      <div className="mt-6">
        <OnboardingWizard />
      </div>
    </div>
  );
}
