const cookies = document.cookie.split('; ');
let username = null;
for (let cookie of cookies) {
    if (cookie.startsWith('username=')) {
        username = decodeURIComponent(cookie.split('=')[1]);
        break;
    }
}

if (username) {
    document.getElementById('profileUsername').textContent = username;
    const signinElement = document.getElementById("signin");
    signinElement.innerHTML = `<li class="nav-item">
                                    <a class="nav-link" href="profile.html">
                                        <i class="fas fa-user"></i> ${username}
                                    </a>
                                </li>`;
    
    fetch('/getUserDebateCount', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({username: username})
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById('debatesWon').textContent = data.debate_wins;
        document.getElementById('totalDebates').textContent = data.debate_count;
        document.getElementById('winRate').textContent = data.debate_count === 0 ? "0%" : `${Math.round((data.debate_wins / data.debate_count) * 100)}%`;
        
        const xp = 1+(data.debate_wins * 2) + (data.debate_count-data.debate_wins);
        let level = 0;
        let xpRequired = 0;

        while (xp >= xpRequired) {
            level++;
            xpRequired += Math.log(level) / Math.log(Math.cbrt(2));
        }
        let xpRequiredForLevel = xpRequired - Math.log(level) / Math.log(Math.cbrt(2));
        level--;
        let progressPercent = ((xp - xpRequiredForLevel) / (xpRequired - xpRequiredForLevel)) * 100;
        const rankingProgressElement = document.getElementById('rankingProgress');
        rankingProgressElement.style.width = `${progressPercent}%`;
        rankingProgressElement.textContent = `${xp} / ${xpRequired.toFixed(0)}`;
        document.getElementById('rankTierDescription').textContent = `Level ${level} - ${xp} XP`;
    })
}