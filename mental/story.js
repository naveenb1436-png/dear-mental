const STORY_TIMING = {
  pageTransition: 1050,
  wrongAnswerReset: 750,
  letterFlight: 1850,
  letterStagger: 320,
  burst: 1450,
  revealHold: 4200,
};

const pageNumber = Number(document.body.dataset.question);
const answerField = document.querySelector('#answer');
const answerForm = document.querySelector('.answer-form');
const feedback = document.querySelector('.answer-feedback');
const questionStage = document.querySelector('.question-stage');
const transitionVeil = document.querySelector('.transition-veil');
const revealStage = document.querySelector('.mental-reveal');

function waitFor(milliseconds) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

function normalizedAnswer(value) {
  return value.trim().replace(/\s+/g, '').toLowerCase();
}

function checkAnswer(value) {
  const answer = normalizedAnswer(value);
  if (pageNumber === 1) return answer === 'mental';
  if (pageNumber === 2) return answer === 'inter';
  return answer.length > 0;
}

async function pageTransition(destination) {
  if (window.parent !== window && destination.startsWith('./index.html?birthday=1')) {
    window.parent.postMessage({ type: 'mental-story-complete' }, window.location.origin);
    return;
  }

  transitionVeil.classList.add('active');
  await waitFor(STORY_TIMING.pageTransition);
  window.location.href = destination;
}

function createLetter(character, index, direction) {
  const letter = document.createElement('span');
  const step = Math.min(window.innerWidth * 0.13, 170);
  const travel = Math.max(window.innerWidth, window.innerHeight) * 0.95;
  const origins = {
    right: [travel, 0],
    left: [-travel, 0],
    top: [0, -travel],
    bottom: [0, travel],
  };
  const [x, y] = origins[direction];

  letter.className = `mental-letter from-${direction}`;
  letter.textContent = character;
  letter.style.left = `calc(50% + ${(index - 2.5) * step}px)`;
  letter.style.setProperty('--from-x', `${x}px`);
  letter.style.setProperty('--from-y', `${y}px`);
  letter.style.setProperty('--start-rotation', `${index % 2 === 0 ? 11 : -11}deg`);
  letter.style.setProperty('--flight-duration', `${STORY_TIMING.letterFlight}ms`);
  letter.style.setProperty('--flight-delay', `${index * STORY_TIMING.letterStagger}ms`);
  letter.dataset.direction = direction;
  revealStage.appendChild(letter);
  return letter;
}

function animateLetter(letter) {
  letter.classList.add('in-flight');
  return waitFor(STORY_TIMING.letterFlight + Number(letter.style.getPropertyValue('--flight-delay').replace('ms', '')));
}

async function centerBurst() {
  const burst = document.createElement('div');
  burst.className = 'center-burst';
  burst.setAttribute('aria-hidden', 'true');

  const flash = document.createElement('i');
  flash.className = 'burst-flash';
  const smoke = document.createElement('i');
  smoke.className = 'burst-smoke';
  const shockwave = document.createElement('i');
  shockwave.className = 'burst-shockwave';
  burst.append(flash, smoke, shockwave);

  const particleCount = window.innerWidth < 600 ? 36 : 56;
  const radius = Math.min(window.innerWidth * 0.36, 310);
  for (let index = 0; index < particleCount; index += 1) {
    const angle = (Math.PI * 2 * index) / particleCount;
    const petalRadius = radius * (0.72 + 0.28 * Math.cos(angle * 6));
    const particle = document.createElement('i');
    particle.className = 'burst-particle';
    particle.style.setProperty('--burst-x', `${Math.cos(angle) * petalRadius}px`);
    particle.style.setProperty('--burst-y', `${Math.sin(angle) * petalRadius}px`);
    particle.style.setProperty('--burst-delay', `${Math.random() * 140}ms`);
    burst.appendChild(particle);
  }

  revealStage.appendChild(burst);
  requestAnimationFrame(() => burst.classList.add('active'));
  await waitFor(STORY_TIMING.burst);
  burst.classList.add('settled');
}

async function revealMental() {
  revealStage.querySelectorAll('.mental-letter').forEach((letter) => {
    letter.classList.add('settled-letter');
  });

  const title = document.createElement('h1');
  title.className = 'mental-final-title';
  title.textContent = 'MENTAL';
  const subtitle = document.createElement('p');
  subtitle.className = 'mental-final-subtitle';
  subtitle.textContent = 'Welcome Mental ❤️';
  revealStage.append(title, subtitle);
  requestAnimationFrame(() => revealStage.classList.add('revealed'));
  await waitFor(900);
}

async function beginMentalReveal() {
  questionStage.classList.add('question-leaving');
  revealStage.setAttribute('aria-hidden', 'false');
  revealStage.classList.add('active');

  const directions = ['right', 'left', 'top', 'bottom', 'right', 'left'];
  const letters = [...'MENTAL'].map((character, index) =>
    createLetter(character, index, directions[index]),
  );
  await Promise.all(letters.map(animateLetter));
  await waitFor(500);
  await centerBurst();
  await revealMental();
  await waitFor(STORY_TIMING.revealHold);
  await pageTransition('./index.html?birthday=1');
}

async function handleCorrectAnswer() {
  if (pageNumber === 1) {
    await pageTransition('./question2.html');
  } else if (pageNumber === 2) {
    await pageTransition('./question3.html');
  } else {
    await beginMentalReveal();
  }
}

function handleWrongAnswer() {
  feedback.textContent = 'Try again ❤️';
  questionStage.classList.remove('wrong-answer');
  void questionStage.offsetWidth;
  questionStage.classList.add('wrong-answer');
  window.setTimeout(() => questionStage.classList.remove('wrong-answer'), STORY_TIMING.wrongAnswerReset);
}

function createAmbientParticles() {
  const particleLayer = document.querySelector('#story-particles');
  const count = window.innerWidth < 600 ? 24 : 42;

  for (let index = 0; index < count; index += 1) {
    const particle = document.createElement('i');
    particle.className = 'story-particle';
    particle.style.left = `${Math.random() * 100}%`;
    particle.style.top = `${Math.random() * 100}%`;
    particle.style.setProperty('--float-duration', `${7 + Math.random() * 10}s`);
    particle.style.setProperty('--float-delay', `${Math.random() * -12}s`);
    particleLayer.appendChild(particle);
  }
}

answerForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (checkAnswer(answerField.value)) {
    answerForm.querySelectorAll('button, input').forEach((control) => {
      control.disabled = true;
    });
    await handleCorrectAnswer();
  } else {
    handleWrongAnswer();
    answerField.focus();
    answerField.select();
  }
});

document.querySelector('#skip-question')?.addEventListener('click', beginMentalReveal);

createAmbientParticles();
answerField.focus({ preventScroll: true });
