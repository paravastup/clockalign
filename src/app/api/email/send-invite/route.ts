import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email/resend';
import { MeetingInviteEmail } from '@/lib/email/templates/meeting-invite';
import { DateTime } from 'luxon';

interface SendInviteRequest {
  meetingId: string;
  slotId: string;
}

interface Meeting {
  id: string;
  title: string;
  description: string | null;
  duration_minutes: number;
  organizer_id: string | null;
}

interface MeetingSlot {
  id: string;
  start_time: string;
  end_time: string;
  status: string;
}

interface Participant {
  id: string;
  email: string;
  name: string | null;
  timezone: string;
}

interface SacrificeScore {
  participant_id: string;
  points: number;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: SendInviteRequest = await request.json();
    const { meetingId, slotId } = body;

    if (!meetingId || !slotId) {
      return NextResponse.json(
        { error: 'Missing meetingId or slotId' },
        { status: 400 }
      );
    }

    // Fetch meeting details
     
    const { data: meeting, error: meetingError } = await (supabase.from('meetings') as any)
      .select('*')
      .eq('id', meetingId)
      .single() as { data: Meeting | null; error: Error | null };

    if (meetingError || !meeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }

    // Verify user is the organizer
    if (meeting.organizer_id !== user.id) {
      return NextResponse.json(
        { error: 'Only the organizer can send invites' },
        { status: 403 }
      );
    }

    // Fetch the confirmed slot
     
    const { data: slot, error: slotError } = await (supabase.from('meeting_slots') as any)
      .select('*')
      .eq('id', slotId)
      .eq('meeting_id', meetingId)
      .single() as { data: MeetingSlot | null; error: Error | null };

    if (slotError || !slot) {
      return NextResponse.json({ error: 'Slot not found' }, { status: 404 });
    }

    // Fetch all participants
     
    const { data: participants, error: participantsError } = await (supabase.from('meeting_participants') as any)
      .select('*')
      .eq('meeting_id', meetingId) as { data: Participant[] | null; error: Error | null };

    if (participantsError || !participants || participants.length === 0) {
      return NextResponse.json(
        { error: 'No participants found' },
        { status: 400 }
      );
    }

    // Fetch organizer details
     
    const { data: organizer } = await (supabase.from('users') as any)
      .select('name, email')
      .eq('id', user.id)
      .single() as { data: { name: string | null; email: string } | null };

    // Fetch sacrifice scores for this slot
     
    const { data: sacrificeScores } = await (supabase.from('sacrifice_scores') as any)
      .select('participant_id, points')
      .eq('meeting_slot_id', slotId) as { data: SacrificeScore[] | null };

    const scoresByParticipant = new Map(
      (sacrificeScores || []).map((s) => [s.participant_id, s.points])
    );

    // Parse the slot times
    const slotStartUTC = DateTime.fromISO(slot.start_time, { zone: 'utc' });
    const slotEndUTC = DateTime.fromISO(slot.end_time, { zone: 'utc' });

    // Generate ICS content for calendar link
    const icsContent = generateICS({
      title: meeting.title,
      description: meeting.description || '',
      startTime: slotStartUTC,
      endTime: slotEndUTC,
      organizer: organizer?.email || user.email!,
      attendees: participants.map((p) => p.email),
    });

    // Create a data URI for the ICS file
    const icsBase64 = Buffer.from(icsContent).toString('base64');
    const calendarLink = `data:text/calendar;base64,${icsBase64}`;

    // Send emails to all participants
    const emailResults = await Promise.allSettled(
      participants.map(async (participant) => {
        const participantTimezone = participant.timezone || 'UTC';
        const localStart = slotStartUTC.setZone(participantTimezone);
        const localEnd = slotEndUTC.setZone(participantTimezone);

        // Build participant list with local times
        const participantsList = participants.map((p) => {
          const pTz = p.timezone || 'UTC';
          const pLocalStart = slotStartUTC.setZone(pTz);
          return {
            name: p.name || p.email.split('@')[0],
            localTime: pLocalStart.toFormat('h:mm a'),
            timezone: pTz.replace(/_/g, ' '),
          };
        });

        const sacrificePoints = scoresByParticipant.get(participant.id);

        return sendEmail({
          to: participant.email,
          subject: `Meeting Invite: ${meeting.title}`,
          react: MeetingInviteEmail({
            meetingTitle: meeting.title,
            organizerName: organizer?.name || 'Organizer',
            description: meeting.description || undefined,
            durationMinutes: meeting.duration_minutes,
            localStartTime: localStart.toFormat('h:mm a'),
            localEndTime: localEnd.toFormat('h:mm a'),
            localDate: localStart.toFormat('EEEE, MMMM d, yyyy'),
            timezone: participantTimezone.replace(/_/g, ' '),
            participants: participantsList,
            calendarLink,
            sacrificePoints,
          }),
        });
      })
    );

    // Count successes and failures
    const successes = emailResults.filter(
      (r) => r.status === 'fulfilled' && !r.value.error
    ).length;
    const failures = emailResults.length - successes;

    // Update slot status to confirmed if not already
    if (slot.status !== 'confirmed') {
       
      await (supabase.from('meeting_slots') as any)
        .update({ status: 'confirmed' })
        .eq('id', slotId);
    }

    return NextResponse.json({
      success: true,
      emailsSent: successes,
      emailsFailed: failures,
      totalParticipants: participants.length,
    });
  } catch (error) {
    console.error('Send invite error:', error);
    return NextResponse.json(
      { error: 'Failed to send invites' },
      { status: 500 }
    );
  }
}

function generateICS({
  title,
  description,
  startTime,
  endTime,
  organizer,
  attendees,
}: {
  title: string;
  description: string;
  startTime: DateTime;
  endTime: DateTime;
  organizer: string;
  attendees: string[];
}): string {
  const formatDate = (dt: DateTime) => dt.toFormat("yyyyMMdd'T'HHmmss'Z'");
  const uid = `${Date.now()}@clockalign.app`;

  const attendeeLines = attendees
    .map((email) => `ATTENDEE;RSVP=TRUE:mailto:${email}`)
    .join('\n');

  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//ClockAlign//Meeting Scheduler//EN
CALSCALE:GREGORIAN
METHOD:REQUEST
BEGIN:VEVENT
UID:${uid}
DTSTAMP:${formatDate(DateTime.utc())}
DTSTART:${formatDate(startTime)}
DTEND:${formatDate(endTime)}
SUMMARY:${title}
DESCRIPTION:${description.replace(/\n/g, '\\n')}
ORGANIZER:mailto:${organizer}
${attendeeLines}
STATUS:CONFIRMED
SEQUENCE:0
END:VEVENT
END:VCALENDAR`;
}
