'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import {
  calculateFlatRate,
  getPartFlatRate,
  formatCurrency,
  pricebookToPricingConfig,
} from '@/lib/pricing';
import type { Pricebook, Category, Part, PricingConfig, Trade } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardAction,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Smartphone,
  FileDown,
  Save,
  GripVertical,
  DollarSign,
  FolderOpen,
} from 'lucide-react';

const tradeBadgeColors: Record<Trade, string> = {
  hvac: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  plumbing: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  electrical: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  general: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
};

const tradeLabels: Record<Trade, string> = {
  hvac: 'HVAC',
  plumbing: 'Plumbing',
  electrical: 'Electrical',
  general: 'General',
};

export default function PricebookEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = React.use(params);
  const supabase = createClient();

  const [pricebook, setPricebook] = useState<Pricebook | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Markup controls state
  const [laborRate, setLaborRate] = useState(95);
  const [partsMarkup, setPartsMarkup] = useState(50);
  const [materialsMarkup, setMaterialsMarkup] = useState(30);
  const [taxRate, setTaxRate] = useState(0);
  const [savingSettings, setSavingSettings] = useState(false);

  // Category dialog
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [categoryDescription, setCategoryDescription] = useState('');
  const [savingCategory, setSavingCategory] = useState(false);

  // Part dialog
  const [partDialogOpen, setPartDialogOpen] = useState(false);
  const [editingPart, setEditingPart] = useState<Part | null>(null);
  const [partCategoryId, setPartCategoryId] = useState<string | null>(null);
  const [partName, setPartName] = useState('');
  const [partDescription, setPartDescription] = useState('');
  const [partNumber, setPartNumber] = useState('');
  const [partCost, setPartCost] = useState(0);
  const [partLaborMinutes, setPartLaborMinutes] = useState(60);
  const [partUnit, setPartUnit] = useState('each');
  const [partNotes, setPartNotes] = useState('');
  const [savingPart, setSavingPart] = useState(false);

  // Price override dialog
  const [overridePart, setOverridePart] = useState<Part | null>(null);
  const [overridePrice, setOverridePrice] = useState(0);
  const [savingOverride, setSavingOverride] = useState(false);

  // Delete confirmation
  const [deleteCategoryId, setDeleteCategoryId] = useState<string | null>(null);
  const [deletePartId, setDeletePartId] = useState<string | null>(null);
  const [deletingItem, setDeletingItem] = useState(false);

  // Expanded categories
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set()
  );

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [pbResult, catResult, partsResult] = await Promise.all([
        supabase.from('pricebooks').select('*').eq('id', id).single(),
        supabase
          .from('categories')
          .select('*')
          .eq('pricebook_id', id)
          .order('sort_order', { ascending: true }),
        supabase
          .from('parts')
          .select('*')
          .eq('pricebook_id', id)
          .order('name', { ascending: true }),
      ]);

      if (pbResult.error) throw pbResult.error;
      if (catResult.error) throw catResult.error;
      if (partsResult.error) throw partsResult.error;

      const pb = pbResult.data as Pricebook;
      setPricebook(pb);
      setCategories(catResult.data as Category[]);
      setParts(partsResult.data as Part[]);

      setLaborRate(pb.default_labor_rate);
      setPartsMarkup(pb.default_parts_markup);
      setMaterialsMarkup(pb.default_materials_markup);
      setTaxRate(pb.tax_rate);

      // Expand all categories by default
      const catIds = new Set((catResult.data as Category[]).map((c) => c.id));
      catIds.add('uncategorized');
      setExpandedCategories(catIds);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load pricebook');
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function getPricingConfig(): PricingConfig {
    return {
      laborRate,
      partsMarkup,
      materialsMarkup,
      taxRate,
    };
  }

  function getPartsForCategory(categoryId: string | null): Part[] {
    return parts.filter((p) => p.category_id === categoryId);
  }

  function toggleCategory(categoryId: string) {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  }

  // Save markup settings
  async function handleSaveSettings() {
    if (!pricebook) return;
    setSavingSettings(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('pricebooks')
        .update({
          default_labor_rate: laborRate,
          default_parts_markup: partsMarkup,
          default_materials_markup: materialsMarkup,
          tax_rate: taxRate,
          updated_at: new Date().toISOString(),
        })
        .eq('id', pricebook.id);

      if (updateError) throw updateError;

      setPricebook({
        ...pricebook,
        default_labor_rate: laborRate,
        default_parts_markup: partsMarkup,
        default_materials_markup: materialsMarkup,
        tax_rate: taxRate,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  }

  // Category CRUD
  function openAddCategory() {
    setEditingCategory(null);
    setCategoryName('');
    setCategoryDescription('');
    setCategoryDialogOpen(true);
  }

  function openEditCategory(cat: Category) {
    setEditingCategory(cat);
    setCategoryName(cat.name);
    setCategoryDescription(cat.description || '');
    setCategoryDialogOpen(true);
  }

  async function handleSaveCategory() {
    if (!categoryName.trim()) return;
    setSavingCategory(true);
    setError(null);

    try {
      if (editingCategory) {
        const { data, error: updateError } = await supabase
          .from('categories')
          .update({
            name: categoryName.trim(),
            description: categoryDescription.trim() || null,
          })
          .eq('id', editingCategory.id)
          .select()
          .single();

        if (updateError) throw updateError;

        setCategories((prev) =>
          prev.map((c) => (c.id === editingCategory.id ? (data as Category) : c))
        );
      } else {
        const maxSort = categories.reduce(
          (max, c) => Math.max(max, c.sort_order),
          -1
        );

        const { data, error: insertError } = await supabase
          .from('categories')
          .insert({
            pricebook_id: id,
            name: categoryName.trim(),
            description: categoryDescription.trim() || null,
            sort_order: maxSort + 1,
          })
          .select()
          .single();

        if (insertError) throw insertError;

        const newCat = data as Category;
        setCategories((prev) => [...prev, newCat]);
        setExpandedCategories((prev) => new Set([...prev, newCat.id]));
      }

      setCategoryDialogOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save category');
    } finally {
      setSavingCategory(false);
    }
  }

  async function handleDeleteCategory() {
    if (!deleteCategoryId) return;
    setDeletingItem(true);

    try {
      const { error: delError } = await supabase
        .from('categories')
        .delete()
        .eq('id', deleteCategoryId);

      if (delError) throw delError;

      setCategories((prev) => prev.filter((c) => c.id !== deleteCategoryId));
      // Parts with this category_id will have it set to null by DB cascade
      setParts((prev) =>
        prev.map((p) =>
          p.category_id === deleteCategoryId
            ? { ...p, category_id: null }
            : p
        )
      );
      setDeleteCategoryId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete category');
    } finally {
      setDeletingItem(false);
    }
  }

  // Part CRUD
  function openAddPart(categoryId: string | null) {
    setEditingPart(null);
    setPartCategoryId(categoryId);
    setPartName('');
    setPartDescription('');
    setPartNumber('');
    setPartCost(0);
    setPartLaborMinutes(60);
    setPartUnit('each');
    setPartNotes('');
    setPartDialogOpen(true);
  }

  function openEditPart(part: Part) {
    setEditingPart(part);
    setPartCategoryId(part.category_id);
    setPartName(part.name);
    setPartDescription(part.description || '');
    setPartNumber(part.part_number || '');
    setPartCost(part.cost);
    setPartLaborMinutes(part.labor_minutes);
    setPartUnit(part.unit);
    setPartNotes(part.notes || '');
    setPartDialogOpen(true);
  }

  async function handleSavePart() {
    if (!partName.trim()) return;
    setSavingPart(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('You must be logged in');

      if (editingPart) {
        const { data, error: updateError } = await supabase
          .from('parts')
          .update({
            category_id: partCategoryId,
            name: partName.trim(),
            description: partDescription.trim() || null,
            part_number: partNumber.trim() || null,
            cost: partCost,
            labor_minutes: partLaborMinutes,
            unit: partUnit,
            notes: partNotes.trim() || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingPart.id)
          .select()
          .single();

        if (updateError) throw updateError;

        setParts((prev) =>
          prev.map((p) => (p.id === editingPart.id ? (data as Part) : p))
        );
      } else {
        const { data, error: insertError } = await supabase
          .from('parts')
          .insert({
            user_id: user.id,
            pricebook_id: id,
            category_id: partCategoryId,
            name: partName.trim(),
            description: partDescription.trim() || null,
            part_number: partNumber.trim() || null,
            cost: partCost,
            labor_minutes: partLaborMinutes,
            unit: partUnit,
            notes: partNotes.trim() || null,
          })
          .select()
          .single();

        if (insertError) throw insertError;

        setParts((prev) => [...prev, data as Part]);
      }

      setPartDialogOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save part');
    } finally {
      setSavingPart(false);
    }
  }

  async function handleDeletePart() {
    if (!deletePartId) return;
    setDeletingItem(true);

    try {
      const { error: delError } = await supabase
        .from('parts')
        .delete()
        .eq('id', deletePartId);

      if (delError) throw delError;

      setParts((prev) => prev.filter((p) => p.id !== deletePartId));
      setDeletePartId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete part');
    } finally {
      setDeletingItem(false);
    }
  }

  // Price override
  function openPriceOverride(part: Part) {
    setOverridePart(part);
    setOverridePrice(
      part.is_custom_price && part.flat_rate_price !== null
        ? part.flat_rate_price
        : getPartFlatRate(part, getPricingConfig())
    );
  }

  async function handleSaveOverride() {
    if (!overridePart) return;
    setSavingOverride(true);

    try {
      const { data, error: updateError } = await supabase
        .from('parts')
        .update({
          flat_rate_price: overridePrice,
          is_custom_price: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', overridePart.id)
        .select()
        .single();

      if (updateError) throw updateError;

      setParts((prev) =>
        prev.map((p) => (p.id === overridePart.id ? (data as Part) : p))
      );
      setOverridePart(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save price override');
    } finally {
      setSavingOverride(false);
    }
  }

  async function handleClearOverride() {
    if (!overridePart) return;
    setSavingOverride(true);

    try {
      const { data, error: updateError } = await supabase
        .from('parts')
        .update({
          flat_rate_price: null,
          is_custom_price: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', overridePart.id)
        .select()
        .single();

      if (updateError) throw updateError;

      setParts((prev) =>
        prev.map((p) => (p.id === overridePart.id ? (data as Part) : p))
      );
      setOverridePart(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear override');
    } finally {
      setSavingOverride(false);
    }
  }

  // Render parts table for a category
  function renderPartsTable(categoryParts: Part[]) {
    const config = getPricingConfig();

    if (categoryParts.length === 0) {
      return (
        <p className="py-4 text-center text-sm text-muted-foreground">
          No parts in this category yet.
        </p>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Part #</TableHead>
            <TableHead className="text-right">Cost</TableHead>
            <TableHead className="text-right">Labor (min)</TableHead>
            <TableHead className="text-right">Flat Rate</TableHead>
            <TableHead className="text-center">Override?</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {categoryParts.map((part) => {
            const flatRate = getPartFlatRate(part, config);
            return (
              <TableRow key={part.id}>
                <TableCell>
                  <div>
                    <span className="font-medium">{part.name}</span>
                    {part.description && (
                      <p className="text-xs text-muted-foreground">
                        {part.description}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {part.part_number || '-'}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(part.cost)}
                </TableCell>
                <TableCell className="text-right">
                  {part.labor_minutes}
                </TableCell>
                <TableCell className="text-right font-bold">
                  {formatCurrency(flatRate)}
                </TableCell>
                <TableCell className="text-center">
                  {part.is_custom_price ? (
                    <Badge
                      variant="secondary"
                      className="cursor-pointer bg-orange/10 text-orange hover:bg-orange/20"
                      onClick={() => openPriceOverride(part)}
                    >
                      Custom
                    </Badge>
                  ) : (
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => openPriceOverride(part)}
                    >
                      <DollarSign className="size-3" />
                    </Button>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => openEditPart(part)}
                    >
                      <Pencil className="size-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => setDeletePartId(part.id)}
                    >
                      <Trash2 className="size-3 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!pricebook) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 text-center">
        <h1 className="text-xl font-bold">Pricebook not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This pricebook may have been deleted.
        </p>
        <Button className="mt-4" render={<Link href="/pricebooks" />}>
          Back to Pricebooks
        </Button>
      </div>
    );
  }

  const config = getPricingConfig();
  const sampleFlatRate = calculateFlatRate(50, 60, config);
  const uncategorizedParts = getPartsForCategory(null);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Button
            variant="ghost"
            size="sm"
            className="mb-2"
            render={<Link href="/pricebooks" />}
          >
            <ArrowLeft className="size-4" data-icon="inline-start" />
            Back
          </Button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">
              {pricebook.name}
            </h1>
            <Badge
              variant="secondary"
              className={tradeBadgeColors[pricebook.trade]}
            >
              {tradeLabels[pricebook.trade]}
            </Badge>
          </div>
          {pricebook.description && (
            <p className="mt-1 text-sm text-muted-foreground">
              {pricebook.description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            render={<Link href={`/pricebooks/${id}/field`} />}
          >
            <Smartphone className="size-4" data-icon="inline-start" />
            Field View
          </Button>
          <Button
            variant="outline"
            size="sm"
            render={<Link href={`/api/pricebook/pdf?id=${id}`} target="_blank" />}
          >
            <FileDown className="size-4" data-icon="inline-start" />
            Export PDF
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
          <Button
            variant="ghost"
            size="xs"
            className="ml-2"
            onClick={() => setError(null)}
          >
            Dismiss
          </Button>
        </div>
      )}

      {/* Markup Controls */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Markup Controls</CardTitle>
          <CardDescription>
            Adjust your default pricing. Changes apply to all non-overridden
            parts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="ed-laborRate">Labor Rate ($/hr)</Label>
              <Input
                id="ed-laborRate"
                type="number"
                min={0}
                step={0.01}
                value={laborRate}
                onChange={(e) => setLaborRate(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ed-partsMarkup">Parts Markup (%)</Label>
              <Input
                id="ed-partsMarkup"
                type="number"
                min={0}
                step={0.01}
                value={partsMarkup}
                onChange={(e) => setPartsMarkup(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ed-materialsMarkup">Materials Markup (%)</Label>
              <Input
                id="ed-materialsMarkup"
                type="number"
                min={0}
                step={0.01}
                value={materialsMarkup}
                onChange={(e) => setMaterialsMarkup(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ed-taxRate">Tax Rate (%)</Label>
              <Input
                id="ed-taxRate"
                type="number"
                min={0}
                step={0.01}
                value={taxRate}
                onChange={(e) => setTaxRate(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="rounded-lg bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
              Sample: $50.00 part + 60min labor ={' '}
              <span className="font-bold text-foreground">
                {formatCurrency(sampleFlatRate)}
              </span>{' '}
              flat rate
            </div>
            <Button
              size="sm"
              onClick={handleSaveSettings}
              disabled={savingSettings}
            >
              {savingSettings ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" data-icon="inline-start" />
              )}
              {savingSettings ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Separator className="mb-8" />

      {/* Categories Section */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Categories &amp; Parts</h2>
        <Button size="sm" onClick={openAddCategory}>
          <Plus className="size-4" data-icon="inline-start" />
          Add Category
        </Button>
      </div>

      {categories.length === 0 && uncategorizedParts.length === 0 && (
        <div className="flex min-h-[200px] flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center">
          <FolderOpen className="mb-3 size-10 text-muted-foreground" />
          <p className="mb-1 font-medium">No categories or parts yet</p>
          <p className="mb-4 text-sm text-muted-foreground">
            Add a category to start organizing your parts, or add uncategorized
            parts directly.
          </p>
          <div className="flex gap-2">
            <Button size="sm" onClick={openAddCategory}>
              <Plus className="size-4" data-icon="inline-start" />
              Add Category
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => openAddPart(null)}
            >
              <Plus className="size-4" data-icon="inline-start" />
              Add Part
            </Button>
          </div>
        </div>
      )}

      {/* Category Accordions */}
      <div className="space-y-4">
        {categories.map((cat) => {
          const categoryParts = getPartsForCategory(cat.id);
          const isExpanded = expandedCategories.has(cat.id);

          return (
            <Card key={cat.id}>
              <CardHeader
                className="cursor-pointer"
                onClick={() => toggleCategory(cat.id)}
              >
                <div className="flex items-center gap-2">
                  <GripVertical className="size-4 text-muted-foreground" />
                  <CardTitle className="flex items-center gap-2">
                    {cat.name}
                    <Badge variant="secondary" className="text-xs">
                      {categoryParts.length}{' '}
                      {categoryParts.length === 1 ? 'part' : 'parts'}
                    </Badge>
                  </CardTitle>
                </div>
                {cat.description && (
                  <CardDescription>{cat.description}</CardDescription>
                )}
                <CardAction>
                  <div
                    className="flex items-center gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => openEditCategory(cat)}
                    >
                      <Pencil className="size-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => setDeleteCategoryId(cat.id)}
                    >
                      <Trash2 className="size-3 text-destructive" />
                    </Button>
                  </div>
                </CardAction>
              </CardHeader>
              {isExpanded && (
                <CardContent>
                  {renderPartsTable(categoryParts)}
                  <div className="mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openAddPart(cat.id)}
                    >
                      <Plus className="size-4" data-icon="inline-start" />
                      Add Part
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}

        {/* Uncategorized Parts */}
        {(uncategorizedParts.length > 0 || categories.length > 0) && (
          <Card>
            <CardHeader
              className="cursor-pointer"
              onClick={() => toggleCategory('uncategorized')}
            >
              <CardTitle className="flex items-center gap-2 text-muted-foreground">
                Uncategorized
                <Badge variant="secondary" className="text-xs">
                  {uncategorizedParts.length}{' '}
                  {uncategorizedParts.length === 1 ? 'part' : 'parts'}
                </Badge>
              </CardTitle>
            </CardHeader>
            {expandedCategories.has('uncategorized') && (
              <CardContent>
                {renderPartsTable(uncategorizedParts)}
                <div className="mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openAddPart(null)}
                  >
                    <Plus className="size-4" data-icon="inline-start" />
                    Add Part
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>
        )}
      </div>

      {/* Category Dialog */}
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Edit Category' : 'Add Category'}
            </DialogTitle>
            <DialogDescription>
              {editingCategory
                ? 'Update the category details.'
                : 'Create a new category to organize your parts.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cat-name">Category Name *</Label>
              <Input
                id="cat-name"
                placeholder="e.g., AC Repair"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat-desc">Description</Label>
              <Textarea
                id="cat-desc"
                placeholder="Optional description..."
                value={categoryDescription}
                onChange={(e) => setCategoryDescription(e.target.value)}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Cancel
            </DialogClose>
            <Button
              onClick={handleSaveCategory}
              disabled={savingCategory || !categoryName.trim()}
            >
              {savingCategory && <Loader2 className="size-4 animate-spin" />}
              {savingCategory
                ? 'Saving...'
                : editingCategory
                  ? 'Update'
                  : 'Add Category'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Part Dialog */}
      <Dialog open={partDialogOpen} onOpenChange={setPartDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingPart ? 'Edit Part' : 'Add Part'}
            </DialogTitle>
            <DialogDescription>
              {editingPart
                ? 'Update the part details and pricing.'
                : 'Add a new part to your pricebook.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="part-name">Part Name *</Label>
              <Input
                id="part-name"
                placeholder="e.g., Capacitor 45/5 MFD"
                value={partName}
                onChange={(e) => setPartName(e.target.value)}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="part-number">Part Number</Label>
                <Input
                  id="part-number"
                  placeholder="e.g., CAP-455"
                  value={partNumber}
                  onChange={(e) => setPartNumber(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="part-unit">Unit</Label>
                <Input
                  id="part-unit"
                  placeholder="each"
                  value={partUnit}
                  onChange={(e) => setPartUnit(e.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="part-cost">Cost ($)</Label>
                <Input
                  id="part-cost"
                  type="number"
                  min={0}
                  step={0.01}
                  value={partCost}
                  onChange={(e) => setPartCost(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="part-labor">Labor (minutes)</Label>
                <Input
                  id="part-labor"
                  type="number"
                  min={0}
                  step={1}
                  value={partLaborMinutes}
                  onChange={(e) => setPartLaborMinutes(Number(e.target.value))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="part-desc">Description</Label>
              <Textarea
                id="part-desc"
                placeholder="Optional description..."
                value={partDescription}
                onChange={(e) => setPartDescription(e.target.value)}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="part-notes">Notes</Label>
              <Textarea
                id="part-notes"
                placeholder="Internal notes..."
                value={partNotes}
                onChange={(e) => setPartNotes(e.target.value)}
                rows={2}
              />
            </div>
            <div className="rounded-lg bg-muted/50 p-3 text-sm">
              Calculated flat rate:{' '}
              <span className="font-bold">
                {formatCurrency(
                  calculateFlatRate(partCost, partLaborMinutes, config)
                )}
              </span>
            </div>
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Cancel
            </DialogClose>
            <Button
              onClick={handleSavePart}
              disabled={savingPart || !partName.trim()}
            >
              {savingPart && <Loader2 className="size-4 animate-spin" />}
              {savingPart
                ? 'Saving...'
                : editingPart
                  ? 'Update Part'
                  : 'Add Part'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Price Override Dialog */}
      <Dialog
        open={overridePart !== null}
        onOpenChange={(open) => {
          if (!open) setOverridePart(null);
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Set Price Override</DialogTitle>
            <DialogDescription>
              Override the calculated flat rate for{' '}
              <strong>{overridePart?.name}</strong>. The calculated price is{' '}
              {overridePart &&
                formatCurrency(
                  calculateFlatRate(
                    overridePart.cost,
                    overridePart.labor_minutes,
                    config
                  )
                )}
              .
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="override-price">Custom Flat Rate ($)</Label>
              <Input
                id="override-price"
                type="number"
                min={0}
                step={0.01}
                value={overridePrice}
                onChange={(e) => setOverridePrice(Number(e.target.value))}
              />
            </div>
          </div>
          <DialogFooter>
            {overridePart?.is_custom_price && (
              <Button
                variant="outline"
                onClick={handleClearOverride}
                disabled={savingOverride}
              >
                Clear Override
              </Button>
            )}
            <Button
              onClick={handleSaveOverride}
              disabled={savingOverride}
            >
              {savingOverride && <Loader2 className="size-4 animate-spin" />}
              {savingOverride ? 'Saving...' : 'Set Override'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Category Confirmation */}
      <Dialog
        open={deleteCategoryId !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteCategoryId(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this category? Parts in this
              category will become uncategorized.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Cancel
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleDeleteCategory}
              disabled={deletingItem}
            >
              {deletingItem && <Loader2 className="size-4 animate-spin" />}
              {deletingItem ? 'Deleting...' : 'Delete Category'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Part Confirmation */}
      <Dialog
        open={deletePartId !== null}
        onOpenChange={(open) => {
          if (!open) setDeletePartId(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Part</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this part? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Cancel
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleDeletePart}
              disabled={deletingItem}
            >
              {deletingItem && <Loader2 className="size-4 animate-spin" />}
              {deletingItem ? 'Deleting...' : 'Delete Part'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
