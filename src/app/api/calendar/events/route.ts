import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createEvent, updateEvent, deleteEvent } from '@/lib/google/calendar';
import { getCalendarTokens } from '@/lib/calendar/tokens';

interface CreateEventRequest {
  meetingId: string;
  slotId: string;
  createMeetLink?: boolean;
}

interface UpdateEventRequest {
  eventId: string;
  title?: string;
  description?: string;
  startTime?: string;
  endTime?: string;
}

interface DeleteEventRequest {
  eventId: string;
}

/**
 * POST - Create a calendar event from a meeting slot
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: CreateEventRequest = await request.json();
    const { meetingId, slotId, createMeetLink = false } = body;

    // Get user's calendar tokens
    const tokens = await getCalendarTokens(supabase, user.id);

    if (!tokens) {
      return NextResponse.json(
        { error: 'Google Calendar not connected' },
        { status: 400 }
      );
    }

    // Fetch meeting and slot details
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: meeting } = await (supabase.from('meetings') as any)
      .select('*')
      .eq('id', meetingId)
      .single() as { data: { title: string; description: string | null } | null };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: slot } = await (supabase.from('meeting_slots') as any)
      .select('*')
      .eq('id', slotId)
      .single() as { data: { start_time: string; end_time: string } | null };

    if (!meeting || !slot) {
      return NextResponse.json(
        { error: 'Meeting or slot not found' },
        { status: 404 }
      );
    }

    // Fetch participants for attendees
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: participants } = await (supabase.from('meeting_participants') as any)
      .select('email')
      .eq('meeting_id', meetingId) as { data: Array<{ email: string }> | null };

    // Get organizer's timezone
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: organizer } = await (supabase.from('users') as any)
      .select('timezone')
      .eq('id', user.id)
      .single() as { data: { timezone: string } | null };

    // Create the calendar event
    const eventId = await createEvent(tokens, {
      title: meeting.title,
      description: meeting.description || 'Scheduled via ClockAlign',
      startTime: slot.start_time,
      endTime: slot.end_time,
      timezone: organizer?.timezone || 'UTC',
      attendees: participants?.map((p) => p.email) || [],
      meetLink: createMeetLink,
    });

    if (!eventId) {
      return NextResponse.json(
        { error: 'Failed to create calendar event' },
        { status: 500 }
      );
    }

    // Store the Google event ID in the slot
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('meeting_slots') as any)
      .update({ google_event_id: eventId })
      .eq('id', slotId);

    return NextResponse.json({ success: true, eventId });
  } catch (error) {
    console.error('Create calendar event error:', error);
    return NextResponse.json(
      { error: 'Failed to create calendar event' },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Update a calendar event
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: UpdateEventRequest = await request.json();
    const { eventId, ...updates } = body;

    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID required' },
        { status: 400 }
      );
    }

    const tokens = await getCalendarTokens(supabase, user.id);

    if (!tokens) {
      return NextResponse.json(
        { error: 'Google Calendar not connected' },
        { status: 400 }
      );
    }

    const success = await updateEvent(tokens, eventId, updates);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update calendar event' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update calendar event error:', error);
    return NextResponse.json(
      { error: 'Failed to update calendar event' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Delete a calendar event
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: DeleteEventRequest = await request.json();
    const { eventId } = body;

    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID required' },
        { status: 400 }
      );
    }

    const tokens = await getCalendarTokens(supabase, user.id);

    if (!tokens) {
      return NextResponse.json(
        { error: 'Google Calendar not connected' },
        { status: 400 }
      );
    }

    const success = await deleteEvent(tokens, eventId);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete calendar event' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete calendar event error:', error);
    return NextResponse.json(
      { error: 'Failed to delete calendar event' },
      { status: 500 }
    );
  }
}
