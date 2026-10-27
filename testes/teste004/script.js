const tracks = {
  "neon-pulse": {
    name: "Neon Pulse",
    bpm: 128,
    bass: [55, 55, 62, 62, 67, 67, 62, 62],
    lead: [220, 277, 329.63, 392, 329.63, 277, 246.94, 196],
    accent: [440, 392, 349.23, 330]
  },
  "afterglow-drive": {
    name: "Afterglow Drive",
    bpm: 136,
    bass: [41.2, 41.2, 46.25, 46.25, 55, 55, 46.25, 46.25],
    lead: [261.63, 329.63, 392, 440, 392, 329.63, 293.66, 261.63],
    accent: [523.25, 493.88, 440, 392]
  },
  "voltage-night": {
    name: "Voltage Night",
    bpm: 122,
    bass: [49, 49, 49, 61.74, 49, 49, 55, 61.74],
    lead: [196, 293.66, 329.63, 392, 349.23, 293.66, 246.94, 220],
    accent: [523.25, 587.33, 659.25, 587.33]
  }
};

const audioState = {
  context: null,
  masterGain: null,
  intervalId: null,
  step: 0,
  isPlaying: false,
  currentTrack: "neon-pulse",
  captureStream: null,
  captureContext: null,
  captureFrame: null
};

function exibirMensagem() {
  const banner = document.getElementById("trackName");
  if (banner) {
    banner.textContent = tracks[audioState.currentTrack].name;
  }
}

function criarAmbienteVisual() {
  const ambient = document.createElement("div");
  ambient.className = "ambient-bg";

  for (let index = 0; index < 6; index += 1) {
    const orb = document.createElement("span");
    orb.className = "ambient-orb";
    orb.style.setProperty("--size", `${150 + index * 70}px`);
    orb.style.setProperty("--x", `${10 + index * 15}%`);
    orb.style.setProperty("--y", `${12 + (index % 3) * 24}%`);
    orb.style.setProperty("--delay", `${index * 0.8}s`);
    ambient.appendChild(orb);
  }

  document.body.prepend(ambient);
}

function criarEfeitoRipple(event) {
  const button = event.currentTarget;
  const circle = document.createElement("span");
  const rect = button.getBoundingClientRect();
  const diameter = Math.max(rect.width, rect.height);

  circle.className = "ripple";
  circle.style.width = `${diameter}px`;
  circle.style.height = `${diameter}px`;
  circle.style.left = `${event.clientX - rect.left - diameter / 2}px`;
  circle.style.top = `${event.clientY - rect.top - diameter / 2}px`;

  button.appendChild(circle);
  setTimeout(() => circle.remove(), 700);
}

function aplicarParallax() {
  const targets = document.querySelectorAll(".card, .hero, .page-shell, .site-header");

  targets.forEach((target) => {
    target.classList.add("tilt");

    target.addEventListener("pointermove", (event) => {
      const rect = target.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const rotateY = ((x / rect.width) - 0.5) * 8;
      const rotateX = (0.5 - (y / rect.height)) * 8;

      target.style.transform = `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
    });

    target.addEventListener("pointerleave", () => {
      target.style.transform = "perspective(1200px) rotateX(0deg) rotateY(0deg) translateY(0)";
    });
  });
}

function aplicarReveal() {
  const revealItems = document.querySelectorAll(".card, .site-header, .hero, .page-main, .contact-layout");

  revealItems.forEach((element, index) => {
    element.classList.add("reveal");
    element.style.transitionDelay = `${index * 80}ms`;
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
        }
      });
    },
    { threshold: 0.12 }
  );

  revealItems.forEach((element) => observer.observe(element));
}

function aplicarHoverNosLinks() {
  document.querySelectorAll(".main-nav a").forEach((link) => {
    link.addEventListener("mousemove", (event) => {
      const glow = document.createElement("span");
      glow.className = "ripple";
      glow.style.width = "20px";
      glow.style.height = "20px";
      glow.style.left = `${event.offsetX - 10}px`;
      glow.style.top = `${event.offsetY - 10}px`;
      glow.style.background = "rgba(255,255,255,0.28)";
      link.appendChild(glow);

      setTimeout(() => glow.remove(), 450);
    });
  });
}

function prepararFormulario() {
  const form = document.querySelector(".contact-form");
  if (!form) {
    return;
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const button = form.querySelector("button[type='submit']");
    if (!button) {
      return;
    }

    button.textContent = "Mensagem enviada!";
    button.disabled = true;
    button.classList.add("success-flash");
  });
}

function createNoiseBuffer(context) {
  const buffer = context.createBuffer(1, context.sampleRate * 0.2, context.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < data.length; i += 1) {
    data[i] = (Math.random() * 2 - 1) * 0.35;
  }

  return buffer;
}

function tocarKick(context, time, intensity = 1) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(150, time);
  oscillator.frequency.exponentialRampToValueAtTime(30, time + 0.12);

  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.exponentialRampToValueAtTime(0.6 * intensity, time + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.18);

  oscillator.connect(gain).connect(context.destination);
  oscillator.start(time);
  oscillator.stop(time + 0.2);
}

function tocarSnare(context, time) {
  const noiseBuffer = createNoiseBuffer(context);
  const noiseSource = context.createBufferSource();
  const noiseFilter = context.createBiquadFilter();
  const noiseGain = context.createGain();

  noiseSource.buffer = noiseBuffer;
  noiseFilter.type = "highpass";
  noiseFilter.frequency.value = 1600;
  noiseGain.gain.setValueAtTime(0.0001, time);
  noiseGain.gain.exponentialRampToValueAtTime(0.32, time + 0.01);
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.12);

  noiseSource.connect(noiseFilter).connect(noiseGain).connect(context.destination);
  noiseSource.start(time);
  noiseSource.stop(time + 0.14);
}

function tocarHiHat(context, time) {
  const noiseBuffer = createNoiseBuffer(context);
  const noiseSource = context.createBufferSource();
  const filter = context.createBiquadFilter();
  const gain = context.createGain();

  noiseSource.buffer = noiseBuffer;
  filter.type = "highpass";
  filter.frequency.value = 7000;
  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.exponentialRampToValueAtTime(0.2, time + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.05);

  noiseSource.connect(filter).connect(gain).connect(context.destination);
  noiseSource.start(time);
  noiseSource.stop(time + 0.07);
}

function tocarBass(context, time, frequency, gainValue = 0.18) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = "sawtooth";
  oscillator.frequency.setValueAtTime(frequency, time);
  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.exponentialRampToValueAtTime(gainValue, time + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.24);

  oscillator.connect(gain).connect(context.destination);
  oscillator.start(time);
  oscillator.stop(time + 0.28);
}

function tocarLead(context, time, frequency, gainValue = 0.08) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = "triangle";
  oscillator.frequency.setValueAtTime(frequency, time);
  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.exponentialRampToValueAtTime(gainValue, time + 0.04);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.18);

  oscillator.connect(gain).connect(context.destination);
  oscillator.start(time);
  oscillator.stop(time + 0.2);
}

function pulseBeat() {
  const stage = document.querySelector(".music-stage");
  if (!stage) {
    return;
  }

  stage.classList.remove("is-playing");
  void stage.offsetWidth;
  stage.classList.add("is-playing");

  const orbs = document.querySelectorAll(".ambient-orb");
  orbs.forEach((orb) => {
    orb.style.transform = "scale(1.04)";
    setTimeout(() => {
      orb.style.transform = "scale(1)";
    }, 180);
  });
}

function tocarPasso() {
  const track = tracks[audioState.currentTrack];
  if (!track || !audioState.context) {
    return;
  }

  const time = audioState.context.currentTime + 0.04;
  const step = audioState.step % 8;

  tocarKick(audioState.context, time, step % 2 === 0 ? 1.1 : 0.8);
  if (step % 2 === 1) {
    tocarSnare(audioState.context, time + 0.02);
  }
  if (step % 2 === 0 && step !== 0) {
    tocarHiHat(audioState.context, time + 0.01);
  }

  const bassIndex = step % track.bass.length;
  tocarBass(audioState.context, time, track.bass[bassIndex], 0.16);

  if (step % 2 === 0 || step % 4 === 1) {
    tocarLead(audioState.context, time + 0.04, track.lead[(audioState.step + 3) % track.lead.length], 0.07);
  }

  pulseBeat();
  audioState.step += 1;
}

function alternarMusica() {
  if (audioState.captureStream) {
    pararCapturaAudio("Captura encerrada para tocar o mix do site.");
  }

  if (!audioState.context) {
    audioState.context = new (window.AudioContext || window.webkitAudioContext)();
    audioState.masterGain = audioState.context.createGain();
    audioState.masterGain.gain.value = 0.28;
    audioState.masterGain.connect(audioState.context.destination);
  }

  if (audioState.context.state === "suspended") {
    audioState.context.resume();
  }

  const stage = document.querySelector(".music-stage");
  const button = document.getElementById("toggleMusic");

  if (audioState.isPlaying) {
    clearInterval(audioState.intervalId);
    audioState.isPlaying = false;
    stage.classList.remove("is-playing");
    button.textContent = "Play mix";
    return;
  }

  const tempo = tracks[audioState.currentTrack].bpm;
  const intervalo = (60000 / tempo) / 2;
  audioState.isPlaying = true;
  button.textContent = "Pause";
  stage.classList.add("is-playing");
  audioState.intervalId = setInterval(tocarPasso, intervalo);
  tocarPasso();
}

function atualizarTrackSelecionada(trackKey) {
  audioState.currentTrack = trackKey;
  const trackName = document.getElementById("trackName");
  if (trackName) {
    trackName.textContent = tracks[trackKey].name;
  }
  document.querySelectorAll(".track-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.track === trackKey);
  });

  if (audioState.isPlaying) {
    clearInterval(audioState.intervalId);
    const tempo = tracks[audioState.currentTrack].bpm;
    const intervalo = (60000 / tempo) / 2;
    audioState.intervalId = setInterval(tocarPasso, intervalo);
  }
}

function pararCapturaAudio(message = "Captura encerrada.") {
  if (audioState.captureFrame !== null) {
    cancelAnimationFrame(audioState.captureFrame);
    audioState.captureFrame = null;
  }

  if (audioState.captureStream) {
    audioState.captureStream.getTracks().forEach((track) => track.stop());
    audioState.captureStream = null;
  }

  if (audioState.captureContext) {
    audioState.captureContext.close();
    audioState.captureContext = null;
  }

  const stage = document.querySelector(".music-stage");
  const button = document.getElementById("captureAudio");
  const status = document.getElementById("captureStatus");

  stage?.classList.remove("is-capturing");
  stage?.style.removeProperty("--ring-scale");
  stage?.style.removeProperty("--glow-radius");
  document.querySelectorAll(".eq-bars span").forEach((bar) => {
    bar.style.removeProperty("--bar-level");
  });

  if (button) {
    button.textContent = "Visualizar áudio de uma aba";
    button.setAttribute("aria-pressed", "false");
  }
  if (status) {
    status.textContent = message;
  }
}

function animarAudioCapturado(analyser, data) {
  const stage = document.querySelector(".music-stage");
  const bars = document.querySelectorAll(".eq-bars span");
  if (!stage) {
    return;
  }

  analyser.getByteFrequencyData(data);
  const bassEnd = Math.max(1, Math.floor(data.length * 0.12));
  let bassTotal = 0;
  for (let index = 0; index < bassEnd; index += 1) {
    bassTotal += data[index];
  }

  const bassLevel = Math.min(1, bassTotal / bassEnd / 180);
  stage.style.setProperty("--ring-scale", (1 + bassLevel * 0.06).toFixed(3));
  stage.style.setProperty("--glow-radius", `${18 + bassLevel * 28}px`);

  bars.forEach((bar, index) => {
    const start = Math.floor((index / bars.length) * data.length);
    const end = Math.max(start + 1, Math.floor(((index + 1) / bars.length) * data.length));
    let total = 0;
    for (let sample = start; sample < end; sample += 1) {
      total += data[sample];
    }
    const level = Math.max(0.08, Math.min(1.2, (total / (end - start) / 150) * 1.2));
    bar.style.setProperty("--bar-level", level.toFixed(2));
  });

  audioState.captureFrame = requestAnimationFrame(() => animarAudioCapturado(analyser, data));
}

async function alternarCapturaAudio() {
  if (audioState.captureStream) {
    pararCapturaAudio();
    return;
  }

  const status = document.getElementById("captureStatus");
  const button = document.getElementById("captureAudio");
  if (!window.isSecureContext) {
    if (status) {
      status.textContent = "A captura exige uma conexão segura. Abra o site por HTTPS ou em localhost.";
    }
    return;
  }

  if (!navigator.mediaDevices?.getDisplayMedia || !window.AudioContext) {
    if (status) {
      status.textContent = "A captura de áudio não está disponível neste navegador. Tente a versão mais recente do Chrome ou Edge.";
    }
    return;
  }

  if (audioState.isPlaying) {
    clearInterval(audioState.intervalId);
    audioState.isPlaying = false;
    document.querySelector(".music-stage")?.classList.remove("is-playing");
    const playButton = document.getElementById("toggleMusic");
    if (playButton) {
      playButton.textContent = "Play mix";
    }
  }

  if (status) {
    status.textContent = "Na janela do navegador, escolha a aba com áudio e habilite o compartilhamento de áudio.";
  }

  let stream;
  try {
    stream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: true
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "NotAllowedError") {
      if (status) {
        status.textContent = "Compartilhamento cancelado. Nenhum áudio foi capturado.";
      }
      return;
    }
    if (status) {
      status.textContent = "Não foi possível iniciar a captura de áudio. Verifique as permissões do navegador e tente novamente.";
    }
    console.error("Falha ao iniciar captura de áudio:", error);
    return;
  }

  const audioTracks = stream.getAudioTracks();
  if (audioTracks.length === 0) {
    stream.getTracks().forEach((track) => track.stop());
    if (status) {
      status.textContent = "A fonte escolhida não compartilhou áudio. Tente novamente e habilite “Compartilhar áudio da aba”.";
    }
    return;
  }

  try {
    const context = new AudioContext();
    audioState.captureContext = context;
    const source = context.createMediaStreamSource(stream);
    const analyser = context.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.82;
    source.connect(analyser);

    audioState.captureStream = stream;
    audioState.captureStream.getTracks().forEach((track) => {
      track.addEventListener("ended", () => pararCapturaAudio("O compartilhamento de áudio foi encerrado."));
    });

    const stage = document.querySelector(".music-stage");
    stage?.classList.add("is-capturing");
    if (button) {
      button.textContent = "Parar captura";
      button.setAttribute("aria-pressed", "true");
    }
    if (status) {
      status.textContent = "Áudio capturado localmente. A animação acompanha as frequências em tempo real.";
    }

    animarAudioCapturado(analyser, new Uint8Array(analyser.frequencyBinCount));
  } catch (error) {
    stream.getTracks().forEach((track) => track.stop());
    if (audioState.captureContext) {
      audioState.captureContext.close();
      audioState.captureContext = null;
    }
    if (status) {
      status.textContent = "Não foi possível analisar o áudio compartilhado.";
    }
    console.error("Falha ao analisar áudio compartilhado:", error);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  criarAmbienteVisual();
  aplicarReveal();
  aplicarParallax();
  aplicarHoverNosLinks();
  prepararFormulario();

  const toggleMusic = document.getElementById("toggleMusic");
  if (toggleMusic) {
    toggleMusic.addEventListener("click", alternarMusica);
  }

  const captureAudio = document.getElementById("captureAudio");
  if (captureAudio) {
    captureAudio.addEventListener("click", alternarCapturaAudio);
  }

  document.querySelectorAll(".track-btn").forEach((button) => {
    button.addEventListener("click", () => atualizarTrackSelecionada(button.dataset.track));
  });

  document.querySelectorAll("button").forEach((button) => {
    button.addEventListener("pointerdown", criarEfeitoRipple);
  });

  exibirMensagem();
});
