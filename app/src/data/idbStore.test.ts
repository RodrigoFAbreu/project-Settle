// @vitest-environment node
/**
 * The IndexedDB store, driven through the `LedgerStore` interface only
 * (ss-02): the interface is enough for every household, member, expense and
 * payment action, and its typed errors are the classes `repository.ts`
 * re-exports.
 */
import { describe, expect, it } from 'vitest'
import {
  equalSplit,
  fourMembers,
  freshDb,
  household,
  member,
  quickExpense,
  settlement,
} from '../test/households.ts'
import { cents } from '../../../shared/src/money.ts'
import { createIdbStore } from './idbStore.ts'
import * as ledger from './ledgerStore.ts'
import * as repository from './repository.ts'
import type { LedgerStore } from './ledgerStore.ts'

async function seeded(): Promise<LedgerStore> {
  const store = createIdbStore(await freshDb())
  await store.createHousehold(household(), fourMembers())
  return store
}

describe('createIdbStore', () => {
  it('creates, reads, renames, archives and restores a household', async () => {
    const store = await seeded()
    expect((await store.listHouseholds()).items).toEqual([household()])
    expect(await store.getHousehold('h1')).toEqual(household())
    expect(await store.getHousehold('nope')).toBeNull()

    const renamed = await store.renameHousehold('h1', 'Casa', '2026-11-01')
    expect(renamed.name).toBe('Casa')
    const archived = await store.setHouseholdArchived(
      'h1',
      '2026-11-02',
      '2026-11-02',
    )
    expect(archived.archivedAt).toBe('2026-11-02')
    const restored = await store.setHouseholdArchived('h1', null, '2026-11-03')
    expect(restored.archivedAt).toBeUndefined()
  })

  it('adds, renames and marks members, and deletes an unused one', async () => {
    const store = await seeded()
    const added = await store.addMember({
      ...member('rui', 'Rui', 0),
    })
    expect(added.position).toBe(4)
    expect((await store.listMembers('h1')).items).toHaveLength(5)

    expect((await store.renameMember('h1', 'rui', 'Rui P.')).name).toBe(
      'Rui P.',
    )
    const left = await store.setMemberLeft('h1', 'rui', '2026-12-01')
    expect(left.leftOn).toBe('2026-12-01')
    expect((await store.setMemberLeft('h1', 'rui', null)).leftOn).toBe(
      undefined,
    )

    await store.deleteMember('h1', 'rui')
    expect((await store.listMembers('h1')).items).toHaveLength(4)
  })

  it('saves, reads, replaces, finds by receipt key and deletes an expense', async () => {
    const store = await seeded()
    const split = equalSplit(1000, ['ana', 'marta'])
    const expense = quickExpense('e1', split, { receiptKey: 'rk-1' })
    await store.saveExpense(expense)
    expect(await store.getExpense('e1')).toEqual(expense)
    expect((await store.listExpenses('h1')).items).toEqual([expense])
    expect(await store.expensesWithReceiptKey('h1', 'rk-1')).toEqual([expense])
    expect(await store.expensesWithReceiptKey('h1', 'other')).toEqual([])

    const edited = { ...expense, description: 'Edited' }
    await store.saveExpense(edited, [], { replacing: true })
    expect((await store.getExpense('e1'))?.description).toBe('Edited')

    await store.deleteExpense('e1')
    expect(await store.getExpense('e1')).toBeNull()
  })

  it('saves, reads, replaces and deletes a payment', async () => {
    const store = await seeded()
    const payment = settlement('s1', 'tiago', 'ana', 500)
    await store.saveSettlement(payment)
    expect(await store.getSettlement('s1')).toEqual(payment)
    expect((await store.listSettlements('h1')).items).toEqual([payment])

    const edited = { ...payment, amount: cents(600) }
    await store.saveSettlement(edited, { replacing: true })
    expect((await store.getSettlement('s1'))?.amount).toBe(600)

    await store.deleteSettlement('s1')
    expect(await store.getSettlement('s1')).toBeNull()
  })

  it('throws the seam’s error classes, the ones repository.ts re-exports', async () => {
    const store = await seeded()
    await store.saveExpense(
      quickExpense('e1', equalSplit(1000, ['ana', 'tiago'])),
    )
    const inUse = await store
      .deleteMember('h1', 'tiago')
      .catch((error: unknown) => error)
    expect(inUse).toBeInstanceOf(ledger.MemberInUseError)
    expect(inUse).toBeInstanceOf(repository.MemberInUseError)

    await expect(
      store.renameHousehold('nope', 'x', 'now'),
    ).rejects.toBeInstanceOf(ledger.HouseholdNotFoundError)
    await expect(
      store.saveExpense(quickExpense('e2', equalSplit(100, ['ghost', 'ana']))),
    ).rejects.toBeInstanceOf(ledger.MissingReferenceError)
    expect(repository.MissingReferenceError).toBe(ledger.MissingReferenceError)
    expect(repository.HouseholdNotFoundError).toBe(
      ledger.HouseholdNotFoundError,
    )
  })
})
