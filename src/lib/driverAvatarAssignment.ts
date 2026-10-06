import type { Prisma, PrismaClient } from "@prisma/client";
import { DRIVER_COLOR_KEYS, type DriverColorKey } from "@/lib/driver-colors";

type Queryable = PrismaClient | Prisma.TransactionClient;

// Least-used color among the carrier's existing drivers, ties broken by
// palette order — the rule for both new-driver creation and backfilling
// drivers that predate this column.
export async function leastUsedDriverColor(db: Queryable, carrierId: string): Promise<DriverColorKey> {
  const counts = await db.driver.groupBy({
    by: ["avatarColor"],
    where: { carrierId, avatarColor: { not: null } },
    _count: { avatarColor: true },
  });
  const countByColor = new Map(counts.map((c) => [c.avatarColor as DriverColorKey, c._count.avatarColor]));
  let best: DriverColorKey = DRIVER_COLOR_KEYS[0];
  let bestCount = Infinity;
  for (const key of DRIVER_COLOR_KEYS) {
    const count = countByColor.get(key) ?? 0;
    if (count < bestCount) {
      best = key;
      bestCount = count;
    }
  }
  return best;
}
