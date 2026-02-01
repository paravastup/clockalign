'use client'

/**
 * Async Nudge Banner Component
 * CA-041: Displays async recommendations with alternatives
 */

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  type NudgeResult,
  type AsyncAlternative,
  getNudgeUrgencyColor,
  formatHoursReclaimed,
} from '@/lib/async-nudge'
import {
  ChevronDown,
  ChevronUp,
  Clock,
  Lightbulb,
  Video,
  FileText,
  BarChart3,
  Mail,
  MessageSquare,
  Zap,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface NudgeBannerProps {
  nudge: NudgeResult
  onDismiss?: () => void
  onSelectAlternative?: (alternative: AsyncAlternative) => void
  onContinueWithMeeting?: () => void
  className?: string
}

const alternativeIcons: Record<string, React.ReactNode> = {
  loom: <Video className="h-4 w-4" />,
  doc: <FileText className="h-4 w-4" />,
  poll: <BarChart3 className="h-4 w-4" />,
  email: <Mail className="h-4 w-4" />,
  slack: <MessageSquare className="h-4 w-4" />,
  other: <Zap className="h-4 w-4" />,
}

export function NudgeBanner({
  nudge,
  onDismiss,
  onSelectAlternative,
  onContinueWithMeeting,
  className,
}: NudgeBannerProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  if (!nudge.shouldNudge) return null
  
  const colors = getNudgeUrgencyColor(nudge.urgency)
  
  return (
    <Card 
      className={cn(
        'transition-all duration-300 animate-in slide-in-from-top-2',
        colors.bg,
        colors.border,
        'border-2',
        className
      )}
    >
      <CardContent className="pt-4 pb-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className={cn(
            'p-2 rounded-lg shrink-0',
            nudge.urgency === 'strong' ? 'bg-orange-100' : 
            nudge.urgency === 'moderate' ? 'bg-yellow-100' : 'bg-blue-100'
          )}>
            <Lightbulb className={cn(
              'h-5 w-5',
              nudge.urgency === 'strong' ? 'text-orange-600' :
              nudge.urgency === 'moderate' ? 'text-yellow-600' : 'text-blue-600'
            )} />
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className={cn('font-medium', colors.text)}>
                  {nudge.message}
                </p>
                
                {/* Time saved indicator */}
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="secondary" className="bg-white/60">
                    <Clock className="h-3 w-3 mr-1" />
                    Save ~{formatHoursReclaimed(nudge.estimatedHoursSaved)}
                  </Badge>
                  <Badge 
                    variant="outline" 
                    className={cn(
                      'bg-white/60',
                      nudge.urgency === 'strong' ? 'border-orange-300 text-orange-700' :
                      nudge.urgency === 'moderate' ? 'border-yellow-300 text-yellow-700' :
                      'border-blue-300 text-blue-700'
                    )}
                  >
                    {nudge.nudgeStrength}% async fit
                  </Badge>
                </div>
              </div>
              
              {/* Dismiss button */}
              {onDismiss && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 shrink-0"
                  onClick={onDismiss}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            
            {/* Collapsible details */}
            <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
              <CollapsibleTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="mt-2 h-7 px-2 text-xs"
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="h-3 w-3 mr-1" />
                      Hide details
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-3 w-3 mr-1" />
                      See alternatives
                    </>
                  )}
                </Button>
              </CollapsibleTrigger>
              
              <CollapsibleContent className="mt-3 space-y-4">
                {/* Why we're suggesting async */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Why async might work better:
                  </p>
                  <ul className="space-y-1">
                    {nudge.reasons.slice(0, 3).map((reason, i) => (
                      <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                        <span className="text-gray-400 mt-0.5">•</span>
                        {reason.description}
                      </li>
                    ))}
                  </ul>
                </div>
                
                {/* Suggested alternatives */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Async alternatives:
                  </p>
                  <div className="grid gap-2 sm:grid-cols-3">
                    {nudge.suggestedAlternatives.map((alt) => (
                      <button
                        key={alt.type}
                        onClick={() => onSelectAlternative?.(alt)}
                        className={cn(
                          'p-3 rounded-lg border bg-white/80 hover:bg-white',
                          'transition-all text-left group',
                          'hover:border-teal-300 hover:shadow-sm'
                        )}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className={cn(
                            'p-1.5 rounded',
                            'bg-gray-100 group-hover:bg-teal-50',
                            'text-gray-600 group-hover:text-teal-600'
                          )}>
                            {alternativeIcons[alt.type]}
                          </span>
                          <span className="font-medium text-sm">{alt.name}</span>
                        </div>
                        <p className="text-xs text-gray-500">
                          {alt.bestFor}
                        </p>
                        <div className="mt-2">
                          <Badge 
                            variant="secondary" 
                            className="text-xs h-5 bg-gray-100"
                          >
                            {alt.suitabilityScore}% match
                          </Badge>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Action buttons */}
                <div className="flex items-center gap-2 pt-2 border-t">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => onSelectAlternative?.(nudge.suggestedAlternatives[0])}
                    className="bg-teal-600 hover:bg-teal-700"
                  >
                    Go Async
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onContinueWithMeeting}
                  >
                    Schedule Meeting Anyway
                  </Button>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Compact version of the nudge for inline use
 */
export function NudgeBadge({
  nudge,
  onClick,
}: {
  nudge: NudgeResult
  onClick?: () => void
}) {
  if (!nudge.shouldNudge) return null
  
  const colors = getNudgeUrgencyColor(nudge.urgency)
  
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full',
        'text-sm font-medium transition-all',
        colors.bg,
        colors.text,
        colors.border,
        'border hover:shadow-sm'
      )}
    >
      <Lightbulb className="h-3.5 w-3.5" />
      <span>Consider async</span>
      <Badge 
        variant="secondary" 
        className="h-4 px-1.5 text-xs bg-white/60"
      >
        {nudge.nudgeStrength}%
      </Badge>
    </button>
  )
}

/**
 * Minimal inline nudge hint
 */
export function NudgeHint({ nudge }: { nudge: NudgeResult }) {
  if (!nudge.shouldNudge || nudge.nudgeStrength < 40) return null
  
  return (
    <p className="text-sm text-amber-600 flex items-center gap-1.5 mt-2">
      <Lightbulb className="h-4 w-4" />
      {nudge.primaryReason.description}
    </p>
  )
}
