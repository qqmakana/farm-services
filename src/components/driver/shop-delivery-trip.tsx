"use client";

import dynamic from "next/dynamic";
import { useRef, useState, useTransition } from "react";
import { Camera } from "lucide-react";
import { advanceShopDelivery } from "@/lib/actions-shop-orders";
import { compressImageFile } from "@/lib/compress-image";
import { formatMoney } from "@/lib/format";
import { isShopPackageJob } from "@/lib/package-job";
import {
  mapsHref,
  nextShopDeliveryStage,
  shopDeliveryOfferLines,
  shopDeliveryStageFromJob,
  shopPhoneFromJob,
  telHref,
} from "@/lib/shop-delivery";
import type { JobWithDriver } from "@/lib/types";

const DriverJobsMap = dynamic(
  () =>
    import("@/components/maps/driver-jobs-map").then((m) => m.DriverJobsMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-48 items-center justify-center bg-[#1b2433] text-sm text-white/70">
        Loading map…
      </div>
    ),
  },
);

export function ShopDeliveryTrip({
  job,
  driverId,
  driverLoc,
  onChanged,
}: {
  job: JobWithDriver;
  driverId: string;
  driverLoc: { lat: number; lng: number } | null;
  onChanged: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const lines = shopDeliveryOfferLines(job);
  const stage = shopDeliveryStageFromJob(job) ?? "accepted";
  const next = nextShopDeliveryStage(stage);
  const shopTel = telHref(shopPhoneFromJob(job));
  const riderTel = telHref(job.customer_phone);
  const pickupNav =
    job.pickup_lat != null && job.pickup_lng != null
      ? mapsHref(job.pickup_lat, job.pickup_lng)
      : null;
  const dropNav =
    job.dropoff_lat != null && job.dropoff_lng != null
      ? mapsHref(job.dropoff_lat, job.dropoff_lng)
      : null;
  const goingToDrop =
    stage === "collected" || stage === "on_the_way" || stage === "at_dropoff";

  if (!isShopPackageJob(job)) return null;

  function run(stageNext: NonNullable<typeof next>, photo?: string | null) {
    setError(null);
    start(async () => {
      try {
        await advanceShopDelivery(job.id, driverId, stageNext, photo);
        onChanged();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not update");
      }
    });
  }

  async function onPhoto(file: File | null) {
    if (!file) return;
    const compressed = await compressImageFile(file, {
      maxSide: 800,
      maxBytes: 300_000,
    });
    const url = URL.createObjectURL(compressed);
    setPhotoPreview(url);
    const reader = new FileReader();
    reader.onload = () => {
      const data = typeof reader.result === "string" ? reader.result : null;
      if (next === "collected") run("collected", data);
    };
    reader.readAsDataURL(compressed);
  }

  return (
    <section
      data-testid="shop-delivery-trip"
      className="overflow-hidden rounded-[20px] bg-white shadow-[0_8px_24px_rgba(0,0,0,0.08)]"
    >
      <div className="h-48">
        <DriverJobsMap
          driverLocation={driverLoc}
          onSelectJob={() => undefined}
          className="h-full w-full"
          jobs={
            job.pickup_lat != null && job.pickup_lng != null
              ? [
                  {
                    id: job.id,
                    lat: goingToDrop
                      ? (job.dropoff_lat ?? job.pickup_lat)
                      : job.pickup_lat,
                    lng: goingToDrop
                      ? (job.dropoff_lng ?? job.pickup_lng)
                      : job.pickup_lng,
                    label: job.reference_code,
                  },
                ]
              : []
          }
        />
      </div>

      <div className="p-4">
        <p className="text-[12px] font-bold uppercase tracking-wide text-[#06c167]">
          Delivery · {formatMoney(lines.earn)}
        </p>
        <h2 className="mt-1 text-[20px] font-bold text-[#111111]">
          {lines.shop}
        </h2>
        <p className="mt-1 text-sm text-[#6B6B6B]">
          {lines.items ? `${lines.items} items` : "Packed bag"} ·{" "}
          {job.reference_code}
        </p>

        <div className="mt-4 rounded-2xl bg-[#F6F6F6] p-3">
          <p className="text-[11px] font-bold uppercase text-[#8A8A8A]">
            Pickup
          </p>
          <p className="mt-0.5 font-semibold text-black">{lines.pickup}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {pickupNav ? (
              <a
                href={pickupNav}
                target="_blank"
                rel="noreferrer"
                className="uber-press rounded-full bg-black px-4 py-2 text-sm font-bold text-white"
              >
                Navigate
              </a>
            ) : null}
            {shopTel ? (
              <a
                href={shopTel}
                className="uber-press rounded-full bg-white px-4 py-2 text-sm font-bold text-black ring-1 ring-gray-200"
              >
                Call Shop
              </a>
            ) : null}
          </div>
        </div>

        <div className="mt-3 rounded-2xl bg-[#F6F6F6] p-3">
          <p className="text-[11px] font-bold uppercase text-[#8A8A8A]">
            Dropoff
          </p>
          <p className="mt-0.5 font-semibold text-black">{lines.dropoff}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {dropNav ? (
              <a
                href={dropNav}
                target="_blank"
                rel="noreferrer"
                className="uber-press rounded-full bg-black px-4 py-2 text-sm font-bold text-white"
              >
                Navigate
              </a>
            ) : null}
            {riderTel ? (
              <a
                href={riderTel}
                className="uber-press rounded-full bg-white px-4 py-2 text-sm font-bold text-black ring-1 ring-gray-200"
              >
                Call Rider
              </a>
            ) : null}
          </div>
        </div>

        {photoPreview ||
        (job.details as { collected_photo_data_url?: string })
          .collected_photo_data_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={
              photoPreview ||
              (job.details as { collected_photo_data_url?: string })
                .collected_photo_data_url
            }
            alt="Collected bag"
            className="mt-3 h-28 w-full rounded-xl object-cover"
          />
        ) : null}

        {error ? (
          <p className="mt-3 text-sm font-semibold text-red-600">{error}</p>
        ) : null}

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          onChange={(e) => void onPhoto(e.target.files?.[0] ?? null)}
        />

        {next === "collected" ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => fileRef.current?.click()}
            className="uber-press mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-[#05944F] py-3.5 text-[16px] font-bold text-white"
          >
            <Camera className="h-5 w-5" />
            Collected — take photo
          </button>
        ) : next ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => run(next)}
            className="uber-press mt-4 w-full rounded-full bg-[#05944F] py-3.5 text-[16px] font-bold text-white"
          >
            {next === "at_shop"
              ? "Arrived at Shop"
              : next === "on_the_way"
                ? "On the Way"
                : next === "at_dropoff"
                  ? "Arrived"
                  : "Delivered"}
          </button>
        ) : null}
      </div>
    </section>
  );
}
