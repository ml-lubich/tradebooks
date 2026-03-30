'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { formatCurrency } from '@/lib/pricing';
import type { Pricebook, Trade } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardAction,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
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
  Plus,
  MoreVertical,
  Pencil,
  Smartphone,
  Trash2,
  BookOpen,
  Loader2,
} from 'lucide-react';

interface PricebookWithCount extends Pricebook {
  parts_count: number;
}

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

export default function PricebooksPage() {
  const router = useRouter();
  const supabase = createClient();
  const [pricebooks, setPricebooks] = useState<PricebookWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchPricebooks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchPricebooks() {
    setLoading(true);
    setError(null);

    try {
      const { data: pricebooksData, error: pbError } = await supabase
        .from('pricebooks')
        .select('*')
        .order('created_at', { ascending: false });

      if (pbError) throw pbError;

      // Get parts counts for each pricebook
      const pricebooksWithCounts: PricebookWithCount[] = await Promise.all(
        (pricebooksData || []).map(async (pb: Pricebook) => {
          const { count } = await supabase
            .from('parts')
            .select('*', { count: 'exact', head: true })
            .eq('pricebook_id', pb.id);

          return { ...pb, parts_count: count || 0 };
        })
      );

      setPricebooks(pricebooksWithCounts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load pricebooks');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);

    try {
      const { error: delError } = await supabase
        .from('pricebooks')
        .delete()
        .eq('id', deleteId);

      if (delError) throw delError;

      setPricebooks((prev) => prev.filter((pb) => pb.id !== deleteId));
      setDeleteId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete pricebook');
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pricebooks</h1>
          <p className="text-sm text-muted-foreground">
            Manage your flat-rate pricebooks
          </p>
        </div>
        <Button render={<Link href="/pricebooks/new" />}>
          <Plus className="size-4" data-icon="inline-start" />
          New Pricebook
        </Button>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Empty state */}
      {pricebooks.length === 0 && !error && (
        <div className="flex min-h-[300px] flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center">
          <BookOpen className="mb-4 size-12 text-muted-foreground" />
          <h2 className="mb-2 text-lg font-semibold">No pricebooks yet</h2>
          <p className="mb-6 max-w-md text-sm text-muted-foreground">
            Create your first pricebook to start building professional flat-rate
            pricing for your trade business.
          </p>
          <Button render={<Link href="/pricebooks/new" />}>
            <Plus className="size-4" data-icon="inline-start" />
            Create Your First Pricebook
          </Button>
        </div>
      )}

      {/* Pricebooks grid */}
      {pricebooks.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pricebooks.map((pb) => (
            <Card key={pb.id} className="cursor-pointer transition-shadow hover:shadow-md">
              <CardHeader>
                <CardTitle>
                  <Link
                    href={`/pricebooks/${pb.id}`}
                    className="hover:text-orange transition-colors"
                  >
                    {pb.name}
                  </Link>
                </CardTitle>
                <CardDescription>
                  {pb.description || 'No description'}
                </CardDescription>
                <CardAction>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={(e) => e.stopPropagation()}
                        />
                      }
                    >
                      <MoreVertical className="size-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => router.push(`/pricebooks/${pb.id}`)}
                      >
                        <Pencil className="size-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          router.push(`/pricebooks/${pb.id}/field`)
                        }
                      >
                        <Smartphone className="size-4" />
                        Field View
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => setDeleteId(pb.id)}
                      >
                        <Trash2 className="size-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardAction>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant="secondary"
                    className={tradeBadgeColors[pb.trade]}
                  >
                    {tradeLabels[pb.trade]}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {pb.parts_count} {pb.parts_count === 1 ? 'part' : 'parts'}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    Labor: {formatCurrency(pb.default_labor_rate)}/hr
                  </span>
                  <span>
                    Markup: {pb.default_parts_markup}%
                  </span>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  Created{' '}
                  {new Date(pb.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteId !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteId(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Pricebook</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this pricebook? This will also
              delete all categories and parts within it. This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Cancel
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting && <Loader2 className="size-4 animate-spin" />}
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
