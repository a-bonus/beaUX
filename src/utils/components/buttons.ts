
export const buttonComponents = [
  {
    id: 'button-primary',
    name: 'Primary Button',
    description: 'A standard primary button component',
    code: `function PrimaryButton() {
  const [clicked, setClicked] = React.useState(0);
  
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
      onClick={() => {
        setClicked(clicked + 1);
        console.log('Primary button clicked', clicked + 1);
      }}
    >
      Primary Button {clicked > 0 ? \`(Clicked \${clicked} times)\` : ''}
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
  const [clicked, setClicked] = React.useState(0);
  
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
      onClick={() => {
        setClicked(clicked + 1);
        console.log('Secondary button clicked', clicked + 1);
      }}
    >
      Secondary Button {clicked > 0 ? \`(Clicked \${clicked} times)\` : ''}
    </button>
  );
}`,
    category: 'buttons'
  }
];
