// background_gemini.js

// Function to get the stored API key
async function getApiKey() {
  const result = await browser.storage.local.get("apiKey"); // Changed to generic name
  return result.apiKey;
}

// Function to open the settings popup (only if needed)
function openSettingsPopup() {
  browser.windows.create({
    url: "common/options.html",
    type: "popup",
    width: 500,
    height: 600
  });
}

// Function to decode HTML entities
function decodeHTML(html) {
  const textArea = document.createElement("textarea");
  textArea.innerHTML = html;
  return textArea.value;
}

// Function to show the suggestions popup
function showSuggestionsPopup(suggestions) {
  const blob = new Blob([
    `<!DOCTYPE html>
    <html>
      <head>
        <title>Proofread Suggestions</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 10px; line-height: 1.5; }
          h1 { font-size: 18px; }
          pre { white-space: pre-wrap; word-wrap: break-word; border: 1px solid #ccc; padding: 10px; background: #f9f9f9; }
        </style>
        <meta http-equiv="content-type" content="text/html,charset=utf-8" />
      </head>
      <body>
        <h1>Proofreading Suggestions</h1>
        <pre>${suggestions}</pre>
      </body>
    </html>`
  ], { type: "text/html" });

  const url = URL.createObjectURL(blob);
  browser.windows.create({
    url,
    type: "popup",
    width: 1000,
    height: 1000
  });
}

// Function to show the waiting popup
function showWaitingPopup(isFullMessage) {
  const proofingMessage = isFullMessage ? "Proofing message" : "Proofing selection";

  const blob = new Blob([
    `<!DOCTYPE html>
    <html>
      <head>
        <title>Waiting...</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 20px; }
          h1 { font-size: 18px; color: #555; }
          p { font-size: 16px; color: #333; }
        </style>
      </head>
      <body>
        <p>${proofingMessage}</p>
        <h1>Waiting for response from Gemini Flash 2.0...</h1>
      </body>
    </html>`
  ], { type: "text/html" });

  const url = URL.createObjectURL(blob);
  return browser.windows.create({
    url,
    type: "popup",
    width: 400,
    height: 250
  }).then(windowInfo => windowInfo.id);
}

// Function to show the error popup
function showErrorPopup(message) {
  const blob = new Blob([
    `<!DOCTYPE html>
    <html>
      <head>
        <title>Error</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; text-align: center; color: #b00; }
          h1 { font-size: 20px; margin-bottom: 10px; }
          p { font-size: 14px; }
        </style>
      </head>
      <body>
        <h1>Error</h1>
        <p>${message}</p>
      </body>
    </html>`
  ], { type: "text/html" });

  const url = URL.createObjectURL(blob);
  browser.windows.create({
    url,
    type: "popup",
    width: 400,
    height: 200
  });
}

// Listener for compose action clicks
messenger.composeAction.onClicked.addListener(async (tab) => {
  let waitingPopupId = null; // Declare here so it can be closed in any error
  try {
    const apiKey = await getApiKey();

    if (!apiKey) {
      console.error("API key not set. Opening settings...");
      openSettingsPopup();
      return;
    }

    const composeDetails = await messenger.compose.getComposeDetails(tab.id);
    let textToProof = composeDetails.body;
    let isFullMessage = true;

    // Try to get the selected text
    try {
      const results = await messenger.tabs.executeScript(tab.id, {
        code: `(function() {
          const selection = window.getSelection().toString();
          return selection.trim();
        })();`
      });

      if (results && results[0] && results[0].length > 0) {
        textToProof = results[0];
        isFullMessage = false;
      }
    } catch (error) {
      console.warn("Error getting selection. Using full message.", error);
    }

    // Get saved prompts
    const { savedPrompts = [], selectedPromptIndex = -1 } = await browser.storage.local.get(["savedPrompts", "selectedPromptIndex"]);
    const selected_prompt = savedPrompts[selectedPromptIndex] || "Correct grammar, spelling, punctuation, and style."; //Default prompt

    // Show waiting popup
    waitingPopupId = await showWaitingPopup(isFullMessage);

    try {
      const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
      const prompt = `${selected_prompt}\n\n${textToProof}`;
      const payload = {
        contents: [{
          parts: [{ text: prompt }]
        }]
      };

      const response = await fetch(geminiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        console.error("Gemini API Error:", response.status, response.statusText);
        const errorData = await response.json();
        const errorMessage = errorData.error?.message || response.statusText;
        showErrorPopup(`Gemini API Error: ${response.status} - ${errorMessage}`);
         if (waitingPopupId) {
          await browser.windows.remove(waitingPopupId);
         }
        return;
      }

      const data = await response.json();

      if (data.error) {
        console.error("Gemini API returned an error:", data.error);
        showErrorPopup(`Gemini API Error: ${data.error.message}`);
         if (waitingPopupId) {
          await browser.windows.remove(waitingPopupId);
         }
        return;
      }

      const suggestions = data.candidates[0].content.parts[0].text;
      const decodedSuggestions = decodeHTML(suggestions);

      showSuggestionsPopup(decodedSuggestions);

    } catch (apiError) {
      console.error("Error contacting Gemini API:", apiError);
      showErrorPopup(`Unexpected error: ${apiError.message}`);
    } finally {
      if (waitingPopupId) {
        await browser.windows.remove(waitingPopupId);
      }
    }
  } catch (overallError) {
    console.error("Overall error:", overallError);
    showErrorPopup(`An unexpected error occurred: ${overallError.message}`);
  }
});

// Added settings button functionality
browser.runtime.onInstalled.addListener(() => {
  browser.browserAction.setPopup({
    popup: "common/options.html"
  });
});