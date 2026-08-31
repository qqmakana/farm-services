"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Plus, X } from "lucide-react";
import { createProduct } from "@/lib/actions";
import { uploadShopProductPhoto } from "@/lib/actions-shop-orders";
import { compressImageFile } from "@/lib/compress-image";
import { formatMoney } from "@/lib/format";
import { ShopPhoto } from "@/components/shops/shop-photo";
import { productPhotoSrc } from "@/lib/shop-photos";
import type { Product } from "@/lib/types";

export function ShopMenuEditor({
  shopId,
  products,
}: {
  shopId: string;
  products: Product[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(products.length === 0);
  const [pending, start] = useTransition();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  function onFile(file: File | null) {
    if (preview) URL.revokeObjectURL(preview);
    setPhoto(file);
    setPreview(file ? URL.createObjectURL(file) : null);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(null);
    const amount = Math.round(Number(price));
    if (!name.trim() || !(amount > 0)) {
      setError("Name and price are required.");
      return;
    }
    start(async () => {
      try {
        let image_url: string | null = null;
        if (photo) {
          const compressed = await compressImageFile(photo, {
            maxSide: 800,
            maxBytes: 300_000,
          });
          const fd = new FormData();
          fd.set("photo", compressed);
          const up = await uploadShopProductPhoto(shopId, fd);
          image_url = up.url;
        }
        await createProduct({
          shop_id: shopId,
          name: name.trim(),
          description: description.trim() || null,
          price: amount,
          size: "small",
          image_url,
        });
        setName("");
        setDescription("");
        setPrice("");
        onFile(null);
        setOk("On the menu.");
        setOpen(false);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not add item.");
      }
    });
  }

  return (
    <section className="mt-6" data-testid="shop-menu-editor">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-[#111111]">Menu</h2>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="uber-press inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full bg-black px-4 text-sm font-bold text-white"
        >
          {open ? (
            <>
              <X className="h-4 w-4" />
              Close
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              Add menu item
            </>
          )}
        </button>
      </div>

      {open ? (
        <form
          onSubmit={submit}
          className="mt-4 space-y-3 rounded-[16px] bg-[#F6F6F6] p-4"
        >
          <label className="block">
            <span className="text-xs font-bold text-[#6B6B6B]">Item name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Beef stew + pap"
              className="mt-1 w-full rounded-2xl bg-white px-4 py-3 text-[16px] text-[#111111] outline-none"
            />
          </label>
          <label className="block">
            <span className="text-xs font-bold text-[#6B6B6B]">
              Short description
            </span>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Slow-cooked beef with pap"
              className="mt-1 w-full rounded-2xl bg-white px-4 py-3 text-[16px] text-[#111111] outline-none"
            />
          </label>
          <label className="block">
            <span className="text-xs font-bold text-[#6B6B6B]">Price (R)</span>
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              inputMode="numeric"
              placeholder="55"
              className="mt-1 w-full rounded-2xl bg-white px-4 py-3 text-[16px] text-[#111111] outline-none"
            />
          </label>
          <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-[#D2D2D2] bg-white px-4 py-3">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-[12px] bg-[#EEEEEE]">
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt="" className="h-full w-full object-cover" />
              ) : (
                <ImagePlus className="h-6 w-6 text-[#8A8A8A]" />
              )}
            </span>
            <span className="text-sm font-semibold text-[#111111]">
              {photo ? photo.name : "Choose a photo"}
              <span className="mt-0.5 block font-normal text-[#6B6B6B]">
                Gallery or files — not the camera.
              </span>
            </span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic,.jpg,.jpeg,.png,.webp"
              className="sr-only"
              onChange={(e) => onFile(e.target.files?.[0] ?? null)}
            />
          </label>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {ok ? (
            <p className="text-sm font-semibold text-[#067a4c]">{ok}</p>
          ) : null}
          <button
            type="submit"
            disabled={pending}
            className="uber-press flex min-h-12 w-full items-center justify-center rounded-full bg-[#06c167] text-[16px] font-bold text-white disabled:opacity-50"
          >
            {pending ? "Saving…" : "Add to menu"}
          </button>
        </form>
      ) : null}

      {products.length > 0 ? (
        <ul className="mt-4 divide-y divide-[#F0F0F0] rounded-[16px] bg-white">
          {products.map((p) => (
            <li key={p.id} className="flex items-center gap-3 py-3">
              <ShopPhoto
                src={productPhotoSrc(p)}
                alt=""
                fallback="/shops/prod-staples.jpg"
                className="h-14 w-14 rounded-[12px] object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-[#111111]">{p.name}</p>
                <p className="truncate text-sm text-[#6B6B6B]">
                  {p.description?.trim() || "No description yet"}
                </p>
                <p className="text-sm font-bold text-[#111111]">
                  {formatMoney(Number(p.price))}
                </p>
              </div>
            </li>
          ))}
        </ul>
      ) : !open ? (
        <p className="mt-4 text-sm text-[#6B6B6B]">
          No items yet. Tap Add menu item.
        </p>
      ) : null}
    </section>
  );
}
