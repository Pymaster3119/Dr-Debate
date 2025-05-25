const cookies = document.cookie.split('; ');
let username = null;
for (let cookie of cookies) {
  if (cookie.startsWith('username=')) {
    console.log("Cookie 'username' found:", decodeURIComponent(cookie.split('=')[1]));
    username = decodeURIComponent(cookie.split('=')[1]);
  }
}
if (username) {
  
  singin = document.getElementById("signin");
  signin.innerHTML = `<li class="nav-item">
            <a class="nav-link" href="profile.html">
              <i class="fas fa-user"></i> ${username}
            </a>
          </li>`;
}

//Populate the list of historical debates
const debatelist = document.getElementById('debate-list');

fetch(`/getAllDebateNames`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({})
  })
  .then(response => response.json())
  .then(data => {
    for (let i = 0; i < data.debates.length; i++) {
      debateName = data.debates[i].replaceAll("_", " ");
      const outsideborder = document.createElement("div");
      outsideborder.className = "input-wrapper";
      outsideborder.style.display = "flex";
      outsideborder.style.justifyContent = "space-between";
      outsideborder.style.marginBottom = '10px';

      const text = document.createElement("div");
      text.innerHTML = debateName;
      text.style.display = 'flex';
      text.style.alignItems = 'center';
      
      const button = document.createElement("button");
      button.className = "ask-button";
      button.innerHTML = "Select";
      button.onclick = () => populateDebate(data.debates[i]);
      outsideborder.appendChild(text);
      outsideborder.appendChild(button);
      debatelist.appendChild(outsideborder);
    }
})
let debatename = "";
//Populate the debate text area
function populateDebate(debateName)
{
  fetch(`/getDebateFile`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({debatename: debateName})
  })
  .then(response => response.json())
  .then(data => {
    document.getElementById("debate-lists").style.display = "none";
    document.getElementById("debate-preview").style.display = "block";
    document.getElementById("chatgpt-button").style.display = "block";
    const debatetitle = document.getElementById("debate-title");
    debatetitle.innerHTML = debateName.replaceAll("_", " ");
    const debatetext = document.getElementById("debate-text");
    debatetext.innerHTML = data.debatetext.replace(/\n/g, "<br>");
    debatename= debateName;
  })
}

function askGPT()
{
  console.log(window.getSelection().toString());
  document.getElementById("ChatGPT-interface").style.display = "block";
  createChatGPTChat();
}

messages = ["How can I help you?"];
function createChatGPTChat()
{
  const chatgptdiv = document.getElementById("ChatGPT-interface");
  for(let i = 0; i < messages.length; i++)
  {
    const content = messages[i];
    const messageWrapper = document.createElement("div");
    messageWrapper.className = `message-wrapper ${i%2 === 0 ? "" : "right"}`;
    
    const messageHeader = document.createElement("div");
    messageHeader.className = "message-header";
    
    const speakerName = document.createElement("span");
    speakerName.textContent = i%2 === 0 ? "ChatGPT" : "User";
    messageHeader.appendChild(speakerName);
    messageWrapper.appendChild(messageHeader);

    const bubble = document.createElement("div");
    bubble.className = `bubble bubble-${i%2===0 ? "left" : "right"}`;
    // changed code: using innerHTML with newline conversion
    bubble.innerHTML = content.replace(/\n/g, "<br>");
    messageWrapper.appendChild(bubble);

    chatgptdiv.appendChild(messageWrapper);
  }

  //Create the input bubble
  const speakerName = document.createElement("span");
  speakerName.textContent = "User";

  const inputWrapper = document.createElement("div");
  inputWrapper.className = "message-wrapper right input-message";

  const inputBubble = document.createElement("div");
  inputBubble.className = "bubble bubble-right";
  inputBubble.style.maxWidth = "80%";
  inputBubble.style.minWidth = "70%";

  const textInput = document.createElement("textarea");
  textInput.placeholder = "Type your message...";
  textInput.className = "con-input-text";
  textInput.style.backgroundColor = "rgba(255, 255, 255, 0)";
  textInput.style.color = "#ffffff";
  textInput.style.border = "none";
  textInput.style.minWidth = "90%";
  textInput.style.maxWidth = "90%";
  
  const sendIcon = document.createElement("i");
  sendIcon.className = "fas fa-paper-plane";
  inputBubble.appendChild(textInput);
  inputBubble.appendChild(sendIcon);
  inputWrapper.appendChild(speakerName);
  inputWrapper.appendChild(inputBubble);
  chatgptdiv.appendChild(inputWrapper);
  
  //Add the event listener for the input
  sendIcon.addEventListener("click", function() {
    const userInput = textInput.value;
    messages.push(userInput);
    fetch('/getDebateAnalysis', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({debatename:debatename, highlights:highlights, messages:messages})
    })
    .then(response => response.json())
    .then(data => {
      messages.push(data.analysis);
      chatgptdiv.innerHTML = "";
      createChatGPTChat();
    })
  });
}

//Handle higghlighting
highlights = [];

function addHighlight(e) {
  if (e.ctrlKey && e.code === 'KeyK') {
    let selection = window.getSelection();
    if (selection.rangeCount > 0 && !selection.isCollapsed) {
      let range = selection.getRangeAt(0);
      let commonAncestor = range.commonAncestorContainer;
      if (commonAncestor.nodeType === Node.TEXT_NODE) {
        commonAncestor = commonAncestor.parentNode;
      }
      if (commonAncestor.tagName === 'MARK') {
        let parent = commonAncestor.parentNode;
        while (commonAncestor.firstChild) {
          parent.insertBefore(commonAncestor.firstChild, commonAncestor);
        }
        parent.removeChild(commonAncestor);
      } else {
        let selectedText = selection.toString();
        if (selectedText.length > 0) {
          highlights.push(selectedText);
          try {
            let mark = document.createElement("mark");
            mark.style.backgroundColor = "yellow";
            range.surroundContents(mark);
          } catch (ex) {
            console.log("Unable to highlight the selected text:", ex);
          }
        }
      }
      selection.removeAllRanges();
    }
  }
}

document.addEventListener('keyup', addHighlight, false);
