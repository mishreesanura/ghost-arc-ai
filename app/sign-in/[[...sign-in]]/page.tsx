import { SignIn } from "@clerk/nextjs";
import { signInUrl, signUpUrl } from "@/proxy";
import { AuthLayout } from "@/components/auth/auth-layout";

export default function SignInPage() {
  return (
    <AuthLayout>
      <SignIn path={signInUrl} routing="path" signUpUrl={signUpUrl} />
    </AuthLayout>
  );
}
