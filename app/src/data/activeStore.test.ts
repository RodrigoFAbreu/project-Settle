// @vitest-environment node
/**
 * The active store (ss-02): the default is the IndexedDB store, and two
 * stores for one database see the same data.
 */
import { describe, expect, it } from 'vitest'
import { fourMembers, freshDb, household } from '../test/households.ts'
import { activeStore } from './activeStore.ts'

describe('activeStore', () => {
  it('is backed by the IndexedDB database it is given', async () => {
    const db = await freshDb()
    await activeStore(db).createHousehold(household(), fourMembers())
    const stored = await new Promise<unknown>((resolve, reject) => {
      const request = db
        .transaction('households', 'readonly')
        .objectStore('households')
        .get('h1')
      request.onsuccess = () => {
        resolve(request.result)
      }
      request.onerror = () => {
        reject(request.error ?? new Error('read failed'))
      }
    })
    expect(stored).toBeDefined()
  })

  it('agrees across two calls for one database', async () => {
    const db = await freshDb()
    await activeStore(db).createHousehold(household(), fourMembers())
    expect(await activeStore(db).getHousehold('h1')).toEqual(household())
    expect((await activeStore(db).listMembers('h1')).items).toHaveLength(4)
  })
})
