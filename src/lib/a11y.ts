/**
 * Accessibility (a11y) Utilities
 * CA-049: Helpers for keyboard navigation, focus management, and screen readers
 */

import { useCallback, useEffect, useRef } from 'react'

// ============================================
// KEYBOARD NAVIGATION
// ============================================

export const KEYS = {
  ENTER: 'Enter',
  SPACE: ' ',
  ESCAPE: 'Escape',
  TAB: 'Tab',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  HOME: 'Home',
  END: 'End',
} as const

type KeyType = keyof typeof KEYS

/**
 * Check if a keyboard event matches specific keys
 */
export function isKey(event: KeyboardEvent | React.KeyboardEvent, ...keys: KeyType[]): boolean {
  return keys.some(key => event.key === KEYS[key])
}

/**
 * Handle keyboard navigation for lists/grids
 */
export function handleListKeyDown(
  event: KeyboardEvent | React.KeyboardEvent,
  options: {
    items: HTMLElement[]
    currentIndex: number
    onSelect?: (index: number) => void
    orientation?: 'vertical' | 'horizontal'
    loop?: boolean
  }
) {
  const { items, currentIndex, onSelect, orientation = 'vertical', loop = true } = options
  
  if (items.length === 0) return
  
  const upKey = orientation === 'vertical' ? KEYS.ARROW_UP : KEYS.ARROW_LEFT
  const downKey = orientation === 'vertical' ? KEYS.ARROW_DOWN : KEYS.ARROW_RIGHT
  
  let nextIndex = currentIndex
  
  if (event.key === upKey) {
    event.preventDefault()
    nextIndex = currentIndex - 1
    if (nextIndex < 0) nextIndex = loop ? items.length - 1 : 0
  } else if (event.key === downKey) {
    event.preventDefault()
    nextIndex = currentIndex + 1
    if (nextIndex >= items.length) nextIndex = loop ? 0 : items.length - 1
  } else if (event.key === KEYS.HOME) {
    event.preventDefault()
    nextIndex = 0
  } else if (event.key === KEYS.END) {
    event.preventDefault()
    nextIndex = items.length - 1
  } else if (event.key === KEYS.ENTER || event.key === KEYS.SPACE) {
    event.preventDefault()
    onSelect?.(currentIndex)
    return
  }
  
  if (nextIndex !== currentIndex && items[nextIndex]) {
    items[nextIndex].focus()
    onSelect?.(nextIndex)
  }
}

// ============================================
// FOCUS MANAGEMENT
// ============================================

/**
 * Get all focusable elements within a container
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ')
  
  return Array.from(container.querySelectorAll<HTMLElement>(focusableSelectors))
}

/**
 * Trap focus within a container (for modals, dialogs)
 */
export function trapFocus(container: HTMLElement) {
  const focusable = getFocusableElements(container)
  if (focusable.length === 0) return
  
  const first = focusable[0]
  const last = focusable[focusable.length - 1]
  
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Tab') return
    
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }
  
  container.addEventListener('keydown', handleKeyDown)
  first.focus()
  
  return () => {
    container.removeEventListener('keydown', handleKeyDown)
  }
}

/**
 * Hook: Focus trap for modals/dialogs
 */
export function useFocusTrap(enabled: boolean) {
  const containerRef = useRef<HTMLElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)
  
  useEffect(() => {
    if (!enabled || !containerRef.current) return
    
    // Store previous focus
    previousFocusRef.current = document.activeElement as HTMLElement
    
    // Trap focus
    const cleanup = trapFocus(containerRef.current)
    
    return () => {
      cleanup?.()
      // Restore focus
      previousFocusRef.current?.focus()
    }
  }, [enabled])
  
  return containerRef
}

/**
 * Hook: Manage roving tabindex for keyboard navigation
 */
export function useRovingTabindex<T extends HTMLElement>(
  items: T[],
  options?: { orientation?: 'vertical' | 'horizontal'; loop?: boolean }
) {
  const { orientation = 'vertical', loop = true } = options || {}
  const currentIndexRef = useRef(0)
  
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    handleListKeyDown(event, {
      items,
      currentIndex: currentIndexRef.current,
      onSelect: (index) => {
        currentIndexRef.current = index
      },
      orientation,
      loop,
    })
  }, [items, orientation, loop])
  
  useEffect(() => {
    const container = items[0]?.parentElement
    if (!container) return
    
    container.addEventListener('keydown', handleKeyDown)
    return () => container.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown, items])
  
  return {
    getTabIndex: (index: number) => index === currentIndexRef.current ? 0 : -1,
    setCurrentIndex: (index: number) => {
      currentIndexRef.current = index
    },
  }
}

// ============================================
// SCREEN READER ANNOUNCEMENTS
// ============================================

let liveRegion: HTMLElement | null = null

/**
 * Get or create the live region for announcements
 */
function getLiveRegion(): HTMLElement {
  if (liveRegion) return liveRegion
  
  liveRegion = document.createElement('div')
  liveRegion.setAttribute('role', 'status')
  liveRegion.setAttribute('aria-live', 'polite')
  liveRegion.setAttribute('aria-atomic', 'true')
  liveRegion.style.cssText = `
    position: absolute;
    width: 1px;
    height: 1px;
    margin: -1px;
    padding: 0;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  `
  document.body.appendChild(liveRegion)
  
  return liveRegion
}

/**
 * Announce a message to screen readers
 */
export function announce(
  message: string, 
  options?: { 
    priority?: 'polite' | 'assertive'
    clearAfter?: number
  }
) {
  const { priority = 'polite', clearAfter = 1000 } = options || {}
  const region = getLiveRegion()
  
  region.setAttribute('aria-live', priority)
  region.textContent = message
  
  // Clear after delay to allow repeated announcements
  setTimeout(() => {
    region.textContent = ''
  }, clearAfter)
}

/**
 * Hook: Announce on state change
 */
export function useAnnounce() {
  return useCallback((message: string, priority?: 'polite' | 'assertive') => {
    announce(message, { priority })
  }, [])
}

// ============================================
// ACCESSIBLE DESCRIPTIONS
// ============================================

/**
 * Generate unique IDs for aria-describedby relationships
 */
let idCounter = 0
export function generateId(prefix = 'a11y'): string {
  return `${prefix}-${++idCounter}`
}

/**
 * Create aria props for an element with description
 */
export function createDescribedBy(id: string, description: string) {
  return {
    'aria-describedby': id,
    descriptionId: id,
    description,
  }
}

// ============================================
// REDUCED MOTION
// ============================================

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Hook: Subscribe to reduced motion preference changes
 */
export function useReducedMotion(): boolean {
  const [reducedMotion, setReducedMotion] = useState(prefersReducedMotion())
  
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    
    const handler = (event: MediaQueryListEvent) => {
      setReducedMotion(event.matches)
    }
    
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])
  
  return reducedMotion
}

// Fix: Import useState
import { useState } from 'react'

// ============================================
// SKIP LINKS
// ============================================

/**
 * Skip link component for keyboard users
 */
export function getSkipLinkProps(targetId: string, label = 'Skip to main content') {
  return {
    href: `#${targetId}`,
    className: 'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-white focus:shadow-lg focus:rounded-md',
    children: label,
  }
}

// ============================================
// COLOR CONTRAST
// ============================================

/**
 * Check if color contrast meets WCAG requirements
 */
export function getContrastRatio(foreground: string, background: string): number {
  const getLuminance = (color: string): number => {
    // Parse hex color
    const hex = color.replace('#', '')
    const r = parseInt(hex.substr(0, 2), 16) / 255
    const g = parseInt(hex.substr(2, 2), 16) / 255
    const b = parseInt(hex.substr(4, 2), 16) / 255
    
    const [rs, gs, bs] = [r, g, b].map(c => 
      c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    )
    
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
  }
  
  const l1 = getLuminance(foreground)
  const l2 = getLuminance(background)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  
  return (lighter + 0.05) / (darker + 0.05)
}

/**
 * Check WCAG compliance level
 */
export function meetsWCAG(
  foreground: string, 
  background: string, 
  options?: { level?: 'AA' | 'AAA'; largeText?: boolean }
): boolean {
  const { level = 'AA', largeText = false } = options || {}
  const ratio = getContrastRatio(foreground, background)
  
  const thresholds = {
    AA: largeText ? 3 : 4.5,
    AAA: largeText ? 4.5 : 7,
  }
  
  return ratio >= thresholds[level]
}
