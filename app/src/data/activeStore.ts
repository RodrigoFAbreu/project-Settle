/**
 * The one place the app gets its {@link LedgerStore} (ADR 0007, decision 8).
 * Today that is the browser's IndexedDB store; a later item may pick another
 * implementation here without touching the pages.
 */
import { createIdbStore } from './idbStore.ts'
import type { LedgerStore } from './ledgerStore.ts'

/** The store for an opened database. */
export function activeStore(db: IDBDatabase): LedgerStore {
  return createIdbStore(db)
}
