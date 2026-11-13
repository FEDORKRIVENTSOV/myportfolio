const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ============================================================================
// Шапка: тонкая граница и тень появляются, когда страница прокручена
// ============================================================================
(function initHeader() {
    const header = document.querySelector(".site-header");
    if (!header) return;
    const update = () => header.classList.toggle("is-scrolled", window.scrollY > 8);
    window.addEventListener("scroll", update, { passive: true });
    update();
})();

// ============================================================================
// Плавное появление блоков при скролле.
// Атрибут data-reveal навешивается здесь, поэтому HTML править не нужно,
// а без JS (или при "меньше анимации") всё остаётся видимым.
// ============================================================================
(function initScrollReveal() {
    if (prefersReducedMotion || !("IntersectionObserver" in window)) return;

    const selector = [
        ".stats__item", ".card", ".empty-state",
        ".about__avatar-col", ".about__text-col", ".contact > *",
        ".project__section", ".project__aside", ".gallery__item",
        ".more-projects h2", ".more-projects__card",
    ].join(",");

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add("is-in");
                observer.unobserve(entry.target);
            });
        },
        { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    document.querySelectorAll(selector).forEach((el) => {
        el.setAttribute("data-reveal", "");
        observer.observe(el);
    });
})();

// ============================================================================
// Фильтр проектов + скользящая подложка под активной вкладкой
// ============================================================================
(function initFilters() {
    const tabs = document.querySelector(".filter-tabs");
    if (!tabs) return;

    const buttons = Array.from(tabs.querySelectorAll(".filter-tabs__btn"));
    const cards = Array.from(document.querySelectorAll(".card"));

    const glow = document.createElement("span");
    glow.className = "filter-tabs__glow";
    glow.setAttribute("aria-hidden", "true");
    tabs.prepend(glow);

    const current = () => tabs.querySelector(".filter-tabs__btn.is-active");
    const moveGlow = (btn) => {
        glow.style.width = btn.offsetWidth + "px";
        glow.style.transform = `translateX(${btn.offsetLeft - 4}px)`;
    };

    // Ждём шрифты, чтобы ширина кнопок посчиталась правильно; первый раз — без анимации
    const ready = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    ready.then(() => {
        const active = current();
        if (!active) return;
        glow.style.transition = "none";
        moveGlow(active);
        void glow.offsetWidth;
        glow.style.transition = "";
        tabs.classList.add("has-glow");
    });

    buttons.forEach((btn) => {
        btn.addEventListener("click", () => {
            buttons.forEach((b) => {
                b.classList.remove("is-active");
                b.setAttribute("aria-selected", "false");
            });
            btn.classList.add("is-active");
            btn.setAttribute("aria-selected", "true");
            moveGlow(btn);

            const filter = btn.dataset.filter;
            cards.forEach((card) => {
                card.classList.toggle("is-hidden", !(filter === "all" || card.dataset.category === filter));
            });
        });
    });

    window.addEventListener("resize", () => {
        const active = current();
        if (active) moveGlow(active);
    });
})();

// ============================================================================
// Кнопка "Копировать" в блоках с кодом
// ============================================================================
(function initCopyButtons() {
    document.querySelectorAll(".snippet__copy").forEach((btn) => {
        btn.addEventListener("click", async () => {
            const codeEl = document.getElementById(btn.dataset.copyTarget);
            if (!codeEl) return;

            const text = codeEl.innerText;
            try {
                await navigator.clipboard.writeText(text);
            } catch (err) {
                const textarea = document.createElement("textarea");
                textarea.value = text;
                textarea.style.cssText = "position:fixed;opacity:0";
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand("copy");
                document.body.removeChild(textarea);
            }

            const original = btn.textContent;
            btn.textContent = "Скопировано!";
            btn.classList.add("is-copied");
            setTimeout(() => {
                btn.textContent = original;
                btn.classList.remove("is-copied");
            }, 1600);
        });
    });
})();

// ============================================================================
// Пасхалка: код Конами  ↑ ↑ ↓ ↓ ← → ← → B A
// ============================================================================
(function initKonamiEasterEgg() {
    const sequence = [
        "ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown",
        "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a",
    ];
    let progress = 0;
    const toast = document.getElementById("easter-egg-toast");

    window.addEventListener("keydown", (e) => {
        const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
        if (key === sequence[progress]) {
            progress += 1;
            if (progress === sequence.length) {
                progress = 0;
                if (toast) {
                    toast.classList.add("is-visible");
                    setTimeout(() => toast.classList.remove("is-visible"), 3200);
                }
                if (!prefersReducedMotion) spawnConfetti();
            }
        } else {
            progress = key === sequence[0] ? 1 : 0;
        }
    });

    function spawnConfetti() {
        const colors = ["#2B6BFF", "#12AEC4", "#8FB5FF", "#0C1A30", "#FFC857"];
        for (let i = 0; i < 36; i += 1) {
            const piece = document.createElement("span");
            const color = colors[i % colors.length];
            piece.style.cssText =
                `position:fixed;left:${Math.random() * 100}vw;top:-10px;width:8px;height:8px;` +
                `border-radius:${Math.random() > 0.5 ? "50%" : "2px"};background:${color};` +
                "z-index:600;pointer-events:none;transition:transform 1.7s ease-in,opacity 1.7s ease-in";
            document.body.appendChild(piece);

            requestAnimationFrame(() => {
                const x = (Math.random() - 0.5) * 220;
                piece.style.transform = `translate(${x}px, ${window.innerHeight + 40}px) rotate(${Math.random() * 540}deg)`;
                piece.style.opacity = "0";
            });
            setTimeout(() => piece.remove(), 1900);
        }
    }
})();