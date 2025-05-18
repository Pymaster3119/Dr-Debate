// 0 - question asked from user->app
// 1 - search queries generated
// 2 - search queries answered
// 3 - debate initiated
// 4 - debate in progress 

// Create hash
const now = new Date().getTime();
const browser = navigator.userAgent;
const random = Math.random().toString(36).substring(2, 15);
const hash = btoa(`${now}-${browser}-${random}`);
state = -1;
stance = NaN;
const sourcesState = {}; // Added to store toggle states

//Load suggestions

fetch('/debatetopics', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({userhash: hash})
})
.then(response => response.text())
.then(data => {
  console.log(data);
  data = data.split('\n');
  questiondiv = document.getElementById("question-suggestions");
  questiondiv.innerHTML = "";
  for (let i = 0; i < data.length; i++) {
    const question = data[i];
    const classes = ['btn-outline-secondary', 'btn-outline-success', 'btn-outline-warning', 'btn-outline-danger', 'btn-outline-info', 'btn-outline-dark', 'btn-outline-primary'];
    const randomClass = classes[Math.floor(Math.random() * classes.length)];
    questiondiv.innerHTML += `<button type="button"
              class="btn ${randomClass} btn-sm m-1 rounded-pill suggestion-btn"
              onclick="document.getElementById('question').value='${question}';">
              ${question}
              </button>`;
  }
})

//Random choice
function randomSuggestion() {
  fetch('/debatetopics', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({userhash: hash})
  })
  .then(response => response.text())
  .then(data => {
    console.log(data);
    data = data.split('\n');
    randomChoice = data[Math.floor(Math.random() * data.length)];
    document.getElementById('question').value = randomChoice;
  })
}
function getSelectedStance() {
  const selectedStanceInput = document.querySelector('input[name="stance"]:checked');
  stance = selectedStanceInput.value;
}
//Send the question to the server
function onQuestion() {
  getSelectedStance();
  const questionTextbox = document.getElementById("question");
  if (questionTextbox) {
    const questionValue = questionTextbox.value;
    
    fetch('/sendQuestion', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({userhash: hash, question: questionValue, stance: stance})
    })
  } else {
    console.error('Textbox with id "question" not found.');
  }
  state = 0;
  document.getElementById("questioninput").style.display = "none";
  document.getElementById("waiting").style.display = "block";
}

//Per 2 second update for search queries
function updateSearchQueries() {
  if (state === 0 || state === 1)
  {
    fetch(`/getSearchQueries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({userhash: hash})
    })
    .then(response => response.json())
    .then(data => {
      if (data.queries) {
        queries = data.queries;
        console.log(queries);

        if (data.finished)
        {
          state = 2;
        }

        //Load up search queries div
        var searchQueriesDiv = document.getElementById("searchqueries");
        searchQueriesDiv.style.display = "block";
        searchQueriesDiv = document.getElementById("searchqueriescontainer");
        searchQueriesDiv.innerHTML = "";
        waitingdiv = document.getElementById("waiting");
        waitingdiv.style.display = "none";
        
        console.log(typeof queries);
        console.log(Object.keys(queries).length);
        i = 0
        for (const query in queries) {
          if (queries.hasOwnProperty(query)) {
            console.log("HERE");
            const card = document.createElement('div');
            card.className = 'card mb-3';

            const cardHeader = document.createElement('div');
            cardHeader.className = 'card-header';
            cardHeader.textContent = query;
            card.appendChild(cardHeader);

            const cardBody = document.createElement('div');
            cardBody.className = 'card-body';

            const cardText = document.createElement('p');
            cardText.className = 'card-text';
            cardText.innerHTML = marked.parse(queries[query]['response']);
            cardBody.appendChild(cardText);

            const toggleWrapper = document.createElement('div');
            toggleWrapper.style.cursor = 'pointer';
            toggleWrapper.style.display = 'flex';
            toggleWrapper.style.alignItems = 'center';
            toggleWrapper.style.marginTop = '10px';

            const arrowIcon = document.createElement('i');
            arrowIcon.className = 'fas fa-chevron-down';
            arrowIcon.style.transition = 'transform 0.3s';

            const sourcesLabel = document.createElement('span');
            sourcesLabel.textContent = ' Sources';
            sourcesLabel.style.marginLeft = '5px'; // Added margin

            const sourcesContent = document.createElement('div');
            sourcesContent.style.display = 'none';
            sourcesContent.style.marginTop = '10px';
            sourcesContent.style.border = '1px solid #ccc';
            sourcesContent.style.padding = '10px';
            sourcesContent.innerHTML = queries[query]['urls']
              .map(url => `<a href="${url}" target="_blank">${url}</a>`)
              .join(', ');

            // Restore state if previously set
            if (sourcesState[query]) {
              sourcesContent.style.display = 'block';
              arrowIcon.style.transform = 'rotate(180deg)';
            } else {
              sourcesContent.style.display = 'none';
              arrowIcon.style.transform = 'rotate(0deg)';
            }

            toggleWrapper.appendChild(arrowIcon);
            toggleWrapper.appendChild(sourcesLabel);
            cardBody.appendChild(toggleWrapper);
            cardBody.appendChild(sourcesContent);

            toggleWrapper.addEventListener('click', () => {
              if (sourcesContent.style.display === 'none') {
                sourcesContent.style.display = 'block';
                arrowIcon.style.transform = 'rotate(180deg)';
                sourcesState[query] = true; // Store state
              } else {
                sourcesContent.style.display = 'none';
                arrowIcon.style.transform = 'rotate(0deg)';
                sourcesState[query] = false; // Store state
              }
            });

            card.appendChild(cardBody);
            searchQueriesDiv.appendChild(card);
            i++;
          }
        }
        if (i != 10)
        {
          const button = document.getElementById("start-debate");
          button.style.display = "none";
          const notes = document.getElementById("searchqueriesnote");
          notes.style.display = "block";
        }
        else
        {
          const button = document.getElementById("start-debate");
          button.style.display = "block";
          const notes = document.getElementById("searchqueriesnote");
          notes.style.display = "none";
        }
      } else {
        console.error('No search queries found for this user.');
      }
    })
    .catch(error => console.error('Error fetching search queries:', error));
  }
}
setInterval(updateSearchQueries, 2000);

//Send the command to start the debate
function startDebate() {
  console.log("Debate started");
  state = 5;
  document.getElementById("searchqueries").style.display = "none";
  document.getElementById("debatewaiting").style.display = "block";
  fetch('/startDebate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({userhash: hash})
  })
  
  fetchdebate();
}

//Fetch the debate and update the client
var previousDebate = NaN;

function fetchdebate()
{
  fetch(`/getDebate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({userhash: hash})
  })
  .then(response => response.json())
  .then(data => {
    
      console.log(typeof data.debate);
      console.log(data.debate);
      if (JSON.stringify(data.debate) === JSON.stringify(previousDebate)) // Compare content
      {
        setTimeout(fetchdebate, 2000); // Still schedule next fetch
        return;
      }
      previousDebate = JSON.parse(JSON.stringify(data.debate)); // Deep copy
      const debateDiv = document.getElementById("debate");
      debateDiv.innerHTML = "";

      data.debate.forEach(({ speaker, content, evaluation, winner }) => {
        if (speaker === "pro" || speaker === "con") {
          const messageWrapper = document.createElement("div");
          messageWrapper.className = `message-wrapper ${speaker === "con" ? "right" : ""}`;
          
          const messageHeader = document.createElement("div");
          messageHeader.className = "message-header";
          
          const speakerName = document.createElement("span");
          speakerName.textContent = speaker === "pro" ? "Pro" : "Con";
          messageHeader.appendChild(speakerName);
          messageWrapper.appendChild(messageHeader);
    
          const bubble = document.createElement("div");
          bubble.className = `bubble bubble-${speaker === "pro" ? "left" : "right"}`;
          bubble.textContent = content;
          messageWrapper.appendChild(bubble);
    
          debateDiv.appendChild(messageWrapper);
        } else {
          const evaluationDiv = document.createElement("div");
          evaluationDiv.className = "evaluation";
          
          if (winner) {
            const winnerBadge = document.createElement("div");
            winnerBadge.className = "winner-badge";
            winnerBadge.textContent = `${winner === "pro" ? "Pro" : "Con"} Wins!`;
            evaluationDiv.appendChild(winnerBadge);
          }
          
          const evaluationContent = document.createElement("div");
          evaluationContent.className = "evaluation-content";
          evaluationContent.textContent = evaluation;
          evaluationDiv.appendChild(evaluationContent);
          
          debateDiv.appendChild(evaluationDiv);
        }
      });
    
      // If the last message was from the pro side, add a con input bubble with a send icon
      if (data.debate.length > 0) {
        const lastMessage = data.debate[data.debate.length - 1];
        if (lastMessage.speaker === "pro") {
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
          textInput.style.minWidth = "95%";
          textInput.style.maxWidth = "95%";
          
        
          const sendIcon = document.createElement("i");
          sendIcon.className = "fas fa-paper-plane";
          inputBubble.appendChild(textInput);
          inputBubble.appendChild(sendIcon);
          inputWrapper.appendChild(inputBubble);
        
          debateDiv.appendChild(inputWrapper);
          sendIcon.addEventListener("click", () => {
            const message = textInput.value.trim();
            if (!message) return;
            fetch('/appendToDebate', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                userhash: hash,
                message: message,
                speaker: "con"
              })
            })
          })
          .then(() => {
            textInput.value = ""; // Clear input after sending
            fetchdebate(); // Immediately fetch to update debate view
          });
        });
        textInput.focus(); // Auto-focus on the textarea
      }
    
      document.getElementById("debatewaiting").style.display = "none";
      document.getElementById("debate").style.display = "block";
      debateDiv.scrollTop = debateDiv.scrollHeight; // Scroll to bottom
  })
  //.catch(error => console.error('Error fetching debate:', error));

  setTimeout(fetchdebate, 2000);
}