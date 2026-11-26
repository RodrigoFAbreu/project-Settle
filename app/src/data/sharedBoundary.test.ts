// @vitest-environment node
/**
 * The shared/ purity guard (ss-03): every import in `shared/src/` is a
 * relative path to an existing file inside `shared/src/`. No `app/` file, no
 * `../` that leaves the folder and no npm package, so the later `server/` can
 * import the folder without `app/`. `tsc -p ../shared` covers DOM globals;
 * this covers imports.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const SHARED_SRC = path.resolve(import.meta.dirname, '../../../shared/src')

function sources(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    return entry.isDirectory()
      ? sources(full)
      : /\.tsx?$/.test(entry.name)
        ? [full]
        : []
  })
}

/** Module specifiers of static imports, re-exports and dynamic imports. */
function specifiers(text: string): string[] {
  const found: string[] = []
  for (const m of text.matchAll(
    /^\s*(?:import|export)\b[^;'"]*?\bfrom\s*['"]([^'"]+)['"]|^\s*import\s*['"]([^'"]+)['"]|\bimport\s*\(\s*['"]([^'"]+)['"]/gm,
  )) {
    const spec = m[1] ?? m[2] ?? m[3]
    if (spec !== undefined) found.push(spec)
  }
  return found
}

/** Why a file's import breaks the boundary, or `null` when it is fine. */
function violation(file: string, spec: string): string | null {
  if (!spec.startsWith('./') && !spec.startsWith('../')) {
    return `${spec} is not a relative path (a package or an alias)`
  }
  const target = path.resolve(path.dirname(file), spec)
  if (!target.startsWith(SHARED_SRC + path.sep)) {
    return `${spec} leaves shared/src/`
  }
  if (!existsSync(target)) return `${spec} names a file that does not exist`
  return null
}

describe('the shared/ boundary', () => {
  it('scans the shared sources', () => {
    expect(sources(SHARED_SRC).length).toBeGreaterThanOrEqual(5)
  })

  it('imports only relative files inside shared/src/', () => {
    const offenders = sources(SHARED_SRC).flatMap((file) =>
      specifiers(readFileSync(file, 'utf8'))
        .map((spec) => ({ spec, why: violation(file, spec) }))
        .filter((hit) => hit.why !== null)
        .map((hit) => `${path.relative(SHARED_SRC, file)}: ${hit.why}`),
    )
    expect(offenders).toEqual([])
  })

  it('refuses a package, an app path and a missing file', () => {
    const file = path.join(SHARED_SRC, 'money.ts')
    expect(violation(file, 'react')).not.toBeNull()
    expect(violation(file, '../../app/src/i18n/index.ts')).not.toBeNull()
    expect(violation(file, './missing.ts')).not.toBeNull()
    expect(violation(file, './bill.ts')).toBeNull()
  })
})
