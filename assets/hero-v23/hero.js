(() => {
    const TOTAL_FRAMES = 160,
        FIRST_BATCH = 100,
        CACHE_RADIUS = 60,
        PREFETCH_AHEAD = 15,
        framePath = (index) =>
            `assets/img/frames-transparent/ezgif-frame-${String(index + 1).padStart(3, "0")}.png`,
        frames = new Array(TOTAL_FRAMES),
        canvas = document.getElementById("heroCanvas"),
        ctx = canvas.getContext("2d"),
        track = document.getElementById("track"),
        loading = document.getElementById("loading"),
        loaderBar = document.getElementById("loaderBar"),
        loaderCount = document.getElementById("loaderCount");
    let currentIndex = 0,
        direction = 1;
    const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
    const loadFrame = (index) => {
        if (index < 0 || index >= TOTAL_FRAMES || frames[index])
            return Promise.resolve(frames[index]);
        const image = new Image();
        const task = new Promise((resolve) => {
            image.onload = () => {
                frames[index] = image;
                resolve(image);
            };
            image.onerror = resolve;
        });
        image.src = framePath(index);
        return task;
    };
    const prune = () => {
        const low = Math.max(0, currentIndex - CACHE_RADIUS),
            high = Math.min(TOTAL_FRAMES - 1, currentIndex + CACHE_RADIUS);
        frames.forEach((image, index) => {
            if (image && (index < low || index > high)) frames[index] = null;
        });
    };
    const draw = (index) => {
        const image = frames[index] || frames[currentIndex];
        if (!image) return;
        const ratio = Math.min(2, devicePixelRatio || 1),
            rect = canvas.getBoundingClientRect(),
            width = Math.max(1, rect.width),
            height = Math.max(1, rect.height);
        canvas.width = Math.floor(width * ratio);
        canvas.height = Math.floor(height * ratio);
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
        const scale = Math.min(
            width / image.naturalWidth,
            height / image.naturalHeight,
        ),
            drawWidth = image.naturalWidth * scale,
            drawHeight = image.naturalHeight * scale;
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(
            image,
            width - drawWidth,
            height - drawHeight,
            drawWidth,
            drawHeight,
        );
    };
    const queueAround = (index) => {
        const low = Math.max(0, index - CACHE_RADIUS),
            high = Math.min(
                TOTAL_FRAMES - 1,
                index + CACHE_RADIUS + PREFETCH_AHEAD * direction,
            );
        for (let i = low; i <= high; i++) loadFrame(i);
        prune();
    };
    const setFrame = (index) => {
        currentIndex = index;
        draw(index);
        queueAround(index);
    };
    const preloadFirst = async () => {
        for (let index = 0; index < FIRST_BATCH; index++) {
            await loadFrame(index);
            loaderBar.style.width = `${((index + 1) / FIRST_BATCH) * 100}%`;
            loaderCount.textContent = `${index + 1} / ${FIRST_BATCH}`;
        }
        draw(0);
        loading.classList.add("is-done");
        queueAround(0);
    };
    const getFrameIndexFromScroll = (progress) => {
        const reverseAt = 80,
            rawIndex = Math.round(progress * (TOTAL_FRAMES - 1)),
            offsetIndex = rawIndex + 1;
        if (offsetIndex <= reverseAt) return offsetIndex;
        const reverseIndex = reverseAt - (offsetIndex - reverseAt);
        return clamp(reverseIndex, 1, reverseAt);
    };
    const updateFrame = () => {
        const rect = track.getBoundingClientRect(),
            travel = Math.max(1, track.offsetHeight - innerHeight),
            progress = clamp(-rect.top / travel, 0, 1),
            index = getFrameIndexFromScroll(progress);
        direction = index >= currentIndex ? 1 : -1;
        setFrame(index);
        requestAnimationFrame(updateFrame);
    };
    addEventListener("resize", () => draw(currentIndex), { passive: true });
    gsap.registerPlugin(ScrollTrigger);
    if (typeof Lenis === "function") {
        const lenis = new Lenis({ duration: 1.15, smoothWheel: true });
        lenis.on("scroll", ScrollTrigger.update);
        gsap.ticker.add((time) => lenis.raf(time * 1000));
    }
    gsap.ticker.lagSmoothing(0);
    gsap.utils.toArray(".reveal").forEach((element) =>
        gsap.fromTo(
            element,
            { y: 30, opacity: 0 },
            {
                y: 0,
                opacity: 1,
                duration: 1,
                ease: "power3.out",
                scrollTrigger: {
                    trigger: element,
                    start: "top 82%",
                    toggleActions: "play none none reverse",
                },
            },
        ),
    );
    
    preloadFirst().then(updateFrame);
})();
