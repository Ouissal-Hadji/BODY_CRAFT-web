document.addEventListener('DOMContentLoaded', () => {
    const observerOptions = {
        threshold: 0.15,
        rootMargin: "0px 0px -50px 0px"
    };

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('reveal-active');
            }
        });
    }, observerOptions);

    const elementsToReveal = document.querySelectorAll('.reveal-up, .reveal-down, .reveal-scale');
    elementsToReveal.forEach(el => revealObserver.observe(el));
});
