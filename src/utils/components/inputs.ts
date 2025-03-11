
export const inputComponents = [
  {
    id: 'input-text',
    name: 'Text Input',
    description: 'A standard text input field',
    code: `function TextInput() {
  const [value, setValue] = React.useState('');
  
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
        value={value}
        onChange={(e) => setValue(e.target.value)}
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
      {value && (
        <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
          You typed: {value}
        </div>
      )}
    </div>
  );
}`,
    category: 'inputs'
  }
];
