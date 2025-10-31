<!DOCTYPE html>
<html>
<head>
  <title>stanley</title>
  <style>
    body { font-family: sans-serif; width: 300px; padding: 10px; }
    textarea { width: 100%; height: 100px; margin-bottom: 10px; }
    button { width: 100%; padding: 8px; }
    #response { margin-top: 10px; white-space: pre-wrap; }
  </style>
</head>
<body>
  <h3>Gemini AI</h3>
  <textarea id="prompt" placeholder="Ask Gemini..."></textarea>
  <button id="send">Ask</button>
  <div id="response"></div>
  <script src="popup.js"></script>
</body>
</html>
