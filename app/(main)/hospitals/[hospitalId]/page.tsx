import { AuthGuard } from "@/features/components/AuthGuard";
import { HospitalWorkspace } from "../components/hospital-workspace";

export default async function HospitalPage({ params }: { params: Promise<{ hospitalId: string }> }) {
  const { hospitalId } = await params;
  return (
    <AuthGuard requireAuth redirectTo="/login" className="h-full min-h-0">
      <HospitalWorkspace hospitalId={hospitalId} />
    </AuthGuard>
  );
}
