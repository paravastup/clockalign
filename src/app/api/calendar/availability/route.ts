import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getFreeBusy, listEvents } from '@/lib/google/calendar';
import { getCalendarTokens } from '@/lib/calendar/tokens';
import { DateTime } from 'luxon';

interface AvailabilityRequest {
  startDate: string; // ISO string
  endDate: string; // ISO string
  userIds?: string[]; // Optional: check availability for specific users
}

interface BusySlot {
  start: string;
  end: string;
}

interface UserAvailability {
  userId: string;
  email: string;
  timezone: string;
  busySlots: BusySlot[];
  calendarConnected: boolean;
}

/**
 * POST - Get availability for users
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

    const body: AvailabilityRequest = await request.json();
    const { startDate, endDate, userIds } = body;

    // Validate dates
    const start = DateTime.fromISO(startDate);
    const end = DateTime.fromISO(endDate);

    if (!start.isValid || !end.isValid) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      );
    }

    // Limit range to 30 days
    if (end.diff(start, 'days').days > 30) {
      return NextResponse.json(
        { error: 'Date range cannot exceed 30 days' },
        { status: 400 }
      );
    }

    // Get list of users to check
    const targetUserIds = userIds || [user.id];

    // Fetch user data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: usersData } = await (supabase.from('users') as any)
      .select('id, email, timezone, preferences')
      .in('id', targetUserIds);

    const users = usersData as Array<{
      id: string;
      email: string;
      timezone: string;
      preferences: unknown;
    }> | null;

    if (!users || users.length === 0) {
      return NextResponse.json({ error: 'No users found' }, { status: 404 });
    }

    // Get availability for each user
    const availability: UserAvailability[] = await Promise.all(
      users.map(async (targetUser) => {
        const tokens = await getCalendarTokens(supabase, targetUser.id);

        if (!tokens) {
          return {
            userId: targetUser.id,
            email: targetUser.email,
            timezone: targetUser.timezone,
            busySlots: [],
            calendarConnected: false,
          };
        }

        try {
          const busySlots = await getFreeBusy(
            tokens,
            start.toISO()!,
            end.toISO()!
          );

          return {
            userId: targetUser.id,
            email: targetUser.email,
            timezone: targetUser.timezone,
            busySlots,
            calendarConnected: true,
          };
        } catch (error) {
          console.error(
            `Failed to get availability for user ${targetUser.id}:`,
            error
          );
          return {
            userId: targetUser.id,
            email: targetUser.email,
            timezone: targetUser.timezone,
            busySlots: [],
            calendarConnected: true, // Connected but errored
          };
        }
      })
    );

    return NextResponse.json({ availability });
  } catch (error) {
    console.error('Get availability error:', error);
    return NextResponse.json(
      { error: 'Failed to get availability' },
      { status: 500 }
    );
  }
}

/**
 * GET - Get current user's upcoming events
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get('days') || '7', 10);

    const tokens = await getCalendarTokens(supabase, user.id);

    if (!tokens) {
      return NextResponse.json(
        { error: 'Google Calendar not connected', events: [] },
        { status: 200 }
      );
    }

    const now = DateTime.utc();
    const endDate = now.plus({ days });

    const events = await listEvents(tokens, now.toISO()!, endDate.toISO()!);

    // Transform events to a simpler format
    const simplifiedEvents = events.map((event) => ({
      id: event.id,
      title: event.summary,
      description: event.description,
      start: event.start?.dateTime || event.start?.date,
      end: event.end?.dateTime || event.end?.date,
      allDay: !event.start?.dateTime,
      meetLink: event.hangoutLink,
      attendees: event.attendees?.map((a) => ({
        email: a.email,
        status: a.responseStatus,
      })),
    }));

    return NextResponse.json({ events: simplifiedEvents });
  } catch (error) {
    console.error('List events error:', error);
    return NextResponse.json(
      { error: 'Failed to list events' },
      { status: 500 }
    );
  }
}
