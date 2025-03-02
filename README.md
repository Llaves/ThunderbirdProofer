# LLM Proofreader for Thunderbird
This Thunderbird extension uses an LLM (large language model, aka chatbot) to 
proofread your email on demand. The repository contains two slightly different
versions. One uses the gpt-4o-mini model from OpenAI, while the other uses Gemini's Flash 2.0 model. These models produce very similar, though not
identical results. Both versions require an API key for the model. Gemini  
offers free use up to limits that are not likely to be relevant for proofing
email. OpenAI does not have a free tier, but proofreading a 4-5 paragraph email
costs a fraction of a cent. 

## Installation
Download one or the other of the .xpi files at the root directory of the 
repository. From the menu bar click Tools->Add-ons and Extensions. In the 
new window that opens click the settings gear in the upper right and then click "Install add-on from file".Browse to wherever you downloaded the .xpi file and select it. Click yes in response to the pop-ups to allow installation. 

The Gemini and OpenAI proofreaders can be installed side-by-side if you want. 
operated independently and don't interfere with each other. 

## Setup

Before you can proof any email you have to first enter your API key. In the main Thunderbird window click on the Proofreader icon, which is the letter P followed by either "Gemini" or  "OpenAI". In the dialog that pops-up, paste your API key into the box and click `Save Key`. You might want to click `View Key` just for confirmation. 

Click the Proofreader icon again and now click `Manage Prompts`. Select the 
prompt you want to give to the LLM when proofing your email or create a new prompt of your choosing.

Your API key and your prompts will be saved in Thunderbird's storage. The keys can be read using the Inspector from the main Thunderbird window. There may be other ways to read the storage as well that are vulnerable to hacks. Use your judgement. For the openAI API key make sure you have placed tight limits on expenditures. For routine email levels and proofreading, you can expect pennies per day. Make sure you know how to access your usage stats. If you're using the Gemini free tier your main hacking risk is that you'll get booted for excessive use.

## Proofing your email
From the composition window just click the extension icon (red P followed by either Gemini or OpenAI) . You will get a pop-up window while waiting for response. At the time of writing, OpenAI is taking 5 seconds or more to respond. Gemini seems to be faster - 2 seconds or so. 

If you have text selected in your message, that's all that will be proofed. Context around the message is not provided to the LLM. If there is no active selection, the entire message body will be sent. 

If you want to replace your original text with the suggested changes, copy the changes then select the original message and paste-without-formatting (ctrl-shift-V) and you should get what you want. 

## Rolling your own
If you copy this repo or fork it to make your own mods, beware of two issues. The first is that the manifest files of both extensions assumes the common directory is a subdirectory of the directory containing the manifest (either OpenAI or Gemini). In my dev environment I have the common directory symlinked beneath each implementation. If you have this arrangement and zip the files into an .xpi, you'll do fine. But if you try to load the unzipped files via debug mode, you will fail because the symlink is not handled correctly by Thunderbird. If you want to load from the unzipped files, you will have to move or copy the common directory beneath appropriate implementation directory. Make sure you return it to it's rightful place before moving on lest you end up with divergent common files between the two implementations. 