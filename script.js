document.getElementById('year').textContent = new Date().getFullYear();

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Scroll reveal ---------- */
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

/* ---------- Your session (real, client-side only) ---------- */
(function sessionWidget() {
  const ua = navigator.userAgent;
  const browser = (() => {
    if (ua.includes('Edg/')) return 'Microsoft Edge';
    if (ua.includes('Chrome/') && !ua.includes('Chromium')) return 'Chrome';
    if (ua.includes('Firefox/')) return 'Firefox';
    if (ua.includes('Safari/') && !ua.includes('Chrome')) return 'Safari';
    return 'Unknown browser';
  })();
  const os = (() => {
    if (ua.includes('Win')) return 'Windows';
    if (ua.includes('Mac')) return 'macOS';
    if (ua.includes('Android')) return 'Android';
    if (ua.includes('like Mac') || ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
    if (ua.includes('Linux')) return 'Linux';
    return 'Unknown OS';
  })();

  document.getElementById('sBrowser').textContent = browser;
  document.getElementById('sOs').textContent = os;
  document.getElementById('sScreen').textContent = `${window.screen.width} × ${window.screen.height}`;
  try {
    document.getElementById('sTz').textContent = Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (e) {
    document.getElementById('sTz').textContent = 'Unavailable';
  }

  fetch('https://ipwho.is/')
    .then(res => res.json())
    .then(data => {
      if (!data || data.success === false) throw new Error('lookup failed');
      document.getElementById('sIp').textContent = data.ip || 'Unavailable';
      document.getElementById('sCity').textContent = [data.city, data.region].filter(Boolean).join(', ') || 'Unavailable';
      document.getElementById('sCountry').textContent = data.country || 'Unavailable';
      document.getElementById('sIsp').textContent = (data.connection && data.connection.isp) || 'Unavailable';
    })
    .catch(() => {
      ['sIp', 'sCity', 'sCountry', 'sIsp'].forEach(id => {
        document.getElementById(id).textContent = 'Unavailable — network blocked lookup';
      });
    });
})();

/* ---------- Globe: illustrative simulated traffic visualization ---------- */
(function globe() {
  const canvas = document.getElementById('globeCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const eventCountEl = document.getElementById('eventCount');
  const arcCountEl = document.getElementById('arcCount');

  const hubs = [
    { lat: 40.7, lon: -74.0, name: 'New York' },
    { lat: 51.5, lon: -0.1, name: 'London' },
    { lat: 50.1, lon: 8.7, name: 'Frankfurt' },
    { lat: 1.35, lon: 103.8, name: 'Singapore' },
    { lat: 35.7, lon: 139.7, name: 'Tokyo' },
    { lat: -33.9, lon: 151.2, name: 'Sydney' },
    { lat: -23.6, lon: -46.6, name: 'São Paulo' },
    { lat: 19.1, lon: 72.9, name: 'Mumbai' },
    { lat: -26.2, lon: 28.0, name: 'Johannesburg' },
    { lat: 43.7, lon: -79.4, name: 'Toronto' }
  ];

  let w, h, cx, cy, radius;
  function resize() {
    const rect = canvas.parentElement.getBoundingClientRect();
    w = canvas.width = rect.width * devicePixelRatio;
    h = canvas.height = rect.height * devicePixelRatio;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    cx = w / 2;
    cy = h / 2;
    radius = Math.min(w, h) * 0.32;
  }
  resize();
  window.addEventListener('resize', resize);

  function toVec3(lat, lon, rotDeg) {
    const phi = (90 - lat) * Math.PI / 180;
    const theta = (lon + rotDeg) * Math.PI / 180;
    return {
      x: Math.sin(phi) * Math.cos(theta),
      y: Math.cos(phi),
      z: Math.sin(phi) * Math.sin(theta)
    };
  }
  function project(v) {
    return { x: cx + v.x * radius, y: cy - v.y * radius, z: v.z };
  }
  function slerp(a, b, t) {
    const dot = Math.max(-1, Math.min(1, a.x*b.x + a.y*b.y + a.z*b.z));
    const omega = Math.acos(dot) || 0.0001;
    const s = Math.sin(omega);
    const wa = Math.sin((1 - t) * omega) / s;
    const wb = Math.sin(t * omega) / s;
    return {
      x: wa * a.x + wb * b.x,
      y: wa * a.y + wb * b.y,
      z: wa * a.z + wb * b.z
    };
  }

  const colors = ['#4C8CFF', '#E3A93B', '#FF6259', '#2BD9C9'];
  let arcs = [];
  let eventCount = 0;
  let rot = 0;
  let lastSpawn = 0;

  function spawnArc(t) {
    let a = hubs[Math.floor(Math.random() * hubs.length)];
    let b = hubs[Math.floor(Math.random() * hubs.length)];
    while (b === a) b = hubs[Math.floor(Math.random() * hubs.length)];
    arcs.push({
      a, b,
      start: t,
      duration: 1600 + Math.random() * 800,
      color: colors[Math.floor(Math.random() * colors.length)]
    });
  }

  function draw(t) {
    ctx.clearRect(0, 0, w, h);
    if (!prefersReducedMotion) rot = (t / 90) % 360;

    // meridians & parallels
    ctx.lineWidth = 1 * devicePixelRatio;
    for (let la = -60; la <= 60; la += 30) {
      ctx.beginPath();
      for (let lo = 0; lo <= 360; lo += 6) {
        const v = toVec3(la, lo, rot);
        const p = project(v);
        const alpha = 0.06 + Math.max(0, v.z) * 0.18;
        if (lo === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
      }
      ctx.strokeStyle = 'rgba(76,140,255,0.12)';
      ctx.stroke();
    }
    for (let lo = 0; lo < 360; lo += 30) {
      ctx.beginPath();
      for (let la = -90; la <= 90; la += 6) {
        const v = toVec3(la, lo, rot);
        const p = project(v);
        if (la === -90) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
      }
      ctx.strokeStyle = 'rgba(76,140,255,0.10)';
      ctx.stroke();
    }

    // hubs
    hubs.forEach(hub => {
      const v = toVec3(hub.lat, hub.lon, rot);
      const p = project(v);
      const front = v.z > -0.15;
      ctx.beginPath();
      ctx.arc(p.x, p.y, front ? 3 * devicePixelRatio : 1.5 * devicePixelRatio, 0, Math.PI * 2);
      ctx.fillStyle = front ? 'rgba(43,217,201,0.9)' : 'rgba(43,217,201,0.25)';
      ctx.fill();
    });

    // arcs
    if (!prefersReducedMotion && t - lastSpawn > 900) {
      spawnArc(t);
      lastSpawn = t;
    }
    arcs = arcs.filter(arc => t - arc.start < arc.duration);
    arcs.forEach(arc => {
      const progress = (t - arc.start) / arc.duration;
      const va = toVec3(arc.a.lat, arc.a.lon, rot);
      const vb = toVec3(arc.b.lat, arc.b.lon, rot);
      const steps = 24;
      const head = Math.min(1, progress * 1.4);
      const tailStart = Math.max(0, head - 0.35);
      ctx.beginPath();
      for (let i = 0; i <= steps; i++) {
        const s = tailStart + (head - tailStart) * (i / steps);
        if (s < 0 || s > 1) continue;
        const mid = slerp(va, vb, s);
        const lift = 1 + Math.sin(s * Math.PI) * 0.18;
        const p = project({ x: mid.x * lift, y: mid.y * lift, z: mid.z * lift });
        if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
      }
      ctx.strokeStyle = arc.color;
      ctx.globalAlpha = 0.75 * (1 - Math.max(0, progress - 0.7) / 0.3);
      ctx.lineWidth = 1.5 * devicePixelRatio;
      ctx.stroke();
      ctx.globalAlpha = 1;

      if (progress > 0.98 && !arc.counted) {
        arc.counted = true;
        eventCount++;
      }
    });

    if (eventCountEl) eventCountEl.textContent = eventCount.toLocaleString();
    if (arcCountEl) arcCountEl.textContent = arcs.length;

    if (!prefersReducedMotion) requestAnimationFrame(draw);
  }

  requestAnimationFrame(draw);
})();
