// ===== MOTION PREFERENCES =====
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ===== LOADING ANIMATION (logo + bar + curtains) =====
window.addEventListener('load', () => {
    const preloader = document.getElementById('preloader');
    if (!preloader) return;
    if (reducedMotion) {
        preloader.classList.add('done');
        return;
    }
    setTimeout(() => preloader.classList.add('reveal'), 3300);
    setTimeout(() => preloader.classList.add('done'), 4200);
});

// ===== HERO ELEMENTS =====
const heroWrapper = document.getElementById('heroWrapper');
const heroContentWrapper = document.getElementById('heroContentWrapper');
const heroScroll = document.getElementById('heroScroll');
const heroBg = document.getElementById('heroBg');
const bgImgPrimary = document.getElementById('heroBgImgPrimary');
const bgImgSecondary = document.getElementById('heroBgImgSecondary');
const bgImgs = [bgImgPrimary, bgImgSecondary].filter(Boolean);
const heroDoorLeft = document.getElementById('heroDoorLeft');
const heroDoorRight = document.getElementById('heroDoorRight');
const heroDoorSeam = document.getElementById('heroDoorSeam');

let mouseX = 0, mouseY = 0, smoothX = 0, smoothY = 0;
let bgScale = 1.05;
let heroContentAnimated = false;

// Easing helpers
const easeInOutCubic = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const easeOutCubic = t => 1 - Math.pow(1 - t, 3);

// Auto-loop crossfade between the two background images (the "wall" animation)
// Always starts with the logo image (primary), then alternates every 5s with 1s crossfade.
const CROSSFADE_PERIOD = 12000;
const crossfadeStart = performance.now();
function bgCrossfadeLoop(t) {
    if (bgImgPrimary && bgImgSecondary) {
        const elapsed = t - crossfadeStart;
        const phase = (elapsed % CROSSFADE_PERIOD) / CROSSFADE_PERIOD; // 0..1
        let opacitySecondary;
        if (phase < 5 / 12)        opacitySecondary = 0;                            // 0-5s: logo image only
        else if (phase < 6 / 12)   opacitySecondary = (phase - 5 / 12) * 12;        // 5-6s: fade to no-logo
        else if (phase < 11 / 12)  opacitySecondary = 1;                            // 6-11s: no-logo image
        else                       opacitySecondary = 1 - (phase - 11 / 12) * 12;   // 11-12s: fade back to logo
        bgImgPrimary.style.opacity = 1 - opacitySecondary;
        bgImgSecondary.style.opacity = opacitySecondary;
    }
}

function rafLoop(t) {
    // Mouse parallax on background
    smoothX += (mouseX - smoothX) * 0.05;
    smoothY += (mouseY - smoothY) * 0.05;

    const bgTransform = `scale(${bgScale}) translate(${smoothX * -5}px, ${smoothY * -3}px)`;
    bgImgs.forEach(img => { img.style.transform = bgTransform; });

    bgCrossfadeLoop(t || performance.now());

    requestAnimationFrame(rafLoop);
}

// Reveal hero content immediately (no scroll-driven door animation)
if (heroContentWrapper) {
    heroContentWrapper.style.opacity = '1';
    heroContentWrapper.style.transform = 'none';
}
animateHero();

if (!reducedMotion) {
    document.addEventListener('mousemove', (e) => {
        mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
        mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    });
    rafLoop(performance.now());
} else {
    // Run a single frame so the bg crossfade still applies once
    rafLoop(0);
}

// ===== HERO CANVAS - Particle Network =====
const canvas = document.getElementById('heroCanvas');
if (canvas && !reducedMotion) {
    const ctx = canvas.getContext('2d');
    let particles = [];

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 1.4 + 0.4;
            this.speedX = (Math.random() - 0.5) * 0.35;
            this.speedY = (Math.random() - 0.5) * 0.35;
            this.opacity = Math.random() * 0.22 + 0.04;
            this.color = Math.random() > 0.65 ? '#00a651' : '#f7931e';
        }
        update() {
            this.x += this.speedX;
            this.y += this.speedY;
            if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
            if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;
        }
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.globalAlpha = this.opacity;
            ctx.fill();
            ctx.globalAlpha = 1;
        }
    }

    const count = Math.min(36, Math.floor(canvas.width * canvas.height / 34000));
    for (let i = 0; i < count; i++) particles.push(new Particle());

    function connectParticles() {
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 120) {
                    ctx.beginPath();
                    ctx.strokeStyle = '#00a651';
                    ctx.globalAlpha = 0.035 * (1 - dist / 120);
                    ctx.lineWidth = 0.5;
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.stroke();
                    ctx.globalAlpha = 1;
                }
            }
        }
    }

    function animateParticles() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => { p.update(); p.draw(); });
        connectParticles();
        requestAnimationFrame(animateParticles);
    }
    animateParticles();
}

// ===== HERO TEXT STAGGER (fires when doors open past threshold) =====
function animateHero() {
    const words = document.querySelectorAll('.title-word');
    const amp = document.querySelector('.title-amp');
    const slogan = document.querySelector('.hero-slogan');
    const actions = document.querySelector('.hero-actions');
    const statsRow = document.querySelector('.hero-stats-row');
    const ease = 'cubic-bezier(0.16, 1, 0.3, 1)';

    if (reducedMotion) {
        words.forEach(w => { w.style.opacity = '1'; w.style.transform = 'none'; });
        if (amp) { amp.style.opacity = '1'; amp.style.transform = 'none'; }
        if (slogan) { slogan.style.opacity = '1'; slogan.style.transform = 'none'; }
        if (actions) { actions.style.opacity = '1'; actions.style.transform = 'none'; }
        if (statsRow) { statsRow.style.opacity = '1'; statsRow.style.transform = 'none'; }
        animateCounters();
        return;
    }

    words.forEach((word, i) => {
        setTimeout(() => {
            word.style.transition = `opacity 0.8s ${ease}, transform 0.8s ${ease}`;
            word.style.opacity = '1';
            word.style.transform = 'translateY(0) rotateX(0)';
        }, 40 + i * 100);
    });

    if (amp) {
        setTimeout(() => {
            amp.style.transition = 'opacity 0.4s, transform 0.55s cubic-bezier(0.34, 1.56, 0.64, 1)';
            amp.style.opacity = '1';
            amp.style.transform = 'scale(1)';
        }, 260);
    }

    if (slogan) {
        setTimeout(() => {
            slogan.style.transition = `opacity 0.8s, transform 0.8s ${ease}`;
            slogan.style.opacity = '1';
            slogan.style.transform = 'translateY(0)';
        }, 520);
    }

    if (actions) {
        setTimeout(() => {
            actions.style.transition = `opacity 0.8s, transform 0.8s ${ease}`;
            actions.style.opacity = '1';
            actions.style.transform = 'translateY(0)';
        }, 640);
    }

    setTimeout(() => {
        if (statsRow) {
            statsRow.style.transition = `opacity 0.8s, transform 0.8s ${ease}`;
            statsRow.style.opacity = '1';
            statsRow.style.transform = 'translateY(0)';
        }
        animateCounters();
    }, 760);
}

// ===== COUNTER ANIMATION =====
function animateCounters() {
    document.querySelectorAll('[data-count]').forEach(counter => {
        if (counter.dataset.counted) return;
        const target = parseInt(counter.dataset.count);
        const duration = reducedMotion ? 0 : 1400;
        const start = performance.now();
        function update(now) {
            const elapsed = now - start;
            const progress = duration === 0 ? 1 : Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            counter.textContent = Math.floor(target * eased);
            if (progress < 1) requestAnimationFrame(update);
            else { counter.textContent = target; counter.dataset.counted = 'true'; }
        }
        requestAnimationFrame(update);
    });
}

// ===== SCROLL REVEAL =====
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const delay = parseInt(entry.target.dataset.delay || 0);
            setTimeout(() => {
                entry.target.classList.add('animated');
                if (entry.target.querySelector && entry.target.querySelector('[data-count]')) {
                    animateCounters();
                }
            }, delay);
        }
    });
}, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });

document.querySelectorAll('[data-animate]').forEach(el => observer.observe(el));

// ===== NAVBAR =====
const navbar = document.getElementById('navbar');
const navToggle = document.getElementById('navToggle');
const navMenu = document.getElementById('navMenu');
const navIndicator = document.getElementById('navIndicator');
const navLinks = document.querySelectorAll('.nav-link');

function moveIndicator(target, animate = true) {
    if (!navIndicator || !target || !navMenu) return;
    if (window.innerWidth <= 900) {
        navIndicator.classList.remove('visible');
        return;
    }
    const menuRect = navMenu.getBoundingClientRect();
    const linkRect = target.getBoundingClientRect();
    const x = linkRect.left - menuRect.left;
    const w = linkRect.width;
    if (!animate) {
        const prev = navIndicator.style.transition;
        navIndicator.style.transition = 'none';
        navIndicator.style.width = w + 'px';
        navIndicator.style.transform = `translateX(${x}px)`;
        void navIndicator.offsetWidth;
        navIndicator.style.transition = prev;
    } else {
        navIndicator.style.width = w + 'px';
        navIndicator.style.transform = `translateX(${x}px)`;
    }
    navIndicator.classList.add('visible');
}

function updateIndicatorToActive(animate = true) {
    const active = document.querySelector('.nav-link.active');
    if (active) moveIndicator(active, animate);
}

window.addEventListener('load', () => {
    requestAnimationFrame(() => updateIndicatorToActive(false));
});
window.addEventListener('resize', () => updateIndicatorToActive(false));

navLinks.forEach(link => {
    link.addEventListener('mouseenter', () => moveIndicator(link, true));
});
navMenu && navMenu.addEventListener('mouseleave', () => updateIndicatorToActive(true));

window.addEventListener('scroll', () => {
    if (!navbar) return;
    navbar.classList.toggle('scrolled', window.scrollY > 40);
    const backTop = document.getElementById('backToTop');
    if (backTop) backTop.classList.toggle('visible', window.scrollY > 500);

    const sections = document.querySelectorAll('section[id]');
    let current = '';
    sections.forEach(s => { if (window.scrollY >= s.offsetTop - 140) current = s.id; });
    let changed = false;
    navLinks.forEach(l => {
        const href = l.getAttribute('href') || '';
        // Only scroll-spy anchor links. Leave cross-page links (services.html, index.html#x) untouched.
        if (!href.startsWith('#')) return;
        const isActive = href === '#' + current;
        if (isActive && !l.classList.contains('active')) changed = true;
        l.classList.toggle('active', isActive);
    });
    if (changed) updateIndicatorToActive(true);
});

if (navToggle) {
    navToggle.addEventListener('click', () => {
        const open = navToggle.classList.toggle('active');
        navMenu.classList.toggle('open', open);
        navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        navToggle.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
    });
}

navLinks.forEach(l => l.addEventListener('click', () => {
    navToggle && navToggle.classList.remove('active');
    navMenu && navMenu.classList.remove('open');
    if (navToggle) {
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.setAttribute('aria-label', 'Ouvrir le menu');
    }
}));

// ===== MAGNETIC ELEMENTS =====
if (!reducedMotion) {
    document.querySelectorAll('[data-magnetic]').forEach(el => {
        const strength = parseFloat(el.dataset.magnetic) || 0.35;
        let rafId;
        el.addEventListener('mousemove', (e) => {
            cancelAnimationFrame(rafId);
            rafId = requestAnimationFrame(() => {
                const rect = el.getBoundingClientRect();
                const x = e.clientX - (rect.left + rect.width / 2);
                const y = e.clientY - (rect.top + rect.height / 2);
                el.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
            });
        });
        el.addEventListener('mouseleave', () => {
            cancelAnimationFrame(rafId);
            el.style.transform = '';
        });
    });
}

// ===== SMOOTH SCROLL =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href === '#' || !href) return;
        const target = document.querySelector(href);
        if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
        }
    });
});

// ===== TILT EFFECT (service + sector cards) — pointer hover only =====
if (!reducedMotion && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    document.querySelectorAll('.service-card, .sector-card').forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width - 0.5;
            const y = (e.clientY - rect.top) / rect.height - 0.5;
            card.style.transform = `perspective(800px) rotateX(${-y * 6}deg) rotateY(${x * 6}deg) translateY(-6px)`;
        });
        card.addEventListener('mouseleave', () => { card.style.transform = ''; });
    });
}

// ===== PARALLAX ON ABOUT IMAGE =====
if (!reducedMotion) {
    window.addEventListener('scroll', () => {
        const aboutImg = document.querySelector('.about-image');
        if (aboutImg) {
            const rect = aboutImg.getBoundingClientRect();
            if (rect.top < window.innerHeight && rect.bottom > 0) {
                const offset = (rect.top / window.innerHeight) * 20;
                aboutImg.style.transform = `scale(1.05) translateY(${offset}px)`;
            }
        }
    });
}
