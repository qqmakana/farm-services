import { DEFAULT_COUNTRY, getCountry } from "@/lib/countries";
import { normalizeHomeCity } from "@/lib/founding-driver";
import { isValidMobileForCountry } from "@/lib/phone";
import {
  isValidSaIdNumber,
  normalizeSaId,
  SA_ID_REJECT_MESSAGE,
  saIdRequiredForCountry,
} from "@/lib/sa-id";
import { createAdminClient, hasServiceRole } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import type { VehicleType } from "@/lib/types";
import { mockRepo } from "@/lib/mock-store";

export type DriverApplyResult =
  | { ok: true; driverId: string }
  | { ok: false; error: string };

function useLiveDb() {
  return isSupabaseConfigured() && hasServiceRole();
}

function asImageFile(
  value: FormDataEntryValue | null,
  key: string,
  label: string,
): File {
  if (!value || typeof value === "string") {
    throw new Error(`${label} is required.`);
  }
  const blob = value as Blob;
  if (!blob.size || blob.size <= 0) {
    throw new Error(`${label} is required.`);
  }
  if (blob.size > 5 * 1024 * 1024) {
    throw new Error(`${label} must be under 5MB.`);
  }
  const type = (blob.type || "").toLowerCase();
  const okType =
    type === "image/jpeg" ||
    type === "image/jpg" ||
    type === "image/png" ||
    type === "image/webp" ||
    type === "";
  if (!okType) {
    throw new Error(`${label} must be JPEG or PNG.`);
  }
  if (typeof File !== "undefined" && value instanceof File) {
    return value;
  }
  return new File([blob], `${key}.jpg`, {
    type: type || "image/jpeg",
  });
}

async function uploadDriverDoc(
  driverId: string,
  kind: "id" | "selfie" | "vehicle_front" | "vehicle_side",
  file: File,
) {
  const admin = createAdminClient();
  const buffer = Buffer.from(await file.arrayBuffer());
  const isPng = (file.type || "").includes("png");
  const ext = isPng ? "png" : "jpg";
  const contentType = isPng ? "image/png" : "image/jpeg";
  const path = `${driverId}/${kind}-${Date.now()}.${ext}`;
  const { error } = await admin.storage
    .from("rr-driver-docs")
    .upload(path, buffer, {
      contentType,
      upsert: true,
    });
  if (error) {
    const msg = error.message || "Upload failed";
    if (/bucket|not found|does not exist/i.test(msg)) {
      throw new Error(
        "Photo storage is missing. Run supabase/DRIVER_APPLY_READY.sql in Supabase, then try again.",
      );
    }
    if (/row-level|policy|jwt|apikey|unauthorized/i.test(msg)) {
      throw new Error(
        "Photo upload was blocked. Check SUPABASE_SERVICE_ROLE_KEY on Vercel.",
      );
    }
    throw new Error(`Could not upload ${kind.replace(/_/g, " ")} photo: ${msg}`);
  }
  return path;
}

async function insertDriverRow(
  row: Record<string, unknown>,
): Promise<{ id: string }> {
  const admin = createAdminClient();
  const full = await admin.from("rr_drivers").insert(row).select("id").single();
  if (!full.error && full.data?.id) {
    return { id: full.data.id as string };
  }

  const msg = full.error?.message || "Could not create driver.";
  // Schema not fully migrated — retry with core columns only.
  if (/column|schema cache|could not find/i.test(msg)) {
    const minimal = {
      full_name: row.full_name,
      phone: row.phone,
      vehicle_type: row.vehicle_type,
      is_active: true,
      approval_status: "approved",
      id_verified: false,
      is_online: false,
      notes: row.notes,
    };
    const retry = await admin
      .from("rr_drivers")
      .insert(minimal)
      .select("id")
      .single();
    if (!retry.error && retry.data?.id) {
      return { id: retry.data.id as string };
    }
    throw new Error(
      retry.error?.message ||
        "Driver table is missing columns. Run supabase/DRIVER_APPLY_READY.sql in Supabase.",
    );
  }
  throw new Error(msg);
}

/**
 * Core driver apply — always returns a JSON-safe result (never throws digests).
 */
export async function submitDriverApplication(
  formData: FormData,
): Promise<DriverApplyResult> {
  try {
    const full_name = String(formData.get("full_name") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").trim();
    const vehicle_type = String(
      formData.get("vehicle_type") ?? "bakkie",
    ).trim() as VehicleType;
    const area = String(formData.get("area") ?? "").trim();
    const notes = String(formData.get("notes") ?? "").trim();
    const country_code = String(
      formData.get("country_code") ?? DEFAULT_COUNTRY,
    ).trim();
    const conduct =
      String(formData.get("code_of_conduct") ?? "") === "on" ||
      String(formData.get("code_of_conduct") ?? "") === "true" ||
      formData.get("code_of_conduct") === "1";

    if (!full_name || !phone) {
      return { ok: false, error: "Name and phone are required." };
    }
    if (!area) return { ok: false, error: "Area / town is required." };
    if (!conduct) {
      return {
        ok: false,
        error: "You must agree to the Driver Code of Conduct.",
      };
    }
    if (!isValidMobileForCountry(phone, country_code)) {
      const c = getCountry(country_code);
      return {
        ok: false,
        error: `Enter a valid ${c.name} mobile (e.g. +${c.phonePrefix}…).`,
      };
    }

    const typedId = normalizeSaId(String(formData.get("id_number") ?? ""));
    let saId: string | null = null;
    if (saIdRequiredForCountry(country_code)) {
      if (!isValidSaIdNumber(typedId)) {
        return { ok: false, error: SA_ID_REJECT_MESSAGE };
      }
      saId = typedId;
    }

    const idFile = asImageFile(formData.get("id_doc"), "id_doc", "ID photo (front)");
    const selfieFile = asImageFile(
      formData.get("selfie"),
      "selfie",
      "Face / selfie photo",
    );
    const vehicleFront = asImageFile(
      formData.get("vehicle_front"),
      "vehicle_front",
      "Vehicle front photo (registration visible)",
    );
    const vehicleSide = asImageFile(
      formData.get("vehicle_side"),
      "vehicle_side",
      "Vehicle side photo",
    );

    const vehicle_make =
      String(formData.get("vehicle_make") ?? "").trim() || null;
    const vehicle_model =
      String(formData.get("vehicle_model") ?? "").trim() || null;
    const vehicle_color =
      String(formData.get("vehicle_color") ?? "").trim() || null;
    const vehicle_registration =
      String(formData.get("vehicle_registration") ?? "").trim() || null;

    const now = new Date().toISOString();
    const noteLine = [
      `Area: ${area}`,
      saId ? `SA ID: ${saId}` : null,
      `${getCountry(country_code).name} — pending photo verification`,
      notes || null,
    ]
      .filter(Boolean)
      .join(" · ");

    if (!useLiveDb()) {
      const driver = mockRepo.applyToDrive({
        full_name,
        phone,
        vehicle_type,
        area,
        notes: notes || undefined,
        country_code,
      });
      driver.id_doc_url = `mock://id/${idFile.name}`;
      driver.selfie_url = `mock://selfie/${selfieFile.name}`;
      driver.vehicle_front_url = `mock://vfront/${vehicleFront.name}`;
      driver.vehicle_side_url = `mock://vside/${vehicleSide.name}`;
      driver.vehicle_make = vehicle_make;
      driver.vehicle_model = vehicle_model;
      driver.vehicle_color = vehicle_color;
      driver.vehicle_registration = vehicle_registration;
      driver.code_of_conduct_accepted_at = now;
      driver.verification_status = "pending";
      if (saId) driver.kyc_id_number = saId;
      driver.id_verified = false;
      driver.docs_submitted_at = now;
      driver.approval_status = "approved";
      return { ok: true, driverId: driver.id };
    }

    const admin = createAdminClient();
    const { data: existing, error: existingErr } = await admin
      .from("rr_drivers")
      .select("id, approval_status, verification_status")
      .eq("phone", phone)
      .maybeSingle();

    if (existingErr) {
      return {
        ok: false,
        error: `Could not check existing drivers: ${existingErr.message}`,
      };
    }

    if (saId) {
      const { data: idHit } = await admin
        .from("rr_drivers")
        .select("id")
        .eq("kyc_id_number", saId)
        .maybeSingle();
      if (idHit?.id && idHit.id !== existing?.id) {
        return {
          ok: false,
          error: "This South African ID is already on a driver application.",
        };
      }
    }

    if (
      existing?.approval_status === "approved" &&
      existing.verification_status === "verified"
    ) {
      return {
        ok: false,
        error: "This phone is already a verified driver. Open the driver app.",
      };
    }
    if (existing?.verification_status === "pending") {
      return {
        ok: false,
        error: "Application already submitted — waiting for ID verification.",
      };
    }

    // Re-apply after reject: update existing row instead of insert conflict
    let driverId = existing?.id as string | undefined;

    if (!driverId) {
      const homeCity = normalizeHomeCity(area);
      const created = await insertDriverRow({
        full_name,
        phone,
        vehicle_type,
        is_active: true,
        approval_status: "approved",
        id_verified: false,
        verification_status: "pending",
        is_online: false,
        prefer_night: true,
        prefer_heavy: true,
        prefer_village_routes: true,
        notes: noteLine,
        country_code,
        home_city: homeCity,
        code_of_conduct_accepted_at: now,
        docs_submitted_at: now,
        vehicle_make,
        vehicle_model,
        vehicle_color,
        vehicle_registration,
        kyc_id_number: saId,
      });
      driverId = created.id;
    } else {
      await admin
        .from("rr_drivers")
        .update({
          full_name,
          vehicle_type,
          notes: noteLine,
          country_code,
          home_city: normalizeHomeCity(area),
          code_of_conduct_accepted_at: now,
          docs_submitted_at: now,
          verification_status: "pending",
          id_verified: false,
          approval_status: "approved",
          vehicle_make,
          vehicle_model,
          vehicle_color,
          vehicle_registration,
          kyc_id_number: saId,
        })
        .eq("id", driverId);
    }

    try {
      const id_doc_url = await uploadDriverDoc(driverId, "id", idFile);
      const selfie_url = await uploadDriverDoc(driverId, "selfie", selfieFile);
      const vehicle_front_url = await uploadDriverDoc(
        driverId,
        "vehicle_front",
        vehicleFront,
      );
      const vehicle_side_url = await uploadDriverDoc(
        driverId,
        "vehicle_side",
        vehicleSide,
      );

      const { error: patchErr } = await admin
        .from("rr_drivers")
        .update({
          id_doc_url,
          selfie_url,
          vehicle_front_url,
          vehicle_side_url,
          docs_submitted_at: now,
          verification_status: "pending",
        })
        .eq("id", driverId);

      if (patchErr) {
        // Photos uploaded; column update may fail if TRUST_SAFETY not run
        if (/column|schema cache|could not find/i.test(patchErr.message)) {
          await admin
            .from("rr_drivers")
            .update({
              id_doc_url,
              notes: `${noteLine} · docs: id=${id_doc_url}`,
            })
            .eq("id", driverId);
        } else {
          throw new Error(patchErr.message);
        }
      }

      return { ok: true, driverId };
    } catch (err) {
      // Keep the driver row so they can retry / ops can see the attempt
      const message =
        err instanceof Error ? err.message : "Photo upload failed.";
      return { ok: false, error: message };
    }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Application failed. Please try again.";
    // Never leak Next digest boilerplate as the only clue
    if (/digest|omitted in production|Server Components render/i.test(message)) {
      return {
        ok: false,
        error:
          "Server could not save your application. Run supabase/DRIVER_APPLY_READY.sql in Supabase, then try again.",
      };
    }
    return { ok: false, error: message };
  }
}
