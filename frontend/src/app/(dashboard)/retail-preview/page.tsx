'use client';

import { useMemo, useState } from 'react';
import {
  Barcode, Bell, ChevronDown, CircleCheck, Cloud, Minus, Plus,
  Search, ShoppingBag, SlidersHorizontal, UserRound, X,
} from 'lucide-react';

type Product = {
  id: string;
  name: string;
  category: 'Men' | 'Women' | 'Kids';
  collection: string;
  price: number;
  colors: { name: string; dot: string; sizes: { name: string; stock: number }[] }[];
  swatch: string;
  label?: string;
};

const products: Product[] = [
  { id: 'polo', name: 'Classic Cotton Polo', category: 'Men', collection: 'Essentials', price: 1499, swatch: 'from-sky-950 via-blue-800 to-slate-950', label: 'New', colors: [{ name: 'Navy', dot: 'bg-[#1b3156]', sizes: [{ name: 'S', stock: 8 }, { name: 'M', stock: 12 }, { name: 'L', stock: 5 }, { name: 'XL', stock: 3 }] }, { name: 'White', dot: 'bg-white ring-1 ring-slate-300', sizes: [{ name: 'S', stock: 4 }, { name: 'M', stock: 7 }, { name: 'L', stock: 4 }, { name: 'XL', stock: 2 }] }] },
  { id: 'linen', name: 'Linen Resort Shirt', category: 'Men', collection: 'Summer Edit', price: 2199, swatch: 'from-stone-200 via-amber-100 to-stone-400', colors: [{ name: 'Sand', dot: 'bg-[#d8c4a0]', sizes: [{ name: 'M', stock: 6 }, { name: 'L', stock: 8 }, { name: 'XL', stock: 2 }] }, { name: 'Olive', dot: 'bg-[#65724c]', sizes: [{ name: 'M', stock: 3 }, { name: 'L', stock: 6 }, { name: 'XL', stock: 1 }] }] },
  { id: 'denim', name: 'Straight Fit Denim', category: 'Women', collection: 'Denim Studio', price: 2899, swatch: 'from-[#5574a0] via-[#284a76] to-[#172b4c]', label: 'Best seller', colors: [{ name: 'Indigo', dot: 'bg-[#274c77]', sizes: [{ name: '28', stock: 4 }, { name: '30', stock: 7 }, { name: '32', stock: 6 }, { name: '34', stock: 2 }] }, { name: 'Black', dot: 'bg-[#1e1e20]', sizes: [{ name: '28', stock: 2 }, { name: '30', stock: 5 }, { name: '32', stock: 3 }, { name: '34', stock: 1 }] }] },
  { id: 'dress', name: 'Printed Midi Dress', category: 'Women', collection: 'Monsoon Bloom', price: 3499, swatch: 'from-rose-200 via-fuchsia-300 to-violet-400', colors: [{ name: 'Rose', dot: 'bg-[#e999b3]', sizes: [{ name: 'S', stock: 5 }, { name: 'M', stock: 9 }, { name: 'L', stock: 4 }, { name: 'XL', stock: 0 }] }, { name: 'Lilac', dot: 'bg-[#b9a2dd]', sizes: [{ name: 'S', stock: 4 }, { name: 'M', stock: 6 }, { name: 'L', stock: 2 }, { name: 'XL', stock: 1 }] }] },
  { id: 'kids', name: 'Weekend Graphic Tee', category: 'Kids', collection: 'Play', price: 799, swatch: 'from-orange-300 via-amber-200 to-cyan-300', colors: [{ name: 'Sunshine', dot: 'bg-[#f7c948]', sizes: [{ name: '4–5Y', stock: 6 }, { name: '6–7Y', stock: 10 }, { name: '8–9Y', stock: 3 }] }, { name: 'Sky', dot: 'bg-[#5eb3e5]', sizes: [{ name: '4–5Y', stock: 5 }, { name: '6–7Y', stock: 7 }, { name: '8–9Y', stock: 4 }] }] },
  { id: 'trouser', name: 'Tailored Wide-Leg Trouser', category: 'Women', collection: 'Work Edit', price: 2699, swatch: 'from-slate-300 via-slate-500 to-slate-800', colors: [{ name: 'Charcoal', dot: 'bg-[#475569]', sizes: [{ name: '28', stock: 3 }, { name: '30', stock: 5 }, { name: '32', stock: 2 }, { name: '34', stock: 2 }] }, { name: 'Cream', dot: 'bg-[#f1eadb]', sizes: [{ name: '28', stock: 3 }, { name: '30', stock: 4 }, { name: '32', stock: 4 }, { name: '34', stock: 1 }] }] },
];

type CartLine = { key: string; product: Product; color: string; size: string; quantity: number };
const money = (amount: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

export default function RetailPreviewPage() {
  const [category, setCategory] = useState<'All' | Product['category']>('All');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Product>(products[0]);
  const [color, setColor] = useState(products[0].colors[0].name);
  const [size, setSize] = useState(products[0].colors[0].sizes[1].name);
  const [cart, setCart] = useState<CartLine[]>([]);

  const selectedColor = selected.colors.find((item) => item.name === color) ?? selected.colors[0];
  const selectedSize = selectedColor.sizes.find((item) => item.name === size) ?? selectedColor.sizes[0];
  const visibleProducts = useMemo(() => products.filter((product) =>
    (category === 'All' || product.category === category)
    && `${product.name} ${product.collection}`.toLowerCase().includes(search.toLowerCase()),
  ), [category, search]);
  const subtotal = cart.reduce((sum, line) => sum + line.product.price * line.quantity, 0);
  const gst = Math.round(subtotal * 0.05);

  const openProduct = (product: Product) => {
    setSelected(product);
    setColor(product.colors[0].name);
    setSize(product.colors[0].sizes[0].name);
  };
  const chooseColor = (nextColor: string) => {
    const option = selected.colors.find((item) => item.name === nextColor)!;
    setColor(nextColor);
    setSize(option.sizes[0].name);
  };
  const addToCart = () => {
    if (selectedSize.stock === 0) return;
    const key = `${selected.id}:${color}:${size}`;
    setCart((lines) => {
      const current = lines.find((line) => line.key === key);
      return current
        ? lines.map((line) => line.key === key ? { ...line, quantity: line.quantity + 1 } : line)
        : [...lines, { key, product: selected, color, size, quantity: 1 }];
    });
  };
  const changeQuantity = (key: string, quantity: number) => setCart((lines) => quantity <= 0 ? lines.filter((line) => line.key !== key) : lines.map((line) => line.key === key ? { ...line, quantity } : line));

  return (
    <main className="min-h-full -m-4 bg-[#f7f8fa] p-4 text-slate-900">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-4">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-[#10284b] px-5 py-4 text-white shadow-sm">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-white font-serif text-xl font-black tracking-tight text-[#10284b]">US</div>
            <div><p className="font-serif text-xl font-bold tracking-wide">US Navy</p><p className="text-xs text-blue-200">Fashion Retail · Kochi</p></div>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden items-center gap-1.5 rounded-full bg-emerald-400/15 px-3 py-1.5 text-emerald-200 sm:flex"><CircleCheck size={15} /> Online · Synced now</span>
            <button className="rounded-lg p-2 hover:bg-white/10" aria-label="Notifications"><Bell size={19} /></button>
            <button className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 hover:bg-white/15"><UserRound size={17} /> Anjali <ChevronDown size={15} /></button>
          </div>
        </header>

        <div className="grid min-h-[680px] gap-4 xl:grid-cols-[1fr_360px]">
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div><h1 className="text-xl font-bold">New sale</h1><p className="text-sm text-slate-500">Scan a barcode or select a variant to add it.</p></div>
              <div className="flex w-full max-w-md items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus-within:border-[#244b7c] focus-within:ring-2 focus-within:ring-[#244b7c]/15">
                <Search size={18} className="text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search product, SKU or barcode" className="min-w-0 flex-1 bg-transparent text-sm outline-none" /><Barcode size={18} className="text-[#244b7c]" />
              </div>
            </div>
            <div className="mb-5 flex flex-wrap gap-2">
              {(['All', 'Men', 'Women', 'Kids'] as const).map((item) => <button key={item} onClick={() => setCategory(item)} className={`rounded-full px-4 py-2 text-sm font-semibold transition ${category === item ? 'bg-[#10284b] text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{item}</button>)}
              <button className="ml-auto flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-sm text-slate-600"><SlidersHorizontal size={15} /> Filters</button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              {visibleProducts.map((product) => <button key={product.id} onClick={() => openProduct(product)} className={`overflow-hidden rounded-2xl border text-left transition hover:-translate-y-0.5 hover:shadow-md ${selected.id === product.id ? 'border-[#244b7c] ring-2 ring-[#244b7c]/15' : 'border-slate-200'}`}>
                <div className={`relative grid aspect-[4/3] place-items-center bg-gradient-to-br ${product.swatch}`}><ShoppingBag size={52} strokeWidth={1} className="text-white/75" />{product.label && <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-[#10284b]">{product.label}</span>}</div>
                <div className="p-3"><p className="text-xs font-medium text-[#557099]">{product.collection}</p><h2 className="mt-1 font-semibold">{product.name}</h2><div className="mt-3 flex items-center justify-between"><span className="font-bold">{money(product.price)}</span><span className="flex gap-1.5">{product.colors.map((shade) => <i key={shade.name} className={`size-3 rounded-full ${shade.dot}`} />)}</span></div></div>
              </button>)}
            </div>
          </section>

          <aside className="flex flex-col rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-4"><div className="flex items-center justify-between"><h2 className="font-bold">Shopping bag</h2><button className="text-xs font-semibold text-[#244b7c]">Hold bill</button></div><button className="mt-3 flex w-full items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-left text-sm text-slate-600"><UserRound size={17} /> Walk-in customer <ChevronDown className="ml-auto" size={16} /></button></div>
            <div className="flex-1 space-y-3 overflow-auto p-4">
              {cart.length === 0 ? <div className="grid place-items-center py-16 text-center text-slate-400"><ShoppingBag size={32} strokeWidth={1.25} /><p className="mt-3 text-sm">Your bag is empty</p><p className="text-xs">Choose a size and colour to begin.</p></div> : cart.map((line) => <div key={line.key} className="flex gap-3 rounded-xl bg-slate-50 p-3"><div className={`grid size-12 shrink-0 place-items-center rounded-lg bg-gradient-to-br ${line.product.swatch}`}><ShoppingBag size={20} className="text-white/80" /></div><div className="min-w-0 flex-1"><div className="flex justify-between gap-2"><p className="truncate text-sm font-semibold">{line.product.name}</p><button onClick={() => changeQuantity(line.key, 0)} className="text-slate-400 hover:text-red-500"><X size={16} /></button></div><p className="text-xs text-slate-500">{line.color} · {line.size}</p><div className="mt-2 flex items-center justify-between"><div className="flex items-center rounded-lg border border-slate-200 bg-white"><button onClick={() => changeQuantity(line.key, line.quantity - 1)} className="p-1.5"><Minus size={13} /></button><span className="w-6 text-center text-sm">{line.quantity}</span><button onClick={() => changeQuantity(line.key, line.quantity + 1)} className="p-1.5"><Plus size={13} /></button></div><span className="text-sm font-bold">{money(line.product.price * line.quantity)}</span></div></div></div>)}
            </div>
            <div className="border-t border-slate-100 p-4"><div className="space-y-1.5 text-sm text-slate-500"><div className="flex justify-between"><span>Subtotal</span><span>{money(subtotal)}</span></div><div className="flex justify-between"><span>GST (estimated)</span><span>{money(gst)}</span></div><div className="flex justify-between pt-2 text-base font-bold text-slate-900"><span>Total</span><span>{money(subtotal + gst)}</span></div></div><button disabled={!cart.length} className="mt-4 w-full rounded-xl bg-[#10284b] py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#193b69] disabled:cursor-not-allowed disabled:opacity-40">Continue to payment</button><p className="mt-2 text-center text-[11px] text-slate-400">Cash · Card · UPI · Split payment</p></div>
          </aside>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="grid gap-5 lg:grid-cols-[160px_1fr]"><div className={`grid aspect-square max-h-44 place-items-center rounded-2xl bg-gradient-to-br ${selected.swatch}`}><ShoppingBag size={64} strokeWidth={1} className="text-white/75" /></div><div><p className="text-sm font-semibold text-[#557099]">{selected.collection} · {selected.category}</p><h2 className="mt-1 text-2xl font-bold">{selected.name}</h2><p className="mt-1 text-lg font-bold">{money(selected.price)} <span className="text-xs font-normal text-slate-500">incl. GST</span></p><div className="mt-5 grid gap-4 sm:grid-cols-2"><div><p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Colour · {color}</p><div className="flex gap-2">{selected.colors.map((option) => <button key={option.name} aria-label={option.name} onClick={() => chooseColor(option.name)} className={`grid size-9 place-items-center rounded-full ${color === option.name ? 'ring-2 ring-[#10284b] ring-offset-2' : ''}`}><i className={`size-7 rounded-full ${option.dot}`} /></button>)}</div></div><div><p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Size · {size}</p><div className="flex flex-wrap gap-2">{selectedColor.sizes.map((option) => <button key={option.name} disabled={option.stock === 0} onClick={() => setSize(option.name)} className={`min-w-11 rounded-lg border px-3 py-2 text-sm font-semibold ${size === option.name ? 'border-[#10284b] bg-[#10284b] text-white' : 'border-slate-200 hover:border-[#557099]'} disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 disabled:line-through`}>{option.name}</button>)}</div></div></div><div className="mt-5 flex flex-wrap items-center gap-4"><span className={`rounded-full px-3 py-1.5 text-sm font-semibold ${selectedSize.stock <= 3 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-50 text-emerald-700'}`}>{selectedSize.stock} in stock · Kochi store</span><span className="text-xs text-slate-500">SKU: USN-{selected.id.toUpperCase()}-{color.slice(0, 3).toUpperCase()}-{size.replace('–', '')}</span><button onClick={addToCart} disabled={selectedSize.stock === 0} className="ml-auto rounded-xl bg-[#be8c42] px-5 py-3 text-sm font-bold text-white hover:bg-[#a87934] disabled:opacity-40">Add {color} / {size}</button></div></div></div></section>
        <p className="flex items-center gap-2 px-1 text-xs text-slate-500"><Cloud size={14} className="text-emerald-600" /> Visual preview only — central inventory and sync APIs will power these live values.</p>
      </div>
    </main>
  );
}
