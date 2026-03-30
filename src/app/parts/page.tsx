'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import { Part, PartWithCategory, Pricebook, Category } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import {
  Plus,
  Upload,
  Search,
  Pencil,
  Trash2,
  Package,
  Loader2,
} from 'lucide-react';

interface PartFormData {
  name: string;
  part_number: string;
  description: string;
  cost: string;
  labor_minutes: string;
  pricebook_id: string;
  category_id: string;
  unit: string;
  notes: string;
}

const emptyForm: PartFormData = {
  name: '',
  part_number: '',
  description: '',
  cost: '',
  labor_minutes: '60',
  pricebook_id: '',
  category_id: '',
  unit: 'each',
  notes: '',
};

export default function PartsPage() {
  const supabase = createClient();

  const [parts, setParts] = useState<PartWithCategory[]>([]);
  const [pricebooks, setPricebooks] = useState<Pricebook[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterPricebookId, setFilterPricebookId] = useState<string>('all');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPart, setEditingPart] = useState<PartWithCategory | null>(null);
  const [formData, setFormData] = useState<PartFormData>(emptyForm);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);

  // Categories filtered by the form's selected pricebook (derived state)

  const fetchParts = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('parts')
      .select('*, category:categories(name)')
      .order('created_at', { ascending: false });

    if (filterPricebookId && filterPricebookId !== 'all') {
      query = query.eq('pricebook_id', filterPricebookId);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching parts:', error);
    } else {
      setParts((data as PartWithCategory[]) || []);
    }
    setLoading(false);
  }, [filterPricebookId]);

  const fetchPricebooks = useCallback(async () => {
    const { data, error } = await supabase
      .from('pricebooks')
      .select('*')
      .eq('is_active', true)
      .order('name');
    if (error) {
      console.error('Error fetching pricebooks:', error);
    } else {
      setPricebooks(data || []);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order');
    if (error) {
      console.error('Error fetching categories:', error);
    } else {
      setCategories(data || []);
    }
  }, []);

  useEffect(() => {
    fetchPricebooks();
    fetchCategories();
  }, [fetchPricebooks, fetchCategories]);

  useEffect(() => {
    fetchParts();
  }, [fetchParts]);

  const formCategories = formData.pricebook_id
    ? categories.filter((c) => c.pricebook_id === formData.pricebook_id)
    : [];

  const filteredParts = parts.filter((part) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      part.name.toLowerCase().includes(q) ||
      (part.part_number && part.part_number.toLowerCase().includes(q))
    );
  });

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);

  const openAddDialog = () => {
    setEditingPart(null);
    setFormData(emptyForm);
    setFormErrors({});
    setDialogOpen(true);
  };

  const openEditDialog = (part: PartWithCategory) => {
    setEditingPart(part);
    setFormData({
      name: part.name,
      part_number: part.part_number || '',
      description: part.description || '',
      cost: String(part.cost),
      labor_minutes: String(part.labor_minutes),
      pricebook_id: part.pricebook_id,
      category_id: part.category_id || '',
      unit: part.unit || 'each',
      notes: part.notes || '',
    });
    setFormErrors({});
    setDialogOpen(true);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = 'Name is required';
    if (!formData.cost || isNaN(Number(formData.cost)) || Number(formData.cost) < 0)
      errors.cost = 'Valid cost is required';
    if (!formData.pricebook_id) errors.pricebook_id = 'Pricebook is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    setSaving(true);

    const partData = {
      name: formData.name.trim(),
      part_number: formData.part_number.trim() || null,
      description: formData.description.trim() || null,
      cost: Number(formData.cost),
      labor_minutes: Number(formData.labor_minutes) || 60,
      pricebook_id: formData.pricebook_id,
      category_id: formData.category_id || null,
      unit: formData.unit || 'each',
      notes: formData.notes.trim() || null,
    };

    if (editingPart) {
      const { error } = await supabase
        .from('parts')
        .update({ ...partData, updated_at: new Date().toISOString() })
        .eq('id', editingPart.id);
      if (error) {
        console.error('Error updating part:', error);
        setSaving(false);
        return;
      }
    } else {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        console.error('Not authenticated');
        setSaving(false);
        return;
      }
      const { error } = await supabase
        .from('parts')
        .insert({ ...partData, user_id: user.id });
      if (error) {
        console.error('Error inserting part:', error);
        setSaving(false);
        return;
      }
    }

    setSaving(false);
    setDialogOpen(false);
    fetchParts();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('parts').delete().eq('id', id);
    if (error) {
      console.error('Error deleting part:', error);
    } else {
      setDeleteConfirmId(null);
      fetchParts();
    }
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    const { error } = await supabase.from('parts').delete().in('id', ids);
    if (error) {
      console.error('Error bulk deleting parts:', error);
    } else {
      setSelectedIds(new Set());
      setBulkDeleteConfirm(false);
      fetchParts();
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredParts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredParts.map((p) => p.id)));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Parts Catalog</h1>
          <p className="text-sm text-muted-foreground">
            Manage your parts, materials, and pricing
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/parts/import">
            <Button variant="outline">
              <Upload className="mr-1.5 size-4" />
              Import CSV
            </Button>
          </Link>
          <Button className="bg-orange hover:bg-orange/90" onClick={openAddDialog}>
            <Plus className="mr-1.5 size-4" />
            Add Part
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or part number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={filterPricebookId}
          onValueChange={(val) => setFilterPricebookId(val as string)}
        >
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="All Pricebooks" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Pricebooks</SelectItem>
            {pricebooks.map((pb) => (
              <SelectItem key={pb.id} value={pb.id}>
                {pb.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Bulk actions */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-orange/30 bg-orange/5 px-4 py-2">
          <span className="text-sm font-medium">
            {selectedIds.size} part{selectedIds.size !== 1 ? 's' : ''} selected
          </span>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setBulkDeleteConfirm(true)}
          >
            <Trash2 className="mr-1 size-3.5" />
            Delete Selected
          </Button>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : filteredParts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Package className="mb-4 size-12 text-muted-foreground/50" />
            <h3 className="mb-1 text-lg font-medium">No parts yet</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Add your first part or import from CSV.
            </p>
            <div className="flex gap-2">
              <Link href="/parts/import">
                <Button variant="outline">Import CSV</Button>
              </Link>
              <Button className="bg-orange hover:bg-orange/90" onClick={openAddDialog}>
                <Plus className="mr-1.5 size-4" />
                Add Part
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <input
                      type="checkbox"
                      checked={
                        filteredParts.length > 0 &&
                        selectedIds.size === filteredParts.length
                      }
                      onChange={toggleSelectAll}
                      className="size-4 rounded border-gray-300"
                    />
                  </TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Part Number</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                  <TableHead className="text-right">Labor (min)</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredParts.map((part) => (
                  <TableRow key={part.id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(part.id)}
                        onChange={() => toggleSelect(part.id)}
                        className="size-4 rounded border-gray-300"
                      />
                    </TableCell>
                    <TableCell className="font-medium">{part.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {part.part_number || '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(part.cost)}
                    </TableCell>
                    <TableCell className="text-right">
                      {part.labor_minutes}
                    </TableCell>
                    <TableCell>
                      {part.category?.name ? (
                        <Badge variant="secondary">{part.category.name}</Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => openEditDialog(part)}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleteConfirmId(part.id)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingPart ? 'Edit Part' : 'Add Part'}</DialogTitle>
            <DialogDescription>
              {editingPart
                ? 'Update the details for this part.'
                : 'Add a new part to your catalog.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            {/* Name */}
            <div className="grid gap-1.5">
              <Label htmlFor="part-name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="part-name"
                placeholder="e.g. 1/2 Copper Elbow"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
              />
              {formErrors.name && (
                <p className="text-xs text-destructive">{formErrors.name}</p>
              )}
            </div>

            {/* Part Number + Cost row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="part-number">Part Number</Label>
                <Input
                  id="part-number"
                  placeholder="e.g. CE-050"
                  value={formData.part_number}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      part_number: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="part-cost">
                  Cost <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="part-cost"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={formData.cost}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, cost: e.target.value }))
                  }
                />
                {formErrors.cost && (
                  <p className="text-xs text-destructive">{formErrors.cost}</p>
                )}
              </div>
            </div>

            {/* Labor + Unit row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="part-labor">Labor (minutes)</Label>
                <Input
                  id="part-labor"
                  type="number"
                  min="0"
                  placeholder="60"
                  value={formData.labor_minutes}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      labor_minutes: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="part-unit">Unit</Label>
                <Input
                  id="part-unit"
                  placeholder="each"
                  value={formData.unit}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, unit: e.target.value }))
                  }
                />
              </div>
            </div>

            {/* Pricebook select */}
            <div className="grid gap-1.5">
              <Label>
                Pricebook <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.pricebook_id || undefined}
                onValueChange={(val) =>
                  setFormData((prev) => ({
                    ...prev,
                    pricebook_id: val as string,
                    category_id: '',
                  }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a pricebook" />
                </SelectTrigger>
                <SelectContent>
                  {pricebooks.map((pb) => (
                    <SelectItem key={pb.id} value={pb.id}>
                      {pb.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formErrors.pricebook_id && (
                <p className="text-xs text-destructive">
                  {formErrors.pricebook_id}
                </p>
              )}
            </div>

            {/* Category select */}
            <div className="grid gap-1.5">
              <Label>Category</Label>
              <Select
                value={formData.category_id || undefined}
                onValueChange={(val) =>
                  setFormData((prev) => ({
                    ...prev,
                    category_id: val as string,
                  }))
                }
                disabled={!formData.pricebook_id}
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={
                      formData.pricebook_id
                        ? 'Select a category'
                        : 'Select a pricebook first'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {formCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="grid gap-1.5">
              <Label htmlFor="part-description">Description</Label>
              <Input
                id="part-description"
                placeholder="Brief description..."
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
              />
            </div>

            {/* Notes */}
            <div className="grid gap-1.5">
              <Label htmlFor="part-notes">Notes</Label>
              <Textarea
                id="part-notes"
                placeholder="Internal notes..."
                rows={2}
                value={formData.notes}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, notes: e.target.value }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-orange hover:bg-orange/90"
              onClick={handleSave}
              disabled={saving}
            >
              {saving && <Loader2 className="mr-1.5 size-4 animate-spin" />}
              {editingPart ? 'Update Part' : 'Add Part'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog
        open={deleteConfirmId !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteConfirmId(null);
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Part</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this part? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Confirm Dialog */}
      <Dialog open={bulkDeleteConfirm} onOpenChange={setBulkDeleteConfirm}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete {selectedIds.size} Parts</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedIds.size} selected part
              {selectedIds.size !== 1 ? 's' : ''}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBulkDeleteConfirm(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleBulkDelete}>
              Delete {selectedIds.size} Parts
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
