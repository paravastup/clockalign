/**
 * Golden Windows Components
 * 
 * Exports all components related to the Golden Windows feature.
 */

// Heatmap visualization
export {
  GoldenWindowsHeatmap,
  HeatmapLegend,
  HeatmapLegendCompact
} from './heatmap'

// Best times summary
export {
  BestTimesSummary,
  BestTimesList,
  GoldenWindowsStats,
  default as BestTimesDefault
} from './best-times'

// Availability preferences form
export {
  AvailabilityPreferencesForm,
  type AvailabilityPreferences
} from './availability-preferences'
