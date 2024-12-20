// background.js
// Handles the functionality of the Proof button, now added via compose-action in the manifest.


messenger.composeAction.onClicked.addListener(async (tab, info) => {
  const composeDetails = await messenger.compose.getComposeDetails(tab.id);

  const emailBody = composeDetails.body;
  const apiKey = (await browser.storage.local.get("apiKey")).apiKey;

  if (!apiKey) {
    console.error("API key not set. Opening settings...");
    openSettingsPopup();
    return;
  }
    // Get saved prompts
  const { savedPrompts = [], selectedPromptIndex = -1 } =
    await browser.storage.local.get(["savedPrompts", "selectedPromptIndex"]);
	 
	let selected_prompt = savedPrompts[selectedPromptIndex];
	console.log(selected_prompt);

  let waitingPopupId = null;
  try {
    // Show waiting popup
    waitingPopupId = await showWaitingPopup();
	 // const selected_prompt = "You are a helpful assistant for proofreading emails. Please suggest changes to improve clarity, grammar, and tone. "
              // +"Provide two set of changes, one for a formal email, one for an informal one";


    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: selected_prompt
          },
          { role: "user", content: emailBody }
        ],
      }),
    });

    if (!response.ok) {
      console.error("Failed to contact ChatGPT API.");
		response.json().then (data=> {showErrorPopup(`Error ${response.status}: ${data.error.message}`);})
		if (waitingPopupId) {
			await browser.windows.remove(waitingPopupId);
			waitingPopupID = null;
		}
      return;
    }

    const data = await response.json();
    let suggestions = data.choices[0].message.content;

    // Convert UTF-8 special characters to ASCII equivalents
    suggestions = decodeHTML(suggestions);

    // Close waiting popup before displaying suggestions
    if (waitingPopupId) {
      await browser.windows.remove(waitingPopupId);
      waitingPopupId = null;
    }
    showSuggestionsPopup(suggestions);
  } catch (error) {
    console.error("Error contacting ChatGPT API:", error);
    if (waitingPopupId) {
      await browser.windows.remove(waitingPopupId);
      waitingPopupId = null;
    }
    showErrorPopup(`Unexpected error: ${error.message}`);
  }
});


function openSettingsPopup() {
  browser.windows.create({
    url: "options.html",
    type: "popup",
    width: 500,
    height: 600
  });
}

function decodeHTML(html) {
  const textArea = document.createElement("textarea");
  textArea.innerHTML = html;
  return textArea.value;
}

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

function showWaitingPopup() {
  const blob = new Blob([
    `<!DOCTYPE html>
    <html>
      <head>
        <title>Waiting...</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 20px; }
          h1 { font-size: 18px; color: #555; }
        </style>
      </head>
      <body>
        <h1>Waiting for response from ChatGPT...</h1>
      </body>
    </html>`
  ], { type: "text/html" });

  const url = URL.createObjectURL(blob);
  return browser.windows.create({
    url,
    type: "popup",
    width: 400,
    height: 150
  }).then(windowInfo => windowInfo.id);
}

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

// Added settings button functionality
browser.runtime.onInstalled.addListener(() => {
  browser.browserAction.setPopup({
    popup: "options.html"
  });
});
