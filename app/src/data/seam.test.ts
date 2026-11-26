// @vitest-environment node
/**
 * The store seam guard (ss-02): the pages reach the ledger through
 * `LedgerStore` only. Nothing outside `src/data/` imports `repository.ts`;
 * tests are exempt, since they seed a real database through it.
 */
import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const SRC = path.resolve(import.meta.dirname, '..')
const DATA = path.join(SRC, 'data') + path.sep

function sources(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    return entry.isDirectory()
      ? sources(full)
      : /\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name)
        ? [full]
        : []
  })
}

/** Module specifiers of static imports, re-exports and dynamic imports. */
function specifiers(text: string): string[] {
  const found: string[] = []
  for (const m of text.matchAll(
    /(?:\bfrom\s*|\bimport\s*\(?\s*)['"]([^'"]+)['"]/g,
  )) {
    if (m[1] !== undefined) found.push(m[1])
  }
  return found
}

describe('the store seam', () => {
  it('scans the app sources', () => {
    expect(sources(SRC).length).toBeGreaterThan(50)
  })

  it('keeps repository.ts behind src/data/', () => {
    const offenders = sources(SRC)
      .filter((file) => !file.startsWith(DATA))
      .filter((file) =>
        specifiers(readFileSync(file, 'utf8')).some((spec) =>
          /(^|\/)repository(\.ts)?$/.test(spec),
        ),
      )
      .map((file) => path.relative(SRC, file))
    expect(offenders).toEqual([])
  })
})
