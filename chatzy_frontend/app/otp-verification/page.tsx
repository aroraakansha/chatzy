import { AuthShell } from "@/features/auth/components/auth-shell";
import { OtpVerificationForm } from "@/features/auth/components/auth-forms";

export default function OtpVerificationPage() {
  return (
    <AuthShell title="Verify OTP" subtitle="Enter the 6 digit code to finish verification.">
      <OtpVerificationForm />
    </AuthShell>
  );
}
