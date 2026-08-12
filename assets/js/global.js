// Header Hide on Scroll (with smooth transition)
let lastScrollTop = 0;
const header = document.querySelector('.top-header');
const scrollThreshold = 50;

if (header) {
    window.addEventListener('scroll', function() {
        let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        if (Math.abs(scrollTop - lastScrollTop) > scrollThreshold) {
            if (scrollTop > lastScrollTop && scrollTop > 100) {
                // Scrolling down: hide header
                header.style.transform = 'translateY(-100%)';
            } else {
                // Scrolling up: show header
                header.style.transform = 'translateY(0)';
            }
            lastScrollTop = scrollTop;
        }
    });
}

// Chatbot theme overrides (ensure deep charcoal)
const chatContainer = document.querySelector('.chat-popup');
if (chatContainer) {
    chatContainer.style.backgroundColor = 'var(--bg-card)';
}