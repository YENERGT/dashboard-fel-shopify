export function LoadingScreen() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      padding: 'var(--space-8)',
      backgroundColor: 'var(--color-bg-primary)'
    }}>
      {/* Header skeleton */}
      <div style={{
        height: '60px',
        marginBottom: 'var(--space-8)',
        backgroundColor: 'var(--dashboard-card-bg)',
        borderRadius: 'var(--dashboard-card-radius)',
        border: `var(--border-width-thin) solid var(--dashboard-card-border)`,
        boxShadow: 'var(--dashboard-card-shadow)'
      }} className="skeleton" />
      
      {/* Cards skeleton */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: 'var(--space-4)',
        marginBottom: 'var(--space-8)'
      }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="skeleton skeleton-card" style={{
            backgroundColor: 'var(--dashboard-card-bg)',
            borderRadius: 'var(--dashboard-card-radius)',
            border: `var(--border-width-thin) solid var(--dashboard-card-border)`,
            boxShadow: 'var(--dashboard-card-shadow)',
            height: '200px'
          }} />
        ))}
      </div>
      
      {/* Content skeleton */}
      <div style={{
        backgroundColor: 'var(--dashboard-card-bg)',
        padding: 'var(--dashboard-card-padding)',
        borderRadius: 'var(--dashboard-card-radius)',
        border: `var(--border-width-thin) solid var(--dashboard-card-border)`,
        boxShadow: 'var(--dashboard-card-shadow)'
      }}>
        <div className="skeleton skeleton-text" style={{ 
          width: '40%',
          height: 'var(--space-4)',
          borderRadius: 'var(--border-radius-sm)',
          marginBottom: 'var(--space-2)'
        }} />
        <div className="skeleton skeleton-text" style={{ 
          width: '60%',
          height: 'var(--space-4)',
          borderRadius: 'var(--border-radius-sm)',
          marginBottom: 'var(--space-2)'
        }} />
        <div className="skeleton skeleton-text" style={{ 
          width: '30%',
          height: 'var(--space-4)',
          borderRadius: 'var(--border-radius-sm)',
          marginBottom: 'var(--space-2)'
        }} />
        <div className="skeleton skeleton-text" style={{ 
          width: '80%',
          height: 'var(--space-4)',
          borderRadius: 'var(--border-radius-sm)',
          marginBottom: 'var(--space-2)'
        }} />
      </div>
      
      {/* Loading text */}
      <div style={{
        textAlign: 'center',
        marginTop: 'var(--space-8)',
        color: 'var(--color-text-secondary)',
        fontSize: 'var(--font-size-sm)',
        fontWeight: 'var(--font-weight-medium)'
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 'var(--space-2)'
        }}>
          <div style={{
            width: '16px',
            height: '16px',
            border: '2px solid var(--color-primary-light)',
            borderTop: '2px solid var(--color-primary)',
            borderRadius: 'var(--border-radius-full)',
            animation: 'spin 1s linear infinite'
          }} />
          Cargando Dashboard FEL...
        </div>
      </div>
      
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export function LoadingCard({ title = "Cargando...", height = "150px" }) {
  return (
    <div style={{
      backgroundColor: 'var(--dashboard-card-bg)',
      border: `var(--border-width-thin) solid var(--dashboard-card-border)`,
      borderRadius: 'var(--dashboard-card-radius)',
      padding: 'var(--dashboard-card-padding)',
      marginBottom: 'var(--space-4)',
      boxShadow: 'var(--dashboard-card-shadow)',
      transition: 'box-shadow var(--transition-base)'
    }}>
      <div style={{
        fontSize: 'var(--font-size-lg)',
        fontWeight: 'var(--font-weight-semibold)',
        marginBottom: 'var(--space-4)',
        color: 'var(--color-text-primary)'
      }}>
        {title}
      </div>
      <div className="skeleton skeleton-card" style={{ 
        height,
        borderRadius: 'var(--border-radius-sm)'
      }} />
    </div>
  );
}

export function LoadingMetric({ label = "Métrica" }) {
  return (
    <div style={{
      backgroundColor: 'var(--dashboard-card-bg)',
      border: `var(--border-width-thin) solid var(--dashboard-card-border)`,
      borderRadius: 'var(--dashboard-card-radius)',
      padding: 'var(--space-5)',
      textAlign: 'center',
      boxShadow: 'var(--dashboard-card-shadow)'
    }}>
      <div style={{
        fontSize: 'var(--font-size-xs)',
        color: 'var(--color-text-secondary)',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        fontWeight: 'var(--font-weight-semibold)',
        marginBottom: 'var(--space-2)'
      }}>
        {label}
      </div>
      <div className="skeleton" style={{
        height: '32px',
        width: '80%',
        margin: '0 auto',
        borderRadius: 'var(--border-radius-sm)'
      }} />
    </div>
  );
}