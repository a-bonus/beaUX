
export const layoutComponents = [
  {
    id: 'card-basic',
    name: 'Basic Card',
    description: 'A simple card component with shadow',
    code: `function BasicCard() {
  const [expanded, setExpanded] = React.useState(false);
  
  return (
    <div 
      style={{ 
        padding: '24px',
        borderRadius: '12px',
        backgroundColor: 'white',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
        maxWidth: '300px'
      }}
    >
      <h3 style={{ 
        margin: '0',
        marginBottom: '8px',
        fontSize: '18px',
        fontWeight: '600'
      }}>
        Card Title
      </h3>
      <p style={{ 
        margin: '0',
        color: '#666',
        fontSize: '14px',
        lineHeight: '1.5',
        marginBottom: expanded ? '16px' : '0'
      }}>
        This is a simple card component with some sample content.
        {expanded && ' This additional text appears when the card is expanded. It demonstrates how React state can control UI elements.'}
      </p>
      
      {expanded && (
        <div style={{ 
          marginTop: '16px',
          padding: '12px',
          backgroundColor: '#f9fafb',
          borderRadius: '8px',
          fontSize: '13px'
        }}>
          Extra content area that appears when expanded
        </div>
      )}
      
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          marginTop: '16px',
          backgroundColor: 'transparent',
          color: '#3b82f6',
          border: 'none',
          padding: '0',
          fontSize: '14px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}
      >
        {expanded ? 'Show less' : 'Show more'}
      </button>
    </div>
  );
}`,
    category: 'layout'
  }
];
