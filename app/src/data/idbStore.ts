/**
 * The browser's {@link LedgerStore}: a thin binding of `repository.ts`'s
 * functions to one opened database. No logic lives here.
 */
import type { LedgerStore } from './ledgerStore.ts'
import * as repository from './repository.ts'

export function createIdbStore(db: IDBDatabase): LedgerStore {
  return {
    listHouseholds: () => repository.listHouseholds(db),
    getHousehold: (id) => repository.getHousehold(db, id),
    createHousehold: (household, members) =>
      repository.createHousehold(db, household, members),
    renameHousehold: (id, name, now) =>
      repository.renameHousehold(db, id, name, now),
    setHouseholdArchived: (id, archivedAt, now) =>
      repository.setHouseholdArchived(db, id, archivedAt, now),
    listMembers: (householdId) => repository.listMembers(db, householdId),
    addMember: (member) => repository.addMember(db, member),
    renameMember: (householdId, memberId, name) =>
      repository.renameMember(db, householdId, memberId, name),
    setMemberLeft: (householdId, memberId, leftOn) =>
      repository.setMemberLeft(db, householdId, memberId, leftOn),
    deleteMember: (householdId, memberId) =>
      repository.deleteMember(db, householdId, memberId),
    listExpenses: (householdId) => repository.listExpenses(db, householdId),
    getExpense: (id) => repository.getExpense(db, id),
    saveExpense: (expense, newMembers, options) =>
      repository.saveExpense(db, expense, newMembers, options),
    deleteExpense: (id) => repository.deleteExpense(db, id),
    expensesWithReceiptKey: (householdId, receiptKey) =>
      repository.expensesWithReceiptKey(db, householdId, receiptKey),
    listSettlements: (householdId) =>
      repository.listSettlements(db, householdId),
    getSettlement: (id) => repository.getSettlement(db, id),
    saveSettlement: (settlement, options) =>
      repository.saveSettlement(db, settlement, options),
    deleteSettlement: (id) => repository.deleteSettlement(db, id),
  }
}
