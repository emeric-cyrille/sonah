import { cookies, headers } from 'next/headers';
import { isLocale, LOCALE_COOKIE, negotiateLocale, type Locale } from './config';
import { getDictionary, type Dictionary } from './dictionaries';

/** Langue de la requête : cookie de préférence, sinon Accept-Language, sinon français. */
export function getLocale(): Locale {
  const fromCookie = cookies().get(LOCALE_COOKIE)?.value;
  if (isLocale(fromCookie)) return fromCookie;
  return negotiateLocale(headers().get('accept-language'));
}

export function getServerDictionary(): { locale: Locale; dict: Dictionary } {
  const locale = getLocale();
  return { locale, dict: getDictionary(locale) };
}
