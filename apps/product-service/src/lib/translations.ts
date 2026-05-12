export function resolveTranslations<T extends Record<string, unknown>>(
  entity: T,
  lang: string | undefined,
  fields: Array<{ original: string; translations: string }>
): T {
  if (!lang || lang === "en") return entity;
  const resolved = { ...entity };
  for (const { original, translations: translationsKey } of fields) {
    const translations = entity[translationsKey];
    if (translations && typeof translations === "object" && !Array.isArray(translations)) {
      const translated = (translations as Record<string, string>)[lang];
      if (translated) {
        (resolved as any)[original] = translated;
      }
    }
  }
  return resolved;
}

export const SPACE_TRANSLATION_FIELDS = [
  { original: "name", translations: "nameTranslations" },
  { original: "shortDescription", translations: "shortDescTranslations" },
  { original: "description", translations: "descriptionTranslations" },
];

export const VENUE_TRANSLATION_FIELDS = [
  { original: "name", translations: "nameTranslations" },
  { original: "shortDescription", translations: "shortDescTranslations" },
  { original: "description", translations: "descriptionTranslations" },
];
