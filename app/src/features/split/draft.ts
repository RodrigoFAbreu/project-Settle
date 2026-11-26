/**
 * The saved draft (D11): the bill being edited, kept in `localStorage` so a
 * refresh doesn't lose it. One draft, no history. It's scratch data, so
 * anything that can't be trusted is dropped for a fresh bill.
 */
import { validateBill, type Bill } from '../../../../shared/src/bill.ts'
import {
  DRAFT_VERSION,
  isObject,
  readBill,
} from '../../../../shared/src/draft.ts'

export const DRAFT_STORAGE_KEY = 'settle.bill'

type Json = unknown

/**
 * The saved bill, or `null` for "start a fresh bill": nothing saved, an
 * unknown version, a bad shape, bad references (unknown or duplicate ids,
 * a person assigned twice, a payer who isn't a person: the reducer relies
 * on stable, unique ids), or storage that can't be read. Out-of-range
 * values load as they are: `validateBill` reports them in the editor.
 */
export function loadDraft(): Bill | null {
  try {
    const stored = window.localStorage.getItem(DRAFT_STORAGE_KEY)
    if (stored === null) {
      return null
    }
    const draft: Json = JSON.parse(stored)
    if (!isObject(draft) || draft.version !== DRAFT_VERSION) {
      return null
    }
    const bill = readBill(draft.bill)
    if (
      !bill ||
      validateBill(bill).some((error) => error.code === 'invalidReference')
    ) {
      return null
    }
    return bill
  } catch {
    return null
  }
}

/**
 * Saves the bill, replacing any earlier draft ("New bill" saves the fresh
 * bill over it). A storage error is ignored: the bill stays in memory.
 */
export function saveDraft(bill: Bill): void {
  try {
    window.localStorage.setItem(
      DRAFT_STORAGE_KEY,
      JSON.stringify({ version: DRAFT_VERSION, bill }),
    )
  } catch {
    // Storage is full, disabled or blocked.
  }
}
