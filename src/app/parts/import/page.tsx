'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import { Pricebook } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
} from 'lucide-react';
import Papa from 'papaparse';

type ColumnMapping = 'name' | 'part_number' | 'cost' | 'labor_minutes' | 'category' | 'description' | 'unit' | 'skip';

const COLUMN_OPTIONS: { value: ColumnMapping; label: string }[] = [
  { value: 'skip', label: '(Skip)' },
  { value: 'name', label: 'Name' },
  { value: 'part_number', label: 'Part Number' },
  { value: 'cost', label: 'Cost' },
  { value: 'labor_minutes', label: 'Labor (minutes)' },
  { value: 'category', label: 'Category' },
  { value: 'description', label: 'Description' },
  { value: 'unit', label: 'Unit' },
];

const AUTO_MAP_KEYS: Record<string, ColumnMapping> = {
  name: 'name',
  part_name: 'name',
  item: 'name',
  item_name: 'name',
  part_number: 'part_number',
  partnumber: 'part_number',
  sku: 'part_number',
  number: 'part_number',
  cost: 'cost',
  price: 'cost',
  unit_cost: 'cost',
  unitcost: 'cost',
  labor_minutes: 'labor_minutes',
  labor: 'labor_minutes',
  minutes: 'labor_minutes',
  time: 'labor_minutes',
  category: 'category',
  cat: 'category',
  group: 'category',
  description: 'description',
  desc: 'description',
  unit: 'unit',
  uom: 'unit',
};

interface RowError {
  row: number;
  message: string;
}

export default function ImportPage() {
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [pricebooks, setPricebooks] = useState<Pricebook[]>([]);
  const [selectedPricebookId, setSelectedPricebookId] = useState<string>('');

  // CSV state
  const [fileName, setFileName] = useState<string>('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([]);

  // Import state
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  const [importResult, setImportResult] = useState<{
    success: number;
    errors: RowError[];
  } | null>(null);

  // Drag state
  const [dragActive, setDragActive] = useState(false);

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

  useEffect(() => {
    fetchPricebooks();
  }, [fetchPricebooks]);

  const parseFile = (file: File) => {
    if (!file.name.endsWith('.csv')) {
      alert('Please upload a .csv file.');
      return;
    }

    setFileName(file.name);
    setImportResult(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsedHeaders = results.meta.fields || [];
        const parsedRows = results.data as Record<string, string>[];

        setHeaders(parsedHeaders);
        setRows(parsedRows);

        // Auto-detect column mappings
        const mappings: ColumnMapping[] = parsedHeaders.map((h) => {
          const normalized = h.toLowerCase().trim().replace(/[\s-]+/g, '_');
          return AUTO_MAP_KEYS[normalized] || 'skip';
        });
        setColumnMappings(mappings);
      },
      error: (err) => {
        console.error('CSV parse error:', err);
        alert('Failed to parse CSV file. Please check the format.');
      },
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) parseFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) parseFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const updateMapping = (index: number, value: ColumnMapping) => {
    setColumnMappings((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const previewRows = rows.slice(0, 5);

  const hasNameMapping = columnMappings.includes('name');
  const hasCostMapping = columnMappings.includes('cost');
  const canImport =
    rows.length > 0 &&
    hasNameMapping &&
    hasCostMapping &&
    selectedPricebookId &&
    !importing;

  const clearFile = () => {
    setFileName('');
    setHeaders([]);
    setRows([]);
    setColumnMappings([]);
    setImportResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleImport = async () => {
    if (!canImport) return;

    setImporting(true);
    setImportResult(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      alert('Not authenticated. Please log in.');
      setImporting(false);
      return;
    }

    // Build index map: mapping type -> column index
    const indexMap: Partial<Record<ColumnMapping, number>> = {};
    columnMappings.forEach((mapping, i) => {
      if (mapping !== 'skip') indexMap[mapping] = i;
    });

    const total = rows.length;
    setImportProgress({ current: 0, total });

    const errors: RowError[] = [];
    let successCount = 0;

    // Collect unique category names and create them if needed
    const categoryIndex = indexMap.category;
    const categoryNames = new Set<string>();
    if (categoryIndex !== undefined) {
      rows.forEach((row) => {
        const val = row[headers[categoryIndex]]?.trim();
        if (val) categoryNames.add(val);
      });
    }

    // Fetch existing categories for this pricebook
    const { data: existingCategories } = await supabase
      .from('categories')
      .select('id, name')
      .eq('pricebook_id', selectedPricebookId);

    const categoryMap = new Map<string, string>();
    (existingCategories || []).forEach((cat: { id: string; name: string }) => {
      categoryMap.set(cat.name.toLowerCase(), cat.id);
    });

    // Create missing categories
    for (const catName of categoryNames) {
      if (!categoryMap.has(catName.toLowerCase())) {
        const { data, error } = await supabase
          .from('categories')
          .insert({
            pricebook_id: selectedPricebookId,
            name: catName,
            sort_order: categoryMap.size,
          })
          .select('id')
          .single();

        if (error) {
          console.error('Error creating category:', catName, error);
        } else if (data) {
          categoryMap.set(catName.toLowerCase(), data.id);
        }
      }
    }

    // Import parts in batches of 50
    const batchSize = 50;
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      const partsToInsert: Array<Record<string, unknown>> = [];

      batch.forEach((row, batchIdx) => {
        const rowNum = i + batchIdx + 1;
        const getValue = (key: ColumnMapping): string => {
          const colIdx = indexMap[key];
          if (colIdx === undefined) return '';
          return row[headers[colIdx]]?.trim() || '';
        };

        const name = getValue('name');
        const costStr = getValue('cost');

        if (!name) {
          errors.push({ row: rowNum, message: 'Missing name' });
          return;
        }

        const cost = parseFloat(costStr.replace(/[^0-9.-]/g, ''));
        if (isNaN(cost)) {
          errors.push({ row: rowNum, message: `Invalid cost: "${costStr}"` });
          return;
        }

        const categoryName = getValue('category');
        const categoryId = categoryName
          ? categoryMap.get(categoryName.toLowerCase()) || null
          : null;

        const laborStr = getValue('labor_minutes');
        const laborMinutes = laborStr ? parseInt(laborStr, 10) : 60;

        partsToInsert.push({
          user_id: user.id,
          pricebook_id: selectedPricebookId,
          name,
          part_number: getValue('part_number') || null,
          cost,
          labor_minutes: isNaN(laborMinutes) ? 60 : laborMinutes,
          category_id: categoryId,
          description: getValue('description') || null,
          unit: getValue('unit') || 'each',
        });
      });

      if (partsToInsert.length > 0) {
        const { error } = await supabase.from('parts').insert(partsToInsert);
        if (error) {
          console.error('Batch insert error:', error);
          // Mark all rows in this batch as failed
          partsToInsert.forEach((_, idx) => {
            errors.push({
              row: i + idx + 1,
              message: error.message,
            });
          });
        } else {
          successCount += partsToInsert.length;
        }
      }

      setImportProgress({ current: Math.min(i + batchSize, total), total });
    }

    setImporting(false);
    setImportResult({ success: successCount, errors });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/parts">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-navy">Import Parts from CSV</h1>
          <p className="text-sm text-muted-foreground">
            Upload a CSV file to bulk-import parts into your catalog
          </p>
        </div>
      </div>

      {/* Step 1: Upload */}
      <Card>
        <CardContent className="p-6">
          <div className="mb-4 flex items-center gap-2">
            <Badge className="bg-orange text-white">1</Badge>
            <h2 className="text-lg font-semibold">Upload CSV File</h2>
          </div>

          {!fileName ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-12 transition-colors ${
                dragActive
                  ? 'border-orange bg-orange/5'
                  : 'border-muted-foreground/25 hover:border-muted-foreground/50'
              }`}
            >
              <Upload className="mb-3 size-10 text-muted-foreground/50" />
              <p className="mb-1 text-sm font-medium">
                Drag and drop your CSV file here
              </p>
              <p className="mb-4 text-xs text-muted-foreground">
                or click to browse
              </p>
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                <FileSpreadsheet className="mr-1.5 size-4" />
                Choose File
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-lg border bg-muted/30 px-4 py-3">
              <FileSpreadsheet className="size-5 text-orange" />
              <div className="flex-1">
                <p className="text-sm font-medium">{fileName}</p>
                <p className="text-xs text-muted-foreground">
                  {rows.length} rows found, {headers.length} columns
                </p>
              </div>
              <Button variant="ghost" size="icon-sm" onClick={clearFile}>
                <X className="size-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Step 2: Column Mapping */}
      {headers.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <div className="mb-4 flex items-center gap-2">
              <Badge className="bg-orange text-white">2</Badge>
              <h2 className="text-lg font-semibold">Map Columns</h2>
            </div>
            <p className="mb-4 text-sm text-muted-foreground">
              Match your CSV columns to the correct fields. Columns marked{' '}
              <span className="font-medium text-destructive">*</span> are
              required.
            </p>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {headers.map((header, i) => (
                      <TableHead key={i} className="min-w-[160px]">
                        <div className="space-y-1.5">
                          <span className="text-xs text-muted-foreground">
                            {header}
                          </span>
                          <Select
                            value={columnMappings[i] || 'skip'}
                            onValueChange={(val) =>
                              updateMapping(i, val as ColumnMapping)
                            }
                          >
                            <SelectTrigger size="sm" className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {COLUMN_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewRows.map((row, rowIdx) => (
                    <TableRow key={rowIdx}>
                      {headers.map((header, colIdx) => (
                        <TableCell
                          key={colIdx}
                          className={
                            columnMappings[colIdx] === 'skip'
                              ? 'text-muted-foreground/50'
                              : ''
                          }
                        >
                          {row[header] || '—'}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {rows.length > 5 && (
              <p className="mt-2 text-xs text-muted-foreground">
                Showing first 5 of {rows.length} rows
              </p>
            )}

            {!hasNameMapping && (
              <p className="mt-3 text-sm text-destructive">
                <AlertCircle className="mr-1 inline size-3.5" />
                Please map a column to &quot;Name&quot; (required)
              </p>
            )}
            {!hasCostMapping && (
              <p className="mt-1 text-sm text-destructive">
                <AlertCircle className="mr-1 inline size-3.5" />
                Please map a column to &quot;Cost&quot; (required)
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 3: Select Pricebook + Import */}
      {headers.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <div className="mb-4 flex items-center gap-2">
              <Badge className="bg-orange text-white">3</Badge>
              <h2 className="text-lg font-semibold">Select Pricebook & Import</h2>
            </div>

            <div className="mb-6 max-w-sm">
              <Label className="mb-1.5 block">
                Target Pricebook <span className="text-destructive">*</span>
              </Label>
              <Select
                value={selectedPricebookId || undefined}
                onValueChange={(val) => setSelectedPricebookId(val as string)}
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
              {pricebooks.length === 0 && (
                <p className="mt-1.5 text-xs text-muted-foreground">
                  No pricebooks found.{' '}
                  <Link href="/pricebooks/new" className="text-orange underline">
                    Create one first
                  </Link>
                  .
                </p>
              )}
            </div>

            {/* Progress */}
            {importing && (
              <div className="mb-4 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Loader2 className="size-4 animate-spin text-orange" />
                  <span>
                    Importing {importProgress.current} of{' '}
                    {importProgress.total} parts...
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-orange transition-all"
                    style={{
                      width: `${
                        importProgress.total > 0
                          ? (importProgress.current / importProgress.total) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            )}

            {/* Results */}
            {importResult && (
              <div className="mb-4 space-y-3">
                <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm dark:border-green-800 dark:bg-green-950">
                  <CheckCircle2 className="size-4 text-green-600" />
                  <span>
                    Successfully imported{' '}
                    <strong>{importResult.success}</strong> parts.
                  </span>
                  <Link
                    href="/parts"
                    className="ml-auto text-orange underline underline-offset-2"
                  >
                    View Parts
                  </Link>
                </div>

                {importResult.errors.length > 0 && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950">
                    <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-destructive">
                      <AlertCircle className="size-4" />
                      {importResult.errors.length} row
                      {importResult.errors.length !== 1 ? 's' : ''} failed
                    </p>
                    <div className="max-h-40 overflow-y-auto">
                      <ul className="space-y-0.5 text-xs text-destructive">
                        {importResult.errors.map((err, i) => (
                          <li key={i}>
                            Row {err.row}: {err.message}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <Button
                className="bg-orange hover:bg-orange/90"
                onClick={handleImport}
                disabled={!canImport}
              >
                {importing ? (
                  <>
                    <Loader2 className="mr-1.5 size-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="mr-1.5 size-4" />
                    Import {rows.length} Parts
                  </>
                )}
              </Button>
              <Link href="/parts">
                <Button variant="outline">Cancel</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
