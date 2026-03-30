export type Trade = 'hvac' | 'plumbing' | 'electrical' | 'general';

export interface Pricebook {
  id: string;
  user_id: string;
  name: string;
  trade: Trade;
  description: string | null;
  default_labor_rate: number;
  default_parts_markup: number;
  default_materials_markup: number;
  tax_rate: number;
  currency: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  pricebook_id: string;
  name: string;
  description: string | null;
  sort_order: number;
  labor_rate_override: number | null;
  parts_markup_override: number | null;
  created_at: string;
}

export interface Part {
  id: string;
  user_id: string;
  category_id: string | null;
  pricebook_id: string;
  name: string;
  description: string | null;
  part_number: string | null;
  cost: number;
  labor_minutes: number;
  flat_rate_price: number | null;
  is_custom_price: boolean;
  unit: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PartWithCategory extends Part {
  category?: Category;
}

export interface PricebookWithCategories extends Pricebook {
  categories: CategoryWithParts[];
}

export interface CategoryWithParts extends Category {
  parts: Part[];
}

export interface PricingConfig {
  laborRate: number;
  partsMarkup: number;
  materialsMarkup: number;
  taxRate: number;
}

export interface CSVPartRow {
  name: string;
  part_number?: string;
  cost: string | number;
  labor_minutes?: string | number;
  category?: string;
  description?: string;
  unit?: string;
}

export interface StarterTemplate {
  name: string;
  categories: {
    name: string;
    parts: {
      name: string;
      description?: string;
      part_number?: string;
      cost: number;
      labor_minutes: number;
    }[];
  }[];
}
