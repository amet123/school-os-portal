import {redirect} from 'next/navigation';
import {cookies} from 'next/headers';

export default function LocaleRoot({params: {locale}}: {params: {locale: string}}) {
  const sid = cookies().get('school_sid')?.value;
  if (sid) {
    redirect(`/${locale}/student`);
  }
  redirect(`/${locale}/login`);
}
