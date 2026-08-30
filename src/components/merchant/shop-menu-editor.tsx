"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Camera } from "lucide-react";
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
  const [pending, start] = useTransition();
  const [name, setName] = useState("");
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
          price: amount,
          size: "small",
          image_url,
        });
        setName("");
        setPrice("");
        onFile(null);
        setOk("On the menu. Riders will see it on your shop page.");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not add item.");
      }
    });
  }

  return (
    <section className="ru-card mt-6 p-5" data-testid="shop-menu-editor">
      <h2 className="text-lg font-bold text-black">Your menu — add photos here</h2>
      <p className="mt-1 text-sm text-[#6B6B6B]">
        This is the shop-owner kitchen. Name, price, and a photo of the real plate.
        Riders see it on your shop page.
      </p>

      <form onSubmit={submit} className="mt-4 space-y-3">
        <label className="block">
          <span className="text-xs font-bold text-[#6B6B6B]">Item name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Beef stew + pap"
            className="mt-1 w-full rounded-2xl bg-[#F3F3F3] px-4 py-3 text-[16px] outline-none"
          />
        </label>
        <label className="block">
          <span className="text-xs font-bold text-[#6B6B6B]">Price (R)</span>
          <input
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            inputMode="numeric"
            placeholder="55"
            className="mt-1 w-full rounded-2xl bg-[#F3F3F3] px-4 py-3 text-[16px] outline-none"
          />
        </label>
        <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-[#D2D2D2] bg-[#FAFAFA] px-4 py-3">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-[12px] bg-[#EEEEEE]">
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="" className="h-full w-full object-cover" />
            ) : (
              <Camera className="h-6 w-6 text-[#8A8A8A]" />
            )}
          </span>
          <span className="text-sm font-semibold text-black">
            {photo ? photo.name : "Photo of this item"}
            <span className="mt-0.5 block font-normal text-[#6B6B6B]">
              Square crop. Shoppers eat with their eyes.
            </span>
          </span>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            onChange={(e) => onFile(e.target.files?.[0] ?? null)}
          />
        </label>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {ok ? <p className="text-sm font-semibold text-[#067a4c]">{ok}</p> : null}
        <button
          type="submit"
          disabled={pending}
          className="uber-press uber-btn-black w-full"
        >
          {pending ? "Saving…" : "Add to menu"}
        </button>
      </form>

      {products.length > 0 ? (
        <ul className="mt-5 divide-y divide-[#F0F0F0]">
          {products.map((p) => (
            <li key={p.id} className="flex items-center gap-3 py-3">
              <ShopPhoto
                src={productPhotoSrc(p)}
                alt=""
                fallback="/shops/prod-staples.jpg"
                className="h-14 w-14 rounded-[12px] object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{p.name}</p>
                <p className="text-sm font-bold">{formatMoney(Number(p.price))}</p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-[#8A8A8A]">
          No items yet. Add one with a photo so the shop page is not empty.
        </p>
      )}
    </section>
  );
}
