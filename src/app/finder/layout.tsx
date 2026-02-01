import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Fair Time Finder | ClockAlign - Find Fair Meeting Times Across Timezones',
  description: 'Compare timezones and find fair meeting times for distributed teams. See sacrifice scores and discover golden windows when everyone is at their best.',
  keywords: ['timezone converter', 'fair meeting time', 'distributed teams', 'sacrifice score', 'golden windows'],
  openGraph: {
    title: 'Fair Time Finder - ClockAlign',
    description: 'Find the fairest meeting times for your global team',
    type: 'website',
  },
};

export default function FinderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
