import { AuthShell } from "@/features/auth/components/auth-shell";
import { ForgotPasswordForm } from "@/features/auth/components/auth-forms";

export default function ForgotPasswordPage() {
  return (
    <AuthShell title="Reset password" subtitle="We will send a verification code to your email.">
      <ForgotPasswordForm />
    </AuthShell>
  );
}
