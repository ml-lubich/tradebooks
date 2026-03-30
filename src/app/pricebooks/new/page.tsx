'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { getTemplateForTrade } from '@/lib/templates';
import type { Trade } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Loader2, Sparkles } from 'lucide-react';

const tradeOptions: { value: Trade; label: string }[] = [
  { value: 'hvac', label: 'HVAC' },
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'general', label: 'General' },
];

const tradeTemplateInfo: Record<Trade, string> = {
  hvac: 'Pre-populates with common HVAC categories like AC Repair, Furnace Install, Heat Pumps, and starter parts with typical costs and labor times.',
  plumbing: 'Pre-populates with common plumbing categories like Water Heaters, Drain Cleaning, Fixture Install, and starter parts with typical costs and labor times.',
  electrical: 'Pre-populates with common electrical categories like Panel Work, Outlet/Switch, Lighting, and starter parts with typical costs and labor times.',
  general: 'Pre-populates with general maintenance categories and common starter parts with typical costs and labor times.',
};

export default function NewPricebookPage() {
  const router = useRouter();
  const supabase = createClient();

  const [name, setName] = useState('');
  const [trade, setTrade] = useState<Trade>('hvac');
  const [description, setDescription] = useState('');
  const [laborRate, setLaborRate] = useState(95);
  const [partsMarkup, setPartsMarkup] = useState(50);
  const [materialsMarkup, setMaterialsMarkup] = useState(30);
  const [taxRate, setTaxRate] = useState(0);
  const [useTemplate, setUseTemplate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError('Pricebook name is required');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('You must be logged in');

      // Insert pricebook
      const { data: pricebook, error: pbError } = await supabase
        .from('pricebooks')
        .insert({
          user_id: user.id,
          name: name.trim(),
          trade,
          description: description.trim() || null,
          default_labor_rate: laborRate,
          default_parts_markup: partsMarkup,
          default_materials_markup: materialsMarkup,
          tax_rate: taxRate,
        })
        .select()
        .single();

      if (pbError) throw pbError;

      // If using starter template, insert categories and parts
      if (useTemplate) {
        const template = getTemplateForTrade(trade);
        if (template) {
          for (const cat of template.categories) {
            const { data: category, error: catError } = await supabase
              .from('categories')
              .insert({
                pricebook_id: pricebook.id,
                name: cat.name,
                sort_order: template.categories.indexOf(cat),
              })
              .select()
              .single();

            if (catError) throw catError;

            if (cat.parts.length > 0) {
              const partsToInsert = cat.parts.map((part) => ({
                user_id: user.id,
                pricebook_id: pricebook.id,
                category_id: category.id,
                name: part.name,
                description: part.description || null,
                part_number: part.part_number || null,
                cost: part.cost,
                labor_minutes: part.labor_minutes,
              }));

              const { error: partsError } = await supabase
                .from('parts')
                .insert(partsToInsert);

              if (partsError) throw partsError;
            }
          }
        }
      }

      router.push(`/pricebooks/${pricebook.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create pricebook');
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          size="sm"
          className="mb-4"
          render={<Link href="/pricebooks" />}
        >
          <ArrowLeft className="size-4" data-icon="inline-start" />
          Back to Pricebooks
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">
          Create New Pricebook
        </h1>
        <p className="text-sm text-muted-foreground">
          Set up a new flat-rate pricebook for your trade business
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Basic Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Name your pricebook and select a trade type
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Pricebook Name *</Label>
              <Input
                id="name"
                placeholder="e.g., 2026 HVAC Service Rates"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="trade">Trade Type</Label>
              <Select
                value={trade}
                onValueChange={(val) => setTrade(val as Trade)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select trade type" />
                </SelectTrigger>
                <SelectContent>
                  {tradeOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Optional description for this pricebook..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Markup Settings */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Markup Settings</CardTitle>
            <CardDescription>
              Set your default pricing rates. You can override these per category
              or per item later.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="laborRate">Labor Rate ($/hr)</Label>
                <Input
                  id="laborRate"
                  type="number"
                  min={0}
                  step={0.01}
                  value={laborRate}
                  onChange={(e) => setLaborRate(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="partsMarkup">Parts Markup (%)</Label>
                <Input
                  id="partsMarkup"
                  type="number"
                  min={0}
                  step={0.01}
                  value={partsMarkup}
                  onChange={(e) => setPartsMarkup(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="materialsMarkup">Materials Markup (%)</Label>
                <Input
                  id="materialsMarkup"
                  type="number"
                  min={0}
                  step={0.01}
                  value={materialsMarkup}
                  onChange={(e) => setMaterialsMarkup(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="taxRate">Tax Rate (%)</Label>
                <Input
                  id="taxRate"
                  type="number"
                  min={0}
                  step={0.01}
                  value={taxRate}
                  onChange={(e) => setTaxRate(Number(e.target.value))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Starter Template */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="size-4 text-orange" />
              Starter Template
            </CardTitle>
            <CardDescription>
              Pre-populate your pricebook with common categories and parts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={useTemplate}
                onChange={(e) => setUseTemplate(e.target.checked)}
                className="size-4 rounded border-input accent-orange"
              />
              <span className="text-sm font-medium">
                Use starter template for {tradeOptions.find((t) => t.value === trade)?.label}
              </span>
            </label>
            {useTemplate && (
              <div className="mt-3 rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
                {tradeTemplateInfo[trade]}
              </div>
            )}
          </CardContent>
        </Card>

        <Separator className="mb-6" />

        {/* Submit */}
        <div className="flex items-center justify-end gap-3">
          <Button variant="outline" render={<Link href="/pricebooks" />}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting && <Loader2 className="size-4 animate-spin" />}
            {submitting ? 'Creating...' : 'Create Pricebook'}
          </Button>
        </div>
      </form>
    </div>
  );
}
