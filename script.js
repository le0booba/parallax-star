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
let isMuted = false; // Локальное состояние для плавного перехода
let noiseNode, autoFilterNode;
let synthNode;
let chimeDensity = 0.4;

async function initAudio() {
  await Tone.start();
  
  // Устанавливаем мастер-громкость в минимум перед стартом для фейда
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

// --- Кнопка включения (с плавным FADE IN / FADE OUT) ---
document.getElementById('btn-audio').addEventListener('click', function() {
  const btn = this;
  const panel = document.getElementById('settings-panel');
  
  if (!isAudioStarted) {
    // ПЕРВЫЙ ЗАПУСК
    initAudio().then(() => {
      isAudioStarted = true;
      isMuted = false;
      btn.innerText = "🔇 Fade Out";
      btn.classList.add("active");
      panel.classList.remove("settings-hidden");
      panel.classList.add("settings-visible");
      
      // Плавное появление (3 секунды) до 0 dB (нормальная громкость)
      Tone.Destination.volume.rampTo(0, 3);
    });
  } else {
    // ПЕРЕКЛЮЧЕНИЕ СОСТОЯНИЯ
    if (isMuted) {
      // UNMUTE: Плавное включение
      Tone.Destination.volume.rampTo(0, 3); // 3 секунды на возврат громкости
      isMuted = false;
      btn.innerText = "🔇 Fade Out";
      btn.classList.add("active");
      // Разблокируем панель
      panel.classList.remove("settings-hidden");
      panel.classList.add("settings-visible");
    } else {
      // MUTE: Плавное выключение
      Tone.Destination.volume.rampTo(-Infinity, 2); // 2 секунды на затухание
      isMuted = true;
      btn.innerText = "🔈 Fade In";
      btn.classList.remove("active");
      // Прячем панель
      panel.classList.remove("settings-visible");
      panel.classList.add("settings-hidden");
    }
  }
});

// --- ОБРАБОТЧИКИ НАСТРОЕК ---

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