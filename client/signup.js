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

document.getElementById('signin-form').addEventListener('submit', function(e) {
  e.preventDefault();
  const email = this.email.value.trim();
  const password = this.password.value;
  if (!email || !password) {
    alert('Please fill in both fields.');
    return;
  }
  if (/\s/.test(email)) {
    alert('Username should not contain spaces.');
    return;
  }
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(password);
  window.crypto.subtle.digest('SHA-256', dataBuffer)
    .then(hashBuffer => {
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      return fetch(`/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username: email, password: hashHex })
      });
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        console.log('Sign in successful:', data);
        document.cookie = "username=" + encodeURIComponent(email) + "; path=/; max-age=86400";
        window.location.href = 'index.html';
      } else {
        document.getElementById('username-error').style.display = 'block';
      }
    })
    .catch(error => {
      console.error('Error:', error);
      document.getElementById('username-error').style.display = 'block';
    });
});