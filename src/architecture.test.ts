import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { describe, expect, it } from "vitest";

const SRC = join(process.cwd(), "src");

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

const files = walk(SRC).filter((f) => /\.(ts|tsx)$/.test(f));
const rel = (f: string): string => relative(SRC, f).split(sep).join("/");
const isTest = (f: string): boolean => /\.test\.tsx?$/.test(f) || rel(f).startsWith("test/");
const source = files.filter((f) => !isTest(f));
const read = (f: string): string => readFileSync(f, "utf8");

describe("architecture rules", () => {
  it("only the storage adapter touches localStorage", () => {
    const offenders = source
      .filter((f) => rel(f) !== "lib/api/mock/storage.ts")
      .filter((f) => /localStorage|sessionStorage/.test(read(f)))
      .map(rel);
    expect(offenders).toEqual([]);
  });

  it("UI code only reaches the API through @/lib/api, never the mock", () => {
    const offenders = source
      .filter((f) => /^(components|app|hooks)\//.test(rel(f)))
      .filter((f) => /@\/lib\/api\/mock|\.\.\/.*api\/mock/.test(read(f)))
      .map(rel);
    expect(offenders).toEqual([]);
  });

  it("lib code outside api/mock does not depend on the mock", () => {
    const offenders = source
      .filter((f) => rel(f).startsWith("lib/") && !rel(f).startsWith("lib/api/mock/"))
      .filter((f) => /api\/mock/.test(read(f)) && rel(f) !== "lib/api/index.ts")
      .map(rel);
    expect(offenders).toEqual([]);
  });

  it("has no explicit any", () => {
    const offenders = files
      .filter((f) => rel(f) !== "architecture.test.ts")
      .filter((f) => /:\s*any\b|\bas any\b|<any>|any\[\]/.test(read(f)))
      .map(rel);
    expect(offenders).toEqual([]);
  });

  it("keeps every file under 400 lines", () => {
    const long = files.filter((f) => read(f).split("\n").length >= 400).map(rel);
    expect(long).toEqual([]);
  });

  it("has no console output in source", () => {
    const offenders = source.filter((f) => /console\.(log|warn|error|info)/.test(read(f))).map(rel);
    expect(offenders).toEqual([]);
  });

  it("keeps Vietnamese user-facing text in the i18n dictionary", () => {
    const vietnamese = /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i;
    const offenders = source
      .filter((f) => !rel(f).startsWith("i18n/"))
      .filter((f) => rel(f) !== "lib/survey/abuse.ts") // pattern comments/regexes only
      .filter((f) => vietnamese.test(read(f)))
      .map(rel);
    expect(offenders).toEqual([]);
  });
});
