document.addEventListener('DOMContentLoaded', async () => {
  const result = await browser.storage.local.get("apiKey");
  const apiKey = result.apiKey || "No API key set.";
  document.getElementById("apiKey").textContent = apiKey;
  
	window.addEventListener('blur', () => {
		window.close();
	});
});