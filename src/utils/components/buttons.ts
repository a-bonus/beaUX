
export const buttonComponents = [
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
  }
];
