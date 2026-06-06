import { SignUp } from "@clerk/nextjs";
import { signInUrl, signUpUrl } from "@/proxy";
import { AuthLayout } from "@/components/auth/auth-layout";

export default function SignUpPage() {
  return (
    <AuthLayout>
      <SignUp path={signUpUrl} routing="path" signInUrl={signInUrl} />
    </AuthLayout>
  );
}
