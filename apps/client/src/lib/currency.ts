const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  EUR: "€",
  MDL: "L",
};

const CURRENCY_POSITION: Record<string, "prefix" | "suffix"> = {
  USD: "prefix",
  EUR: "prefix",
  MDL: "suffix",
};

export function formatCurrencyPrice(
  amount: number | null | undefined,
  currency: string = "USD"
): string {
  if (amount == null) return "";
  const symbol = CURRENCY_SYMBOLS[currency] || currency;
  const position = CURRENCY_POSITION[currency] || "prefix";
  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
  return position === "prefix" ? `${symbol}${formatted}` : `${formatted} ${symbol}`;
}

export function formatCurrencyPriceFull(
  amount: number | null | undefined,
  currency: string = "USD"
): string {
  if (amount == null) return formatCurrencyPrice(0, currency);
  const symbol = CURRENCY_SYMBOLS[currency] || currency;
  const position = CURRENCY_POSITION[currency] || "prefix";
  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return position === "prefix" ? `${symbol}${formatted}` : `${formatted} ${symbol}`;
}
