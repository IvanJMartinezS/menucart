import { normalizeName, type ShoppingCategory } from '@menucart/shared'
import { useState } from 'react'

/**
 * Identifies an item of the list across visits: its section, its name without capital letters or
 * accents, and its unit. So a check stays in place even when the quantity changes.
 */
export const itemKey = (category: ShoppingCategory, name: string, unit: string | null) =>
  `${category}:${normalizeName(name)}:${unit ?? ''}`

const storageKey = (planId: string) => `menucart.shopping-list.${planId}`

/** Browser storage can be missing or full (private mode): the list then works without memory. */
function readChecked(planId: string): Set<string> {
  try {
    const saved = localStorage.getItem(storageKey(planId))
    return new Set(saved ? (JSON.parse(saved) as string[]) : [])
  } catch {
    return new Set()
  }
}

function saveChecked(planId: string, checked: Set<string>) {
  try {
    localStorage.setItem(storageKey(planId), JSON.stringify([...checked]))
  } catch {
    // Nothing to do: the checks still work until the page is closed.
  }
}

/**
 * Items checked while shopping, saved on this device, one list per plan.
 * They are not shared between phones yet: that comes with syncing them through the API.
 */
export function useCheckedItems(planId: string) {
  const [checked, setChecked] = useState(() => readChecked(planId))

  const update = (next: Set<string>) => {
    setChecked(next)
    saveChecked(planId, next)
  }

  return {
    isChecked: (key: string) => checked.has(key),
    toggle: (key: string) => {
      const next = new Set(checked)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      update(next)
    },
    clear: () => update(new Set()),
    /** How many of the given keys are checked (old keys of removed items are ignored). */
    countChecked: (keys: string[]) => keys.filter((key) => checked.has(key)).length,
  }
}
