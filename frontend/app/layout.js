import './globals.css';

export const metadata = {
  title: 'Tracebound',
  description: 'Agentic workflow → on-chain audit trail.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
