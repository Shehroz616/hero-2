(() => {
    const LAST_FRAME = 80;      // frames 0..80 are the only ones ever shown
    const TOTAL_FRAMES = LAST_FRAME + 1;
    const INITIAL_FRAMES = 12;  // needed before the loader hides
    const framePath = (i) =>
        `assets/img/frames-transparent/ezgif-frame-${String(i + 1).padStart(3, "0")}.webp`;

    const frames = new Array(TOTAL_FRAMES);
    const canvas = document.getElementById("heroCanvas");
    const ctx = canvas.getContext("2d");
    const track = document.getElementById("track");
    const loading = document.getElementById("loading");
    const loaderBar = document.getElementById("loaderBar");
    const loaderCount = document.getElementById("loaderCount");

    let currentIndex = 0;
    let needsRedraw = true;
    let cssW = 1, cssH = 1;

    const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

    const loadFrame = (i) =>
        new Promise((resolve) => {
            if (frames[i]) return resolve(frames[i]);
            const img = new Image();
            img.decoding = "async";
            img.src = framePath(i);
            img.decode()
                .then(() => {
                    frames[i] = img;
                    if (i === currentIndex) needsRedraw = true;
                    resolve(img);
                })
                .catch(() => resolve(null));
        });

    // load a range with limited parallelism
    const loadRange = async (start, end, limit, onProgress) => {
        let next = start, done = 0;
        const worker = async () => {
            while (next <= end) {
                const i = next++;
                await loadFrame(i);
                if (onProgress) onProgress(++done);
            }
        };
        await Promise.all(Array.from({ length: limit }, worker));
    };

    const resizeCanvas = () => {
        const ratio = Math.min(2, devicePixelRatio || 1);
        const rect = canvas.getBoundingClientRect();
        cssW = Math.max(1, rect.width);
        cssH = Math.max(1, rect.height);
        canvas.width = Math.floor(cssW * ratio);
        canvas.height = Math.floor(cssH * ratio);
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
        needsRedraw = true;
    };

    const draw = (index) => {
        // fall back to the nearest already-loaded earlier frame
        let image = null;
        for (let i = index; i >= 0 && !image; i--) image = frames[i];
        if (!image) return;
        const scale = Math.min(cssW / image.naturalWidth, cssH / image.naturalHeight);
        const w = image.naturalWidth * scale;
        const h = image.naturalHeight * scale;
        ctx.clearRect(0, 0, cssW, cssH);
        ctx.drawImage(image, cssW - w, cssH - h, w, h);
    };

    const getFrameIndexFromScroll = (progress) => {
        const reverseAt = 80;
        const offsetIndex = Math.round(progress * 159) + 1;
        if (offsetIndex <= reverseAt) return offsetIndex;
        return clamp(reverseAt - (offsetIndex - reverseAt), 1, reverseAt);
    };

    const tick = () => {
        const rect = track.getBoundingClientRect();
        const travel = Math.max(1, track.offsetHeight - innerHeight);
        const progress = clamp(-rect.top / travel, 0, 1);
        const index = getFrameIndexFromScroll(progress);
        if (index !== currentIndex || needsRedraw) {
            currentIndex = index;
            needsRedraw = false;
            draw(index);
        }
        requestAnimationFrame(tick);
    };

    addEventListener("resize", resizeCanvas, { passive: true });

    gsap.registerPlugin(ScrollTrigger);
    if (typeof Lenis === "function") {
        const lenis = new Lenis({ duration: 1.15, smoothWheel: true });
        lenis.on("scroll", ScrollTrigger.update);
        gsap.ticker.add((time) => lenis.raf(time * 1000));
    }
    gsap.ticker.lagSmoothing(0);

    gsap.utils.toArray(".reveal").forEach((el) =>
        gsap.fromTo(
            el,
            { y: 30, opacity: 0 },
            {
                y: 0, opacity: 1, duration: 1, ease: "power3.out",
                scrollTrigger: { trigger: el, start: "top 82%", toggleActions: "play none none reverse" },
            },
        ),
    );

    resizeCanvas();
    loadRange(0, INITIAL_FRAMES - 1, 6, (n) => {
        loaderBar.style.width = `${(n / INITIAL_FRAMES) * 100}%`;
        loaderCount.textContent = `${n} / ${INITIAL_FRAMES}`;
    }).then(() => {
        draw(0);
        loading.classList.add("is-done");
        tick();
        // the rest loads in the background while the user starts scrolling
        loadRange(INITIAL_FRAMES, LAST_FRAME, 4);
    });
})();