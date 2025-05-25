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

function animateCount(id, target, duration) {
const element = document.getElementById(id);
let startTime = null;

function easeOutExpo(t) {
    return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

function step(timestamp) {
    if (!startTime) startTime = timestamp;
    const elapsed = timestamp - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easedProgress = easeOutExpo(progress);
    const current = Math.floor(easedProgress * target);
    element.textContent = current.toLocaleString();
    
    if (progress < 1) {
    requestAnimationFrame(step);
    } else {
    element.textContent = target.toLocaleString();
    }
}

requestAnimationFrame(step);
}

fetch('/numDebates', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({"hi":"hi"})
})
.then(response => response.json())
.then(data => {
    animateCount("debatesCount", data.numDebates, 2000);
})

fetch('/numAnalyses', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({"hi":"hi"})
})
.then(response => response.json())
.then(data => {
    animateCount("viewsCount", data.numAnalyses, 2000);
})