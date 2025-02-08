document.addEventListener("DOMContentLoaded", function () {
    const signInForm = document.querySelector("#signin-form");
    const signUpForm = document.querySelector("#signup-form");
    const toggleAuth = document.querySelector("#toggle-auth");
    const popup = document.querySelector("#popup");

    function showPopup(message) {
        popup.textContent = message;
        popup.style.display = "block";
        setTimeout(() => { popup.style.display = "none"; }, 3000);
    }

    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    function isValidPassword(password) {
        return password.length >= 6;
    }

    toggleAuth.addEventListener("click", function (event) {
        event.preventDefault(); // Prevent page reload

        if (signInForm.style.display === "none") {
            signInForm.style.display = "block";
            signUpForm.style.display = "none";
            toggleAuth.textContent = "Create an Account";
        } else {
            signInForm.style.display = "none";
            signUpForm.style.display = "block";
            toggleAuth.textContent = "Already have an account? Sign In";
        }
    });

    signUpForm.addEventListener("submit", function (e) {
        e.preventDefault();
        const username = document.querySelector("#signup-username").value.trim();
        const email = document.querySelector("#signup-email").value.trim();
        const password = document.querySelector("#signup-password").value.trim();

        if (!username || !email || !password) {
            showPopup("⚠️ Please fill in all fields!");
            return;
        }
        if (!isValidEmail(email)) {
            showPopup("⚠️ Invalid email format!");
            return;
        }
        if (!isValidPassword(password)) {
            showPopup("⚠️ Password must be at least 6 characters!");
            return;
        }

        if (localStorage.getItem(email)) {
            showPopup("⚠️ Email is already registered!");
            return;
        }

        localStorage.setItem(email, JSON.stringify({ username, password }));
        showPopup("✅ Account created successfully!");
        signUpForm.reset();
        signInForm.style.display = "block";
        signUpForm.style.display = "none";
        toggleAuth.textContent = "Create an Account";
    });

    signInForm.addEventListener("submit", function (e) {
        e.preventDefault();
        const email = document.querySelector("#signin-email").value.trim();
        const password = document.querySelector("#signin-password").value.trim();
    
        if (!email || !password) {
            showPopup("⚠️ Please fill in all fields!");
            return;
        }
    
        const userData = localStorage.getItem(email);
        if (!userData) {
            showPopup("⚠️ No account found! Please create an account.");
            return;
        }
    
        const { username, password: storedPassword } = JSON.parse(userData);
        if (password !== storedPassword) {
            showPopup("⚠️ Incorrect password!");
            return;
        }
    
        // Save user session
        localStorage.setItem('user', JSON.stringify({ username, email }));
        showPopup("✅ Sign-in successful!");
    
        setTimeout(() => {
            window.location.href = 'landing.html'; // Redirect to landing page
        }, 1000);
    });
    
});


function handleSignOut() {
    // Clear user data from localStorage
    localStorage.removeItem('user');

    // Redirect to sign-in page
    window.location.href = 'sign.html';
}