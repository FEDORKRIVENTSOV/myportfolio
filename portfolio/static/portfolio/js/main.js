"use strict";

// ============================================================================
// devcase — поведение сайта.
// Каждая фича обёрнута в safe(): если одна сломается, остальные продолжат работать.
// ============================================================================

const hasFinePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function safe(name, fn) {
    try {
        fn();
    } catch (err) {
        console.error("[devcase] " + name + " не запустился:", err);
    }
}

// Запускает callback один раз, когда элемент появился в окне просмотра.
function onceVisible(el, callback, threshold) {
    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
        callback();
        return;
    }
    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    observer.disconnect();
                    callback();
                }
            });
        },
        { threshold: threshold || 0.3 }
    );
    observer.observe(el);
}


// ============================================================================
// Прогресс-бар скролла
// ============================================================================
safe("scrollProgress", () => {
    const bar = document.getElementById("scrollProgressBar");
    if (!bar) return;

    let ticking = false;
    function update() {
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const pct = docHeight > 0 ? (window.scrollY / docHeight) * 100 : 0;
        bar.style.width = Math.min(100, Math.max(0, pct)) + "%";
        ticking = false;
    }
    window.addEventListener("scroll", () => {
        if (!ticking) {
            requestAnimationFrame(update);
            ticking = true;
        }
    }, { passive: true });
    window.addEventListener("resize", update);
    update();
});


// ============================================================================
// Плавное проявление блоков при скролле
// ============================================================================
safe("scrollReveal", () => {
    const items = document.querySelectorAll("[data-reveal]");
    if (!items.length) return;

    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
        items.forEach((el) => el.classList.add("is-in"));
        return;
    }

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("is-in");
                    observer.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    items.forEach((el) => observer.observe(el));
});


// ============================================================================
// Мобильное меню
// ============================================================================
safe("navToggle", () => {
    const toggle = document.getElementById("navToggle");
    const header = document.querySelector(".site-header");
    if (!toggle || !header) return;

    function setOpen(open) {
        header.classList.toggle("is-open", open);
        toggle.setAttribute("aria-expanded", open ? "true" : "false");
    }
    toggle.addEventListener("click", () => setOpen(!header.classList.contains("is-open")));
    header.querySelectorAll(".site-nav a").forEach((a) => a.addEventListener("click", () => setOpen(false)));
    window.addEventListener("keydown", (e) => { if (e.key === "Escape") setOpen(false); });
    window.addEventListener("resize", () => { if (window.innerWidth > 720) setOpen(false); });
    // тап мимо меню закрывает его
    document.addEventListener("click", (e) => {
        if (header.classList.contains("is-open") && !header.contains(e.target)) setOpen(false);
    });
});


// ============================================================================
// Фоновая сетка из точек: рядом с курсором точки загораются розовым.
// Работает через CSS-переменные --cx / --cy (без canvas — ноль нагрузки).
// ============================================================================
safe("dotGlow", () => {
    if (!hasFinePointer || prefersReducedMotion) return;

    const root = document.documentElement;
    let raf = 0;
    let x = 0;
    let y = 0;

    window.addEventListener("pointermove", (e) => {
        x = e.clientX;
        y = e.clientY;
        if (!raf) {
            raf = requestAnimationFrame(() => {
                root.style.setProperty("--cx", x + "px");
                root.style.setProperty("--cy", y + "px");
                raf = 0;
            });
        }
    }, { passive: true });

    root.addEventListener("mouseleave", () => {
        root.style.setProperty("--cx", "-999px");
        root.style.setProperty("--cy", "-999px");
    });
});


// ============================================================================
// Хиро: символ из тысячи точек. Три знака по очереди «загораются»,
// между ними бегут импульсы света, точки отталкиваются от курсора,
// по тапу/клику расходится волна. Идея — из карты-точек на inefam.com.
// ============================================================================
safe("heroDots", () => {
    const canvas = document.getElementById("heroDots");
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const glyph = canvas.dataset.glyph || "</>";
    const chars = Array.from(glyph);
    const FONT = '"JetBrains Mono", ui-monospace, Menlo, Consolas, monospace';
    const TURN_MS = 2400;

    let W = 0;
    let H = 0;
    let dots = [];
    let centers = [];
    let glow = chars.map(() => 0.3);
    let raf = 0;
    let running = false;
    let visible = true;
    let startTime = performance.now();
    const pointer = { x: -999, y: -999, active: false };
    const ripples = [];

    function build() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const rect = canvas.getBoundingClientRect();
        W = Math.max(220, Math.round(rect.width));
        H = Math.max(160, Math.round(rect.height));
        canvas.width = Math.round(W * dpr);
        canvas.height = Math.round(H * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        const gap = W < 420 ? 8 : 9;

        // Рисуем глиф на скрытом canvas и читаем, какие ячейки сетки попали в букву.
        const off = document.createElement("canvas");
        off.width = W;
        off.height = H;
        const o = off.getContext("2d", { willReadFrequently: true });
        if (!o) return;

        o.font = "700 100px " + FONT;
        const w100 = o.measureText(glyph).width || 1;
        const size = Math.min((100 * W * 0.9) / w100, H * 0.82);
        o.font = "700 " + size + "px " + FONT;
        o.textBaseline = "middle";
        o.textAlign = "left";
        const totalW = o.measureText(glyph).width;
        const startX = (W - totalW) / 2;
        o.fillStyle = "#fff";
        o.strokeStyle = "#fff";
        o.lineWidth = size * 0.1;
        o.fillText(glyph, startX, H / 2);
        o.strokeText(glyph, startX, H / 2);
        const pixels = o.getImageData(0, 0, W, H).data;

        const charW = totalW / chars.length;
        centers = chars.map((_, i) => ({ x: startX + charW * (i + 0.5), y: H / 2 }));

        const cols = Math.floor(W / gap);
        const rows = Math.floor(H / gap);
        const ox = (W - (cols - 1) * gap) / 2;
        const oy = (H - (rows - 1) * gap) / 2;
        const maxDist = Math.hypot(W / 2, H / 2);

        dots = [];
        for (let r = 0; r < rows; r += 1) {
            for (let c = 0; c < cols; c += 1) {
                const x = ox + c * gap;
                const y = oy + r * gap;
                const px = Math.min(W - 1, Math.max(0, Math.round(x)));
                const py = Math.min(H - 1, Math.max(0, Math.round(y)));
                const on = pixels[(py * W + px) * 4 + 3] > 110;
                const region = on
                    ? Math.min(chars.length - 1, Math.max(0, Math.floor((x - startX) / charW)))
                    : -1;
                dots.push({ x, y, on, region, dist: Math.hypot(x - W / 2, y - H / 2) / maxDist });
            }
        }
    }

    function draw(now, still) {
        const el = now - startTime;
        const n = chars.length;
        let pulse = null;

        if (!still) {
            const turn = Math.floor(el / TURN_MS) % n;
            const p = (el % TURN_MS) / TURN_MS;
            for (let i = 0; i < n; i += 1) {
                glow[i] += ((i === turn ? 1 : 0.22) - glow[i]) * 0.07;
            }
            const q = (p - 0.3) / 0.6;
            if (n > 1 && q > 0 && q < 1) {
                const a = centers[turn];
                const b = centers[(turn + 1) % n];
                const e = q * q * (3 - 2 * q);
                const arc = Math.sin(q * Math.PI) * H * 0.22 * (turn % 2 ? 1 : -1);
                pulse = { x: a.x + (b.x - a.x) * e, y: a.y + (b.y - a.y) * e + arc };
            }
            for (let i = ripples.length - 1; i >= 0; i -= 1) {
                if (now - ripples[i].t > 1400) ripples.splice(i, 1);
            }
        }

        const appear = still ? 1 : Math.min(1, el / 1000);
        const usePointer = !still && pointer.active;

        ctx.clearRect(0, 0, W, H);

        for (let i = 0; i < dots.length; i += 1) {
            const d = dots[i];
            const appearK = Math.max(0, Math.min(1, appear * 1.6 - d.dist * 0.6));
            if (appearK <= 0) continue;

            let x = d.x;
            let y = d.y;
            const g = d.region >= 0 ? glow[d.region] : 0;
            let alpha = d.on ? 0.3 + 0.55 * g : 0.16;
            let radius = d.on ? 1.7 + 1.1 * g : 1.05;
            // базовый цвет: серо-голубой -> синий по мере «загорания»; пустые точки серые
            let cr = d.on ? 148 - 111 * g : 100;
            let cg = d.on ? 163 - 64 * g : 116;
            let cb = d.on ? 200 + 35 * g : 139;

            if (pulse) {
                const dx = x - pulse.x;
                const dy = y - pulse.y;
                const dd = dx * dx + dy * dy;
                if (dd < 2500) {
                    const k = 1 - Math.sqrt(dd) / 50;
                    cr += (15 - cr) * k; cg += (23 - cg) * k; cb += (42 - cb) * k;
                    alpha += k * 0.6;
                    radius += k * 1.5;
                }
            }

            for (let r = 0; r < ripples.length; r += 1) {
                const rp = ripples[r];
                const age = now - rp.t;
                const diff = Math.abs(Math.hypot(d.x - rp.x, d.y - rp.y) - age * 0.28);
                if (diff < 16) {
                    const k = (1 - diff / 16) * (1 - age / 1400);
                    cr += (15 - cr) * k; cg += (23 - cg) * k; cb += (42 - cb) * k;
                    alpha += k * 0.7;
                    radius += k * 1.6;
                }
            }

            if (usePointer) {
                const dx = x - pointer.x;
                const dy = y - pointer.y;
                const dd = dx * dx + dy * dy;
                if (dd < 12100) {
                    const dist = Math.sqrt(dd) || 1;
                    const m = 1 - dist / 110;
                    x += (dx / dist) * m * 8;
                    y += (dy / dist) * m * 8;
                    cr += (37 - cr) * m; cg += (99 - cg) * m; cb += (235 - cb) * m;
                    alpha += m * 0.6;
                    radius += m * 1.8;
                }
            }

            ctx.fillStyle = "rgba(" + (cr | 0) + "," + (cg | 0) + "," + (cb | 0) + "," + Math.min(1, alpha * appearK).toFixed(3) + ")";
            ctx.beginPath();
            ctx.arc(x, y, radius * appearK, 0, 6.2832);
            ctx.fill();
        }
    }

    function frame(now) {
        raf = 0;
        if (!visible || document.hidden) {
            running = false;
            return;
        }
        draw(now, false);
        raf = requestAnimationFrame(frame);
    }

    function start() {
        if (prefersReducedMotion || running) return;
        running = true;
        raf = requestAnimationFrame(frame);
    }

    function redrawStill() {
        glow = chars.map(() => 0.6);
        draw(0, true);
    }

    function rebuild() {
        build();
        if (prefersReducedMotion) redrawStill();
        else if (!running) draw(performance.now(), false); // не оставляем холст пустым на паузе
    }

    rebuild();
    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(rebuild).catch(() => {});
    }

    if (prefersReducedMotion) return;

    // Взаимодействие
    function localPoint(e) {
        const rect = canvas.getBoundingClientRect();
        return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }
    canvas.addEventListener("pointermove", (e) => {
        const p = localPoint(e);
        pointer.x = p.x;
        pointer.y = p.y;
        pointer.active = true;
    });
    canvas.addEventListener("pointerleave", () => { pointer.active = false; });
    canvas.addEventListener("pointercancel", () => { pointer.active = false; });
    canvas.addEventListener("pointerdown", (e) => {
        const p = localPoint(e);
        pointer.x = p.x;
        pointer.y = p.y;
        pointer.active = true;
        if (ripples.length >= 4) ripples.shift();
        ripples.push({ x: p.x, y: p.y, t: performance.now() });
    });
    canvas.addEventListener("pointerup", (e) => {
        if (e.pointerType !== "mouse") setTimeout(() => { pointer.active = false; }, 500);
    });

    // Пауза, когда блок не виден или вкладка в фоне
    if ("IntersectionObserver" in window) {
        new IntersectionObserver((entries) => {
            visible = entries[0].isIntersecting;
            if (visible) start();
        }, { threshold: 0.05 }).observe(canvas);
    }
    document.addEventListener("visibilitychange", () => { if (!document.hidden) start(); });

    // Пересборка при изменении размера
    let resizeTimer = 0;
    const onResize = () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(rebuild, 150);
    };
    if ("ResizeObserver" in window) {
        new ResizeObserver(onResize).observe(canvas);
    } else {
        window.addEventListener("resize", onResize);
    }

    start();
});


// ============================================================================
// Одометр: цифры статистики «прокручиваются», как на inefam.com.
// Нецифровые символы («+», «AM») остаются на месте.
// ============================================================================
safe("odometer", () => {
    const nodes = document.querySelectorAll(".odo");
    if (!nodes.length) return;

    nodes.forEach((el) => {
        const text = (el.dataset.value || el.textContent || "").trim();
        if (!text) return;
        el.setAttribute("role", "img");
        el.setAttribute("aria-label", text);
        el.textContent = "";

        const frag = document.createDocumentFragment();
        Array.from(text).forEach((ch, i) => {
            if (/[0-9]/.test(ch)) {
                const win = document.createElement("span");
                win.className = "odo__digit";
                win.setAttribute("aria-hidden", "true");
                const strip = document.createElement("span");
                strip.className = "odo__strip";
                strip.style.setProperty("--d", String(10 + Number(ch)));
                strip.style.setProperty("--delay", i * 80 + "ms");
                for (let n = 0; n < 20; n += 1) {
                    const s = document.createElement("span");
                    s.textContent = String(n % 10);
                    strip.appendChild(s);
                }
                win.appendChild(strip);
                frag.appendChild(win);
            } else {
                const s = document.createElement("span");
                s.className = "odo__char" + (/[+%]/.test(ch) ? " odo__char--sign" : "");
                s.setAttribute("aria-hidden", "true");
                s.textContent = ch === " " ? "\u00A0" : ch;
                frag.appendChild(s);
            }
        });
        el.appendChild(frag);

        onceVisible(el, () => {
            // двойной rAF: браузер успевает зафиксировать стартовое положение
            requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add("is-in")));
        }, 0.4);
    });
});


// ============================================================================
// Точечный график «проекты по годам»: колонки точек растут слева направо.
// ============================================================================
safe("dotChart", () => {
    const chart = document.querySelector("[data-dotchart]");
    if (!chart) return;
    const ROWS = 10;

    chart.querySelectorAll(".dotchart__col").forEach((col, ci) => {
        const stack = col.querySelector(".dotchart__stack");
        if (!stack) return;
        const count = Math.min(parseInt(col.dataset.count || "0", 10) || 0, ROWS);
        stack.textContent = "";
        for (let r = 0; r < ROWS; r += 1) {
            const fromBottom = ROWS - 1 - r;
            const dot = document.createElement("i");
            if (fromBottom < count) {
                dot.className = "is-on";
                dot.style.setProperty("--n", String(fromBottom));
            }
            stack.appendChild(dot);
        }
        col.style.setProperty("--ci", String(ci));
    });

    chart.classList.add("is-ready");
    onceVisible(chart, () => {
        requestAnimationFrame(() => requestAnimationFrame(() => chart.classList.add("is-in")));
    }, 0.3);
});


// ============================================================================
// 3D-наклон карточек вслед за курсором + «прожектор»
// ============================================================================
safe("tilt", () => {
    if (!hasFinePointer || prefersReducedMotion) return;

    const MAX_TILT = 8;
    document.querySelectorAll("[data-tilt]").forEach((el) => {
        let resetTimer = 0;

        el.addEventListener("mousemove", (e) => {
            clearTimeout(resetTimer);
            const rect = el.getBoundingClientRect();
            if (!rect.width || !rect.height) return;
            const px = (e.clientX - rect.left) / rect.width;
            const py = (e.clientY - rect.top) / rect.height;

            el.classList.add("is-tilting");
            el.style.setProperty("--rx", ((px - 0.5) * MAX_TILT * 2).toFixed(2) + "deg");
            el.style.setProperty("--ry", ((0.5 - py) * MAX_TILT * 2).toFixed(2) + "deg");
            el.style.setProperty("--mx", (px * 100).toFixed(1) + "%");
            el.style.setProperty("--my", (py * 100).toFixed(1) + "%");
        });

        el.addEventListener("mouseleave", () => {
            el.style.setProperty("--rx", "0deg");
            el.style.setProperty("--ry", "0deg");
            resetTimer = setTimeout(() => el.classList.remove("is-tilting"), 450);
        });
    });
});


// ============================================================================
// «Магнитные» кнопки
// ============================================================================
safe("magnetic", () => {
    if (!hasFinePointer || prefersReducedMotion) return;

    const STRENGTH = 0.3;
    document.querySelectorAll("[data-magnetic]").forEach((el) => {
        el.addEventListener("mousemove", (e) => {
            const rect = el.getBoundingClientRect();
            const relX = e.clientX - (rect.left + rect.width / 2);
            const relY = e.clientY - (rect.top + rect.height / 2);
            el.style.translate = (relX * STRENGTH).toFixed(1) + "px " + (relY * STRENGTH).toFixed(1) + "px";
        });
        el.addEventListener("mouseleave", () => {
            el.style.translate = "";
        });
    });
});


// ============================================================================
// Фильтр проектов + скользящая подложка под активной вкладкой
// ============================================================================
safe("filters", () => {
    const buttons = document.querySelectorAll(".filter-tabs__btn");
    const cards = document.querySelectorAll(".cards-grid .card");
    const glowEl = document.getElementById("filterGlow");
    if (!buttons.length) return;

    function moveGlow(btn) {
        if (!glowEl || !btn) return;
        glowEl.style.width = btn.offsetWidth + "px";
        glowEl.style.transform = "translateX(" + (btn.offsetLeft - 4) + "px)";
    }
    const current = () => document.querySelector(".filter-tabs__btn.is-active");

    requestAnimationFrame(() => moveGlow(current()));
    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => moveGlow(current())).catch(() => {});
    }
    window.addEventListener("resize", () => moveGlow(current()));

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
                const matches = filter === "all" || card.dataset.category === filter;
                card.classList.toggle("is-hidden", !matches);
                if (matches) card.classList.add("is-in"); // не оставляем карточку невидимой
            });
        });
    });
});


// ============================================================================
// Кнопка «Копировать» в блоках с кодом
// ============================================================================
safe("copyButtons", () => {
    document.querySelectorAll(".snippet__copy").forEach((btn) => {
        btn.addEventListener("click", async () => {
            const codeEl = document.getElementById(btn.dataset.copyTarget);
            if (!codeEl) return;
            const text = codeEl.innerText;

            try {
                await navigator.clipboard.writeText(text);
            } catch (err) {
                const ta = document.createElement("textarea");
                ta.value = text;
                ta.style.position = "fixed";
                ta.style.opacity = "0";
                document.body.appendChild(ta);
                ta.select();
                try { document.execCommand("copy"); } catch (e) { /* игнор */ }
                document.body.removeChild(ta);
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
});


// ============================================================================
// Просмотр фото на весь экран.
// Тап/клик по фото -> открывается. Внутри:
//   телефон: щипок двумя пальцами — приближение, перетаскивание — сдвиг,
//            свайп влево/вправо — другое фото, свайп вниз — закрыть,
//            двойной тап — приблизить/вернуть, кнопка «Назад» — закрыть.
//   компьютер: колесо мыши, двойной клик, стрелки ← →, + / − / 0, Esc.
// ============================================================================
safe("lightbox", () => {
    const links = Array.from(document.querySelectorAll("a[data-lightbox]"));
    if (!links.length) return;

    const groups = {};
    links.forEach((a) => {
        const g = a.dataset.lightbox || "default";
        (groups[g] = groups[g] || []).push(a);
    });

    const root = document.createElement("div");
    root.className = "lb";
    root.hidden = true;
    root.setAttribute("role", "dialog");
    root.setAttribute("aria-modal", "true");
    root.setAttribute("aria-label", "Просмотр фото");
    root.innerHTML =
        '<div class="lb__backdrop"></div>' +
        '<div class="lb__stage"><img class="lb__img" alt="" draggable="false"></div>' +
        '<button type="button" class="lb__btn lb__close" aria-label="Закрыть">&times;</button>' +
        '<button type="button" class="lb__btn lb__prev" aria-label="Предыдущее фото">&#8249;</button>' +
        '<button type="button" class="lb__btn lb__next" aria-label="Следующее фото">&#8250;</button>' +
        '<div class="lb__bar"><span class="lb__caption"></span><span class="lb__counter"></span>' +
        '<div class="lb__zoom"><button type="button" class="lb__btn" data-zoom="out" aria-label="Уменьшить">&minus;</button>' +
        '<button type="button" class="lb__btn" data-zoom="in" aria-label="Приблизить">+</button></div></div>';
    document.body.appendChild(root);

    const stage = root.querySelector(".lb__stage");
    const img = root.querySelector(".lb__img");
    const backdrop = root.querySelector(".lb__backdrop");
    const captionEl = root.querySelector(".lb__caption");
    const counterEl = root.querySelector(".lb__counter");
    const btnClose = root.querySelector(".lb__close");
    const btnPrev = root.querySelector(".lb__prev");
    const btnNext = root.querySelector(".lb__next");

    const MAX_SCALE = 5;
    let items = [];
    let index = 0;
    let isOpen = false;
    let pushed = false;
    let lastFocus = null;
    let scale = 1;
    let tx = 0;
    let ty = 0;

    const pointers = new Map();
    let mode = null;       // null | "pan" | "swipe-x" | "swipe-y" | "pinch" | "ignore"
    let start = null;
    let pinch = null;
    let lastTap = { t: 0, x: 0, y: 0 };

    // ---------- вспомогательные ----------
    function apply() {
        img.style.transform = "translate3d(" + tx + "px," + ty + "px,0) scale(" + scale + ")";
        stage.classList.toggle("is-zoomed", scale > 1.01);
    }

    function clampPan() {
        if (scale <= 1) { tx = 0; ty = 0; return; }
        const w = img.offsetWidth * scale;
        const h = img.offsetHeight * scale;
        const mx = Math.max(0, (w - stage.clientWidth) / 2);
        const my = Math.max(0, (h - stage.clientHeight) / 2);
        tx = Math.min(mx, Math.max(-mx, tx));
        ty = Math.min(my, Math.max(-my, ty));
    }

    function stageCenter() {
        const r = stage.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    }

    // приблизить так, чтобы точка (px, py) экрана осталась на месте
    function zoomAt(px, py, newScale, animate) {
        const c = stageCenter();
        const ns = Math.min(MAX_SCALE, Math.max(1, newScale));
        const rx = px - c.x;
        const ry = py - c.y;
        tx = rx - (rx - tx) * (ns / scale);
        ty = ry - (ry - ty) * (ns / scale);
        scale = ns;
        if (scale <= 1.001) { scale = 1; tx = 0; ty = 0; }
        clampPan();
        img.classList.toggle("is-anim", !!animate);
        apply();
    }

    function resetTransform(animate) {
        scale = 1; tx = 0; ty = 0;
        img.classList.toggle("is-anim", !!animate);
        backdrop.style.opacity = "";
        apply();
    }

    function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
    function mid(a, b) { return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }; }

    // ---------- показ фото ----------
    function show(i, dir) {
        const n = items.length;
        index = (i + n) % n;
        const item = items[index];

        scale = 1; tx = 0; ty = 0;
        backdrop.style.opacity = "";
        img.classList.remove("is-anim");
        img.style.opacity = "0";
        img.style.transform = "translate3d(" + (dir ? dir * 60 : 0) + "px,0,0) scale(1)";
        stage.classList.remove("is-zoomed");

        img.onload = () => {
            requestAnimationFrame(() => {
                void img.offsetWidth; // фиксируем стартовое положение для плавной анимации
                img.classList.add("is-anim");
                img.style.opacity = "1";
                apply();
            });
        };
        img.onerror = () => { img.style.opacity = "1"; };
        img.alt = item.caption;
        img.src = item.href;

        captionEl.textContent = item.caption;
        counterEl.textContent = n > 1 ? (index + 1) + " / " + n : "";

        // подгружаем соседей, чтобы листание было мгновенным
        if (n > 1) {
            [index - 1, index + 1].forEach((k) => { new Image().src = items[(k + n) % n].href; });
        }
    }

    function go(delta) {
        if (items.length < 2) return;
        show(index + delta, delta);
    }

    function openAt(group, i, trigger) {
        items = groups[group].map((a) => ({ href: a.href, caption: a.dataset.caption || "" }));
        lastFocus = trigger || document.activeElement;
        isOpen = true;
        root.classList.toggle("lb--single", items.length < 2);
        root.hidden = false;
        document.documentElement.classList.add("lb-open");
        show(i, 0);
        requestAnimationFrame(() => root.classList.add("is-open"));
        btnClose.focus({ preventScroll: true });
        try { history.pushState({ lb: 1 }, ""); pushed = true; } catch (e) { pushed = false; }
    }

    function close(fromPop) {
        if (!isOpen) return;
        isOpen = false;
        pointers.clear();
        mode = null;
        root.classList.remove("is-open");
        document.documentElement.classList.remove("lb-open");
        setTimeout(() => {
            if (isOpen) return;
            root.hidden = true;
            img.onload = null;
            img.removeAttribute("src");
            img.style.opacity = "0";
        }, 230);
        if (pushed && !fromPop) { pushed = false; try { history.back(); } catch (e) { /* игнор */ } }
        pushed = false;
        if (lastFocus && lastFocus.focus) { try { lastFocus.focus({ preventScroll: true }); } catch (e) { /* игнор */ } }
    }

    // кнопка «Назад» на телефоне закрывает просмотр, а не уходит со страницы
    window.addEventListener("popstate", () => { if (isOpen) { pushed = false; close(true); } });

    // ---------- открытие по клику ----------
    Object.keys(groups).forEach((g) => {
        groups[g].forEach((a, i) => {
            a.addEventListener("click", (e) => {
                if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
                e.preventDefault();
                openAt(g, i, a);
            });
        });
    });

    // ---------- кнопки ----------
    btnClose.addEventListener("click", () => close(false));
    btnPrev.addEventListener("click", () => go(-1));
    btnNext.addEventListener("click", () => go(1));
    root.querySelectorAll("[data-zoom]").forEach((b) => {
        b.addEventListener("click", () => {
            const c = stageCenter();
            zoomAt(c.x, c.y, scale * (b.dataset.zoom === "in" ? 1.6 : 1 / 1.6), true);
        });
    });
    root.addEventListener("gesturestart", (e) => e.preventDefault()); // iOS: не масштабируем всю страницу

    // ---------- жесты ----------
    stage.addEventListener("pointerdown", (e) => {
        if (e.pointerType === "mouse" && e.button !== 0) return;
        try { stage.setPointerCapture(e.pointerId); } catch (err) { /* игнор */ }
        pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
        img.classList.remove("is-anim");

        if (pointers.size === 1) {
            start = { x: e.clientX, y: e.clientY, t: performance.now(), tx: tx, ty: ty, onImg: e.target === img, moved: false };
            mode = scale > 1.01 ? "pan" : null;
        } else if (pointers.size === 2) {
            const pts = Array.from(pointers.values());
            const m = mid(pts[0], pts[1]);
            pinch = { d: Math.max(1, dist(pts[0], pts[1])), s: scale, tx: tx, ty: ty, mx: m.x, my: m.y };
            mode = "pinch";
        }
    });

    stage.addEventListener("pointermove", (e) => {
        if (!pointers.has(e.pointerId)) return;
        pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

        if (mode === "pinch" && pointers.size >= 2 && pinch) {
            const pts = Array.from(pointers.values());
            const m = mid(pts[0], pts[1]);
            const ns = Math.min(MAX_SCALE * 1.15, Math.max(0.7, pinch.s * dist(pts[0], pts[1]) / pinch.d));
            const c = stageCenter();
            // точка картинки под пальцами в момент начала жеста должна остаться под пальцами
            const ix = (pinch.mx - c.x - pinch.tx) / pinch.s;
            const iy = (pinch.my - c.y - pinch.ty) / pinch.s;
            scale = ns;
            tx = (m.x - c.x) - ix * ns;
            ty = (m.y - c.y) - iy * ns;
            apply();
            return;
        }

        if (pointers.size !== 1 || !start) return;
        const dx = e.clientX - start.x;
        const dy = e.clientY - start.y;
        if (!start.moved && Math.hypot(dx, dy) > 6) start.moved = true;
        if (!start.moved) return;

        if (mode === "pan") {
            tx = start.tx + dx;
            ty = start.ty + dy;
            clampPan();
            apply();
            stage.classList.add("is-dragging");
        } else {
            if (mode === null) {
                if (Math.abs(dx) > Math.abs(dy)) mode = items.length > 1 ? "swipe-x" : "ignore";
                else mode = "swipe-y";
            }
            if (mode === "swipe-x") {
                tx = dx; ty = 0;
                apply();
            } else if (mode === "swipe-y") {
                tx = 0; ty = dy;
                backdrop.style.opacity = String(Math.max(0.25, 1 - Math.abs(dy) / 380));
                apply();
            }
        }
    });

    function endPointer(e, cancelled) {
        if (!pointers.has(e.pointerId)) return;
        pointers.delete(e.pointerId);
        try { stage.releasePointerCapture(e.pointerId); } catch (err) { /* игнор */ }
        stage.classList.remove("is-dragging");

        // отпустили один палец из двух: продолжаем сдвиг оставшимся
        if (mode === "pinch") {
            if (pointers.size === 1) {
                if (scale < 1.02) { resetTransform(true); mode = "ignore"; }
                else {
                    if (scale > MAX_SCALE) scale = MAX_SCALE;
                    clampPan();
                    img.classList.add("is-anim");
                    apply();
                    const p = Array.from(pointers.values())[0];
                    start = { x: p.x, y: p.y, t: performance.now(), tx: tx, ty: ty, onImg: true, moved: true };
                    mode = "pan";
                }
            } else if (pointers.size === 0) {
                if (scale < 1.02) resetTransform(true);
                mode = null;
            }
            return;
        }

        if (pointers.size > 0 || !start) return;

        const dx = e.clientX - start.x;
        const dy = e.clientY - start.y;
        const dt = performance.now() - start.t;

        if (!cancelled) {
            if (mode === "swipe-x") {
                const fast = Math.abs(dx) > 30 && dt < 260;
                if (Math.abs(dx) > 70 || fast) { go(dx < 0 ? 1 : -1); }
                else resetTransform(true);
            } else if (mode === "swipe-y") {
                if (Math.abs(dy) > 110 || (Math.abs(dy) > 40 && dt < 220)) { close(false); }
                else resetTransform(true);
            } else if (mode === "pan") {
                clampPan();
                img.classList.add("is-anim");
                apply();
            } else if (!start.moved && dt < 350) {
                // это был тап/клик
                if (!start.onImg) {
                    close(false);
                } else {
                    const now = performance.now();
                    if (now - lastTap.t < 320 && Math.hypot(e.clientX - lastTap.x, e.clientY - lastTap.y) < 40) {
                        lastTap.t = 0;
                        zoomAt(e.clientX, e.clientY, scale > 1.2 ? 1 : 2.6, true);
                    } else {
                        lastTap = { t: now, x: e.clientX, y: e.clientY };
                    }
                }
            }
        } else {
            resetTransform(true);
        }
        mode = null;
        start = null;
    }
    stage.addEventListener("pointerup", (e) => endPointer(e, false));
    stage.addEventListener("pointercancel", (e) => endPointer(e, true));

    // колесо мыши / щипок на тачпаде
    stage.addEventListener("wheel", (e) => {
        e.preventDefault();
        const k = Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0018));
        zoomAt(e.clientX, e.clientY, scale * k, false);
    }, { passive: false });

    // ---------- клавиатура ----------
    document.addEventListener("keydown", (e) => {
        if (!isOpen) return;
        const c = stageCenter();
        let handled = true;
        switch (e.key) {
            case "Escape": close(false); break;
            case "ArrowLeft": go(-1); break;
            case "ArrowRight": go(1); break;
            case "+": case "=": zoomAt(c.x, c.y, scale * 1.4, true); break;
            case "-": case "_": zoomAt(c.x, c.y, scale / 1.4, true); break;
            case "0": resetTransform(true); break;
            case "Tab": {
                const focusable = Array.from(root.querySelectorAll("button")).filter((b) => b.offsetParent !== null);
                if (!focusable.length) break;
                const first = focusable[0];
                const last = focusable[focusable.length - 1];
                if (e.shiftKey && document.activeElement === first) { last.focus(); }
                else if (!e.shiftKey && document.activeElement === last) { first.focus(); }
                else handled = false;
                break;
            }
            default: handled = false;
        }
        if (handled) { e.preventDefault(); e.stopPropagation(); }
    }, true);

    window.addEventListener("resize", () => { if (isOpen) { clampPan(); apply(); } });
});


// ============================================================================
// Пасхалка: код Конами  ↑ ↑ ↓ ↓ ← → ← → B A
// ============================================================================
safe("konami", () => {
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
                spawnConfetti();
            }
        } else {
            progress = key === sequence[0] ? 1 : 0;
        }
    });

    function spawnConfetti() {
        if (prefersReducedMotion) return;
        const colors = ["#2563EB", "#3B82F6", "#60A5FA", "#F59E0B", "#0F172A"];
        for (let i = 0; i < 36; i += 1) {
            const piece = document.createElement("span");
            const color = colors[i % colors.length];
            Object.assign(piece.style, {
                position: "fixed",
                left: Math.random() * 100 + "vw",
                top: "-10px",
                width: "8px",
                height: "8px",
                borderRadius: "50%", // конфетти-точки в тему
                background: color,
                boxShadow: "none",
                zIndex: "600",
                pointerEvents: "none",
                transition: "transform 1.7s ease-in, opacity 1.7s ease-in",
            });
            document.body.appendChild(piece);

            requestAnimationFrame(() => {
                const x = (Math.random() - 0.5) * 220;
                piece.style.transform = "translate(" + x + "px, " + (window.innerHeight + 40) + "px)";
                piece.style.opacity = "0";
            });
            setTimeout(() => piece.remove(), 1900);
        }
    }
});
