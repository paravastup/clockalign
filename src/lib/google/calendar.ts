import { google, calendar_v3 } from 'googleapis';

const SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.events',
];

export interface GoogleTokens {
  access_token: string;
  refresh_token?: string;
  expiry_date?: number;
  token_type?: string;
  scope?: string;
}

export interface CalendarEvent {
  id?: string;
  title: string;
  description?: string;
  startTime: string; // ISO string
  endTime: string; // ISO string
  timezone?: string;
  attendees?: string[];
  meetLink?: boolean;
}

export interface FreeBusySlot {
  start: string;
  end: string;
}

/**
 * Create an OAuth2 client for Google APIs
 */
export function createOAuth2Client() {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    throw new Error('Google OAuth credentials not configured');
  }

  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/calendar/callback`
  );
}

/**
 * Generate the OAuth authorization URL
 */
export function getAuthUrl(state?: string): string {
  const oauth2Client = createOAuth2Client();

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent', // Force to get refresh token
    state,
  });
}

/**
 * Exchange authorization code for tokens
 */
export async function getTokensFromCode(code: string): Promise<GoogleTokens> {
  const oauth2Client = createOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  return tokens as GoogleTokens;
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(
  refreshToken: string
): Promise<GoogleTokens> {
  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({ refresh_token: refreshToken });

  const { credentials } = await oauth2Client.refreshAccessToken();
  return credentials as GoogleTokens;
}

/**
 * Create a Calendar API client with tokens
 */
export function createCalendarClient(tokens: GoogleTokens): calendar_v3.Calendar {
  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials(tokens);

  return google.calendar({ version: 'v3', auth: oauth2Client });
}

/**
 * Get free/busy information for a user
 */
export async function getFreeBusy(
  tokens: GoogleTokens,
  timeMin: string,
  timeMax: string,
  calendarId = 'primary'
): Promise<FreeBusySlot[]> {
  const calendar = createCalendarClient(tokens);

  const response = await calendar.freebusy.query({
    requestBody: {
      timeMin,
      timeMax,
      items: [{ id: calendarId }],
    },
  });

  const busy = response.data.calendars?.[calendarId]?.busy || [];
  return busy.map((slot) => ({
    start: slot.start || '',
    end: slot.end || '',
  }));
}

/**
 * Create a calendar event
 */
export async function createEvent(
  tokens: GoogleTokens,
  event: CalendarEvent
): Promise<string | null> {
  const calendar = createCalendarClient(tokens);

  const eventResource: calendar_v3.Schema$Event = {
    summary: event.title,
    description: event.description,
    start: {
      dateTime: event.startTime,
      timeZone: event.timezone || 'UTC',
    },
    end: {
      dateTime: event.endTime,
      timeZone: event.timezone || 'UTC',
    },
  };

  if (event.attendees && event.attendees.length > 0) {
    eventResource.attendees = event.attendees.map((email) => ({ email }));
  }

  if (event.meetLink) {
    eventResource.conferenceData = {
      createRequest: {
        requestId: `clockalign-${Date.now()}`,
        conferenceSolutionKey: { type: 'hangoutsMeet' },
      },
    };
  }

  const response = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: eventResource,
    conferenceDataVersion: event.meetLink ? 1 : 0,
    sendUpdates: 'all',
  });

  return response.data.id || null;
}

/**
 * Update an existing calendar event
 */
export async function updateEvent(
  tokens: GoogleTokens,
  eventId: string,
  event: Partial<CalendarEvent>
): Promise<boolean> {
  const calendar = createCalendarClient(tokens);

  const eventResource: calendar_v3.Schema$Event = {};

  if (event.title) eventResource.summary = event.title;
  if (event.description) eventResource.description = event.description;
  if (event.startTime) {
    eventResource.start = {
      dateTime: event.startTime,
      timeZone: event.timezone || 'UTC',
    };
  }
  if (event.endTime) {
    eventResource.end = {
      dateTime: event.endTime,
      timeZone: event.timezone || 'UTC',
    };
  }

  try {
    await calendar.events.patch({
      calendarId: 'primary',
      eventId,
      requestBody: eventResource,
      sendUpdates: 'all',
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Delete a calendar event
 */
export async function deleteEvent(
  tokens: GoogleTokens,
  eventId: string
): Promise<boolean> {
  const calendar = createCalendarClient(tokens);

  try {
    await calendar.events.delete({
      calendarId: 'primary',
      eventId,
      sendUpdates: 'all',
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * List upcoming events
 */
export async function listEvents(
  tokens: GoogleTokens,
  timeMin: string,
  timeMax: string,
  maxResults = 50
): Promise<calendar_v3.Schema$Event[]> {
  const calendar = createCalendarClient(tokens);

  const response = await calendar.events.list({
    calendarId: 'primary',
    timeMin,
    timeMax,
    maxResults,
    singleEvents: true,
    orderBy: 'startTime',
  });

  return response.data.items || [];
}
