# Stanley's Cafeteria Restaurant Chatbot

This is a sophisticated, WhatsApp-style chatbot for a restaurant review and delivery business. It leverages multiple Gemini models to provide a rich user experience, including standard chat, complex query handling, low-latency responses, image analysis, and text-to-speech output.

## Features

- **Customer View:** An interactive home page and WhatsApp-like chat interface for placing orders and asking questions.
- **Comprehensive Admin Panel:** A full-featured dashboard for managing all aspects of the business:
  - **Dashboard:** At-a-glance overview of sales, pending orders, and available agents.
  - **Order Management:** View, approve, reject, and assign delivery orders.
  - **Sales & Performance:** Track sales data and agent delivery performance.
  - **HR Management:** Manage agents, track attendance with photo verification, generate payroll, and handle leave requests.
  - **Operations:** Manage menu products, track inventory stock levels, handle tasks, and log expenses.
  - **Content Management:** Update the home page content (About Us, History, FAQs) and contact information.
  - **Bot Configuration:** Customize the bot's core system instructions.
- **Multiple Chat Modes:**
  - **Standard Mode:** Balanced performance for general queries.
  - **Thinking Mode:** Utilizes a more powerful model for complex reasoning.
  - **Low-Latency Mode:** Optimized for quick, snappy responses.
  - **Voice Mode:** Real-time, voice-to-voice conversation with transcription.
- **Advanced Gemini Features:**
  - **Function Calling:** To get menu items and place delivery orders automatically.
  - **Image Analysis:** Users can upload images for the bot to analyze.
  - **Text-to-Speech:** Bot responses can be played back as audio.
  - **AI-Powered Search:** Search through chat history with an AI summary.
- **Offline First:** Uses a service worker to cache application assets for offline availability.
- **Responsive & Modern UI:** A clean, dark/light mode compatible interface that works on both desktop and mobile devices.

## Project Structure

```
.
├── components/
│   ├── AdminPanel.tsx
│   ├── AdminSidebar.tsx
│   ├── ChatInterface.tsx
│   ├── ChatMessage.tsx
│   ├── CustomerDashboard.tsx
│   ├── Header.tsx
│   ├── HomePage.tsx
│   ├── icons.tsx
│   ├── Menu.tsx
│   └── MessageInput.tsx
├── services/
│   └── geminiService.ts
├── utils/
│   ├── audio.ts
│   └── image.ts
├── App.tsx
├── index.html
├── index.tsx
├── manifest.json
├── metadata.json
├── README.md
├── sw.js
└── types.ts
```

## Getting Started

### Prerequisites

- A modern web browser that supports the Web Audio API and `localStorage`.
- A Google Gemini API Key.

### Environment Variables

This project requires a Google Gemini API key to function. This is handled by the execution environment and should be pre-configured.

## Deployment

When deploying this application, the `API_KEY` must be configured as an environment variable within your hosting provider's settings.

- **Variable Name:** `API_KEY`
- **Value:** Your Gemini API Key

By setting the variable on the hosting platform, the `process.env.API_KEY` in the code will be correctly populated in the production environment without exposing your key in the repository.

---

This project was built with React, TypeScript, and Tailwind CSS, utilizing the `@google/genai` SDK.