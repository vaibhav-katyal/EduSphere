document.addEventListener("DOMContentLoaded", function () {
    const signInForm = document.querySelector("#signin-form");
    const signUpForm = document.querySelector("#signup-form");
    const otpForm = document.querySelector("#otp-form");
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
            otpForm.style.display = "none";
            toggleAuth.textContent = "Create an Account";
        } else {
            signInForm.style.display = "none";
            signUpForm.style.display = "block";
            otpForm.style.display = "none";
            toggleAuth.textContent = "Already have an account? Sign In";
        }
    });

    async function sendOTP(email) {
        try {
            const response = await fetch("http://localhost:3000/send-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email })
            });

            const data = await response.json();
            if (response.ok) {
                showPopup("✅ OTP sent to your email.");
                return true;
            } else {
                showPopup(`⚠️ ${data.message}`);
                return false;
            }
        } catch (error) {
            showPopup("⚠️ Error sending OTP.");
            return false;
        }
    }

    // Signup with OTP
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

        if (!await sendOTP(email)) return;

        otpForm.style.display = "block";
        signUpForm.style.display = "none";

        otpForm.addEventListener("submit", async function (e) {
            e.preventDefault();
            const otp = document.querySelector("#otp-input").value.trim();

            try {
                const response = await fetch("http://localhost:3000/signup", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ username, email, password, otp })
                });

                const data = await response.json();
                if (response.ok) {
                    showPopup("✅ OTP verified! Please log in.");
                    otpForm.style.display = "none";
                    signUpForm.reset();
                    toggleAuth.click(); // Switch to Sign-in form
                } else {
                    showPopup(`⚠️ ${data.message}`);
                }
            } catch (error) {
                showPopup("⚠️ Error verifying OTP.");
            }
        });
    });

    // Signin with Password or OTP
    signInForm.addEventListener("submit", async function (e) {
        e.preventDefault();
        const email = document.querySelector("#signin-email").value.trim();
        const password = document.querySelector("#signin-password").value.trim();

        if (!email) {
            showPopup("⚠️ Please enter your email!");
            return;
        }

        if (password) {
            // Password-based login
            try {
                const response = await fetch("http://localhost:3000/signin", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();
                if (response.ok) {
                    localStorage.setItem("username", data.username);
                    localStorage.setItem("token", data.token);
                    showPopup("✅ Sign-in successful!");
                    setTimeout(() => window.location.href = "index.html", 1000);
                } else {
                    showPopup(`⚠️ ${data.message}`);
                }
            } catch (error) {
                showPopup("⚠️ Server error. Please try again.");
            }
        } else {
            // OTP-based login
            if (!await sendOTP(email)) return;

            otpForm.style.display = "block";
            signInForm.style.display = "none";

            otpForm.addEventListener("submit", async function (e) {
                e.preventDefault();
                const otp = document.querySelector("#otp-input").value.trim();

                try {
                    const response = await fetch("http://localhost:3000/verify-otp", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ email, otp })
                    });

                    const data = await response.json();
                    if (response.ok) {
                        localStorage.setItem("username", data.username);
                        localStorage.setItem("token", data.token);
                        showPopup("✅ OTP verified! Redirecting...");
                        setTimeout(() => window.location.href = "index.html", 1000);
                    } else {
                        showPopup(`⚠️ ${data.message}`);
                    }
                } catch (error) {
                    showPopup("⚠️ Error verifying OTP.");
                }
            });
        }
    });
});
