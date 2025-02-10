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
        event.preventDefault(); 

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

    // Signup Functionality
    signUpForm.addEventListener("submit", async function (e) {
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

        try {
            const response = await fetch("http://localhost:3000/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, email, password })
            });

            const data = await response.json();
            if (response.ok) {
                showPopup("✅ Account created successfully!");
                signUpForm.reset();
                signInForm.style.display = "block";
                signUpForm.style.display = "none";
                toggleAuth.textContent = "Create an Account";
            } else {
                showPopup(`⚠️ ${data.message}`);
            }
        } catch (error) {
            showPopup("⚠️ Server error. Please try again.");
        }
    });

    // Signin Functionality
    signInForm.addEventListener("submit", async function (e) {
        e.preventDefault();
        const email = document.querySelector("#signin-email").value.trim();
        const password = document.querySelector("#signin-password").value.trim();

        if (!email || !password) {
            showPopup("⚠️ Please fill in all fields!");
            return;
        }

        try {
            const response = await fetch("http://localhost:3000/signin", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();
            if (response.ok) {
                localStorage.setItem("token", data.token); // Store JWT token
                showPopup("✅ Sign-in successful!");

                setTimeout(() => {
                    window.location.href = 'landing.html'; // Redirect
                }, 1000);
            } else {
                showPopup(`⚠️ ${data.message}`);
            }
        } catch (error) {
            showPopup("⚠️ Server error. Please try again.");
        }
    });
});
