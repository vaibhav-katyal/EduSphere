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
            const response = await fetch("https://edusphere-c0wr.onrender.com/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, email, password })
            });

            const data = await response.json();
            if (response.ok) {
                showPopup("✅ Account created successfully!");
                signUpForm.reset();
                toggleAuth.click(); // Switch to sign-in form
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
            const response = await fetch("https://edusphere-c0wr.onrender.com/signin", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();
            if (response.ok) {
                localStorage.setItem("username", data.username); // Store username
                localStorage.setItem("token", data.token); // Store JWT token
                showPopup("✅ Sign-in successful!");

                setTimeout(() => {
                    window.location.href = 'index.html'; // Redirect
                }, 1000);
            } else {
                showPopup(`⚠️ ${data.message}`);
            }
        } catch (error) {
            showPopup("⚠️ Server error. Please try again.");
        }
    });
});


fetch("https://edusphere-c0wr.onrender.com/signin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
})
.then(response => response.json())
.then(data => {
    console.log("🔹 Server Response:", data); // ✅ Debugging

    if (data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("username", data.username || "User");  // ✅ Store username properly
        console.log("📌 Stored in LocalStorage:", localStorage.getItem("username")); // ✅ Debugging
        window.location.href = "index.html";
    } else {
        alert("Login failed: " + data.message);
    }
})
.catch(error => console.error("Fetch Error:", error));
