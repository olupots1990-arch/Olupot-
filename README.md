# Stanley's Cafeteria Restaurant Chatbot

This is a sophisticated, WhatsApp-style chatbot for a restaurant review and delivery business. It leverages multiple Gemini models to provide a rich user experience, including standard chat, complex query handling, low-latency responses, image analysis, and text-to-speech output.

## Features

- **Customer View:** An interactive, WhatsApp-like chat interface.
- **Admin Panel:** A comprehensive dashboard for managing the business, including:
  - Viewing and managing orders.
  - Customizing the bot's system instructions.
  - Updating home page content (About Us, History, FAQs).
  - Managing menu products.
  - Tracking sales and agent performance.
- **Multiple Chat Modes:**
  - **Standard Mode:** Balanced performance for general queries.
  - **Thinking Mode:** Utilizes a more powerful model for complex reasoning.
  - **Low-Latency Mode:** Optimized for quick, snappy responses.
  - **Voice Mode:** Real-time, voice-to-voice conversation with transcription.
- **Advanced Gemini Features:**
  - **Function Calling:** To get menu items and place delivery orders.
  - **Image Analysis:** Users can upload images for the bot to analyze.
  - **Text-to-Speech:** Bot responses can be played back as audio.
- **Offline First:** Uses a service worker to cache application assets for offline availability.
- **Responsive Design:** Works seamlessly on both desktop and mobile devices.

## Getting Started

### Prerequisites

- A modern web browser.
- A Google Gemini API Key.

### Environment Variables

This project requires a Google Gemini API key to function.

1.  **Get an API Key:** If you don't have one, you can get a free API key from [Google AI Studio](https://aistudio.google.com/app/apikey).

2.  **Create an Environment File:**
    - In the root of the project, create a new file named `.env.local`.
    - Copy the contents of `.env.example` into your new `.env.local` file.
    - Replace `YOUR_GEMINI_API_KEY` with your actual Gemini API key.

    Your `.env.local` file should look like this:
    ```
    API_KEY="AIzaSy...your...key...here"
    ```

    **Important:** The `.env.local` file is included in `.gitignore` and should **never** be committed to your version control system.

### Running Locally

This application is designed to be run in a web-based development environment that automatically handles dependencies and serves the files. Simply load the project files into such an environment, ensure your `.env.local` file is set up, and open the `index.html` file in your browser.

## Deployment

When deploying this application, do **not** upload your `.env.local` file. Instead, you must configure the `API_KEY` as an environment variable within your hosting provider's settings.

Most modern hosting platforms (like Vercel, Netlify, Google Cloud Run, etc.) provide a dashboard where you can securely store and manage environment variables for your project.

- **Variable Name:** `API_KEY`
- **Value:** Your Gemini API Key

By setting the variable on the hosting platform, the `process.env.API_KEY` in the code will be correctly populated in the production environment without exposing your key in the repository.

---

This project was built with React, TypeScript, and Tailwind CSS, utilizing the `@google/genai` SDK.
