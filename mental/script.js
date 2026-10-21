import * as THREE from 'three';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';

const app = {
  canvas: document.getElementById('scene-canvas'),
  photoLayer: document.getElementById('photo-layer'),
  textLayer: document.getElementById('text-layer'),
  surpriseLayer: document.getElementById('surprise-layer'),
  mailCard: document.getElementById('mail-card'),
  mailConfirm: document.getElementById('mail-confirm'),
  mailQuestion: document.getElementById('mail-question'),
  mailReveal: document.getElementById('mail-reveal'),
  mailAnswerForm: document.getElementById('mail-answer-form'),
  mailAnswer: document.getElementById('mail-answer'),
  mailFeedback: document.getElementById('mail-feedback'),
  smokeLayer: document.getElementById('smoke-layer'),
  welcomeLayer: document.getElementById('welcome-layer'),
  welcomeParticles: document.getElementById('welcome-particles'),
  storyFrame: document.getElementById('story-frame'),
  enterBtn: document.getElementById('enter-btn'),
  soundToggle: document.getElementById('sound-toggle'),
  finalSurprise: document.getElementById('final-surprise'),
  finalSurpriseButton: document.getElementById('final-surprise-show'),
  finalSurprisePhoto: document.getElementById('final-surprise-photo'),
  finalSurpriseCinema: document.getElementById('final-surprise-cinema'),
  finalCinemaIntro: document.getElementById('final-cinema-intro'),
  finalCinemaAssembled: document.getElementById('final-cinema-assembled'),
  finalCinemaGo: document.getElementById('final-cinema-go'),
  finalCinemaParticles: document.getElementById('final-cinema-particles'),
  quality: 'high',
  started: false,
  questionStoryStarted: false,
  birthdayStarted: false,
  scene: null,
  camera: null,
  renderer: null,
  clock: new THREE.Clock(),
  smokeMeshes: [],
  particles: null,
  dust: null,
  glowLight: null,
  farLight: null,
  photoItems: [],
  currentPhoto: null,
  currentText: null,
  currentMusic: 'opening',
  audioContext: null,
  ambienceGain: null,
  musicGain: null,
  ambientOsc: null,
  audioElement: null,
  audioReady: false,
  textTimeout: null,
  cameraTarget: new THREE.Vector3(0, 1, 12),
  cameraLookAt: new THREE.Vector3(0, 0, 0),
  cameraTween: null,
  mentalWord: null,
  mentalSegments: [],
  isAnimating: false,
  qualityMode: {
    high: { particleCount: 1400, smokeCount: 8, fogDensity: 0.055, pointSize: 0.045 },
    medium: { particleCount: 800, smokeCount: 5, fogDensity: 0.07, pointSize: 0.06 },
    low: { particleCount: 420, smokeCount: 3, fogDensity: 0.09, pointSize: 0.08 },
  },
  lastTime: performance.now(),
};

function wait(ms = 0) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function launchSurpriseFireworks() {
  const layer = document.getElementById('final-surprise-fireworks');
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const bursts = [
    { left: 39, top: 39, color: '#ffd68a' },
    { left: 53, top: 27, color: '#ffd2dc' },
    { left: 64, top: 44, color: '#ffe8a8' },
  ];

  bursts.forEach((burst, burstIndex) => {
    window.setTimeout(() => {
      const firework = document.createElement('span');
      firework.className = 'surprise-firework-burst';
      firework.style.left = `${burst.left}%`;
      firework.style.top = `${burst.top}%`;
      firework.style.setProperty('--firework-color', burst.color);

      for (let index = 0; index < 24; index += 1) {
        const angle = (Math.PI * 2 * index) / 24 + Math.random() * 0.12;
        const distance = 38 + Math.random() * 56;
        const spark = document.createElement('i');
        spark.className = 'surprise-firework-spark';
        spark.style.setProperty('--spark-x', `${Math.cos(angle) * distance}px`);
        spark.style.setProperty('--spark-y', `${Math.sin(angle) * distance}px`);
        firework.appendChild(spark);
      }

      layer.appendChild(firework);
      window.setTimeout(() => firework.remove(), 2500);
    }, burstIndex * 480);
  });
}

function launchPaperBurst() {
  const layer = document.getElementById('final-surprise-papers');
  if (!layer || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const paperCount = window.innerWidth <= 600 ? 20 : 32;
  for (let index = 0; index < paperCount; index += 1) {
    const fromLeft = index % 2 === 0;
    const paper = document.createElement('i');
    const startX = fromLeft ? randomBetween(-8, 2) : randomBetween(98, 108);
    const travelX = fromLeft ? randomBetween(72, 110) : randomBetween(-110, -72);
    const travelY = randomBetween(-18, 24);
    const width = randomBetween(10, 30);
    const height = randomBetween(15, 42);

    paper.className = 'flying-paper';
    paper.style.left = `${startX}%`;
    paper.style.top = `${randomBetween(2, 98)}%`;
    paper.style.width = `${width}px`;
    paper.style.height = `${height}px`;
    paper.style.setProperty('--paper-x', `${travelX}vw`);
    paper.style.setProperty('--paper-mid-x', `${travelX * 0.46}vw`);
    paper.style.setProperty('--paper-mid-y', `${travelY - randomBetween(4, 20)}vh`);
    paper.style.setProperty('--paper-y', `${travelY}vh`);
    const rotation = randomBetween(-900, 900);
    const tilt = randomBetween(-35, 35);
    paper.style.setProperty('--paper-rotation', `${rotation}deg`);
    paper.style.setProperty('--paper-mid-rotation', `${rotation * 0.42}deg`);
    paper.style.setProperty('--paper-duration', `${randomBetween(1.5, 2.8)}s`);
    paper.style.setProperty('--paper-delay', `${randomBetween(0, 0.42)}s`);
    paper.style.setProperty('--paper-tilt', `${tilt}deg`);
    paper.style.setProperty('--paper-end-tilt', `${-tilt}deg`);
    layer.appendChild(paper);
    paper.addEventListener('animationend', () => paper.remove(), { once: true });
  }
}

async function playPaperWhoosh() {
  const AudioCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtor) return;

  app.audioContext ||= new AudioCtor();
  if (app.audioContext.state === 'suspended') {
    await app.audioContext.resume();
  }

  const context = app.audioContext;
  const duration = 1.25;
  const buffer = context.createBuffer(1, Math.ceil(context.sampleRate * duration), context.sampleRate);
  const samples = buffer.getChannelData(0);
  for (let index = 0; index < samples.length; index += 1) {
    samples[index] = (Math.random() * 2 - 1) * (1 - index / samples.length * 0.25);
  }

  const source = context.createBufferSource();
  const filter = context.createBiquadFilter();
  const gain = context.createGain();
  const now = context.currentTime;

  source.buffer = buffer;
  filter.type = 'bandpass';
  filter.Q.value = 0.7;
  filter.frequency.setValueAtTime(500, now);
  filter.frequency.exponentialRampToValueAtTime(1700, now + 0.45);
  filter.frequency.exponentialRampToValueAtTime(850, now + duration);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.16, now + 0.1);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  source.connect(filter);
  filter.connect(gain);
  gain.connect(context.destination);
  source.start(now);
  source.stop(now + duration);
}

const FINAL_BIRTHDAY_MESSAGE = 'ONCE AGAIN HAPPY BIRTHDAY MY DEAR MENTAL';
const LETTER_FLIGHT_DIRECTIONS = [
  'top-left', 'top-right', 'bottom-left', 'bottom-right',
  'left', 'right', 'top', 'bottom',
];

function createAssembledBirthdayTitle() {
  app.finalCinemaAssembled.replaceChildren();
  app.finalCinemaAssembled.setAttribute('aria-hidden', 'true');

  const words = FINAL_BIRTHDAY_MESSAGE.split(' ');
  let letterIndex = 0;
  words.forEach((word, wordIndex) => {
    if (wordIndex > 0) {
      app.finalCinemaAssembled.appendChild(document.createTextNode(' '));
    }

    const wordElement = document.createElement('span');
    wordElement.className = 'final-cinema-word';
    [...word].forEach((character) => {
      const letter = document.createElement('span');
      const direction = LETTER_FLIGHT_DIRECTIONS[letterIndex % LETTER_FLIGHT_DIRECTIONS.length];
      const horizontal = randomBetween(50, 100);
      const vertical = randomBetween(45, 90);
      const flight = {
        'top-left': [`-${horizontal}vw`, `-${vertical}vh`, '-420px', '-48deg'],
        'top-right': [`${horizontal}vw`, `-${vertical}vh`, '-520px', '52deg'],
        'bottom-left': [`-${horizontal}vw`, `${vertical}vh`, '-480px', '46deg'],
        'bottom-right': [`${horizontal}vw`, `${vertical}vh`, '-560px', '-50deg'],
        left: ['-110vw', `${randomBetween(-50, 50)}vh`, '-440px', '42deg'],
        right: ['110vw', `${randomBetween(-50, 50)}vh`, '-500px', '-42deg'],
        top: [`${randomBetween(-45, 45)}vw`, '-110vh', '-520px', '38deg'],
        bottom: [`${randomBetween(-45, 45)}vw`, '110vh', '-460px', '-38deg'],
      }[direction];

      letter.className = 'final-cinema-letter';
      letter.textContent = character;
      letter.style.setProperty('--letter-x', flight[0]);
      letter.style.setProperty('--letter-y', flight[1]);
      letter.style.setProperty('--letter-z', flight[2]);
      letter.style.setProperty('--letter-rotation', flight[3]);
      letter.style.setProperty('--letter-delay', `${letterIndex * 55}ms`);
      wordElement.appendChild(letter);
      letterIndex += 1;
    });
    app.finalCinemaAssembled.appendChild(wordElement);
  });
}

function launchFinalBirthdayBurst() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const layer = app.finalCinemaParticles;
  layer.replaceChildren();
  const colors = ['#ffe8b0', '#ffd2dd', '#c5e6ff', '#fff8ea', '#f4b9a8'];
  const count = window.innerWidth < 600 ? 48 : 76;

  for (let index = 0; index < count; index += 1) {
    const particle = document.createElement('i');
    const angle = Math.random() * Math.PI * 2;
    const distance = randomBetween(24, Math.min(window.innerWidth, window.innerHeight) * 0.72);
    particle.className = 'final-cinema-confetti';
    particle.style.setProperty('--confetti-x', `${Math.cos(angle) * distance}px`);
    particle.style.setProperty('--confetti-y', `${Math.sin(angle) * distance}px`);
    particle.style.setProperty('--confetti-spin', `${randomBetween(-720, 720)}deg`);
    particle.style.setProperty('--confetti-size', `${randomBetween(4, 10)}px`);
    particle.style.setProperty('--confetti-color', colors[index % colors.length]);
    particle.style.setProperty('--confetti-delay', `${randomBetween(0, 380)}ms`);
    layer.appendChild(particle);
  }

  for (let index = 0; index < 6; index += 1) {
    const lightning = document.createElement('i');
    lightning.className = 'final-cinema-lightning';
    lightning.style.left = `${randomBetween(24, 76)}%`;
    lightning.style.top = `${randomBetween(8, 38)}%`;
    lightning.style.setProperty('--lightning-height', `${randomBetween(24, 54)}vh`);
    lightning.style.setProperty('--lightning-rotation', `${randomBetween(-24, 24)}deg`);
    lightning.style.setProperty('--lightning-delay', `${randomBetween(0, 1.6)}s`);
    layer.appendChild(lightning);
  }
}

async function keepBirthdayMusicPlaying() {
  if (app.audioContext?.state === 'suspended') {
    await app.audioContext.resume();
  }
  if (app.audioElement?.paused) {
    await app.audioElement.play();
  }
}

async function runFinalBirthdaySequence() {
  const cinema = app.finalSurpriseCinema;
  cinema.hidden = false;
  cinema.setAttribute('aria-hidden', 'false');
  cinema.classList.remove('burst', 'blurred', 'button-ready', 'assembling', 'settled');
  app.finalCinemaGo.disabled = false;
  app.finalCinemaIntro.textContent = FINAL_BIRTHDAY_MESSAGE;
  createAssembledBirthdayTitle();
  requestAnimationFrame(() => cinema.classList.add('active'));

  await wait(2400);
  cinema.classList.add('burst');
  launchFinalBirthdayBurst();
  await wait(2400);
  cinema.classList.add('blurred');
  await wait(1350);
  cinema.classList.add('button-ready');
  app.finalCinemaGo.focus({ preventScroll: true });
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function detectQuality() {
  const isMobile = /Mobi|Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || window.innerWidth <= 768;
  const coarseGpu = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4;

  if (isMobile || coarseGpu) {
    app.quality = 'low';
  } else if (window.innerWidth <= 1200 || navigator.deviceMemory <= 4) {
    app.quality = 'medium';
  } else {
    app.quality = 'high';
  }
}

function createSmokeTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  const gradient = ctx.createRadialGradient(256, 256, 60, 256, 256, 220);
  gradient.addColorStop(0, 'rgba(230,236,255,0.82)');
  gradient.addColorStop(0.25, 'rgba(188,202,234,0.36)');
  gradient.addColorStop(0.52, 'rgba(122,139,165,0.18)');
  gradient.addColorStop(1, 'rgba(9,14,18,0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < 110; i += 1) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const r = Math.random() * 80 + 24;
    const alpha = Math.random() * 0.12;
    ctx.beginPath();
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  return new THREE.CanvasTexture(canvas);
}

function createScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x02070d);
  scene.fog = new THREE.FogExp2(0x091522, app.qualityMode[app.quality].fogDensity);

  const renderer = new THREE.WebGLRenderer({
    canvas: app.canvas,
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance',
  });

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, app.quality === 'low' ? 1.5 : 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  renderer.setClearColor(0x02070d, 1);

  app.scene = scene;
  app.renderer = renderer;
}

function createCamera() {
  const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 120);
  camera.position.set(0, 1.2, 12);
  app.camera = camera;
}

function createLights() {
  const hemi = new THREE.HemisphereLight(0x87a7d4, 0x04070d, 0.72);
  app.scene.add(hemi);

  const keyLight = new THREE.DirectionalLight(0xf2d7b1, 0.9);
  keyLight.position.set(2, 6, 8);
  app.scene.add(keyLight);

  const glowLight = new THREE.PointLight(0xf5d6b0, 18, 35, 2);
  glowLight.position.set(0, 2, 8);
  app.scene.add(glowLight);
  app.glowLight = glowLight;

  const farLight = new THREE.PointLight(0x8ec5ff, 6, 60, 2);
  farLight.position.set(-3, 4, -8);
  app.scene.add(farLight);
  app.farLight = farLight;
}

function createParticles() {
  const config = app.qualityMode[app.quality];
  const geometry = new THREE.BufferGeometry();
  const count = config.particleCount;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  for (let i = 0; i < count; i += 1) {
    const i3 = i * 3;
    positions[i3] = randomBetween(-22, 22);
    positions[i3 + 1] = randomBetween(-10, 14);
    positions[i3 + 2] = randomBetween(-18, 18);

    const tint = new THREE.Color().setHSL(0.58 + Math.random() * 0.08, 0.4, 0.72);
    colors[i3] = tint.r;
    colors[i3 + 1] = tint.g;
    colors[i3 + 2] = tint.b;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: config.pointSize,
    vertexColors: true,
    transparent: true,
    opacity: 0.9,
    sizeAttenuation: true,
    depthWrite: false,
  });

  const particles = new THREE.Points(geometry, material);
  app.scene.add(particles);
  app.particles = particles;

  const dustGeometry = new THREE.BufferGeometry();
  const dustCount = config.particleCount * 0.7;
  const dustPositions = new Float32Array(dustCount * 3);
  const dustColors = new Float32Array(dustCount * 3);

  for (let i = 0; i < dustCount; i += 1) {
    const i3 = i * 3;
    dustPositions[i3] = randomBetween(-24, 24);
    dustPositions[i3 + 1] = randomBetween(-12, 18);
    dustPositions[i3 + 2] = randomBetween(-18, 20);

    const dColor = new THREE.Color().setHSL(0.62, 0.2, 0.54 + Math.random() * 0.2);
    dustColors[i3] = dColor.r;
    dustColors[i3 + 1] = dColor.g;
    dustColors[i3 + 2] = dColor.b;
  }

  dustGeometry.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
  dustGeometry.setAttribute('color', new THREE.BufferAttribute(dustColors, 3));

  const dustMaterial = new THREE.PointsMaterial({
    size: config.pointSize * 1.25,
    vertexColors: true,
    transparent: true,
    opacity: 0.45,
    depthWrite: false,
  });

  const dust = new THREE.Points(dustGeometry, dustMaterial);
  app.scene.add(dust);
  app.dust = dust;
}

function createSmoke() {
  const smokeTexture = createSmokeTexture();
  const config = app.qualityMode[app.quality];
  const group = new THREE.Group();

  for (let i = 0; i < config.smokeCount; i += 1) {
    const material = new THREE.MeshBasicMaterial({
      map: smokeTexture,
      transparent: true,
      opacity: 0.12,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });

    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(16, 12), material);
    mesh.position.set(randomBetween(-7, 7), randomBetween(-1, 5), randomBetween(-12, 5));
    mesh.rotation.z = randomBetween(-Math.PI, Math.PI);
    mesh.scale.setScalar(randomBetween(1.4, 2.8));
    mesh.userData = {
      speed: randomBetween(0.08, 0.2),
      drift: randomBetween(-0.6, 0.6),
      baseY: mesh.position.y,
      amp: randomBetween(0.3, 1.1),
    };

    group.add(mesh);
    app.smokeMeshes.push(mesh);
  }

  group.name = 'smokeGroup';
  app.scene.add(group);
  app.smokeTexture = smokeTexture;
}

function setParticleIntensity(value) {
  if (!app.particles) return;
  const material = app.particles.material;
  material.opacity = clamp(value, 0.1, 1);

  if (app.dust && app.dust.material) {
    app.dust.material.opacity = clamp(value * 0.7, 0.08, 0.8);
  }
}

function setSmokeDensity(value) {
  app.smokeMeshes.forEach((mesh) => {
    mesh.material.opacity = clamp(value * 0.6 + Math.random() * 0.08, 0.04, 0.42);
  });
}

function updateCamera() {
  if (!app.camera) return;

  if (app.cameraTween) {
    const eased = 1 - Math.pow(1 - app.cameraTween.progress, 2);
    app.camera.position.lerpVectors(app.cameraTween.from, app.cameraTween.to, eased);
    app.camera.lookAt(app.cameraTween.lookAt);
    app.cameraTween.progress += app.cameraTween.speed;
    if (app.cameraTween.progress >= 1) {
      app.cameraTween = null;
    }
  } else {
    app.camera.position.lerp(new THREE.Vector3(app.cameraTarget.x, app.cameraTarget.y, app.cameraTarget.z), 0.015);
    app.camera.lookAt(app.cameraLookAt.x, app.cameraLookAt.y, app.cameraLookAt.z);
  }
}

function moveCamera(toPosition, lookAt, duration = 5) {
  const from = app.camera.position.clone();
  const target = toPosition instanceof THREE.Vector3 ? toPosition : new THREE.Vector3(...toPosition);
  app.cameraTween = {
    from,
    to: target,
    lookAt: lookAt instanceof THREE.Vector3 ? lookAt : new THREE.Vector3(...lookAt),
    progress: 0,
    speed: 1 / (duration * 60),
  };
  app.cameraTarget.copy(target);
  app.cameraLookAt.copy(app.cameraTween.lookAt);
}

function travelToLight() {
  const lightTarget = new THREE.Vector3(0, 2.5, -4);
  moveCamera(new THREE.Vector3(0, 1.2, 8), lightTarget, 10);
}

function sceneVoid() {
  app.setCameraDrift = true;
  setParticleIntensity(0.28);
  setSmokeDensity(0.22);
  app.cameraTarget.set(0.2, 1.2, 12.5);
  app.cameraLookAt.set(0, 0, 0);
}

function sceneJourney() {
  setParticleIntensity(0.64);
  setSmokeDensity(0.5);
  moveCamera(new THREE.Vector3(-2, 1.8, 11), new THREE.Vector3(-1, 1, -2), 9);
}

async function sceneFirstMemory() {
  await transitionPhoto('mental01.jpg');
  moveCamera(new THREE.Vector3(0.5, 1.7, 7.4), new THREE.Vector3(0, 0, 0), 7);
  await showText('It started with a friendship.', { duration: 3200, className: 'cinematic-text centered' });
  await wait(600);
}

function sceneMemoryWorld() {
  return new Promise(async (resolve) => {
    const photos = ['mental02.jpg', 'mental03.jpg', 'mental04.jpg', 'mental05.jpg', 'mental06.png', 'together01.png'];
    setParticleIntensity(0.72);
    setSmokeDensity(0.62);

    for (let index = 0; index < photos.length; index += 1) {
      const label = ['The laughs.', 'The madness.', 'The memories.', 'The moments.', 'The story.', 'The us.'][index] || '';
      await transitionPhoto(photos[index]);
      if (label) {
        await showText(label, { duration: 1800, className: 'cinematic-text centered' });
        await wait(300);
      } else {
        await wait(1200);
      }
    }

    resolve();
  });
}

async function sceneChange() {
  setParticleIntensity(0.28);
  setSmokeDensity(0.28);
  await transitionPhoto('mental06.png');
  await showText('Somewhere along the way…', { duration: 2400, className: 'cinematic-text centered' });
  await wait(1200);
  await showText('…you became more than just a friend.', { duration: 3200, className: 'cinematic-text centered' });
  await wait(700);
}

async function sceneMessage() {
  const lines = [
    'You came into my life as a friend…',
    'but somewhere between the laughs,',
    'the memories,',
    'the madness,',
    'and the moments that mattered…',
    'you became someone I could never see as',
    '“just a friend.”',
    '',
    'Your happiness matters to me.',
    'Your presence feels special.',
    'And your place in my life',
    'is something words can’t really explain.',
    '',
    'I don’t know what every tomorrow will look like,',
    'but I know I want more memories,',
    'more laughs,',
    'more madness,',
    'and more moments with you.',
    '',
    'Happy Birthday, Mental. ❤️',
  ];

  for (const line of lines) {
    if (!line) {
      await wait(500);
      continue;
    }

    const waitTime = line.includes('Happy Birthday') ? 2600 : 1350;
    await showText(line, { duration: waitTime, className: 'cinematic-text message' });
    await wait(250);
  }
}

function sceneLight() {
  setParticleIntensity(0.1);
  setSmokeDensity(0.18);
  hidePhoto();
  moveCamera(new THREE.Vector3(0, 1.2, 9), new THREE.Vector3(0, 1.4, -3), 9);
}

async function revealMentalName() {
  if (!app.mentalWord) {
    const fontLoader = new FontLoader();
    const font = await fontLoader.loadAsync('https://threejs.org/examples/fonts/helvetiker_bold.typeface.json');
    const segments = ['M', 'ME', 'MEN', 'MENT', 'MENTA', 'MENTAL'];
    const group = new THREE.Group();
    group.position.set(0, 0.2, -2.4);
    group.rotation.set(-0.15, 0.64, 0);
    group.scale.setScalar(0.96);

    app.mentalSegments = segments.map((segment, index) => {
      const geometry = new TextGeometry(segment, {
        font,
        size: 1.08 + index * 0.18,
        depth: 0.42,
        curveSegments: 24,
      });
      geometry.center();

      const material = new THREE.MeshPhysicalMaterial({
        color: 0xf2efe6,
        metalness: 0.66,
        roughness: 0.18,
        emissive: 0x4c7ef7,
        emissiveIntensity: 0.45,
        transparent: true,
        opacity: 0.96,
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(0, -index * 0.08, index * 0.12);
      mesh.scale.setScalar(0.25);
      mesh.visible = false;
      group.add(mesh);
      return mesh;
    });

    app.scene.add(group);
    app.mentalWord = group;
  }

  app.mentalWord.visible = true;

  for (let i = 0; i < app.mentalSegments.length; i += 1) {
    const mesh = app.mentalSegments[i];
    mesh.visible = true;
    mesh.scale.setScalar(0.14);
    const start = mesh.scale.clone();
    const target = new THREE.Vector3(1, 1, 1);

    for (let step = 0; step <= 60; step += 1) {
      const t = step / 60;
      mesh.scale.lerpVectors(start, target, t);
      mesh.material.opacity = 0.2 + t * 0.8;
      await wait(18);
    }

    await wait(250);
  }

  app.glowLight.intensity = 12;
  app.farLight.intensity = 9;
}

async function sceneFinalReveal() {
  await revealMentalName();
  await wait(800);
  await transitionPhoto('final.jpg');
  await showText('HAPPY BIRTHDAY, MENTAL ❤️', { duration: 3400, className: 'cinematic-text large' });
  await wait(1200);
  await showText('To more memories,\nmore madness,\nand many more moments together.', {
    duration: 4200,
    className: 'cinematic-text message',
  });
  await wait(1200);
  await showSurpriseMail();
}

async function showSurpriseMail() {
  await showText('Wait... I have one more surprise for you. 👀', {
    duration: 3400,
    className: 'cinematic-text centered',
  });
  await wait(450);
  await showText("But I'm not going to reveal it that easily... 😌", {
    duration: 3600,
    className: 'cinematic-text centered',
  });
  await wait(550);
  hideText();

  app.surpriseLayer.setAttribute('aria-hidden', 'false');
  app.surpriseLayer.classList.add('visible');
  requestAnimationFrame(() => app.surpriseLayer.classList.add('ready'));
  app.mailCard.focus();

  await new Promise((resolve) => {
    app.mailContinue.addEventListener('click', resolve, { once: true });
  });

  app.surpriseLayer.classList.remove('ready');
  await wait(1100);
  app.surpriseLayer.classList.remove('visible');
  app.surpriseLayer.setAttribute('aria-hidden', 'true');
}

function normalizeMailAnswer(value) {
  return value.trim().replace(/\s+/g, '').toLowerCase();
}

function bindMailFlow() {
  const confirm = app.mailConfirm;
  const question = app.mailQuestion;
  const reveal = app.mailReveal;
  const answerField = app.mailAnswer;
  const acceptedAnswers = new Set(['naveenkhan', 'naveenkan']);

  app.mailCard.addEventListener('click', () => {
    app.mailCard.classList.add('selected');
    confirm.hidden = false;
    requestAnimationFrame(() => confirm.classList.add('shown'));
  });

  document.getElementById('mail-ready').addEventListener('click', () => {
    confirm.classList.remove('shown');
    confirm.hidden = true;
    question.hidden = false;
    requestAnimationFrame(() => question.classList.add('shown'));
    answerField.focus({ preventScroll: true });
  });

  document.getElementById('mail-not-yet').addEventListener('click', () => {
    confirm.classList.remove('shown');
    confirm.hidden = true;
    app.mailCard.classList.remove('selected');
    app.mailCard.focus();
  });

  app.mailAnswerForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const answer = normalizeMailAnswer(answerField.value);

    if (!acceptedAnswers.has(answer)) {
      app.mailFeedback.textContent = 'Wrong answer 😂 Think again!';
      answerField.focus();
      answerField.select();
      return;
    }

    app.mailAnswerForm.querySelectorAll('input, button').forEach((control) => {
      control.disabled = true;
    });
    app.mailFeedback.textContent = '';
    question.classList.remove('shown');
    question.hidden = true;
    app.mailCard.classList.add('opening');
    await wait(1500);
    app.mailCard.classList.add('opened');
    reveal.hidden = false;
    requestAnimationFrame(() => reveal.classList.add('shown'));
    document.getElementById('mail-continue').focus({ preventScroll: true });
  });

  app.mailContinue = document.getElementById('mail-continue');
}

function bindMemoryGallery() {
  const gallery = document.getElementById('memory-gallery');
  const openButton = document.getElementById('memory-gallery-open');
  const closeButton = document.getElementById('memory-gallery-close');
  const stage = gallery.querySelector('.memory-gallery-stage');
  const lockScreen = document.getElementById('memory-lock-screen');
  const albumContent = document.getElementById('memory-album-content');
  const bookOpening = document.getElementById('memory-book-opening');
  const scrollInstruction = document.getElementById('memory-scroll-instruction');
  const notes = gallery.querySelectorAll('.memory-note');
  const endMarker = document.getElementById('memory-album-end');
  const finale = document.getElementById('memory-finale');
  const form = document.getElementById('memory-unlock-form');
  const password = document.getElementById('memory-password');
  const feedback = document.getElementById('memory-feedback');
  const particles = document.getElementById('memory-particles');
  let unlockStarted = false;

  function revealNote(entries, observer) {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('revealed');
      observer.unobserve(entry.target);
    });
  }

  function revealFinale(entries, observer) {
    if (!entries.some((entry) => entry.isIntersecting)) return;
    finale.setAttribute('aria-hidden', 'false');
    finale.classList.add('revealed');
    observer.disconnect();
  }

  if ('IntersectionObserver' in window) {
    const noteObserver = new IntersectionObserver(revealNote, {
      root: gallery,
      threshold: 0.18,
      rootMargin: '0px 0px -8% 0px',
    });
    notes.forEach((note) => noteObserver.observe(note));

    const finaleObserver = new IntersectionObserver(revealFinale, {
      root: gallery,
      threshold: 0.1,
    });
    finaleObserver.observe(endMarker);
  }

  gallery.addEventListener('scroll', () => {
    if (gallery.scrollTop > 28) {
      scrollInstruction.classList.add('fading');
    }

    if (!('IntersectionObserver' in window) && !albumContent.hidden) {
      notes.forEach((note) => {
        if (note.getBoundingClientRect().top < gallery.getBoundingClientRect().bottom - 60) {
          note.classList.add('revealed');
        }
      });
      if (gallery.scrollTop + gallery.clientHeight >= gallery.scrollHeight - 4) {
        finale.setAttribute('aria-hidden', 'false');
        finale.classList.add('revealed');
      }
    }
  }, { passive: true });

  function closeGallery() {
    if (gallery.hidden) return;
    gallery.classList.remove('visible');
    gallery.setAttribute('aria-hidden', 'true');
    window.setTimeout(() => {
      gallery.hidden = true;
      openButton.focus({ preventScroll: true });
    }, 500);
  }

  openButton.addEventListener('click', () => {
    gallery.hidden = false;
    gallery.setAttribute('aria-hidden', 'false');
    requestAnimationFrame(() => gallery.classList.add('visible'));
    password.focus({ preventScroll: true });
  });

  closeButton.addEventListener('click', closeGallery);
  gallery.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeGallery();
  });
  password.addEventListener('input', () => {
    password.value = password.value.replace(/\D/g, '').slice(0, 4);
    feedback.textContent = '';
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (unlockStarted) return;

    if (!/^\d{4}$/.test(password.value)) {
      feedback.textContent = 'Please enter four digits in DDMM format.';
      password.focus();
      return;
    }

    if (password.value !== '2911') {
      feedback.textContent = 'That date doesn’t open our little world just yet. Try again.';
      password.focus();
      password.select();
      return;
    }

    unlockStarted = true;
    feedback.textContent = '';
    form.querySelectorAll('input, button').forEach((control) => {
      control.disabled = true;
    });
    lockScreen.classList.add('unlocking');

    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      for (let index = 0; index < 28; index += 1) {
        const particle = document.createElement('i');
        particle.className = 'memory-particle';
        particle.style.setProperty('--particle-left', `${Math.random() * 100}%`);
        particle.style.setProperty('--particle-delay', `${Math.random() * 1.8}s`);
        particle.style.setProperty('--particle-duration', `${5 + Math.random() * 6}s`);
        particles.appendChild(particle);
      }
    }

    window.setTimeout(() => {
      stage.classList.add('album-unlocked');
      albumContent.hidden = false;
      requestAnimationFrame(() => {
        albumContent.classList.add('opened');
        bookOpening.classList.add('opened');
      });
    }, 1100);
  });
}

async function sceneEnding() {
  await wait(900);
  hidePhoto();
  await showText('Some stories are worth keeping forever.', { duration: 3600, className: 'cinematic-text centered' });
  await wait(1800);
  if (app.mentalWord) {
    app.mentalWord.visible = false;
  }
  const fadeDuration = 2200;
  const start = performance.now();
  while (performance.now() - start < fadeDuration) {
    const progress = (performance.now() - start) / fadeDuration;
    app.renderer.setClearAlpha(1 - progress);
    app.scene.fog.density = 0.055 + (1 - progress) * 0.04;
    setParticleIntensity(0.08 * (1 - progress));
    setSmokeDensity(0.1 * (1 - progress));
    await wait(16);
  }
  app.renderer.setClearAlpha(0);
}

async function revealFinalSurprise() {
  app.renderer.setAnimationLoop(null);

  app.finalSurprise.hidden = false;
  app.finalSurprise.setAttribute('aria-hidden', 'false');
  requestAnimationFrame(() => app.finalSurprise.classList.add('visible'));
}

async function startTimeline() {
  if (app.started) return;
  app.started = true;
  app.enterBtn.classList.add('hidden');
  app.soundToggle.classList.remove('hidden');

  await wait(350);
  await sceneVoid();
  await showText('Some people…', { duration: 2400, className: 'cinematic-text centered' });
  await wait(1200);
  await showText('…just enter your life.', { duration: 2800, className: 'cinematic-text centered' });
  await wait(2000);
  hideText();

  await wait(1400);
  sceneJourney();
  await wait(2200);
  await showText('And then…', { duration: 2000, className: 'cinematic-text centered' });
  await wait(1000);
  await showText('…they become a part of your story.', { duration: 3200, className: 'cinematic-text centered' });
  await wait(1600);
  hideText();

  await wait(800);
  await sceneFirstMemory();
  await wait(1000);
  await sceneMemoryWorld();
  await wait(1000);
  await sceneChange();
  await wait(500);
  await sceneMessage();
  await wait(300);
  sceneLight();
  await wait(2200);
  await sceneFinalReveal();
  await sceneEnding();
  await revealFinalSurprise();
}

async function beginQuestionStory() {
  if (app.questionStoryStarted) return;
  app.questionStoryStarted = true;
  app.enterBtn.classList.add('hidden');
  app.soundToggle.classList.remove('hidden');

  for (let index = 0; index < 42; index += 1) {
    const particle = document.createElement('i');
    particle.className = 'welcome-particle';
    particle.style.left = `${Math.random() * 100}%`;
    particle.style.top = `${Math.random() * 100}%`;
    particle.style.setProperty('--particle-delay', `${Math.random() * 6}s`);
    particle.style.setProperty('--particle-duration', `${4 + Math.random() * 5}s`);
    app.welcomeParticles.appendChild(particle);
  }

  await wait(350);
  app.welcomeLayer.classList.add('show');
  await wait(3900);
  app.welcomeLayer.classList.add('fade-out');
  await wait(1300);

  const frameLoaded = new Promise((resolve) => {
    app.storyFrame.addEventListener('load', resolve, { once: true });
  });
  app.storyFrame.src = './question1.html?embedded=1';
  await frameLoaded;
  app.storyFrame.classList.add('active');
}

async function continueBirthdayExperience() {
  if (app.birthdayStarted) return;
  app.birthdayStarted = true;
  app.storyFrame.classList.add('fade-out');
  await wait(1500);
  app.storyFrame.classList.remove('active', 'fade-out');
  app.storyFrame.src = 'about:blank';
  await wait(100);
  await startTimeline();
}

function hideText() {
  if (app.textTimeout) {
    clearTimeout(app.textTimeout);
    app.textTimeout = null;
  }
  app.textLayer.classList.remove('show');
  app.textLayer.innerHTML = '';
}

function showText(text, options = {}) {
  const config = {
    duration: 2200,
    className: 'cinematic-text centered',
    ...options,
  };

  hideText();
  const block = document.createElement('div');
  block.className = config.className;
  const lines = text.split('\n');
  block.innerHTML = lines.map((line) => line.trim() || '&nbsp;').join('<br>');
  app.textLayer.appendChild(block);
  app.textLayer.classList.add('show');

  return new Promise((resolve) => {
    app.textTimeout = setTimeout(() => {
      hideText();
      resolve();
    }, config.duration);
  });
}

function hidePhoto() {
  if (!app.currentPhoto) return;
  app.currentPhoto.classList.remove('show');
  app.currentPhoto.classList.add('fade-out');
  setTimeout(() => {
    app.currentPhoto.remove();
    app.currentPhoto = null;
  }, 1200);
}

function createFallbackPhoto(name) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1200" viewBox="0 0 1600 1200">
      <defs>
        <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="#0a1420" />
          <stop offset="45%" stop-color="#1d2f3c" />
          <stop offset="100%" stop-color="#090d12" />
        </linearGradient>
      </defs>
      <rect width="1600" height="1200" fill="url(#g)"/>
      <circle cx="790" cy="420" r="260" fill="rgba(214,214,240,0.15)"/>
      <rect x="530" y="620" width="540" height="190" rx="18" fill="rgba(255,255,255,0.08)"/>
      <text x="800" y="530" text-anchor="middle" fill="rgba(238,242,255,0.72)" font-family="Segoe UI, Arial, sans-serif" font-size="86" letter-spacing="8">${name.replace(/\.[^.]+$/, '').toUpperCase()}</text>
      <text x="800" y="710" text-anchor="middle" fill="rgba(214,228,255,0.5)" font-family="Segoe UI, Arial, sans-serif" font-size="34" letter-spacing="10">MEMORY</text>
    </svg>
  `;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function getPhotoUrl(name) {
  const normalizedName = String(name || '').trim();
  const candidates = [
    `./assets/photos/${normalizedName}`,
    `./assets/photos/${normalizedName.replace(/\.jpg$/i, '.png')}`,
    `./assets/photos/${normalizedName.replace(/\.png$/i, '.jpg')}`,
  ];

  return candidates[0];
}

function transitionPhoto(name) {
  return new Promise((resolve) => {
    const photo = document.createElement('div');
    photo.className = 'photo';
    const img = document.createElement('img');
    img.alt = name;
    img.src = getPhotoUrl(name);
    img.onload = () => {
      photo.appendChild(img);
      if (app.currentPhoto) {
        app.currentPhoto.classList.add('fade-out');
        setTimeout(() => app.currentPhoto.remove(), 900);
      }
      app.photoLayer.appendChild(photo);
      requestAnimationFrame(() => {
        photo.classList.add('show');
      });
      app.currentPhoto = photo;
      setTimeout(resolve, 2300);
    };
    img.onerror = () => {
      img.src = createFallbackPhoto(name);
      photo.appendChild(img);
      if (app.currentPhoto) {
        app.currentPhoto.classList.add('fade-out');
        setTimeout(() => app.currentPhoto.remove(), 900);
      }
      app.photoLayer.appendChild(photo);
      requestAnimationFrame(() => {
        photo.classList.add('show');
      });
      app.currentPhoto = photo;
      setTimeout(resolve, 2300);
    };
  });
}

function loadPhotos() {
  app.photoItems = [
    'mental01.jpg', 'mental02.jpg', 'mental03.jpg', 'mental04.jpg', 'mental05.jpg', 'mental06.png', 'together01.png', 'final.jpg',
  ];
}

function createSmokeBackground() {
  const smokeCount = app.quality === 'low' ? 3 : app.quality === 'medium' ? 5 : 7;
  for (let i = 0; i < smokeCount; i += 1) {
    const smoke = document.createElement('div');
    smoke.className = 'smoke';
    smoke.style.left = `${Math.random() * 85}%`;
    smoke.style.top = `${Math.random() * 80}%`;
    smoke.style.width = `${Math.random() * 32 + 24}vw`;
    smoke.style.height = `${Math.random() * 28 + 20}vh`;
    smoke.style.opacity = `${0.08 + Math.random() * 0.16}`;
    app.smokeLayer.appendChild(smoke);
  }
}

function bindUI() {
  app.enterBtn.addEventListener('click', async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
    } catch (error) {
      // ignore fullscreen failures; keep cinematic experience accessible
    }

    await initializeAudio();
    if (new URLSearchParams(window.location.search).get('birthday') === '1') {
      await startTimeline();
    } else {
      await beginQuestionStory();
    }
  });

  app.soundToggle.addEventListener('click', async () => {
    if (!app.audioContext) return;
    const target = app.musicGain.gain.value > 0 ? 0 : 0.38;
    app.musicGain.gain.setTargetAtTime(target, app.audioContext.currentTime, 0.5);
    app.ambienceGain.gain.setTargetAtTime(target * 0.65, app.audioContext.currentTime, 0.5);
    app.soundToggle.textContent = target > 0 ? 'Sound' : 'Muted';
  });

  window.addEventListener('message', (event) => {
    if (event.origin !== window.location.origin || event.data?.type !== 'mental-story-complete') return;
    continueBirthdayExperience();
  });

  window.addEventListener('resize', () => {
    if (!app.camera || !app.renderer) return;
    app.camera.aspect = window.innerWidth / window.innerHeight;
    app.camera.updateProjectionMatrix();
    app.renderer.setSize(window.innerWidth, window.innerHeight);
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && app.audioContext && app.audioContext.state === 'running') {
      app.audioContext.suspend();
    } else if (!document.hidden && app.audioContext && app.audioContext.state === 'suspended') {
      app.audioContext.resume();
    }
  });
}

async function initializeAudio() {
  if (app.audioReady) return;

  const AudioCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtor) {
    app.audioReady = true;
    return;
  }

  app.audioContext = new AudioCtor();
  app.ambienceGain = app.audioContext.createGain();
  app.musicGain = app.audioContext.createGain();
  app.ambienceGain.gain.value = 0.12;
  app.musicGain.gain.value = 0.15;

  app.ambienceGain.connect(app.audioContext.destination);
  app.musicGain.connect(app.audioContext.destination);

  const baseOsc = app.audioContext.createOscillator();
  const baseGain = app.audioContext.createGain();
  baseOsc.type = 'sine';
  baseOsc.frequency.value = 42;
  baseGain.gain.value = 0.02;
  baseOsc.connect(baseGain);
  baseGain.connect(app.ambienceGain);
  baseOsc.start();
  app.ambientOsc = baseOsc;

  const drone = app.audioContext.createOscillator();
  const droneGain = app.audioContext.createGain();
  drone.type = 'triangle';
  drone.frequency.value = 85;
  droneGain.gain.value = 0.0;
  drone.connect(droneGain);
  droneGain.connect(app.musicGain);
  drone.start();

  app.audioElement = new Audio();
  app.audioElement.loop = true;
  app.audioElement.volume = 0.25;
  app.audioElement.crossOrigin = 'anonymous';

  const songUrl = './assets/audio/Maate%20Vinadhuga%20-%20SenSongsMp3.Co.mp3';
  app.audioElement.src = songUrl;
  app.audioElement.load();
  app.audioElement.addEventListener('error', () => {
    app.audioElement.src = '';
  });

  try {
    app.audioElement.play().catch(() => {});
  } catch (error) {
    // fallback to synthesized ambience
  }

  app.audioReady = true;
  app.audioContext.resume();
  app.soundToggle.textContent = 'Sound';
  app.soundToggle.classList.remove('hidden');
}

function setMusicMood(mood) {
  if (!app.audioContext || !app.musicGain) return;
  const current = app.audioContext.currentTime;
  const gains = {
    opening: 0.18,
    journey: 0.23,
    memories: 0.32,
    message: 0.2,
    light: 0.34,
    reveal: 0.5,
    ending: 0.12,
  };

  app.musicGain.gain.setTargetAtTime(gains[mood] || 0.2, current, 1.5);
}

async function animate() {
  const elapsed = app.clock.getElapsedTime();

  if (app.particles) {
    const positions = app.particles.geometry.attributes.position.array;
    for (let i = 0; i < positions.length; i += 3) {
      positions[i + 1] += Math.sin(elapsed * 0.25 + i) * 0.0008;
    }
    app.particles.geometry.attributes.position.needsUpdate = true;
  }

  if (app.dust) {
    app.dust.rotation.y += 0.0008;
    app.dust.rotation.x = Math.sin(elapsed * 0.12) * 0.16;
  }

  app.smokeMeshes.forEach((mesh, index) => {
    mesh.position.x += Math.sin(elapsed * 0.25 + index) * mesh.userData.speed * 0.2;
    mesh.position.y = mesh.userData.baseY + Math.sin(elapsed * 0.45 + index) * mesh.userData.amp * 0.45;
    mesh.rotation.z += 0.00035 + mesh.userData.speed * 0.002;
    mesh.material.opacity = clamp((mesh.material.opacity || 0.12) * 0.98 + Math.sin(elapsed * 0.6 + index) * 0.004, 0.04, 0.35);
  });

  if (app.glowLight) {
    app.glowLight.position.x = Math.sin(elapsed * 0.38) * 3;
    app.glowLight.position.z = 7 + Math.cos(elapsed * 0.25) * 2;
  }

  if (app.mentalWord) {
    app.mentalWord.rotation.y += 0.0035;
    app.mentalWord.position.y = Math.sin(elapsed * 0.9) * 0.14 + 0.22;
  }

  updateCamera();
  app.renderer.render(app.scene, app.camera);
}

function init() {
  detectQuality();
  createScene();
  createCamera();
  createLights();
  createParticles();
  createSmoke();
  createSmokeBackground();
  loadPhotos();
  bindMailFlow();
  bindMemoryGallery();
  bindUI();
  app.finalSurpriseButton.addEventListener('click', () => {
    if (!app.finalSurprisePhoto.hidden) return;

    keepBirthdayMusicPlaying().catch((error) => {
      console.warn('Could not resume the birthday song.', error);
    });
    app.finalSurprisePhoto.hidden = false;
    app.finalSurpriseButton.setAttribute('aria-expanded', 'true');
    playPaperWhoosh().catch((error) => {
      console.warn('Could not play the paper whoosh sound.', error);
    });
    requestAnimationFrame(() => {
      app.finalSurprisePhoto.classList.add('revealed');
      window.setTimeout(launchSurpriseFireworks, 500);
      launchPaperBurst();
      window.setTimeout(() => {
        runFinalBirthdaySequence();
      }, 3400);
    });
  });
  app.finalCinemaGo.addEventListener('click', () => {
    if (!app.finalSurpriseCinema.classList.contains('button-ready')) return;

    keepBirthdayMusicPlaying().catch((error) => {
      console.warn('Could not resume the birthday song.', error);
    });
    app.finalCinemaGo.disabled = true;
    app.finalCinemaAssembled.setAttribute('aria-hidden', 'false');
    app.finalCinemaIntro.setAttribute('aria-hidden', 'true');
    app.finalSurpriseCinema.classList.remove('blurred');
    app.finalSurpriseCinema.classList.add('assembling');
    app.finalCinemaAssembled.focus({ preventScroll: true });
    const lastLetter = app.finalCinemaAssembled.querySelector('.final-cinema-letter:last-child');
    if (lastLetter) {
      lastLetter.addEventListener('animationend', () => {
        app.finalSurpriseCinema.classList.add('settled');
      }, { once: true });
    }
  });
  app.sceneVoid = sceneVoid;
  app.sceneJourney = sceneJourney;
  app.sceneFirstMemory = sceneFirstMemory;
  app.sceneMemoryWorld = sceneMemoryWorld;
  app.sceneChange = sceneChange;
  app.sceneMessage = sceneMessage;
  app.sceneLight = sceneLight;
  app.sceneFinalReveal = sceneFinalReveal;
  app.sceneEnding = sceneEnding;
  app.showPhoto = transitionPhoto;
  app.hidePhoto = hidePhoto;
  app.showText = showText;
  app.hideText = hideText;
  app.revealMessage = () => sceneMessage();
  app.moveCamera = moveCamera;
  app.travelToLight = travelToLight;
  app.revealMentalName = revealMentalName;
  app.animate = animate;

  app.camera.position.set(0, 1.2, 12);
  app.camera.lookAt(0, 0, 0);
  app.renderer.setClearColor(0x02070d, 1);
  app.renderer.setAnimationLoop(() => {
    animate();
  });

  app.soundToggle.classList.add('hidden');
  if (new URLSearchParams(window.location.search).get('birthday') === '1') {
    app.enterBtn.classList.add('hidden');
    initializeAudio().then(() => startTimeline());
  } else {
    app.enterBtn.focus();
  }
}

window.addEventListener('load', init);
