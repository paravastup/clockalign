import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

export interface MeetingInviteEmailProps {
  meetingTitle: string;
  organizerName: string;
  description?: string;
  durationMinutes: number;
  // Time shown in recipient's timezone
  localStartTime: string;
  localEndTime: string;
  localDate: string;
  timezone: string;
  // All participants with their local times
  participants: Array<{
    name: string;
    localTime: string;
    timezone: string;
  }>;
  // ICS calendar link
  calendarLink: string;
  meetingLink?: string;
  sacrificePoints?: number;
}

export function MeetingInviteEmail({
  meetingTitle,
  organizerName,
  description,
  durationMinutes,
  localStartTime,
  localEndTime,
  localDate,
  timezone,
  participants,
  calendarLink,
  meetingLink,
  sacrificePoints,
}: MeetingInviteEmailProps) {
  const previewText = `Meeting invite: ${meetingTitle} on ${localDate}`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>📅 Meeting Invite</Heading>

          <Text style={title}>{meetingTitle}</Text>

          <Section style={detailsBox}>
            <Text style={detailLabel}>When</Text>
            <Text style={detailValue}>
              {localDate}
              <br />
              {localStartTime} – {localEndTime} ({timezone})
            </Text>

            <Text style={detailLabel}>Duration</Text>
            <Text style={detailValue}>{durationMinutes} minutes</Text>

            <Text style={detailLabel}>Organized by</Text>
            <Text style={detailValue}>{organizerName}</Text>

            {description && (
              <>
                <Text style={detailLabel}>Description</Text>
                <Text style={detailValue}>{description}</Text>
              </>
            )}
          </Section>

          {sacrificePoints !== undefined && sacrificePoints > 0 && (
            <Section style={sacrificeBox}>
              <Text style={sacrificeText}>
                🏆 Sacrifice Points: <strong>{sacrificePoints}</strong>
              </Text>
              <Text style={sacrificeSubtext}>
                Thanks for accommodating others&apos; schedules!
              </Text>
            </Section>
          )}

          <Section style={buttonSection}>
            <Button style={button} href={calendarLink}>
              Add to Calendar
            </Button>
            {meetingLink && (
              <Button style={secondaryButton} href={meetingLink}>
                Join Meeting
              </Button>
            )}
          </Section>

          <Hr style={hr} />

          <Section>
            <Text style={participantsHeader}>All Participants</Text>
            {participants.map((p, i) => (
              <Text key={i} style={participantRow}>
                <strong>{p.name}</strong> — {p.localTime} ({p.timezone})
              </Text>
            ))}
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            This meeting was scheduled with{' '}
            <Link href="https://clockalign.app" style={link}>
              ClockAlign
            </Link>
            , the fair meeting scheduler for global teams.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default MeetingInviteEmail;

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '40px 20px',
  borderRadius: '8px',
  maxWidth: '580px',
};

const h1 = {
  color: '#1a1a1a',
  fontSize: '24px',
  fontWeight: '600',
  lineHeight: '1.25',
  marginBottom: '24px',
};

const title = {
  fontSize: '20px',
  fontWeight: '600',
  color: '#333',
  marginBottom: '24px',
};

const detailsBox = {
  backgroundColor: '#f9fafb',
  borderRadius: '8px',
  padding: '20px',
  marginBottom: '24px',
};

const detailLabel = {
  fontSize: '12px',
  fontWeight: '600',
  color: '#6b7280',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
  marginBottom: '4px',
  marginTop: '16px',
};

const detailValue = {
  fontSize: '14px',
  color: '#1a1a1a',
  margin: '0 0 8px 0',
  lineHeight: '1.5',
};

const sacrificeBox = {
  backgroundColor: '#fef3c7',
  borderRadius: '8px',
  padding: '16px',
  marginBottom: '24px',
  textAlign: 'center' as const,
};

const sacrificeText = {
  fontSize: '16px',
  color: '#92400e',
  margin: '0',
};

const sacrificeSubtext = {
  fontSize: '12px',
  color: '#b45309',
  margin: '4px 0 0 0',
};

const buttonSection = {
  textAlign: 'center' as const,
  marginBottom: '24px',
};

const button = {
  backgroundColor: '#f97316',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '14px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
  marginRight: '12px',
};

const secondaryButton = {
  backgroundColor: '#e5e7eb',
  borderRadius: '6px',
  color: '#374151',
  fontSize: '14px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
};

const hr = {
  borderColor: '#e5e7eb',
  margin: '24px 0',
};

const participantsHeader = {
  fontSize: '14px',
  fontWeight: '600',
  color: '#374151',
  marginBottom: '12px',
};

const participantRow = {
  fontSize: '13px',
  color: '#6b7280',
  margin: '0 0 6px 0',
};

const footer = {
  color: '#9ca3af',
  fontSize: '12px',
  lineHeight: '1.5',
  textAlign: 'center' as const,
};

const link = {
  color: '#f97316',
  textDecoration: 'none',
};
