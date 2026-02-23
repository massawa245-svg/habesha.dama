import {getRequestConfig} from 'next-intl/server';
import {cookies} from 'next/headers';

// Statische Imports für beide Sprachen
import de from '../messages/de.json';
import en from '../messages/en.json';

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const locale = cookieStore.get('NEXT_LOCALE')?.value || 'de';

  return {
    locale,
    messages: locale === 'de' ? de : en
  };
});