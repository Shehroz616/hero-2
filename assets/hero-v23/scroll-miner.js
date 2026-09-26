(() => {
  const track = document.getElementById('track');
  const box = document.getElementById('scrollMiner');
  if (!track || !box) return;
  box.querySelectorAll('.miner-motion-layer,.miner-inner-hardware,.scroll-miner-frame,.miner-parts-scene').forEach(el => el.remove());
  const ns = 'http://www.w3.org/2000/svg';
  const scene = document.createElementNS(ns, 'svg');
  scene.classList.add('miner-parts-scene');
  scene.setAttribute('viewBox', '0 0 1254 1254');
  scene.setAttribute('aria-hidden', 'true');
  // All clips use source-image coordinates, not the containing element's dimensions.
  // Complementary boundaries reconstruct the supplied image without gaps at rest.
  const pieces = [
    ['control', '0,0 850,0 850,175 650,175 0,175', 0, -170],
    ['body', '650,175 850,175 850,1254 640,1254 640,700', 100, -20],
    ['psu', '850,0 1254,0 1254,1254 850,1254', 190, 0],
    ['fans', '0,175 650,175 640,700 640,1254 0,1254', -190, 0]
  ];
  const defs = document.createElementNS(ns, 'defs');
  scene.append(defs);
  const inside = document.createElementNS(ns, 'g');
  inside.setAttribute('opacity', '0');
  // Reuse the supplied rendered hashboards and heatsink instead of drawn placeholders.
  const hardwareParts = [
    ['board-a', 465, 210, 145, 900, '350 0 500 1312', 1199, 1312],
    ['board-b', 540, 210, 145, 900, '350 0 500 1312', 1199, 1312],
    ['heat', 605, 245, 225, 840, '180 0 1000 1168', 1346, 1168]
  ];
  hardwareParts.forEach(([name,x,y,width,height,viewBox,sourceWidth,sourceHeight]) => {
    const crop = document.createElementNS(ns, 'svg');
    Object.entries({x,y,width,height,viewBox,preserveAspectRatio:'none'}).forEach(([key,value])=>crop.setAttribute(key,String(value)));
    const image = document.createElementNS(ns, 'image');
    image.setAttribute('href', `assets/hero-v23/assets/user-miner/${name}.png`);
    image.setAttribute('width', sourceWidth);image.setAttribute('height',sourceHeight);
    crop.append(image);inside.append(crop);
  });
  scene.append(inside);
  const groups = pieces.map(([name, points, x, y]) => {
    const clip = document.createElementNS(ns, 'clipPath');
    clip.id = 'same-miner-' + name;
    const polygon = document.createElementNS(ns, 'polygon');
    polygon.setAttribute('points', points);
    clip.append(polygon); defs.append(clip);
    const group = document.createElementNS(ns, 'g');
    const img = document.createElementNS(ns, 'image');
    img.setAttribute('href', 'assets/hero-v23/assets/scroll-miner/closed.png');
    img.setAttribute('width', '1254'); img.setAttribute('height', '1254');
    img.setAttribute('clip-path', `url(#${clip.id})`);
    group.append(img); scene.append(group);
    return {group, name, x, y};
  });
  box.append(scene);
  const orbit = document.createElement('div');
  orbit.className = 'miner-base-orbit';
  box.append(orbit);
  const smooth = value => {const t = Math.max(0, Math.min(1, value)); return t*t*(3-2*t)};
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  function render(now) {
    const p = Math.max(0, -track.getBoundingClientRect().top / innerHeight);
    const closing = 1 - smooth((p - 3.05) / .75);
    const opening = smooth((p - .15) / .85) * closing;
    const exposed = smooth((p - 1) / .85) * closing;
    inside.setAttribute('opacity', String(exposed));
    inside.setAttribute('transform', `translate(0 ${-35 * exposed})`);
    const idle = 1 - opening;
    const angle = reduced.matches ? 0 : Math.sin(now / 3500) * 7 * idle;
    scene.style.transform = `perspective(1200px) rotateY(${angle}deg)`;
    box.style.setProperty('--base-turn', `${reduced.matches ? 0 : Math.sin(now / 3500) * 3}deg`);
    for (const part of groups) {
      const start = part.name === 'control' ? .15 : part.name === 'fans' ? 1.8 : 1;
      const amount = smooth((p - start) / .85) * closing;
      part.group.setAttribute('transform', `translate(${part.x * amount} ${part.y * amount})`);
    }
    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
})();
