// Shakik Zaman portfolio — static build interactions
(function () {
  "use strict";
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- Network canvases (hero interactive, footer faint) ---- */
  document.querySelectorAll("canvas").forEach(function (canvas, idx) {
    var ctx = canvas.getContext("2d");
    if (!ctx) return;
    var interactive = idx === 0;
    var faint = idx !== 0;
    var width = 0, height = 0, nodes = [], t = 0;
    var pointer = { x: -9999, y: -9999 };

    function resize() {
      var rect = canvas.getBoundingClientRect();
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var count = Math.max(18, Math.min(90, Math.round(width * height * 0.00009)));
      nodes = [];
      for (var i = 0; i < count; i++) {
        nodes.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.18,
          vy: (Math.random() - 0.5) * 0.18,
          phase: Math.random() * Math.PI * 2
        });
      }
    }

    function draw() {
      t += 0.008;
      ctx.clearRect(0, 0, width, height);
      var linkDist = Math.min(160, Math.max(90, width / 8));
      var alphaScale = faint ? 0.4 : 1;
      var i, j, n;
      for (i = 0; i < nodes.length; i++) {
        n = nodes[i];
        if (!reduced) { n.x += n.vx; n.y += n.vy; }
        if (n.x < 0 || n.x > width) n.vx *= -1;
        if (n.y < 0 || n.y > height) n.vy *= -1;
        if (interactive) {
          var dx = n.x - pointer.x, dy = n.y - pointer.y;
          var d = Math.hypot(dx, dy);
          if (d < 130 && d > 0.01) {
            n.x += (dx / d) * (130 - d) * 0.012;
            n.y += (dy / d) * (130 - d) * 0.012;
          }
        }
      }
      for (i = 0; i < nodes.length; i++) {
        for (j = i + 1; j < nodes.length; j++) {
          var a = nodes[i], b = nodes[j];
          var d2 = Math.hypot(a.x - b.x, a.y - b.y);
          if (d2 > linkDist) continue;
          var strength = 1 - d2 / linkDist;
          var travel = (Math.sin(t * 1.4 + (i + j) * 0.35) + 1) / 2;
          ctx.strokeStyle = "rgba(59, 130, 246, " + strength * 0.28 * alphaScale + ")";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
          if (!reduced && strength > 0.55) {
            var px = a.x + (b.x - a.x) * travel;
            var py = a.y + (b.y - a.y) * travel;
            ctx.fillStyle = "rgba(6, 182, 212, " + strength * 0.7 * alphaScale + ")";
            ctx.beginPath();
            ctx.arc(px, py, 1.4, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
      for (i = 0; i < nodes.length; i++) {
        n = nodes[i];
        var pulse = (Math.sin(t * 2 + n.phase) + 1) / 2;
        ctx.fillStyle = "rgba(124, 58, 237, " + (0.35 + pulse * 0.4) * alphaScale + ")";
        ctx.beginPath();
        ctx.arc(n.x, n.y, 1.6 + pulse * 1.4, 0, Math.PI * 2);
        ctx.fill();
      }
      requestAnimationFrame(draw);
    }

    resize();
    draw();
    window.addEventListener("resize", resize);
    if (interactive) {
      window.addEventListener("pointermove", function (e) {
        var rect = canvas.getBoundingClientRect();
        pointer.x = e.clientX - rect.left;
        pointer.y = e.clientY - rect.top;
      });
      window.addEventListener("pointerleave", function () {
        pointer.x = -9999;
        pointer.y = -9999;
      });
    }
  });

  /* ---- Role cycler (typing effect) ---- */
  var ROLES = ["ICE Student", "Web Developer", "Frontend Developer", "Database Enthusiast", "Networking Learner"];
  var roleSpan = document.querySelector("span.text-gradient.absolute");
  if (roleSpan) {
    var rIndex = 0, rText = "", rDeleting = false;
    (function tick() {
      var full = ROLES[rIndex % ROLES.length];
      var done = rText === full;
      var delay;
      if (!rDeleting) {
        if (done) { rDeleting = true; delay = 1600; }
        else { rText = full.slice(0, rText.length + 1); delay = 70; }
      } else if (rText === "") {
        rDeleting = false;
        rIndex = (rIndex + 1) % ROLES.length;
        delay = 70;
      } else {
        rText = full.slice(0, rText.length - 1);
        delay = 40;
      }
      roleSpan.textContent = rText;
      setTimeout(tick, reduced ? 1600 : delay);
    })();
  }

  /* ---- Reveal on scroll ---- */
  var revealEls = document.querySelectorAll("[data-visible]");
  if ("IntersectionObserver" in window && !reduced) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.setAttribute("data-visible", "true");
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -40px 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.setAttribute("data-visible", "true"); });
  }

  /* ---- About stat counters ---- */
  var statSpans = document.querySelectorAll("#about .grid.grid-cols-2 .text-gradient");
  var targets = [
    { value: 3, suffix: "" },   // Projects
    { value: 5, suffix: "+" },  // Skills
    { value: 3, suffix: "rd" }, // Year
    null                        // Graduation stays 2027
  ];
  function animateCount(el, value, suffix) {
    var start = performance.now(), dur = 1200;
    function step(now) {
      var p = Math.min(1, (now - start) / dur);
      var n = Math.round(value * (1 - Math.pow(1 - p, 3)));
      el.textContent = n + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if (statSpans.length) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        cio.unobserve(en.target);
        var idx = Array.prototype.indexOf.call(statSpans, en.target);
        var t = targets[idx];
        if (t) {
          if (reduced) en.target.textContent = t.value + t.suffix;
          else animateCount(en.target, t.value, t.suffix);
        }
      });
    }, { threshold: 0.4 });
    statSpans.forEach(function (el) { cio.observe(el); });
  }

  /* ---- Nav: scrollspy, progress bar, mobile menu ---- */
  var LINKS = ["home","about","education","skills","services","projects","achievements","hobbies","cv","contact"];
  var header = document.querySelector("header");
  var progressBar = header && header.querySelector(".h-px");
  var menuBtn = header && header.querySelector('button[aria-label="Open menu"], button[aria-label="Close menu"]');
  var desktopLinks = header ? header.querySelectorAll("ul.hidden a") : [];
  var mobileList = null;

  function setActive(id) {
    desktopLinks.forEach(function (a) {
      var on = a.getAttribute("href") === "#" + id;
      a.className = "rounded-md px-3 py-2 text-sm transition-colors " + (on ? "text-accent" : "text-muted-foreground hover:text-foreground");
    });
    if (mobileList) {
      mobileList.querySelectorAll("a").forEach(function (a) {
        var on = a.getAttribute("href") === "#" + id;
        a.className = "block py-2.5 text-sm " + (on ? "text-accent" : "text-muted-foreground");
      });
    }
  }

  function onScroll() {
    var max = document.body.scrollHeight - window.innerHeight;
    if (progressBar) progressBar.style.transform = "scaleX(" + (max > 0 ? window.scrollY / max : 0) + ")";
    var offset = window.scrollY + 120;
    var current = "home";
    LINKS.forEach(function (id) {
      var el = document.getElementById(id);
      if (el && el.offsetTop <= offset) current = id;
    });
    setActive(current);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  if (menuBtn) {
    menuBtn.addEventListener("click", function () {
      var open = !!mobileList;
      if (open) {
        mobileList.remove();
        mobileList = null;
        menuBtn.setAttribute("aria-label", "Open menu");
        menuBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5h16"></path><path d="M4 12h16"></path><path d="M4 19h16"></path></svg>';
      } else {
        mobileList = document.createElement("ul");
        mobileList.className = "border-t border-border px-5 pb-4 md:hidden";
        LINKS.forEach(function (id) {
          var li = document.createElement("li");
          var a = document.createElement("a");
          a.href = "#" + id;
          a.textContent = id === "cv" ? "CV" : id.charAt(0).toUpperCase() + id.slice(1);
          a.className = "block py-2.5 text-sm text-muted-foreground";
          a.addEventListener("click", function () { menuBtn.click(); });
          li.appendChild(a);
          mobileList.appendChild(li);
        });
        menuBtn.parentNode.parentNode.insertBefore(mobileList, progressBar);
        menuBtn.setAttribute("aria-label", "Close menu");
        menuBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>';
        onScroll();
      }
    });
  }
})();

/* ---- Contact form (static): compose an email ---- */
(function () {
  var form = document.querySelector("#contact form");
  if (!form) return;
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var v = function (sel) { var el = form.querySelector(sel); return el ? el.value.trim() : ""; };
    var name = v('input[name="name"], input[placeholder*="name" i], #name') || v("input");
    var inputs = form.querySelectorAll("input, textarea");
    var vals = Array.prototype.map.call(inputs, function (i) { return i.value.trim(); });
    var n = vals[0] || "", em = vals[1] || "", sub = vals[2] || "", msg = vals[3] || "";
    var body = "Name: " + n + "\nEmail: " + em + "\n\n" + msg;
    window.location.href = "mailto:shakikzaman066@gmail.com?subject=" +
      encodeURIComponent(sub || "Portfolio contact from " + n) + "&body=" + encodeURIComponent(body);
    form.reset();
  });
})();
