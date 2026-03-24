/* ── CURSOR ── */
const cursor = document.getElementById("cursor");
const ring = document.getElementById("cursorRing");
let mx = 0,
  my = 0,
  rx = 0,
  ry = 0;
document.addEventListener("mousemove", (e) => {
  mx = e.clientX;
  my = e.clientY;
});
const animCursor = () => {
  cursor.style.left = mx + "px";
  cursor.style.top = my + "px";
  rx += (mx - rx) * 0.12;
  ry += (my - ry) * 0.12;
  ring.style.left = rx + "px";
  ring.style.top = ry + "px";
  requestAnimationFrame(animCursor);
};
animCursor();
document
  .querySelectorAll("a, button, .service-card, .testi-card")
  .forEach((el) => {
    el.addEventListener("mouseenter", () => {
      ring.style.transform = "translate(-50%, -50%) scale(1.6)";
      ring.style.opacity = "0.3";
    });
    el.addEventListener("mouseleave", () => {
      ring.style.transform = "translate(-50%, -50%) scale(1)";
      ring.style.opacity = "0.5";
    });
  });

/* ── NAVBAR SCROLL ── */
const navbar = document.getElementById("navbar");
const progressBar = document.getElementById("progressBar");
window.addEventListener("scroll", () => {
  if (window.scrollY > 30) navbar.classList.add("scrolled");
  else navbar.classList.remove("scrolled");
  const pct =
    (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
  progressBar.style.width = pct + "%";
});

/* ── SCROLL REVEAL ── */
const reveals = document.querySelectorAll(".reveal");
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("visible");
      }
    });
  },
  { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
);
reveals.forEach((r) => observer.observe(r));

/* ── COUNTER ── */
const counters = document.querySelectorAll("[data-count]");
const suffixes = { 10000: "k+", 500: "+", 98: "%", 6: "" };
const counterObs = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const target = parseInt(el.dataset.count);
      const suffix = suffixes[target] || "";
      let start = 0;
      const duration = 1600;
      const step = (timestamp) => {
        if (!start) start = timestamp;
        const progress = Math.min((timestamp - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const val = Math.floor(eased * target);
        el.textContent =
          (target >= 1000 ? (val / 1000).toFixed(1) : val) + suffix;
        if (progress < 1) requestAnimationFrame(step);
        else
          el.textContent =
            (target >= 1000 ? (target / 1000).toFixed(0) : target) + suffix;
      };
      requestAnimationFrame(step);
      counterObs.unobserve(el);
    });
  },
  { threshold: 0.5 },
);
counters.forEach((c) => counterObs.observe(c));

/* ── PARTICLES ── */
const canvas = document.getElementById("particles-canvas");
const ctx = canvas.getContext("2d");
let W,
  H,
  particles = [];
const resize = () => {
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;
};
resize();
window.addEventListener("resize", resize);

for (let i = 0; i < 40; i++) {
  particles.push({
    x: Math.random() * W,
    y: Math.random() * H,
    r: Math.random() * 2 + 0.5,
    vx: (Math.random() - 0.5) * 0.3,
    vy: (Math.random() - 0.5) * 0.3,
    alpha: Math.random() * 0.6 + 0.1,
  });
}

const animParticles = () => {
  ctx.clearRect(0, 0, W, H);
  particles.forEach((p) => {
    p.x += p.vx;
    p.y += p.vy;
    if (p.x < 0) p.x = W;
    if (p.x > W) p.x = 0;
    if (p.y < 0) p.y = H;
    if (p.y > H) p.y = 0;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(37,99,235,${p.alpha})`;
    ctx.fill();
  });
  // lines between close particles
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const dx = particles[i].x - particles[j].x;
      const dy = particles[i].y - particles[j].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 120) {
        ctx.beginPath();
        ctx.moveTo(particles[i].x, particles[i].y);
        ctx.lineTo(particles[j].x, particles[j].y);
        ctx.strokeStyle = `rgba(37,99,235,${0.08 * (1 - dist / 120)})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
  }
  requestAnimationFrame(animParticles);
};
animParticles();

/* ── HERO CARD PARALLAX ── */
const heroCard = document.querySelector(".booking-card");
document.addEventListener("mousemove", (e) => {
  if (!heroCard) return;
  const xPct = (e.clientX / window.innerWidth - 0.5) * 2;
  const yPct = (e.clientY / window.innerHeight - 0.5) * 2;
  heroCard.style.transform = `perspective(800px) rotateY(${-4 + xPct * 4}deg) rotateX(${yPct * 2}deg)`;
});
