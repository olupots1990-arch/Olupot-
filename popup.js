const API_KEY = "YOUR_GEMINI_API_KEY_HERE";
const MODEL = "gemini-1.5-flash";

document.getElementById("send").addEventListener("click", async () => {
  const prompt = document.getElementById("prompt").value;
  const responseDiv = document.getElementById("response");
  responseDiv.textContent = "Thinking...";

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    }
  );

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "No response.";
  responseDiv.textContent = text;
});
