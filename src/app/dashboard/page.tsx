'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, Package, Plus, Upload, ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { Pricebook, Trade } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const tradeBadgeColors: Record<Trade, string> = {
  hvac: 'bg-blue-100 text-blue-800',
  plumbing: 'bg-green-100 text-green-800',
  electrical: 'bg-yellow-100 text-yellow-800',
  general: 'bg-gray-100 text-gray-800',
};

interface PricebookWithPartCount extends Pricebook {
  parts: { count: number }[];
}

export default function DashboardPage() {
  const supabase = createClient();

  const [pricebooks, setPricebooks] = useState<PricebookWithPartCount[]>([]);
  const [totalParts, setTotalParts] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const [pricebooksRes, partsCountRes] = await Promise.all([
        supabase
          .from('pricebooks')
          .select('*, parts(count)')
          .order('updated_at', { ascending: false })
          .limit(5),
        supabase
          .from('parts')
          .select('*', { count: 'exact', head: true }),
      ]);

      if (pricebooksRes.data) {
        setPricebooks(pricebooksRes.data as PricebookWithPartCount[]);
      }
      if (partsCountRes.count !== null) {
        setTotalParts(partsCountRes.count);
      }

      setLoading(false);
    }
    fetchData();
  }, [supabase]);

  const totalPricebooks = pricebooks.length;
  const activePricebooks = pricebooks.filter((pb) => pb.is_active).length;

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  function getPartCount(pb: PricebookWithPartCount): number {
    return pb.parts?.[0]?.count ?? 0;
  }

  return (
    <div className="space-y-6">
      {/* Heading */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Welcome back. Here is an overview of your pricebooks.
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total Pricebooks
            </CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-8 w-16 animate-pulse rounded bg-muted" />
            ) : (
              <div className="text-2xl font-bold">{totalPricebooks}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Parts</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-8 w-16 animate-pulse rounded bg-muted" />
            ) : (
              <div className="text-2xl font-bold">{totalParts}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Active Pricebooks
            </CardTitle>
            <BookOpen className="h-4 w-4 text-orange" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-8 w-16 animate-pulse rounded bg-muted" />
            ) : (
              <div className="text-2xl font-bold">{activePricebooks}</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="mb-3 text-lg font-semibold">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <Button render={<Link href="/pricebooks/new" />}>
            <Plus className="mr-2 h-4 w-4" />
            Create Pricebook
          </Button>
          <Button variant="outline" render={<Link href="/parts/import" />}>
            <Upload className="mr-2 h-4 w-4" />
            Import Parts
          </Button>
        </div>
      </div>

      <Separator />

      {/* Recent Pricebooks */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Recent Pricebooks</h3>
          <Button variant="ghost" size="sm" render={<Link href="/pricebooks" />}>
            View all
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-16 animate-pulse rounded-lg bg-muted"
              />
            ))}
          </div>
        ) : pricebooks.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-10">
              <BookOpen className="mb-3 h-10 w-10 text-muted-foreground" />
              <CardDescription className="mb-4 text-center">
                You have not created any pricebooks yet. Get started by creating
                your first one.
              </CardDescription>
              <Button render={<Link href="/pricebooks/new" />}>
                <Plus className="mr-2 h-4 w-4" />
                Create Pricebook
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium">Name</th>
                  <th className="px-4 py-3 text-left font-medium">Trade</th>
                  <th className="px-4 py-3 text-left font-medium">Parts</th>
                  <th className="px-4 py-3 text-left font-medium">
                    Last Updated
                  </th>
                </tr>
              </thead>
              <tbody>
                {pricebooks.map((pb) => (
                  <tr
                    key={pb.id}
                    className="border-b transition-colors hover:bg-muted/50"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/pricebooks/${pb.id}`}
                        className="font-medium text-foreground hover:underline"
                      >
                        {pb.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="secondary"
                        className={tradeBadgeColors[pb.trade]}
                      >
                        {pb.trade.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {getPartCount(pb)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(pb.updated_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
