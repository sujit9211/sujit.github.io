document.getElementById('year').textContent = new Date().getFullYear();
 
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 
if (!prefersReducedMotion && 'IntersectionObserver' in window) {
  const entries = document.querySelectorAll('.entry, .platform-group, .post-card, .cert-column');
  entries.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(12px)';
    el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
  });
 
  const observer = new IntersectionObserver((observed) => {
    observed.forEach(item => {
      if (item.isIntersecting) {
        item.target.style.opacity = '1';
        item.target.style.transform = 'translateY(0)';
        observer.unobserve(item.target);
      }
    });
  }, { threshold: 0.15 });
 
  entries.forEach(el => observer.observe(el));
}