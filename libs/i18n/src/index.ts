export const locales = ['en', 'fr'] as const;
export type Locale = (typeof locales)[number];

export type Messages = Readonly<Record<string, string>>;

const catalogs: Readonly<Record<Locale, Messages>> = {
  en: { 'app.title': 'General Data Collection System' },
  fr: { 'app.title': 'Système général de collecte de données' },
};

/** 取文案；缺失的键退回英文，再缺失就返回键本身（便于在界面上发现漏翻）。 */
export function translate(locale: Locale, key: string): string {
  return catalogs[locale][key] ?? catalogs.en[key] ?? key;
}
