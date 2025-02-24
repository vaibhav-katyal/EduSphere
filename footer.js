// Intersection Observer for footer animations
const footerObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, {
    threshold: 0.1
});

// Observe footer elements
document.querySelectorAll('.footer-grid, .newsletter-content').forEach(element => {
    footerObserver.observe(element);
});

// Newsletter form handler
function handleNewsletter(event) {
    event.preventDefault();
    const email = event.target.querySelector('input[type="email"]').value;

    // Add animation to button
    const button = event.target.querySelector('button');
    button.style.transform = 'scale(0.95)';
    setTimeout(() => {
        button.style.transform = '';
    }, 100);

    // Here you would typically send the email to your server
    console.log('Newsletter signup:', email);

    // Show success message
    const form = event.target;
    form.innerHTML = '<p style="color: #00FF66">Thanks for subscribing! 🎉</p>';
}

// Add hover effect to social links
document.querySelectorAll('.social-link').forEach(link => {
    link.addEventListener('mouseover', () => {
        link.style.transform = 'translateY(-2px)';
    });

    link.addEventListener('mouseout', () => {
        link.style.transform = '';
    });
});

// comment