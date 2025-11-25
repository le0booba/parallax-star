/*
  CINVA Generative Audio & Visuals
  Based on Tone.js
*/

// --- ГЕНЕРАЦИЯ ЗВЕЗД (Responsive Fix) ---
function generateStars() {
  const width = window.innerWidth; // Берем реальную ширину экрана
  const height = 2000; // Высота цикла анимации (как в CSS)
  
  // Функция для создания строки box-shadow
  const createShadows = (count) => {
    let shadows = [];
    for (let i = 0; i < count; i++) {
      const x = Math.floor(Math.random() * width);
      const y = Math.floor(Math.random() * height);
      shadows.push(`${x}px ${y}px #FFF`);
    }
    return shadows.join(', ');
  };

  // Удаляем старые стили, если они есть
  const oldStyle = document.getElementById('dynamic-star-style');
  if (oldStyle) oldStyle.remove();

  // Генерируем новые
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

// Генерируем звезды при запуске и при изменении размера окна
generateStars();
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(generateStars, 500); // Ждем окончания ресайза
});


// --- AUDIO ENGINE ---

let isAudioStarted = false;
let noiseNode, autoFilterNode;
let synthNode;
let chimeDensity = 0.4;

async function initAudio() {
  await Tone.start();
  console.log("Audio Context Started");

  // --- 1. ATMOSPHERE (Wind / Drone) ---
  const initialNoiseType = document.getElementById("type-wind").value;
  const noise = new Tone.Noise(initialNoiseType);
  
  // Фильтр для движения звука
  const autoFilter = new Tone.AutoFilter({
    frequency: "8m", // Скорость (будет меняться слайдером)
    baseFrequency: 200,
    octaves: 2.6 // Глубина (будет меняться слайдером)
  }).toDestination();
  
  noise.connect(autoFilter);
  noise.volume.value = document.getElementById("vol-wind").value; 
  
  // Применяем начальные значения со слайдеров
  const startSpeed = document.getElementById("param-wind-speed").value;
  const startDepth = document.getElementById("param-wind-depth").value;
  
  autoFilter.frequency.value = startSpeed; 
  autoFilter.octaves = startDepth;

  autoFilter.start();
  noise.start();
  
  noiseNode = noise;
  autoFilterNode = autoFilter;

  // --- 2. STARLIGHT (Chimes) ---
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

// --- Кнопка включения ---
document.getElementById('btn-audio').addEventListener('click', function() {
  const btn = this;
  const panel = document.getElementById('settings-panel');
  
  if (!isAudioStarted) {
    initAudio().then(() => {
      isAudioStarted = true;
      btn.innerText = "🔇 Mute Audio";
      btn.classList.add("active");
      panel.classList.remove("settings-hidden");
      panel.classList.add("settings-visible");
    });
  } else {
    if (Tone.Destination.mute) {
      Tone.Destination.mute = false;
      btn.innerText = "🔇 Mute Audio";
      btn.classList.add("active");
      panel.style.opacity = "1";
      panel.style.pointerEvents = "auto";
    } else {
      Tone.Destination.mute = true;
      btn.innerText = "🔈 Resume Audio";
      btn.classList.remove("active");
      panel.style.opacity = "0.5";
      panel.style.pointerEvents = "none";
    }
  }
});

// --- ОБРАБОТЧИКИ НАСТРОЕК (Listeners) ---

// 1. Тип Ветра
document.getElementById('type-wind').addEventListener('change', function(e) {
  if(noiseNode) noiseNode.type = e.target.value; 
});

// 2. Громкость Ветра
document.getElementById('vol-wind').addEventListener('input', function(e) {
  if(noiseNode) noiseNode.volume.value = parseFloat(e.target.value);
});

// 3. [NEW] Скорость Ветра (Turbulence)
document.getElementById('param-wind-speed').addEventListener('input', function(e) {
  if(autoFilterNode) {
    // Частота фильтра в Гц (чем больше число, тем быстрее "плавает" звук)
    autoFilterNode.frequency.value = parseFloat(e.target.value);
  }
});

// 4. [NEW] Глубина Ветра (Depth)
document.getElementById('param-wind-depth').addEventListener('input', function(e) {
  if(autoFilterNode) {
    // Октавы фильтра (диапазон изменений)
    autoFilterNode.octaves = parseFloat(e.target.value);
  }
});

// 5. Тип Синтезатора
document.getElementById('type-synth').addEventListener('change', function(e) {
  if(synthNode) {
    synthNode.set({ oscillator: { type: e.target.value } });
  }
});

// 6. Громкость Синтезатора
document.getElementById('vol-synth').addEventListener('input', function(e) {
  if(synthNode) synthNode.volume.value = parseFloat(e.target.value);
});

// 7. Плотность нот
document.getElementById('param-density').addEventListener('input', function(e) {
  chimeDensity = parseFloat(e.target.value);
});