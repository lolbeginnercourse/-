import { redirect } from 'next/navigation';
import { OfficeApp } from '@/components/office-app';
import { isOfficeAuthenticated } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function Page() {
  if (!(await isOfficeAuthenticated())) redirect('/login');
  return <OfficeApp />;
}
