
export const defaultComponents = [
  {
    id: 'button-primary',
    name: 'Primary Button',
    description: 'A standard primary button component',
    code: `function PrimaryButton() {
  return (
    <button 
      style={{ 
        backgroundColor: '#007AFF',
        color: 'white',
        padding: '12px 24px',
        borderRadius: '8px',
        fontWeight: '500',
        border: 'none',
        cursor: 'pointer',
        fontSize: '14px',
        transition: 'background-color 0.2s'
      }}
      onClick={() => console.log('Primary button clicked')}
    >
      Primary Button
    </button>
  );
}`,
    category: 'buttons'
  },
  {
    id: 'button-secondary',
    name: 'Secondary Button',
    description: 'A bordered secondary button',
    code: `function SecondaryButton() {
  return (
    <button 
      style={{ 
        backgroundColor: 'transparent',
        color: '#007AFF',
        padding: '12px 24px',
        borderRadius: '8px',
        fontWeight: '500',
        border: '1px solid #007AFF',
        cursor: 'pointer',
        fontSize: '14px',
        transition: 'all 0.2s'
      }}
      onClick={() => console.log('Secondary button clicked')}
    >
      Secondary Button
    </button>
  );
}`,
    category: 'buttons'
  },
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
  },
  {
    id: 'input-text',
    name: 'Text Input',
    description: 'A standard text input field',
    code: `function TextInput() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <label 
        style={{ 
          fontSize: '14px',
          fontWeight: '500',
          marginBottom: '4px',
          color: '#333'
        }}
      >
        Label
      </label>
      <input 
        type="text"
        placeholder="Enter text..."
        style={{ 
          padding: '12px 16px',
          borderRadius: '8px',
          border: '1px solid #E2E8F0',
          fontSize: '14px',
          outline: 'none',
          width: '100%',
          transition: 'border-color 0.2s'
        }}
      />
    </div>
  );
}`,
    category: 'inputs'
  }
];
