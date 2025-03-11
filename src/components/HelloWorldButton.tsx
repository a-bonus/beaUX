function HelloWorldButton() {
  function handleClick() {
    alert('Hello World!');
  }

  return (
    <button
      style={{
        padding: '10px',
        backgroundColor: 'blue',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer', 
      }}
      onClick={handleClick}
    >
      Hello World
    </button>
  );
}

export default HelloWorldButton;
