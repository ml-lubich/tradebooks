import type { Part, PricingConfig } from '@/types';

export function calculateFlatRate(
  partCost: number,
  laborMinutes: number,
  config: PricingConfig
): number {
  const markedUpCost = partCost * (1 + config.partsMarkup / 100);
  const laborCost = (laborMinutes / 60) * config.laborRate;
  const subtotal = markedUpCost + laborCost;
  const total = subtotal * (1 + config.taxRate / 100);
  return Math.round(total * 100) / 100;
}

export function getPartFlatRate(part: Part, config: PricingConfig): number {
  if (part.is_custom_price && part.flat_rate_price !== null) {
    return part.flat_rate_price;
  }
  return calculateFlatRate(part.cost, part.labor_minutes, config);
}

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function pricebookToPricingConfig(pricebook: {
  default_labor_rate: number;
  default_parts_markup: number;
  default_materials_markup: number;
  tax_rate: number;
}): PricingConfig {
  return {
    laborRate: pricebook.default_labor_rate,
    partsMarkup: pricebook.default_parts_markup,
    materialsMarkup: pricebook.default_materials_markup,
    taxRate: pricebook.tax_rate,
  };
}
