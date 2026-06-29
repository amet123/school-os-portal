import {cookies} from 'next/headers';
import {redirect} from 'next/navigation';
import {ReactNode} from 'react';

export default function StudentLayout({
  children, params: {locale},
}: {children: ReactNode; params: {locale: string}}) {
  const sid = cookies().get('school_sid')?.value;
  if (!sid) redirect(`/${locale}/login`);
  return <>{children}</>;
}
