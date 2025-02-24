const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, {
    threshold: 0.1
});

// Observe elements
document.querySelectorAll('.hero, .features-grid, .testimonial-card, .pricing-card').forEach(element => {
    observer.observe(element);
});

// Add stagger effect to testimonial cards
document.querySelectorAll('.testimonial-card').forEach((card, index) => {
    card.style.transitionDelay = `${index * 0.1}s`; // ✅ Fixed syntax issue (added backticks)
});

// Add stagger effect to pricing cards
document.querySelectorAll('.pricing-card').forEach((card, index) => {
    card.style.transitionDelay = `${index * 0.1}s`; // ✅ Fixed syntax issue (added backticks)
});

document.addEventListener("DOMContentLoaded", async function () {
    async function fetchUserData() {
        const token = localStorage.getItem("token");
        if (!token) return null;

        try {
            const response = await fetch("http://localhost:3000/user", {
                headers: { Authorization: token }
            });
            if (!response.ok) return null;
            return await response.json();
        } catch (error) {
            return null;
        }
    }

    async function updateNavbar() {
        const user = await fetchUserData();
        const authNav = document.getElementById("nav-auth");

        if (user) {
            authNav.innerHTML = `
                <a href="landing.html"><li>Home</li></a>
                <a href="groupPage.html"><li>Group Study</li></a>
                <a href="library.html"><li>Library</li></a>
                <a href="quiz.html"><li>Quiz</li></a>
                <a href="feedback.html"><li>Contact Us</li></a>
                <li class="profile-container">
                    <img src="${user.profilePic}" class="profile-pic" alt="Profile Picture">
                    <span class="profile-text">Hi👋, ${user.username}!</span>
                </li>
                <li><button class="logout-btn" id="logout-btn">Logout</button></li>
            `;

            document.getElementById("logout-btn").addEventListener("click", () => {
                localStorage.removeItem("token");
                window.location.reload();
            });
        }
    }

    updateNavbar();
});


// const menuToggle = document.querySelector('.menu-toggle');
// const navLinks = document.querySelector('.navbar ul');

// menuToggle.addEventListener('click', () => {
//     navLinks.classList.toggle('show');
// });



