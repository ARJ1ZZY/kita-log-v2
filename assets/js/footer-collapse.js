// Collapsible footer - hides on scroll down, shows on scroll up
let lastScrollTop = 0;
const footer = document.getElementById('main-footer');
const scrollThreshold = 10; // minimum scroll amount to trigger

if (footer) {
    window.addEventListener('scroll', function() {
        let scrollTop = window.pageYOffset || document.documentElement.scrollTop;

        // Determine scroll direction
        if (Math.abs(scrollTop - lastScrollTop) > scrollThreshold) {
            if (scrollTop > lastScrollTop) {
                // Scrolling down: hide footer
                footer.classList.add('footer-hidden');
            } else {
                // Scrolling up: show footer
                footer.classList.remove('footer-hidden');
            }
            lastScrollTop = scrollTop;
        }
    });
}