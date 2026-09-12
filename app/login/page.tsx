import { redirect } from 'next/navigation';
import { isOfficeAuthenticated } from '@/lib/auth';
import { LoginForm } from '@/components/login-form';

export default async function LoginPage() {
  if (await isOfficeAuthenticated()) redirect('/');
  return <LoginForm />;
}
