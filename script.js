/*
  CINVA Generative Audio & Visuals
  Based on Tone.js
*/

// --- ГЕНЕРАЦИЯ ЗВЕЗД ---
function generateStars() {
  const width = window.innerWidth; 
  const height = 2000; 
  
  const createShadows = (count) => {
    let shadows = [];
    for (let i = 0; i < count; i++) {
      const x = Math.floor(Math.random() * width);
      const y = Math.floor(Math.random() * height);
      shadows.push(`${x}px ${y}px #FFF`);
    }
    return shadows.join(', ');
  };

  const oldStyle = document.getElementById('dynamic-star-style');
  if (oldStyle) oldStyle.remove();

  const smallStars = createShadows(700);
  const mediumStars = createShadows(200);
  const bigStars = createShadows(100);

  const style = document.createElement('style');
  style.id = 'dynamic-star-style';
  style.innerHTML = `
    #stars, #stars:after { box-shadow: ${smallStars}; width: 1px; height: 1px; }
    #stars2, #stars2:after { box-shadow: ${mediumStars}; width: 2px; height: 2px; }
    #stars3, #stars3:after { box-shadow: ${bigStars}; width: 3px; height: 3px; }
  `;
  document.head.appendChild(style);
}

generateStars();
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(generateStars, 500);
});


// --- AUDIO ENGINE ---

let isAudioStarted = false;
let isMuted = false; 
let noiseNode, autoFilterNode;
let synthNode;
let chimeDensity = 0.4;

async function initAudio() {
  await Tone.start();
  Tone.Destination.volume.value = -60; 
  console.log("Audio Context Started");

  // --- 1. ATMOSPHERE ---
  const initialNoiseType = document.getElementById("type-wind").value;
  const noise = new Tone.Noise(initialNoiseType);
  
  const autoFilter = new Tone.AutoFilter({
    frequency: "8m", 
    baseFrequency: 200,
    octaves: 2.6 
  }).toDestination();
  
  noise.connect(autoFilter);
  noise.volume.value = document.getElementById("vol-wind").value; 
  
  const startSpeed = document.getElementById("param-wind-speed").value;
  const startDepth = document.getElementById("param-wind-depth").value;
  
  autoFilter.frequency.value = startSpeed; 
  autoFilter.octaves = startDepth;

  autoFilter.start();
  noise.start();
  
  noiseNode = noise;
  autoFilterNode = autoFilter;

  // --- 2. STARLIGHT ---
  const reverb = new Tone.Reverb({
    decay: 10,
    wet: 0.6
  }).toDestination();

  const initialSynthType = document.getElementById("type-synth").value;

  const synth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: initialSynthType }, 
    envelope: {
      attack: 0.02,
      decay: 0.3,
      sustain: 0,
      release: 3
    }
  }).connect(reverb);
  
  synth.volume.value = document.getElementById("vol-synth").value; 
  
  synthNode = synth;

  const scale = ["C4", "D4", "Eb4", "G4", "A4", "C5", "D5", "Eb5", "G5"];

  const loop = new Tone.Loop(time => {
    if (Math.random() < chimeDensity) {
      const note = scale[Math.floor(Math.random() * scale.length)];
      synth.triggerAttackRelease(note, "8n", time);
    }
  }, "4n"); 

  Tone.Transport.start();
  loop.start(0);
}

// --- Кнопка включения (с плавным FADE) ---
document.getElementById('btn-audio').addEventListener('click', function() {
  const btn = this;
  const panel = document.getElementById('settings-panel');
  
  if (!isAudioStarted) {
    initAudio().then(() => {
      isAudioStarted = true;
      isMuted = false;
      btn.innerText = "🔇 Fade Out";
      btn.classList.add("active");
      panel.classList.remove("settings-hidden");
      panel.classList.add("settings-visible");
      Tone.Destination.volume.rampTo(0, 3);
    });
  } else {
    if (isMuted) {
      Tone.Destination.volume.rampTo(0, 3);
      isMuted = false;
      btn.innerText = "🔇 Fade Out";
      btn.classList.add("active");
      panel.classList.remove("settings-hidden");
      panel.classList.add("settings-visible");
    } else {
      Tone.Destination.volume.rampTo(-Infinity, 2);
      isMuted = true;
      btn.innerText = "🔈 Fade In";
      btn.classList.remove("active");
      panel.classList.remove("settings-visible");
      panel.classList.add("settings-hidden");
      panel.classList.remove("expanded"); // Сбрасываем расширенное состояние при закрытии
    }
  }
});

// --- МОБИЛЬНАЯ ЛОГИКА: Клик по панели ---
const settingsPanel = document.getElementById('settings-panel');

settingsPanel.addEventListener('click', function(e) {
  // Если панель еще не расширена, мы её расширяем
  if (!this.classList.contains('expanded')) {
    this.classList.add('expanded');
    e.stopPropagation(); // Останавливаем всплытие, чтобы не сработал глобальный клик
  }
  // Если уже расширена, клики внутри (по инпутам) работают штатно благодаря CSS pointer-events: auto
});

// Клик вне панели сворачивает её
document.addEventListener('click', function(e) {
  const panel = document.getElementById('settings-panel');
  const audioBtn = document.getElementById('btn-audio');
  
  // Если клик НЕ по панели И НЕ по кнопке аудио
  if (!panel.contains(e.target) && !audioBtn.contains(e.target)) {
    panel.classList.remove('expanded');
  }
});


// --- ОБРАБОТЧИКИ ПАРАМЕТРОВ ---

document.getElementById('type-wind').addEventListener('change', function(e) {
  if(noiseNode) noiseNode.type = e.target.value; 
});

document.getElementById('vol-wind').addEventListener('input', function(e) {
  if(noiseNode) noiseNode.volume.value = parseFloat(e.target.value);
});

document.getElementById('param-wind-speed').addEventListener('input', function(e) {
  if(autoFilterNode) {
    autoFilterNode.frequency.value = parseFloat(e.target.value);
  }
});

document.getElementById('param-wind-depth').addEventListener('input', function(e) {
  if(autoFilterNode) {
    autoFilterNode.octaves = parseFloat(e.target.value);
  }
});

document.getElementById('type-synth').addEventListener('change', function(e) {
  if(synthNode) {
    synthNode.set({ oscillator: { type: e.target.value } });
  }
});

document.getElementById('vol-synth').addEventListener('input', function(e) {
  if(synthNode) synthNode.volume.value = parseFloat(e.target.value);
});

document.getElementById('param-density').addEventListener('input', function(e) {
  chimeDensity = parseFloat(e.target.value);
});