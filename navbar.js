const menuBtn = document.querySelector('.menu-icon');
const closeBtn = document.querySelector('.close-icon');
const navMenu = document.querySelector('.navbar ul');

menuBtn.addEventListener('click', () => {
    navMenu.classList.add('show');
    menuBtn.style.display = 'none';
    closeBtn.style.display = 'block';
});

closeBtn.addEventListener('click', () => {
    navMenu.classList.remove('show');
    menuBtn.style.display = 'block';
    closeBtn.style.display = 'none';
});