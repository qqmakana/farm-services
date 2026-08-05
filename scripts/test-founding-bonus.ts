/**
 * Quick Founding Driver Bonus Pool logic check (mock store).
 * Run: npx tsx scripts/test-founding-bonus.ts
 */
import { mockRepo } from "../src/lib/mock-store";
import {
  FOUNDING_ERA_CUTOFF_ISO,
  isWithinFoundingEra,
  monthYearKey,
  randsToCents,
} from "../src/lib/founding-driver";

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg);
}

async function main() {
  assert(isWithinFoundingEra(), `Expected within founding era (cutoff ${FOUNDING_ERA_CUTOFF_ISO})`);

  const driver = mockRepo.listDrivers().find((d) => d.id === "d1");
  assert(driver, "seed driver d1 missing");
  assert(driver!.home_city === "Johannesburg", "d1 should be Johannesburg");

  // Reset founding flags for clean run
  driver!.is_founding_driver = false;
  driver!.founding_era_qualified_at = null;
  driver!.accumulated_bonus_balance = 0;

  const month = monthYearKey();
  const feeCents = randsToCents(5); // R5 platform fee → 500 cents

  // Simulate first completed trip qualification + accrue
  mockRepo.processFoundingBonusOnComplete(driver!.id, feeCents, month);
  assert(driver!.is_founding_driver === true, "should qualify as founding driver");
  assert(driver!.founding_era_qualified_at, "should set founding_era_qualified_at");

  const board = mockRepo.listCityBonusBoard(month);
  const jhb = board.find((r) => r.city === "Johannesburg");
  assert(jhb, "Johannesburg board row missing");
  assert(
    (jhb!.total_gross_revenue_cents ?? 0) >= feeCents,
    `expected accrued fees >= ${feeCents}, got ${jhb!.total_gross_revenue_cents}`,
  );

  // Second accrue
  mockRepo.processFoundingBonusOnComplete(driver!.id, feeCents, month);
  const board2 = mockRepo.listCityBonusBoard(month);
  const jhb2 = board2.find((r) => r.city === "Johannesburg")!;
  assert(
    jhb2.total_gross_revenue_cents >= feeCents * 2,
    "fees should accumulate",
  );

  const before = Number(driver!.accumulated_bonus_balance ?? 0);
  const dist = mockRepo.distributeCityBonus("Johannesburg", month);
  assert(dist.bonus_pool_cents === Math.floor((jhb2.total_gross_revenue_cents * 2) / 100), "2% pool");
  assert(dist.founding_driver_count >= 1, "at least one founding driver");
  assert(
    Number(driver!.accumulated_bonus_balance ?? 0) === before + dist.bonus_each_cents,
    "bonus credited to driver",
  );

  let threw = false;
  try {
    mockRepo.distributeCityBonus("Johannesburg", month);
  } catch {
    threw = true;
  }
  assert(threw, "second distribute should fail (already distributed)");

  console.log("OK founding bonus logic", {
    city: dist.city,
    pool_cents: dist.bonus_pool_cents,
    each_cents: dist.bonus_each_cents,
    drivers: dist.founding_driver_count,
    driver_balance_cents: driver!.accumulated_bonus_balance,
  });
}

main().catch((e) => {
  console.error("FAIL", e);
  process.exit(1);
});
