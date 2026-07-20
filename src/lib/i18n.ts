/**
 * Minimal localization strings — English + local language per country.
 */

import type { AppLocale, CountryCode } from "./countries";
import { getCountry } from "./countries";

type MsgKey =
  | "search_places"
  | "country_label"
  | "language_label"
  | "available_in"
  | "payment_methods"
  | "select_country"
  | "welcome_country";

const EN: Record<MsgKey, string> = {
  search_places: "Search town, village or landmark…",
  country_label: "Country",
  language_label: "Language",
  available_in: "Available in",
  payment_methods: "Payment methods",
  select_country: "Where do you ride?",
  welcome_country: "Choose your country to see local prices & places.",
};

const LOCAL: Partial<Record<AppLocale, Partial<Record<MsgKey, string>>>> = {
  xh: {
    search_places: "Khangela idolophu, ilali okanye indawo…",
    country_label: "Ilizwe",
    language_label: "Ulwimi",
    available_in: "Iyafumaneka kwi",
    payment_methods: "Iindlela zokuhlawula",
    select_country: "Uqhuba phi?",
    welcome_country: "Khetha ilizwe lakho ukuze ubone amaxabiso neendawo.",
  },
  sw: {
    search_places: "Tafuta mji, kijiji au alama…",
    country_label: "Nchi",
    language_label: "Lugha",
    available_in: "Inapatikana katika",
    payment_methods: "Njia za malipo",
    select_country: "Unaendesha wapi?",
    welcome_country: "Chagua nchi yako kuona bei na maeneo ya hapa.",
  },
  yo: {
    search_places: "Wa abúlé, ìlú tàbí ibi…",
    country_label: "Orílẹ̀-èdè",
    language_label: "Èdè",
    available_in: "Ó wà ní",
    payment_methods: "Ọ̀nà ìsanwó",
    select_country: "Nibo ni o ń wà?",
    welcome_country: "Yan orílẹ̀-èdè rẹ láti rí iye owó àti ibi.",
  },
  ak: {
    search_places: "Hwehwɛ kurow, akuraa anaa beaeɛ…",
    country_label: "Ɔman",
    language_label: "Kasa",
    available_in: "Ɛwɔ",
    payment_methods: "Tua ho kwan",
    select_country: "Ɛhe na wote?",
    welcome_country: "Paw wo ɔman na wohu bo ne mmeaeɛ.",
  },
  hi: {
    search_places: "शहर, गाँव या जगह खोजें…",
    country_label: "देश",
    language_label: "भाषा",
    available_in: "उपलब्ध",
    payment_methods: "भुगतान के तरीके",
    select_country: "आप कहाँ हैं?",
    welcome_country: "स्थानीय कीमतें और जगहें देखने के लिए देश चुनें।",
  },
  tl: {
    search_places: "Maghanap ng bayan, baryo o landmark…",
    country_label: "Bansa",
    language_label: "Wika",
    available_in: "Available sa",
    payment_methods: "Paraan ng bayad",
    select_country: "Saan ka biyahe?",
    welcome_country: "Piliin ang bansa para sa lokal na presyo at lugar.",
  },
};

export function t(
  key: MsgKey,
  opts?: { locale?: AppLocale | "en"; country?: CountryCode | string | null },
): string {
  const locale = opts?.locale ?? "en";
  if (locale === "en") return EN[key];
  const countryLang = opts?.country
    ? getCountry(opts.country).language
    : locale;
  const pack = LOCAL[countryLang as AppLocale] ?? LOCAL[locale as AppLocale];
  return pack?.[key] ?? EN[key];
}
