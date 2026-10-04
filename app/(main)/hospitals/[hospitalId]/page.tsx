import { AuthGuard } from "@/features/components/AuthGuard";
import { HospitalWorkspace } from "../components/hospital-workspace";
import { hospitalPermissions } from "@/features/auth/access-control";

export default async function HospitalPage({ params }: { params: Promise<{ hospitalId: string }> }) {
  const { hospitalId } = await params;
  return (
    <AuthGuard requireAuth redirectTo="/login" permissions={hospitalPermissions} className="h-full min-h-0">
      <HospitalWorkspace hospitalId={hospitalId} />
    </AuthGuard>
  );
}
