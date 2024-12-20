// manage_prompts.js
document.addEventListener('DOMContentLoaded', async () => {
  const DEFAULT_PROMPT1 =
    "You are a helpful assistant for proofreading emails. Please suggest changes to improve clarity, grammar, and tone. Provide two set of changes, one for a formal email, one for an informal one";
	const DEFAULT_PROMPT2 = 
	  "Check this email for spelling, punctuation, missing or incorrect words,and capitalization.";

  // Get saved prompts
  var { savedPrompts = [], selectedPromptIndex = -1 } =
    await browser.storage.local.get(["savedPrompts", "selectedPromptIndex"]);

  // Ensure default prompt exists
  if (savedPrompts.length === 0) {
    savedPrompts.push(DEFAULT_PROMPT1);
	 savedPrompts.push(DEFAULT_PROMPT2);
	 selectedPromptIndex= 0;
    await browser.storage.local.set({
      savedPrompts,
      selectedPromptIndex,
    });
  }

  // Create and insert prompt elements
  const container = document.getElementById('promptsContainer');
  savedPrompts.forEach((prompt, index) => {
    const div = document.createElement('div');
    div.id = "prompt-container";
    div.className = index === selectedPromptIndex ? "selected" : "";
    
    div.innerHTML = `
      ${prompt}
      <br><br>
      <button id="selectPrompt${index}" style="margin-right:25px">Select</button>
      <button id="deletePrompt${index}">Delete</button>
    `;
    
    container.appendChild(div);
  });

  // Add event listeners
  document.getElementById("newPromptButton").addEventListener("click", async () => {
    const newPrompt = prompt("Enter new prompt:");
    if (newPrompt) {
      savedPrompts.push(newPrompt);
      await browser.storage.local.set({ savedPrompts });
      // Reload the page to show new prompt
      window.location.reload();
    }
  });

  // Add listeners for select and delete buttons
  savedPrompts.forEach((_, index) => {
    document.getElementById(`selectPrompt${index}`).addEventListener("click", async () => {
      await browser.storage.local.set({ selectedPromptIndex: index });
      // Update visual selection
      document.querySelectorAll("#prompt-container").forEach(div => div.className = "");
      document.getElementById(`selectPrompt${index}`).parentElement.className = "selected";
    });

    document.getElementById(`deletePrompt${index}`).addEventListener("click", async () => {
      if (confirm("Are you sure you want to delete this prompt?")) {
        savedPrompts.splice(index, 1);
        await browser.storage.local.set({ 
          savedPrompts,
          selectedPromptIndex: savedPrompts.length > 0 ? 0 : -1
        });
        // Reload the page to show updated prompts
        window.location.reload();
      }
    });
  });
  
  //add listener to close window on loss of focus
	window.addEventListener('blur', () => {
		window.close();
	});
});