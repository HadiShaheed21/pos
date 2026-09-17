'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import {
  ExternalLink, Globe2, ImageIcon, PackageCheck,
  RefreshCw, ShoppingBag, Tags, Upload, Wifi,
} from 'lucide-react';
import api from '@/lib/api';
import type { Product } from '@/lib/types';
import { useFormatCurrency } from '@/hooks/useFormatCurrency';
import { nameToColor } from '@/lib/image-utils';

type WebsiteOrder = { id: string; customer: string; items: string; total: number; state: 'New order' | 'Paid' | 'Packing' | 'Dispatched' };

const previewOrders: WebsiteOrder[] = [
  { id: 'WEB-1042', customer: 'Aisha K.', items: 'Classic Cotton Polo · Navy / M', total: 1499, state: 'New order' },
  { id: 'WEB-1041', customer: 'Rahul P.', items: 'Straight Fit Denim · Indigo / 30', total: 2899, state: 'Paid' },
  { id: 'WEB-1040', customer: 'Maya S.', items: 'Printed Midi Dress · Rose / M', total: 3499, state: 'Packing' },
];

export default function OnlineStorePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [published, setPublished] = useState<Set<string>>(new Set());
  const fmt = useFormatCurrency();

  useEffect(() => {
    const controller = new AbortController();
    api.get('/products', { signal: controller.signal })
      .then((response) => {
        const next = (response.data.products as Product[]) || [];
        setProducts(next);
        setPublished(new Set(next.filter((product) => product.available_online).map((product) => product.id)));
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  const readyProducts = useMemo(() => products.filter((product) => product.has_image && product.track_inventory && product.stock_quantity > 0), [products]);
  const updatePublished = (id: string) => setPublished((current) => {
    const next = new Set(current);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 pb-10">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-[#244b7c]"><Globe2 size={17} /> US Navy · Online Store</div>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Website control centre</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Manage what customers see online, prepare website orders, and keep your store catalog ready for publishing.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/products" className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-card px-4 text-sm font-semibold hover:bg-muted"><Upload size={16} /> Manage catalog</Link>
          <button type="button" className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#10284b] px-4 text-sm font-semibold text-white hover:bg-[#193b69]"><ExternalLink size={16} /> Connect domain</button>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Stat icon={<Globe2 size={19} />} label="Storefront status" value="Preparing" hint="Connect shop.yourdomain.com" tone="navy" />
        <Stat icon={<PackageCheck size={19} />} label="Products ready to publish" value={loading ? '—' : String(readyProducts.length)} hint="Photo, price and stock required" tone="green" />
        <Stat icon={<ShoppingBag size={19} />} label="Website orders today" value="3" hint="1 needs attention" tone="amber" />
        <Stat icon={<Wifi size={19} />} label="Central stock sync" value="Design mode" hint="Live sync begins with central API" tone="blue" />
      </div>

      <section className="rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
          <div><h2 className="font-bold">Storefront catalog</h2><p className="mt-0.5 text-sm text-muted-foreground">Upload product photos, set your selling/offer prices, then publish each item.</p></div>
          <Link href="/products" className="text-sm font-semibold text-[#244b7c] hover:underline">Open product editor <span aria-hidden>→</span></Link>
        </div>
        {loading ? <div className="p-10 text-center text-sm text-muted-foreground">Loading your catalog…</div> : products.length === 0 ? <EmptyCatalog /> : (
          <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-3">
            {products.slice(0, 6).map((product) => {
              const isPublished = published.has(product.id);
              return <article key={product.id} className="overflow-hidden rounded-xl border border-border bg-background">
                <div className="relative grid aspect-[16/9] place-items-center overflow-hidden" style={{ backgroundColor: nameToColor(product.name) }}>
                  {product.has_image ? <img src={`${api.defaults.baseURL}/products/${product.id}/image`} alt={product.name} className="size-full object-cover" /> : <><ImageIcon className="text-white/80" size={34} /><span className="absolute bottom-3 rounded-full bg-black/30 px-2 py-1 text-xs font-medium text-white">Photo needed</span></>}
                </div>
                <div className="space-y-3 p-4"><div><p className="text-xs font-semibold text-[#557099]">{product.category?.name || 'Uncategorised'}</p><h3 className="mt-1 font-semibold">{product.name}</h3></div>
                  <div className="grid grid-cols-2 gap-2 text-sm"><div className="rounded-lg bg-muted p-2"><p className="text-xs text-muted-foreground">Selling price</p><p className="mt-0.5 font-bold">{fmt(Number(product.price))}</p></div><div className="rounded-lg bg-muted p-2"><p className="text-xs text-muted-foreground">Stock</p><p className="mt-0.5 font-bold">{product.track_inventory ? product.stock_quantity : 'Not tracked'}</p></div></div>
                  <div className="flex items-center justify-between gap-3"><button type="button" onClick={() => updatePublished(product.id)} className={`inline-flex items-center gap-1.5 text-sm font-semibold ${isPublished ? 'text-emerald-700' : 'text-muted-foreground'}`}><span className={`size-2 rounded-full ${isPublished ? 'bg-emerald-500' : 'bg-slate-400'}`} /> {isPublished ? 'Published' : 'Draft'}</button><Link href="/products" className="text-sm font-semibold text-[#244b7c] hover:underline">Edit photos & offers</Link></div>
                </div>
              </article>;
            })}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b border-border px-5 py-4"><div><h2 className="font-bold">Website order monitor</h2><p className="mt-0.5 text-sm text-muted-foreground">This replaces the kitchen display for clothing orders: verify payment, pack, and dispatch.</p></div><button type="button" className="inline-flex items-center gap-2 text-sm font-semibold text-[#244b7c]"><RefreshCw size={15} /> Refresh</button></div>
        <div className="grid gap-0 divide-y divide-border md:grid-cols-3 md:divide-x md:divide-y-0">
          {(['New order', 'Paid', 'Packing'] as const).map((state) => <div key={state} className="min-h-44 p-4"><div className="mb-3 flex items-center justify-between"><h3 className="font-semibold">{state}</h3><span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold">{previewOrders.filter((order) => order.state === state).length}</span></div>{previewOrders.filter((order) => order.state === state).map((order) => <div key={order.id} className="mb-2 rounded-lg border border-border bg-background p-3"><div className="flex justify-between gap-2"><span className="text-xs font-bold text-[#244b7c]">{order.id}</span><span className="text-xs font-bold">{fmt(order.total)}</span></div><p className="mt-1 text-sm font-semibold">{order.customer}</p><p className="mt-1 text-xs text-muted-foreground">{order.items}</p></div>)}{!previewOrders.some((order) => order.state === state) && <p className="py-8 text-center text-sm text-muted-foreground">No orders</p>}</div>)}
        </div>
        <div className="border-t border-border bg-muted/40 px-5 py-3 text-xs text-muted-foreground"><Tags className="mr-1 inline size-3.5" /> Preview order cards are shown until the hosted storefront is connected. Offer price, coupons, Razorpay confirmation, shipping labels, and central stock sync are delivered with that service—not by the old KDS.</div>
      </section>
    </div>
  );
}

function Stat({ icon, label, value, hint, tone }: { icon: ReactNode; label: string; value: string; hint: string; tone: 'navy' | 'green' | 'amber' | 'blue' }) {
  const tones = { navy: 'border-[#244b7c]/30 bg-[#10284b]/5 text-[#244b7c]', green: 'border-emerald-500/25 bg-emerald-500/5 text-emerald-700', amber: 'border-amber-500/25 bg-amber-500/5 text-amber-700', blue: 'border-blue-500/25 bg-blue-500/5 text-blue-700' };
  return <div className={`rounded-2xl border p-4 ${tones[tone]}`}><div className="flex items-center justify-between"><p className="text-sm font-medium text-foreground">{label}</p>{icon}</div><p className="mt-3 text-2xl font-bold text-foreground">{value}</p><p className="mt-1 text-xs text-muted-foreground">{hint}</p></div>;
}

function EmptyCatalog() {
  return <div className="p-10 text-center"><ImageIcon className="mx-auto text-muted-foreground" size={32} /><h3 className="mt-3 font-semibold">Add your first clothing product</h3><p className="mt-1 text-sm text-muted-foreground">Add product photos, sizes, colours, stock and prices from your catalog.</p><Link href="/products" className="mt-4 inline-flex rounded-lg bg-[#10284b] px-4 py-2 text-sm font-semibold text-white">Open catalog</Link></div>;
}
