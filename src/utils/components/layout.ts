
export const layoutComponents = [
  {
    id: 'card-basic',
    name: 'Basic Card',
    description: 'A simple card component with shadow',
    code: `function BasicCard() {
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
        lineHeight: '1.5'
      }}>
        This is a simple card component with some sample content.
      </p>
    </div>
  );
}`,
    category: 'layout'
  }
];
