// options.js
document.getElementById("saveButton").addEventListener("click", async () => {
  const apiKey = document.getElementById("apiKey").value;
  const output = document.getElementById("output");

  if (!apiKey) {
    output.textContent = "API key cannot be empty.";
    return;
  }

  await browser.storage.local.set({ apiKey });
  output.textContent = "API key saved successfully.";
});

document.getElementById("viewKeyButton").addEventListener("click", async () => {
  const url = "view_key.html";  
  browser.windows.create({
    url: url,
    type: "popup",
    width: 400,
    height: 400
  });
});

document.getElementById("removeKeyButton").addEventListener("click", async () => {
  await browser.storage.local.remove("apiKey");
  document.getElementById("output").textContent = "API key removed successfully.";
});

// Prompt Management
document.getElementById("promptsButton").addEventListener("click", async () => {
  browser.windows.create({
    url: "manage_prompts.html",
    type: "popup",
    width: 500,
    height: 600,
  });
});

// Initialize output element
document.addEventListener('DOMContentLoaded', async () => {
  const result = await browser.storage.local.get("apiKey");
  const output = document.getElementById("output");
  if (result.apiKey) {
    output.textContent = "API key is set";
  } else {
    output.textContent = "No API key is set";
  }
});

window.addEventListener('blur', () => {
	window.close();
});