/**
 * The ledger store seam (ADR 0007, decision 8): the one interface the app
 * talks to, whatever holds the data. Each method is the matching
 * `repository.ts` function without its leading database argument, so a
 * second implementation (a server) needs no IndexedDB in its callers.
 *
 * The shared types and typed errors live here because every implementation
 * must throw the same classes; `repository.ts` re-exports them.
 */
import type {
  Expense,
  Household,
  Member,
  Settlement,
} from '../../../shared/src/household.ts'

/** Records that read, and how many didn't (kept, never deleted, H1). */
export interface Listed<T> {
  items: T[]
  unreadable: number
}

/** The household doesn't exist (or can't be read). */
export class HouseholdNotFoundError extends Error {}

/** The member doesn't exist in this household (or can't be read). */
export class MemberNotFoundError extends Error {}

/**
 * An expense names a member that isn't in its household any more,
 * typically deleted in another tab (M-I-3). Nothing was written.
 */
export class MissingReferenceError extends Error {
  readonly memberIds: readonly string[]
  constructor(memberIds: readonly string[]) {
    super(memberIds.join(', '))
    this.memberIds = memberIds
  }
}

/**
 * A member delete refused (H7, M-I-4): an expense or a payment names the
 * member, or one that can't be read might (M5, B3). Nothing was written.
 */
export class MemberInUseError extends Error {
  readonly reason: 'referenced' | 'unreadable'
  constructor(reason: 'referenced' | 'unreadable') {
    super(reason)
    this.reason = reason
  }
}

/** An edit's expense is gone, typically deleted in another tab. */
export class ExpenseNotFoundError extends Error {}

/** An edit's payment is gone, typically deleted in another tab (M5, B3). */
export class SettlementNotFoundError extends Error {}

/** Too many members: 20 active on any one day, 50 in all (H4). */
export class MemberLimitError extends Error {}

export interface LedgerStore {
  // Households
  listHouseholds(): Promise<Listed<Household>>
  getHousehold(id: string): Promise<Household | null>
  /** A new household with its first members, in one transaction. */
  createHousehold(
    household: Household,
    members: readonly Member[],
  ): Promise<void>
  renameHousehold(id: string, name: string, now: string): Promise<Household>
  /** Archives (or, with `null`, restores) a household. */
  setHouseholdArchived(
    id: string,
    archivedAt: string | null,
    now: string,
  ): Promise<Household>

  // Members
  listMembers(householdId: string): Promise<Listed<Member>>
  /** Adds a member after the household's last position, within the limits. */
  addMember(member: Omit<Member, 'position'>): Promise<Member>
  renameMember(
    householdId: string,
    memberId: string,
    name: string,
  ): Promise<Member>
  /** Marks a member as left on a date, or (with `null`) undoes it. */
  setMemberLeft(
    householdId: string,
    memberId: string,
    leftOn: string | null,
  ): Promise<Member>
  /** Deletes a member only when nothing names them ({@link MemberInUseError}). */
  deleteMember(householdId: string, memberId: string): Promise<void>

  // Expenses
  listExpenses(householdId: string): Promise<Listed<Expense>>
  getExpense(id: string): Promise<Expense | null>
  /** Saves an expense with any members the save dialog added. */
  saveExpense(
    expense: Expense,
    newMembers?: readonly Omit<Member, 'position'>[],
    options?: { replacing?: boolean },
  ): Promise<Member[]>
  deleteExpense(id: string): Promise<void>
  /** The household's readable expenses with this receipt key. */
  expensesWithReceiptKey(
    householdId: string,
    receiptKey: string,
  ): Promise<Expense[]>

  // Payments
  listSettlements(householdId: string): Promise<Listed<Settlement>>
  getSettlement(id: string): Promise<Settlement | null>
  saveSettlement(
    settlement: Settlement,
    options?: { replacing?: boolean },
  ): Promise<void>
  deleteSettlement(id: string): Promise<void>
}
