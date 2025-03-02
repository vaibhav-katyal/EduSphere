// Wait for DOM to load
document.addEventListener("DOMContentLoaded", () => {
    // Mobile menu toggle
    const menuToggle = document.querySelector(".menu-toggle")
    const navLinks = document.querySelector(".nav-links")
  
    if (menuToggle) {
      menuToggle.addEventListener("click", () => {
        navLinks.classList.toggle("active")
        menuToggle.classList.toggle("active")
      })
    }
  
    // Intersection Observer for animations
    const observerOptions = {
      root: null,
      rootMargin: "0px",
      threshold: 0.1,
    }
  
    // Observer for features
    const featureObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible")
        }
      })
    }, observerOptions)
  
    // Observe all features
    document.querySelectorAll(".features-grid, .dashboard-card, .benefit-card").forEach((el) => {
      featureObserver.observe(el)
      // Add initial hidden state
      el.style.opacity = "0"
      el.style.transform = "translateY(20px)"
      el.style.transition = "all 0.6s ease-out"
    })
  
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener("click", function (e) {
        e.preventDefault()
  
        const targetId = this.getAttribute("href")
        if (targetId === "#") return
  
        const targetElement = document.querySelector(targetId)
        if (targetElement) {
          window.scrollTo({
            top: targetElement.offsetTop - 80,
            behavior: "smooth",
          })
        }
  
        // Close mobile menu if open
        if (navLinks.classList.contains("active")) {
          navLinks.classList.remove("active")
          menuToggle.classList.remove("active")
        }
      })
    })
  
    // Dashboard card hover effects
    const dashboardCards = document.querySelectorAll(".dashboard-card")
  
    dashboardCards.forEach((card) => {
      card.addEventListener("mouseenter", () => {
        dashboardCards.forEach((c) => {
          if (c !== card) {
            c.style.opacity = "0.7"
          }
        })
      })
  
      card.addEventListener("mouseleave", () => {
        dashboardCards.forEach((c) => {
          c.style.opacity = "1"
        })
      })
    })
  
    // Add visible class to elements in viewport on page load
    setTimeout(() => {
      document.querySelectorAll(".features-grid, .dashboard-card, .benefit-card").forEach((el) => {
        const rect = el.getBoundingClientRect()
        if (rect.top < window.innerHeight) {
          el.classList.add("visible")
        }
      })
    }, 300)
  })
  
  