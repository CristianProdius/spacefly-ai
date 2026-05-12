"use client";

import { useState } from "react";

const fieldClassName =
  "w-full rounded-md border border-input bg-background px-4 py-3 text-sm text-foreground shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30";

const labelClassName = "mb-1 block text-sm font-medium text-foreground";

interface TranslationField {
  name: string;
  label: string;
  type: "input" | "textarea";
  value: string;
  translations: Record<string, string>;
  onTranslationChange: (lang: string, value: string) => void;
}

interface TranslationTabsProps {
  fields: TranslationField[];
}

const LANGUAGES = [
  { code: "en", label: "EN" },
  { code: "ro", label: "RO" },
  { code: "ru", label: "RU" },
] as const;

const TranslationTabs = ({ fields }: TranslationTabsProps) => {
  const [activeTab, setActiveTab] = useState<"en" | "ro" | "ru">("en");

  return (
    <div className="rounded-lg border border-border/60 bg-accent/10 p-4">
      <div className="mb-4 flex items-center gap-1 rounded-md bg-accent/30 p-1">
        {LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            type="button"
            onClick={() => setActiveTab(lang.code)}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              activeTab === lang.code
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {lang.label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {fields.map((field) => (
          <div key={field.name}>
            <label className={labelClassName}>
              {field.label}{" "}
              <span className="text-xs text-muted-foreground uppercase">
                ({activeTab})
              </span>
            </label>
            {field.type === "textarea" ? (
              <textarea
                rows={3}
                disabled={activeTab === "en"}
                value={
                  activeTab === "en"
                    ? field.value
                    : field.translations[activeTab] ?? ""
                }
                onChange={(e) =>
                  field.onTranslationChange(activeTab, e.target.value)
                }
                className={`${fieldClassName} min-h-24 resize-y`}
                placeholder={
                  activeTab === "en"
                    ? "Edited in the main form above"
                    : `${field.label} in ${activeTab.toUpperCase()}`
                }
              />
            ) : (
              <input
                type="text"
                disabled={activeTab === "en"}
                value={
                  activeTab === "en"
                    ? field.value
                    : field.translations[activeTab] ?? ""
                }
                onChange={(e) =>
                  field.onTranslationChange(activeTab, e.target.value)
                }
                className={fieldClassName}
                placeholder={
                  activeTab === "en"
                    ? "Edited in the main form above"
                    : `${field.label} in ${activeTab.toUpperCase()}`
                }
              />
            )}
          </div>
        ))}
      </div>

      {activeTab === "en" && (
        <p className="mt-3 text-xs text-muted-foreground">
          English content is edited in the main form fields above. Select RO or
          RU to add translations.
        </p>
      )}
    </div>
  );
};

export default TranslationTabs;
