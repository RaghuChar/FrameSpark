/* FrameSpark — shared interactions (no framework)
   - Sticky navbar styling on scroll
   - Mobile hamburger menu
   - Scroll-reveal animations (IntersectionObserver)
   - Portfolio preview modal
*/

(function () {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function initStickyNav() {
    const nav = $("#siteHeader");
    if (!nav) return;

    const onScroll = () => {
      const scrolled = window.scrollY > 8;
      nav.classList.toggle("nav-solid", scrolled);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  function initMobileMenu() {
    const btn = $("#menuButton");
    const panel = $("#mobileMenu");
    if (!btn || !panel) return;

    const close = () => {
      panel.classList.add("hidden");
      btn.setAttribute("aria-expanded", "false");
    };
    const open = () => {
      panel.classList.remove("hidden");
      btn.setAttribute("aria-expanded", "true");
    };

    btn.addEventListener("click", () => {
      const isOpen = btn.getAttribute("aria-expanded") === "true";
      if (isOpen) close();
      else open();
    });

    // Close on navigation
    $$("a", panel).forEach((a) => a.addEventListener("click", close));

    // Close on Escape and outside click
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") close();
    });
    document.addEventListener("click", (e) => {
      const target = e.target;
      if (!(target instanceof Element)) return;
      if (panel.classList.contains("hidden")) return;
      if (panel.contains(target) || btn.contains(target)) return;
      close();
    });

    // Keep menu state sane on resize
    window.addEventListener(
      "resize",
      () => {
        if (window.innerWidth >= 768) close();
      },
      { passive: true }
    );
  }

  function initScrollReveal() {
    const items = $$(".reveal");
    if (!items.length) return;

    // Fallback if IntersectionObserver isn't available
    if (!("IntersectionObserver" in window)) {
      items.forEach((el) => el.classList.add("is-visible"));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        });
      },
      { threshold: 0.14, rootMargin: "0px 0px -6% 0px" }
    );

    items.forEach((el) => io.observe(el));
  }

  function initPortfolioModal() {
    const modal = $("#projectModal");
    const title = $("#projectModalTitle");
    const desc = $("#projectModalDesc");
    const image = $("#projectModalImage");
    const tags = $("#projectModalTags");
    const closeBtn = $("#projectModalClose");
    const openers = $$("[data-project]");

    if (!modal || !title || !desc || !image || !closeBtn || !openers.length) return;

    const focusableSelector =
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';
    let lastActive = null;

    const setTags = (csv) => {
      if (!tags) return;
      tags.innerHTML = "";
      const parts = (csv || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      parts.slice(0, 6).forEach((t) => {
        const chip = document.createElement("span");
        chip.className =
          "inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200/90";
        chip.textContent = t;
        tags.appendChild(chip);
      });
    };

    const open = (data) => {
      lastActive = document.activeElement;
      title.textContent = data.title || "Project Preview";
      desc.textContent = data.desc || "";
      image.src = data.image || "";
      image.alt = data.title ? `${data.title} preview` : "Project preview";
      setTags(data.tags);

      modal.classList.add("is-open");
      modal.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";

      // Focus first focusable element
      const focusables = $$(focusableSelector, modal);
      (focusables[0] || closeBtn).focus();
    };

    const close = () => {
      modal.classList.remove("is-open");
      modal.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
      if (lastActive && lastActive.focus) lastActive.focus();
    };

    openers.forEach((btn) => {
      btn.addEventListener("click", () => {
        const data = {
          title: btn.getAttribute("data-title"),
          desc: btn.getAttribute("data-desc"),
          image: btn.getAttribute("data-image"),
          tags: btn.getAttribute("data-tags"),
        };
        open(data);
      });
    });

    closeBtn.addEventListener("click", close);
    modal.addEventListener("click", (e) => {
      if (e.target === modal) close();
    });
    document.addEventListener("keydown", (e) => {
      if (!modal.classList.contains("is-open")) return;
      if (e.key === "Escape") close();

      // Simple focus trap
      if (e.key === "Tab") {
        const focusables = $$(focusableSelector, modal).filter((el) => el.offsetParent !== null);
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });
  }

  function setActiveNavLink() {
    const path = (location.pathname.split("/").pop() || "index.html").toLowerCase();
    const links = $$("[data-nav]");
    links.forEach((a) => {
      const href = (a.getAttribute("href") || "").toLowerCase();
      const active = href === path || (path === "" && href === "index.html");
      a.classList.toggle("text-slate-50", active);
      a.classList.toggle("text-slate-200/80", !active);
      a.setAttribute("aria-current", active ? "page" : "false");
    });
  }

  function initTiltCards() {
    // Apple-like micro-interaction for highlight panels
    const prefersReduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;
    if (!window.matchMedia || !window.matchMedia("(hover:hover)").matches) return;

    const cards = $$("[data-tilt='card']");
    if (!cards.length) return;

    cards.forEach((card) => {
      const strength = Number(card.getAttribute("data-tilt-strength") || 10); // smaller = subtler
      const onMove = (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width;
        const y = (e.clientY - r.top) / r.height;
        const rotY = (x - 0.5) * (strength * 1.0);
        const rotX = (0.5 - y) * (strength * 0.75);
        card.style.transform = `translateY(-2px) perspective(900px) rotateX(${rotX}deg) rotateY(${rotY}deg)`;
      };
      const onLeave = () => {
        card.style.transform = "";
      };

      card.addEventListener("mousemove", onMove);
      card.addEventListener("mouseleave", onLeave);
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    initStickyNav();
    initMobileMenu();
    initScrollReveal();
    initPortfolioModal();
    setActiveNavLink();
    initTiltCards();
  });
})();

