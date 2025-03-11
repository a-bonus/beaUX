# beaUX MVP Implementation Guide

## **🚀 Overview**
This document provides step-by-step instructions to build the **beaUX MVP** with two core features:

1. **Component Previewing** – Users can enter React code and see a live preview.
2. **AI-Generated Components** – Users can describe a component, and AI (Claude API) will generate React code.

---

## **🟢 Step 2: Build the Component Previewing System**

### **1. Set Up the Project with Vite & TailwindCSS**
```bash
npm create vite@latest beaUX --template react-ts
cd beaUX
npm install
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```
Configure Tailwind in `tailwind.config.ts` and add global styles in `index.css`.

### **2. Create the UI Layout (Editor + Preview Window)**
Create `src/pages/Home.tsx`:
```tsx
import { useState } from "react";

export default function Home() {
  const [code, setCode] = useState("<button>Click me</button>");

  return (
    <div className="grid grid-cols-2 h-screen p-4 gap-4">
      <textarea
        className="w-full h-full p-2 border rounded-lg font-mono"
        value={code}
        onChange={(e) => setCode(e.target.value)}
      />
      <iframe
        className="w-full h-full border rounded-lg"
        srcDoc={`<html><body>${code}</body></html>`}
      />
    </div>
  );
}
```

### **3. Safely Render Components Using an iframe Sandbox**
```tsx
const createBlobURL = (code: string) => {
  const blob = new Blob([code], { type: "text/html" });
  return URL.createObjectURL(blob);
};
<iframe src={createBlobURL(code)} />;
```

### **4. Handle Errors Gracefully**
```tsx
<Suspense fallback={<div>Loading...</div>}>
  <iframe src={createBlobURL(code)} />
</Suspense>
```

### **5. Deploy the MVP to Vercel**
- Push code to **GitHub** and deploy to **Vercel**.

---

## **🟠 Step 3: Integrate AI-Generated Component Functionality**

### **6. Set Up a Backend to Call the Claude API**
Install dependencies:
```bash
npm install axios
```
Create `server.js`:
```js
import express from "express";
import axios from "axios";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cors());

app.post("/generate", async (req, res) => {
  const { prompt } = req.body;
  try {
    const response = await axios.post("https://api.anthropic.com/v1/claude", {
      prompt: `Generate a React component for: ${prompt}`,
      model: "claude-2",
      apiKey: process.env.CLAUDE_API_KEY,
    });
    res.json({ code: response.data });
  } catch (error) {
    res.status(500).json({ error: "Failed to generate component" });
  }
});

app.listen(3001, () => console.log("Server running on port 3001"));
```

### **7. Create a Frontend UI for AI-Powered Component Generation**
```tsx
const [prompt, setPrompt] = useState("");
const [generatedCode, setGeneratedCode] = useState("");

const generateComponent = async () => {
  const response = await fetch("http://localhost:3001/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });

  const data = await response.json();
  setGeneratedCode(data.code);
};

return (
  <div className="p-4">
    <input
      className="border p-2 rounded w-full"
      placeholder="Describe your component..."
      value={prompt}
      onChange={(e) => setPrompt(e.target.value)}
    />
    <button className="mt-2 p-2 bg-blue-500 text-white rounded" onClick={generateComponent}>
      Generate Component
    </button>
    <pre className="mt-4 bg-gray-100 p-2 rounded">{generatedCode}</pre>
  </div>
);
```

### **8. Inject AI-Generated Code into the Preview**
```tsx
<iframe srcDoc={`<html><body>${generatedCode}</body></html>`} />;
```

### **9. Cache AI-Generated Components**
```tsx
const cacheKey = `ai_component_${prompt}`;
const cachedCode = localStorage.getItem(cacheKey);

if (cachedCode) {
  setGeneratedCode(cachedCode);
} else {
  fetch(...).then((data) => {
    setGeneratedCode(data.code);
    localStorage.setItem(cacheKey, data.code);
  });
}
```

### **10. Deploy AI Integration & Optimize for Performance**
- Deploy **backend on Railway or Fly.io**.
- Optimize API calls using **debounced input**:
```tsx
import { useState, useEffect } from "react";

const [prompt, setPrompt] = useState("");
const [debouncedPrompt, setDebouncedPrompt] = useState("");

useEffect(() => {
  const handler = setTimeout(() => setDebouncedPrompt(prompt), 500);
  return () => clearTimeout(handler);
}, [prompt]);
```

---

## **✅ Next Steps**
This guide takes you **from zero to MVP**. Now, you can:
1. Refine the **UI/UX**.
2. Add **styling and animations**.
3. Optimize **performance and AI output quality**.

💡 Need help? Start by **implementing the Component Previewing System first!** 🚀
