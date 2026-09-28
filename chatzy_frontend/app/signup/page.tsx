import { AuthShell } from "@/features/auth/components/auth-shell";
import { SignupForm } from "@/features/auth/components/auth-forms";

export default function SignupPage() {
  return (
    <AuthShell title="Create your account" subtitle="Set up your secure workspace in seconds.">
      <SignupForm />
    </AuthShell>
  );
}
