export const PlaceholderPage = ({ title }: { title: string }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', textAlign: 'center' }}>
    <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 800, marginBottom: '16px', color: 'var(--text-primary)' }}>
      {title}
    </h1>
    <p style={{ color: 'var(--text-secondary)', maxWidth: '400px' }}>
      This section is part of the application architecture and will be fully implemented in a future phase.
    </p>
  </div>
);
