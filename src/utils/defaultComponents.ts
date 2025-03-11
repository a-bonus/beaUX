
export const defaultComponents = [
  {
    id: 'button-primary',
    name: 'Primary Button',
    description: 'A standard primary button component',
    code: `function Button() {
  return (
    <button 
      style={{ 
        backgroundColor: '#007AFF', 
        color: 'white',
        padding: '12px 24px',
        borderRadius: 8,
        fontWeight: '500',
        border: 'none',
        cursor: 'pointer'
      }}
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
        borderRadius: 8,
        fontWeight: '500',
        border: '1px solid #007AFF',
        cursor: 'pointer'
      }}
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
    code: `function Card() {
  return (
    <div 
      style={{ 
        padding: 24,
        borderRadius: 12,
        backgroundColor: 'white',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
        maxWidth: 300
      }}
    >
      <h3 style={{ 
        margin: 0, 
        marginBottom: 8,
        fontSize: 18,
        fontWeight: 600
      }}>
        Card Title
      </h3>
      <p style={{ 
        margin: 0,
        color: '#666',
        fontSize: 14,
        lineHeight: 1.5
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label 
        style={{ 
          fontSize: 14, 
          fontWeight: 500, 
          marginBottom: 4,
          color: '#333'
        }}
      >
        Name
      </label>
      <input 
        type="text"
        placeholder="Enter your name"
        style={{ 
          padding: '12px 16px',
          borderRadius: 8,
          border: '1px solid #E2E8F0',
          fontSize: 14,
          outline: 'none',
          width: '100%'
        }}
      />
    </div>
  );
}`,
    category: 'inputs'
  },
  {
    id: 'alert-success',
    name: 'Success Alert',
    description: 'Success notification alert',
    code: `function SuccessAlert() {
  return (
    <div 
      style={{ 
        display: 'flex',
        alignItems: 'center',
        backgroundColor: '#ECFDF5',
        color: '#065F46',
        padding: '12px 16px',
        borderRadius: 6,
        border: '1px solid #A7F3D0'
      }}
    >
      <span style={{ marginRight: 12 }}>✓</span>
      <p style={{ margin: 0, fontSize: 14 }}>
        Operation completed successfully
      </p>
    </div>
  );
}`,
    category: 'feedback'
  },
  {
    id: 'badge-status',
    name: 'Status Badge',
    description: 'A small status indicator',
    code: `function StatusBadge() {
  return (
    <span 
      style={{ 
        backgroundColor: '#E0F2FE',
        color: '#0369A1',
        fontSize: 12,
        fontWeight: 500,
        padding: '2px 8px',
        borderRadius: 16,
        display: 'inline-block'
      }}
    >
      Active
    </span>
  );
}`,
    category: 'badges'
  },
  {
    id: 'toggle-switch',
    name: 'Toggle Switch',
    description: 'A simple toggle switch component',
    code: `function ToggleSwitch() {
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <input 
        type="checkbox" 
        id="switch"
        style={{ 
          opacity: 0,
          width: 0,
          height: 0
        }}
      />
      <label 
        htmlFor="switch"
        style={{
          display: 'block',
          width: 48,
          height: 28,
          borderRadius: 14,
          backgroundColor: '#007AFF',
          cursor: 'pointer',
          position: 'relative'
        }}
      >
        <span 
          style={{
            position: 'absolute',
            top: 4,
            left: 4,
            width: 20,
            height: 20,
            borderRadius: 10,
            backgroundColor: 'white',
            transition: 'transform 0.2s'
          }}
        />
      </label>
    </div>
  );
}`,
    category: 'inputs'
  },
  {
    id: 'avatar-user',
    name: 'User Avatar',
    description: 'Circular user profile avatar',
    code: `function Avatar() {
  return (
    <div 
      style={{ 
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#E0F2FE',
        color: '#0369A1',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 600,
        fontSize: 16,
        overflow: 'hidden'
      }}
    >
      JD
    </div>
  );
}`,
    category: 'avatars'
  }
];
