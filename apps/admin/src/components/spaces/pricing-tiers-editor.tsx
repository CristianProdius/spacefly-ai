"use client";

import { Plus, X } from "lucide-react";
import { PRICING_TIER_PRESETS, CURRENCY_SYMBOLS } from "@repo/types";
import { fieldClassName, labelClassName } from "./space-form.shared";

interface PricingTier {
  minutes: number;
  label: string;
  price: string;
}

interface PricingTiersEditorProps {
  tiers: PricingTier[];
  onChange: (tiers: PricingTier[]) => void;
  currency: string;
}

const PricingTiersEditor = ({ tiers, onChange, currency }: PricingTiersEditorProps) => {
  const currencySymbol = CURRENCY_SYMBOLS[currency as keyof typeof CURRENCY_SYMBOLS] || currency;

  const addTier = () => {
    const firstUnused = PRICING_TIER_PRESETS.find(
      (preset) => !tiers.some((t) => t.minutes === preset.minutes)
    );
    const newTier: PricingTier = firstUnused
      ? { minutes: firstUnused.minutes, label: firstUnused.label, price: "" }
      : { minutes: 60, label: "1 hour", price: "" };
    onChange([...tiers, newTier]);
  };

  const removeTier = (index: number) => {
    onChange(tiers.filter((_, i) => i !== index));
  };

  const updateTier = (index: number, field: keyof PricingTier, value: string | number) => {
    const updated = tiers.map((tier, i) => {
      if (i !== index) return tier;
      if (field === "minutes") {
        const minutes = typeof value === "string" ? parseInt(value, 10) : value;
        const preset = PRICING_TIER_PRESETS.find((p) => p.minutes === minutes);
        return { ...tier, minutes, label: preset ? preset.label : tier.label };
      }
      return { ...tier, [field]: value };
    });
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      <label className={labelClassName}>Pricing Tiers</label>
      <p className="text-sm text-muted-foreground">
        Define interval-based pricing for longer bookings. These override the default hourly/daily rates.
      </p>

      {tiers.map((tier, index) => (
        <div key={index} className="flex items-end gap-3">
          <div className="flex-1">
            {index === 0 && (
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Duration
              </label>
            )}
            <select
              value={tier.minutes}
              onChange={(e) => updateTier(index, "minutes", e.target.value)}
              className={fieldClassName}
            >
              {PRICING_TIER_PRESETS.map((preset) => (
                <option key={preset.minutes} value={preset.minutes}>
                  {preset.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1">
            {index === 0 && (
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Label
              </label>
            )}
            <input
              type="text"
              value={tier.label}
              onChange={(e) => updateTier(index, "label", e.target.value)}
              className={fieldClassName}
              placeholder="e.g. Half day"
            />
          </div>

          <div className="flex-1">
            {index === 0 && (
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Price ({currencySymbol})
              </label>
            )}
            <input
              type="number"
              min="0"
              step="0.01"
              value={tier.price}
              onChange={(e) => updateTier(index, "price", e.target.value)}
              className={fieldClassName}
              placeholder={currencySymbol}
            />
          </div>

          <button
            type="button"
            onClick={() => removeTier(index)}
            className="mb-0.5 inline-flex size-10 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            aria-label={`Remove tier ${index + 1}`}
          >
            <X className="size-4" />
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={addTier}
        className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        <Plus className="size-4" />
        Add tier
      </button>
    </div>
  );
};

export default PricingTiersEditor;
