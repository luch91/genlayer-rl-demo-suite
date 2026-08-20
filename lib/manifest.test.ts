import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { DOMAIN_IDS, ManifestSchema } from "./manifest";

const dataDir = join(process.cwd(), "public", "data");

function readFixture(id: string): unknown {
  return JSON.parse(readFileSync(join(dataDir, `${id}.json`), "utf-8"));
}

describe("fixtures validate against the manifest schema", () => {
  for (const id of DOMAIN_IDS) {
    it(`${id}.json is a valid manifest`, () => {
      const parsed = ManifestSchema.safeParse(readFixture(id));
      if (!parsed.success) {
        throw new Error(
          `${id}: ${parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}`,
        );
      }
      expect(parsed.data.domain.id).toBe(id);
      // Every fixture is seeded with real data: contract address, a learning
      // curve, and at least one run.
      expect(parsed.data.contract.address).toMatch(/^0x[0-9a-fA-F]{40}$/);
      expect(parsed.data.learning.episodes.length).toBeGreaterThan(100);
      expect(parsed.data.runs.length).toBeGreaterThan(0);
    });
  }

  it("rejects a corrupted manifest with a field-named error", () => {
    const bad = readFixture("crisis") as Record<string, unknown>;
    (bad.contract as Record<string, unknown>).address = 123; // wrong type
    const parsed = ManifestSchema.safeParse(bad);
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues[0].path.join(".")).toContain("contract.address");
    }
  });

  it("keeps the verified crisis receipt distinct from the mock replay", () => {
    const parsed = ManifestSchema.parse(readFixture("crisis"));
    const live = parsed.runs.find((run) => run.mode === "live");
    expect(live?.episodes[0]?.steps[0]?.tx?.hash).toBe(
      "0xa0e7c9799b29fa1ea51be5e52846eaf80dd9ffa1663d7f465e49ece48a9be5c6",
    );
    expect(live?.episodes[0]?.steps[0]?.reward).toBe(0);
    expect(parsed.runs.find((run) => run.mode === "mock")?.label).toContain(
      "no live receipts",
    );
  });
});
