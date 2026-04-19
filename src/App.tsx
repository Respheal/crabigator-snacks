import { useState } from 'react'

function App() {
  const [count, setCount] = useState(0)

  return (
<div>thing go here {count}</div>
  )
}

export default App
