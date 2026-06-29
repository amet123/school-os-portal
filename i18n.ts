import {getRequestConfig} from 'next-intl/server';

const LOCALES = ['en', 'hi', 'ar'];

export default getRequestConfig(async ({requestLocale}) => {
  const requested = await requestLocale;
  const locale = requested && LOCALES.includes(requested) ? requested : 'en';
  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});
