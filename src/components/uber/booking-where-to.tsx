"use client";

import { LandmarkField, type Loc } from "@/components/uber/landmark-field";
import { SavedPlacesChips } from "@/components/location/saved-places-chips";
import { WhereToBar } from "@/components/uber/where-to-bar";
import { PlanYourRideHeader } from "@/components/uber/plan-your-ride-header";

export function BookingWhereTo({
  pickup,
  dropoff,
  onPickup,
  onDropoff,
  pickupPlaceholder = "Current location",
  dropoffPlaceholder = "Where to?",
  whenMode,
  whenLabel,
  forMeLabel,
  onToggleWhen,
  onForMe,
}: {
  pickup: Loc;
  dropoff: Loc;
  onPickup: (loc: Loc) => void;
  onDropoff: (loc: Loc) => void;
  pickupPlaceholder?: string;
  dropoffPlaceholder?: string;
  whenMode?: "now" | "later";
  whenLabel?: string;
  forMeLabel?: string;
  onToggleWhen?: () => void;
  onForMe?: () => void;
}) {
  return (
    <div className="space-y-3">
      {whenMode ? (
        <PlanYourRideHeader
          whenMode={whenMode}
          whenLabel={whenLabel}
          forMeLabel={forMeLabel}
          onToggleWhen={onToggleWhen}
          onForMe={onForMe}
        />
      ) : null}
      <WhereToBar
        onSwap={() => {
          onPickup(dropoff);
          onDropoff(pickup);
        }}
        pickupSlot={
          <LandmarkField
            compact
            showSaved={false}
            showGps={false}
            label="Pickup"
            placeholder={pickupPlaceholder}
            loc={pickup}
            onChange={onPickup}
          />
        }
        dropoffSlot={
          <LandmarkField
            compact
            showSaved={false}
            showGps={false}
            label="Dropoff"
            placeholder={dropoffPlaceholder}
            loc={dropoff}
            onChange={onDropoff}
          />
        }
      />
      <SavedPlacesChips
        onSelect={(v) => {
          const loc: Loc = {
            landmark: v.label,
            lat: v.lat,
            lng: v.lng,
          };
          if (!pickup.landmark.trim() || pickup.lat == null) onPickup(loc);
          else onDropoff(loc);
        }}
      />
    </div>
  );
}
