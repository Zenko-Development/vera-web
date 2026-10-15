import { AuthGuard } from "@/features/components/AuthGuard";
import { HospitalWorkspace } from "../components/hospital-workspace";
import { hospitalPermissions } from "@/features/auth/access-control";
import type { HospitalOperationsSection } from "../../operations/components/hospital-operations";

const validSections = new Set<HospitalOperationsSection>(["overview", "arrivals", "schedule", "resources", "staff", "areas"]);

export default async function HospitalPage({ params, searchParams }: { params: Promise<{ hospitalId: string }>; searchParams: Promise<{ section?: string | string[] }> }) {
  const { hospitalId } = await params;
  const rawSection = (await searchParams).section;
  const section = typeof rawSection === "string" && validSections.has(rawSection as HospitalOperationsSection)
    ? rawSection as HospitalOperationsSection
    : undefined;
  return (
    <AuthGuard requireAuth redirectTo="/login" permissions={hospitalPermissions} className="h-full min-h-0">
      <HospitalWorkspace hospitalId={hospitalId} initialSection={section} />
    </AuthGuard>
  );
}
