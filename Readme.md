# Dr. Debate

## How to run
1. Create a file at DebateDaddy/key.txt containing an OpenAI API key
2. Run the app.py python application
3. Visit the address localhost:8080
4. If this does not work, try changing the network. Possibly, try joining youir cell phone's mobile data, if possible

## Breakdown of the website
Home - the main page, where users can take part in interactive debates with GPT agents
About - a quick summary of the page nad the creator
Historical Debates - an archive containing 10 historical debates that users can look through and ask a GPT agent about

## File structure
DebateDaddy/  
├── client/  
│   ├── index.html - the interactive debate's HTML code  
│   ├── historicaldebates.py - the archive of debates' HTML code  
│   ├── about.html - the HTML file for the about page  
|   ├── script.js - the JavaScript file invoked with the interactive debate  
|   ├── historicalDebates.js - the JavaScript file invoked with the archive of debates  
|   └── styles.css - the CSS formatting used across the frontend  
├── influentialdebates/... - files for each of the debates, with the debate name being the file's name and the transcript of each debate inside them  
├── debatefiles/... - auto-generated files for each user which track the progress of their debate. Can be cleared outside of runtime  
├── server/  
|   ├── app.py - the main Flask backend  
|   ├── debate.py - a program that contains code to run the GPT agents in the interactive debate  
|   ├── gatheringinfo.py - a program that manages the retrieval of information  
|   ├── debateanalyser.py - a program that facilitates the GPT-powered debate analysis in the debate archive subpage  
|   ├── querygpt.py - a program that interacts with ChatGPT (borrowed from my past project - GovGuide)  
|   ├──systemtext/  
|   |   ├── debate - the system text fed to ChatGPT when running the interactive debate  
|   |   ├── evaluator - the system text fed to ChatGPT when evaluating the debate's winner  
|   |   ├── search - the system text fed to ChatGPT when searching for information online  
|   |   ├── debateanalysis - the system text fed to ChatGPT when going through the debate analysis  
├── Readme.md - this file  
├── key.txt (not included) - the OpenAI API key used throughout my code  