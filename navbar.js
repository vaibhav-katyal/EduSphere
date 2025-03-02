const menuBtn = document.getElementById('menu-toggle');
const navAuth = document.getElementById('nav-auth');
const navUser = document.getElementById('nav-user');
let isMenuOpen = false;

menuBtn.addEventListener('click', (event) => {
    event.stopPropagation(); // Prevent immediate close

    if (navAuth.style.display !== 'none') {
        navAuth.classList.toggle('show');
    } else {
        navUser.classList.toggle('show');
    }

    isMenuOpen = !isMenuOpen;
    menuBtn.innerHTML = isMenuOpen ? '&#10006;' : '&#9776;'; // Change ☰ to ❌ (cross)
});

// Close menu when clicking outside
document.addEventListener('click', (event) => {
    if (isMenuOpen && !navAuth.contains(event.target) && !navUser.contains(event.target) && event.target !== menuBtn) {
        navAuth.classList.remove('show');
        navUser.classList.remove('show');
        isMenuOpen = false;
        menuBtn.innerHTML = '&#9776;'; // Reset to ☰ (hamburger icon)
    }
});


