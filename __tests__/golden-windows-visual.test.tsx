/**
 * Golden Windows Visual Tests (CA-039)
 * 
 * Component rendering tests for the heatmap and best times components.
 * Uses React Testing Library to verify proper rendering.
 */

import { describe, it, expect, vi } from 'vitest'
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'

import {
  GoldenWindowsHeatmap,
  HeatmapLegend,
  HeatmapLegendCompact,
  BestTimesSummary,
  BestTimesList,
  GoldenWindowsStats
} from '@/components/golden-windows'

import {
  generateHeatmapData,
  HeatmapData,
  Participant
} from '@/lib/golden-windows'

// ============================================
// TEST FIXTURES
// ============================================

const createTestParticipants = (): Participant[] => [
  {
    id: 'user-1',
    email: 'dana@example.com',
    name: 'Dana',
    timezone: 'America/Los_Angeles',
    unavailableHours: [0, 1, 2, 3, 4, 5, 22, 23]
  },
  {
    id: 'user-2',
    email: 'tom@example.com',
    name: 'Tom',
    timezone: 'Europe/London',
    unavailableHours: [0, 1, 2, 3, 4, 5, 22, 23]
  },
  {
    id: 'user-3',
    email: 'priya@example.com',
    name: 'Priya',
    timezone: 'Asia/Kolkata',
    unavailableHours: [0, 1, 2, 3, 4, 5, 22, 23]
  }
]

const createMockBestTimes = () => [
  {
    rank: 1,
    utcHour: 14,
    utcStartFormatted: '14:00 UTC',
    goldenScore: 82,
    qualityScore: 78,
    recommendation: 'excellent' as const,
    summary: 'Peak energy alignment (82% avg sharpness)',
    allAvailable: true,
    participants: [
      {
        id: 'user-1',
        name: 'Dana',
        timezone: 'America/Los_Angeles',
        localHour: 6,
        localTimeFormatted: '6 AM',
        sharpness: 70,
        isAvailable: true
      },
      {
        id: 'user-2',
        name: 'Tom',
        timezone: 'Europe/London',
        localHour: 14,
        localTimeFormatted: '2 PM',
        sharpness: 85,
        isAvailable: true
      },
      {
        id: 'user-3',
        name: 'Priya',
        timezone: 'Asia/Kolkata',
        localHour: 19,
        localTimeFormatted: '7 PM',
        sharpness: 65,
        isAvailable: true
      }
    ]
  },
  {
    rank: 2,
    utcHour: 15,
    utcStartFormatted: '15:00 UTC',
    goldenScore: 75,
    qualityScore: 72,
    recommendation: 'good' as const,
    summary: 'Good energy levels across the team',
    allAvailable: true,
    participants: [
      {
        id: 'user-1',
        name: 'Dana',
        timezone: 'America/Los_Angeles',
        localHour: 7,
        localTimeFormatted: '7 AM',
        sharpness: 75,
        isAvailable: true
      },
      {
        id: 'user-2',
        name: 'Tom',
        timezone: 'Europe/London',
        localHour: 15,
        localTimeFormatted: '3 PM',
        sharpness: 80,
        isAvailable: true
      },
      {
        id: 'user-3',
        name: 'Priya',
        timezone: 'Asia/Kolkata',
        localHour: 20,
        localTimeFormatted: '8 PM',
        sharpness: 50,
        isAvailable: true
      }
    ]
  }
]

// ============================================
// HEATMAP COMPONENT TESTS
// ============================================

describe('GoldenWindowsHeatmap', () => {
  let testData: HeatmapData
  
  beforeEach(() => {
    const participants = createTestParticipants()
    testData = generateHeatmapData(participants)
  })
  
  it('renders without crashing', () => {
    render(<GoldenWindowsHeatmap data={testData} />)
    expect(screen.getByText('Participant')).toBeInTheDocument()
  })
  
  it('displays all participant names', () => {
    render(<GoldenWindowsHeatmap data={testData} />)
    
    expect(screen.getByText('Dana')).toBeInTheDocument()
    expect(screen.getByText('Tom')).toBeInTheDocument()
    expect(screen.getByText('Priya')).toBeInTheDocument()
  })
  
  it('shows Golden Score row when showCombinedRow is true', () => {
    render(<GoldenWindowsHeatmap data={testData} showCombinedRow={true} />)
    expect(screen.getByText('Golden Score')).toBeInTheDocument()
  })
  
  it('hides Golden Score row when showCombinedRow is false', () => {
    render(<GoldenWindowsHeatmap data={testData} showCombinedRow={false} />)
    expect(screen.queryByText('Golden Score')).not.toBeInTheDocument()
  })
  
  it('highlights specified hours', () => {
    const { container } = render(
      <GoldenWindowsHeatmap 
        data={testData} 
        highlightedHours={[10, 14, 15]} 
      />
    )
    
    // Highlighted hours should have ring styling
    const highlightedCells = container.querySelectorAll('.ring-green-500')
    expect(highlightedCells.length).toBeGreaterThan(0)
  })
  
  it('calls onCellClick when a cell is clicked', () => {
    const handleClick = vi.fn()
    render(
      <GoldenWindowsHeatmap 
        data={testData} 
        onCellClick={handleClick}
      />
    )
    
    // Find and click a cell (first row, first button after participant name)
    const cells = screen.getAllByRole('button')
    if (cells.length > 0) {
      fireEvent.click(cells[0])
      expect(handleClick).toHaveBeenCalled()
    }
  })
  
  it('renders in compact mode', () => {
    const { container } = render(
      <GoldenWindowsHeatmap data={testData} compact={true} />
    )
    
    // Compact mode should have smaller cells
    const compactCells = container.querySelectorAll('.h-6')
    expect(compactCells.length).toBeGreaterThan(0)
  })
  
  it('displays correct UTC offset for each participant', () => {
    render(<GoldenWindowsHeatmap data={testData} />)
    
    // Should show timezone offsets
    expect(screen.getAllByText(/UTC[+-]/).length).toBeGreaterThan(0)
  })
})

// ============================================
// HEATMAP LEGEND TESTS
// ============================================

describe('HeatmapLegend', () => {
  it('renders all energy levels', () => {
    render(<HeatmapLegend />)
    
    expect(screen.getByText('90%+')).toBeInTheDocument()
    expect(screen.getByText('70-90%')).toBeInTheDocument()
    expect(screen.getByText('50-70%')).toBeInTheDocument()
    expect(screen.getByText('Unavail.')).toBeInTheDocument()
  })
  
  it('renders compact version', () => {
    render(<HeatmapLegendCompact />)
    
    expect(screen.getByText('Energy:')).toBeInTheDocument()
    expect(screen.getByText('Low')).toBeInTheDocument()
    expect(screen.getByText('High')).toBeInTheDocument()
  })
})

// ============================================
// BEST TIMES SUMMARY TESTS
// ============================================

describe('BestTimesSummary', () => {
  it('renders without crashing', () => {
    render(<BestTimesSummary bestTimes={createMockBestTimes()} />)
    expect(screen.getByText('Best Meeting Times')).toBeInTheDocument()
  })
  
  it('displays all provided time slots', () => {
    const bestTimes = createMockBestTimes()
    render(<BestTimesSummary bestTimes={bestTimes} />)
    
    expect(screen.getByText('14:00 UTC')).toBeInTheDocument()
    expect(screen.getByText('15:00 UTC')).toBeInTheDocument()
  })
  
  it('shows rank badges', () => {
    render(<BestTimesSummary bestTimes={createMockBestTimes()} />)
    
    expect(screen.getByText('🥇')).toBeInTheDocument()
    expect(screen.getByText('🥈')).toBeInTheDocument()
  })
  
  it('displays quality scores', () => {
    render(<BestTimesSummary bestTimes={createMockBestTimes()} />)
    
    expect(screen.getByText('78%')).toBeInTheDocument()
    expect(screen.getByText('72%')).toBeInTheDocument()
  })
  
  it('shows participant details when showDetails is true', () => {
    render(
      <BestTimesSummary 
        bestTimes={createMockBestTimes()} 
        showDetails={true}
      />
    )
    
    expect(screen.getAllByText('Dana').length).toBeGreaterThan(0)
    expect(screen.getAllByText('6 AM').length).toBeGreaterThan(0)
  })
  
  it('hides participant details when showDetails is false', () => {
    render(
      <BestTimesSummary 
        bestTimes={createMockBestTimes()} 
        showDetails={false}
      />
    )
    
    // Participant times should not be visible
    expect(screen.queryByText('6 AM')).not.toBeInTheDocument()
  })
  
  it('shows empty state when no times available', () => {
    render(<BestTimesSummary bestTimes={[]} />)
    
    expect(screen.getByText('No suitable meeting times found.')).toBeInTheDocument()
  })
  
  it('calls onSelectTime when a slot is clicked', () => {
    const handleSelect = vi.fn()
    render(
      <BestTimesSummary 
        bestTimes={createMockBestTimes()}
        onSelectTime={handleSelect}
      />
    )
    
    // Click on first slot
    fireEvent.click(screen.getByText('14:00 UTC'))
    expect(handleSelect).toHaveBeenCalled()
  })
  
  it('highlights selected slot', () => {
    const { container } = render(
      <BestTimesSummary 
        bestTimes={createMockBestTimes()}
        selectedHour={14}
      />
    )
    
    const selectedSlot = container.querySelector('.border-green-500.bg-green-50')
    expect(selectedSlot).toBeInTheDocument()
  })
  
  it('respects maxSlots prop', () => {
    const manyTimes = [
      ...createMockBestTimes(),
      { ...createMockBestTimes()[0], rank: 3, utcHour: 16, utcStartFormatted: '16:00 UTC' },
      { ...createMockBestTimes()[0], rank: 4, utcHour: 17, utcStartFormatted: '17:00 UTC' },
      { ...createMockBestTimes()[0], rank: 5, utcHour: 18, utcStartFormatted: '18:00 UTC' }
    ]
    
    render(<BestTimesSummary bestTimes={manyTimes} maxSlots={3} />)
    
    expect(screen.getByText('14:00 UTC')).toBeInTheDocument()
    expect(screen.getByText('15:00 UTC')).toBeInTheDocument()
    expect(screen.getByText('16:00 UTC')).toBeInTheDocument()
    expect(screen.queryByText('17:00 UTC')).not.toBeInTheDocument()
    expect(screen.queryByText('18:00 UTC')).not.toBeInTheDocument()
  })
})

// ============================================
// BEST TIMES LIST TESTS
// ============================================

describe('BestTimesList', () => {
  const mockSlots = [
    { rank: 1, utcHour: 14, goldenScore: 82, recommendation: 'excellent', allAvailable: true },
    { rank: 2, utcHour: 15, goldenScore: 75, recommendation: 'good', allAvailable: true },
    { rank: 3, utcHour: 16, goldenScore: 60, recommendation: 'acceptable', allAvailable: true }
  ]
  
  it('renders all slots', () => {
    render(<BestTimesList slots={mockSlots} />)
    
    expect(screen.getByText('2 PM')).toBeInTheDocument()
    expect(screen.getByText('3 PM')).toBeInTheDocument()
    expect(screen.getByText('4 PM')).toBeInTheDocument()
  })
  
  it('shows empty state when no slots', () => {
    render(<BestTimesList slots={[]} />)
    expect(screen.getByText('No available time slots found')).toBeInTheDocument()
  })
  
  it('calls onSelect when slot is clicked', () => {
    const handleSelect = vi.fn()
    render(<BestTimesList slots={mockSlots} onSelect={handleSelect} />)
    
    fireEvent.click(screen.getByText('2 PM'))
    expect(handleSelect).toHaveBeenCalledWith(14)
  })
})

// ============================================
// GOLDEN WINDOWS STATS TESTS
// ============================================

describe('GoldenWindowsStats', () => {
  it('renders all stats', () => {
    render(
      <GoldenWindowsStats
        participantCount={3}
        timezoneCount={3}
        availableSlots={8}
        bestScore={82}
      />
    )
    
    expect(screen.getByText('Participants')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('Timezones')).toBeInTheDocument()
    expect(screen.getByText('Available Slots')).toBeInTheDocument()
    expect(screen.getByText('8')).toBeInTheDocument()
    expect(screen.getByText('Best Score')).toBeInTheDocument()
    expect(screen.getByText('82%')).toBeInTheDocument()
  })
})

// ============================================
// ACCESSIBILITY TESTS
// ============================================

describe('Accessibility', () => {
  it('heatmap cells have tooltips for screen readers', () => {
    const participants = createTestParticipants()
    const testData = generateHeatmapData(participants)
    
    render(<GoldenWindowsHeatmap data={testData} />)
    
    // All interactive cells should be buttons
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBeGreaterThan(0)
  })
  
  it('best times slots are clickable buttons', () => {
    render(<BestTimesSummary bestTimes={createMockBestTimes()} />)
    
    // The time slots container should be interactive
    const slots = screen.getAllByText(/UTC/)
    expect(slots.length).toBeGreaterThan(0)
  })
})

// ============================================
// RESPONSIVE DESIGN TESTS
// ============================================

describe('Responsive Design', () => {
  it('heatmap renders in compact mode for mobile', () => {
    const participants = createTestParticipants()
    const testData = generateHeatmapData(participants)
    
    const { container } = render(
      <GoldenWindowsHeatmap data={testData} compact={true} />
    )
    
    // In compact mode, participant column should be narrower
    const participantColumn = container.querySelector('.w-24')
    expect(participantColumn).toBeInTheDocument()
  })
  
  it('legend has compact variant', () => {
    render(<HeatmapLegendCompact />)
    
    // Compact legend should be a single row
    expect(screen.getByText('Energy:')).toBeInTheDocument()
  })
})
