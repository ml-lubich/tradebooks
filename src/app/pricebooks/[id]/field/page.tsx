'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { getPartFlatRate, formatCurrency, pricebookToPricingConfig } from '@/lib/pricing';
import type { Pricebook, Category, Part, PricingConfig } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Search, Star, ArrowLeft, Loader2, Package } from 'lucide-react';

const FAVORITES_KEY = (pricebookId: string) => `tradebooks-favorites-${pricebookId}`;

function getFavorites(pricebookId: string): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const stored = localStorage.getItem(FAVORITES_KEY(pricebookId));
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch {
    return new Set();
  }
}

function saveFavorites(pricebookId: string, favorites: Set<string>) {
  try {
    localStorage.setItem(FAVORITES_KEY(pricebookId), JSON.stringify([...favorites]));
  } catch {
    // localStorage might be full or unavailable
  }
}

export default function FieldViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: pricebookId } = React.use(params);
  const router = useRouter();
  const supabase = createClient();

  const [pricebook, setPricebook] = useState<Pricebook | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // Load data from Supabase
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [pricebookRes, categoriesRes, partsRes] = await Promise.all([
          supabase.from('pricebooks').select('*').eq('id', pricebookId).single(),
          supabase
            .from('categories')
            .select('*')
            .eq('pricebook_id', pricebookId)
            .order('sort_order', { ascending: true }),
          supabase
            .from('parts')
            .select('*')
            .eq('pricebook_id', pricebookId)
            .order('name', { ascending: true }),
        ]);

        if (pricebookRes.data) setPricebook(pricebookRes.data);
        if (categoriesRes.data) setCategories(categoriesRes.data);
        if (partsRes.data) setParts(partsRes.data);
      } catch (error) {
        console.error('Failed to load pricebook data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
    setFavorites(getFavorites(pricebookId));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pricebookId]);

  const pricingConfig: PricingConfig | null = useMemo(() => {
    if (!pricebook) return null;
    return pricebookToPricingConfig(pricebook);
  }, [pricebook]);

  const toggleFavorite = useCallback(
    (partId: string) => {
      setFavorites((prev) => {
        const next = new Set(prev);
        if (next.has(partId)) {
          next.delete(partId);
        } else {
          next.add(partId);
        }
        saveFavorites(pricebookId, next);
        return next;
      });
    },
    [pricebookId]
  );

  // Build category lookup
  const categoryMap = useMemo(() => {
    const map = new Map<string, Category>();
    for (const cat of categories) {
      map.set(cat.id, cat);
    }
    return map;
  }, [categories]);

  // Filtered parts based on search + active tab
  const filteredParts = useMemo(() => {
    let result = parts;

    // Filter by tab
    if (activeTab === 'favorites') {
      result = result.filter((p) => favorites.has(p.id));
    } else if (activeTab !== 'all') {
      result = result.filter((p) => p.category_id === activeTab);
    }

    // Filter by search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.part_number && p.part_number.toLowerCase().includes(q))
      );
    }

    return result;
  }, [parts, activeTab, searchQuery, favorites]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-navy">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-orange" />
          <p className="text-lg text-white">Loading pricebook...</p>
        </div>
      </div>
    );
  }

  if (!pricebook || !pricingConfig) {
    return (
      <div className="flex h-screen items-center justify-center bg-navy">
        <div className="flex flex-col items-center gap-3 text-center px-6">
          <Package className="h-12 w-12 text-muted-foreground" />
          <p className="text-lg text-white">Pricebook not found</p>
          <Button
            variant="outline"
            onClick={() => router.push('/pricebooks')}
            className="mt-2"
          >
            Back to Pricebooks
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-dvh flex-col bg-background">
      {/* Top Bar */}
      <header className="flex items-center justify-between gap-3 bg-navy px-4 py-3 text-white shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/pricebooks/${pricebookId}`)}
          className="text-white hover:bg-white/10 shrink-0"
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Exit
        </Button>
        <h1 className="truncate text-base font-semibold">{pricebook.name}</h1>
        <Badge variant="secondary" className="shrink-0 capitalize">
          {pricebook.trade}
        </Badge>
      </header>

      {/* Sticky Search Bar */}
      <div className="sticky top-0 z-10 bg-background border-b px-4 py-3 shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search parts by name or number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-12 pl-11 text-base rounded-lg"
          />
        </div>
      </div>

      {/* Category Tabs */}
      <div className="shrink-0 border-b">
        <div className="flex gap-1.5 overflow-x-auto px-4 py-2 scrollbar-hide">
          <TabButton
            active={activeTab === 'all'}
            onClick={() => setActiveTab('all')}
          >
            All
          </TabButton>
          <TabButton
            active={activeTab === 'favorites'}
            onClick={() => setActiveTab('favorites')}
          >
            <Star className="mr-1 h-3.5 w-3.5" />
            Favorites
          </TabButton>
          {categories.map((cat) => (
            <TabButton
              key={cat.id}
              active={activeTab === cat.id}
              onClick={() => setActiveTab(cat.id)}
            >
              {cat.name}
            </TabButton>
          ))}
        </div>
      </div>

      {/* Parts List */}
      <div className="flex-1 overflow-y-auto">
        {filteredParts.length === 0 ? (
          <EmptyState tab={activeTab} searchQuery={searchQuery} />
        ) : (
          <div className="divide-y">
            {filteredParts.map((part) => {
              const category = part.category_id
                ? categoryMap.get(part.category_id)
                : null;

              // Use category-level overrides if present
              const config: PricingConfig = category
                ? {
                    laborRate:
                      category.labor_rate_override ?? pricingConfig.laborRate,
                    partsMarkup:
                      category.parts_markup_override ??
                      pricingConfig.partsMarkup,
                    materialsMarkup: pricingConfig.materialsMarkup,
                    taxRate: pricingConfig.taxRate,
                  }
                : pricingConfig;

              const flatRate = getPartFlatRate(part, config);
              const partsCost = part.cost * (1 + config.partsMarkup / 100);
              const laborCost = (part.labor_minutes / 60) * config.laborRate;

              return (
                <PartCard
                  key={part.id}
                  part={part}
                  flatRate={flatRate}
                  partsCost={partsCost}
                  laborCost={laborCost}
                  currency={pricebook.currency}
                  isFavorite={favorites.has(part.id)}
                  onToggleFavorite={() => toggleFavorite(part.id)}
                  categoryName={category?.name}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom info bar */}
      <div className="shrink-0 border-t bg-muted/50 px-4 py-2 text-center text-xs text-muted-foreground">
        {filteredParts.length} {filteredParts.length === 1 ? 'item' : 'items'}
        {searchQuery && ' found'}
        {' · '}
        Labor: {formatCurrency(pricingConfig.laborRate, pricebook.currency)}/hr
        {' · '}
        Markup: {pricingConfig.partsMarkup}%
      </div>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex shrink-0 items-center rounded-full px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
        active
          ? 'bg-navy text-white'
          : 'bg-muted text-muted-foreground hover:bg-muted/80'
      }`}
    >
      {children}
    </button>
  );
}

function PartCard({
  part,
  flatRate,
  partsCost,
  laborCost,
  currency,
  isFavorite,
  onToggleFavorite,
  categoryName,
}: {
  part: Part;
  flatRate: number;
  partsCost: number;
  laborCost: number;
  currency: string;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  categoryName?: string;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-4 min-h-20 active:bg-muted/50 transition-colors">
      {/* Part info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-base truncate">{part.name}</p>
          {categoryName && (
            <Badge variant="outline" className="shrink-0 text-xs">
              {categoryName}
            </Badge>
          )}
        </div>
        {part.part_number && (
          <p className="text-sm text-muted-foreground mt-0.5">
            #{part.part_number}
          </p>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          Parts: {formatCurrency(partsCost, currency)} + Labor:{' '}
          {formatCurrency(laborCost, currency)}
          {part.labor_minutes > 0 && (
            <span className="ml-1">({part.labor_minutes} min)</span>
          )}
        </p>
      </div>

      {/* Price */}
      <div className="text-right shrink-0">
        <p className="text-3xl font-bold text-orange">
          {formatCurrency(flatRate, currency)}
        </p>
        {part.is_custom_price && (
          <span className="text-xs text-muted-foreground">custom</span>
        )}
      </div>

      {/* Favorite toggle */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleFavorite();
        }}
        className="shrink-0 p-2 rounded-full hover:bg-muted transition-colors"
        aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
      >
        <Star
          className={`h-5 w-5 ${
            isFavorite
              ? 'fill-orange text-orange'
              : 'text-muted-foreground'
          }`}
        />
      </button>
    </div>
  );
}

function EmptyState({
  tab,
  searchQuery,
}: {
  tab: string;
  searchQuery: string;
}) {
  if (searchQuery.trim()) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
        <Search className="h-12 w-12 text-muted-foreground/50 mb-3" />
        <p className="text-lg font-medium text-muted-foreground">
          No parts found
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Try a different search term
        </p>
      </div>
    );
  }

  if (tab === 'favorites') {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
        <Star className="h-12 w-12 text-muted-foreground/50 mb-3" />
        <p className="text-lg font-medium text-muted-foreground">
          No favorites yet
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Tap the star on any part to add it to your favorites
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <Package className="h-12 w-12 text-muted-foreground/50 mb-3" />
      <p className="text-lg font-medium text-muted-foreground">
        No parts in this category
      </p>
    </div>
  );
}
