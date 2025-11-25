/*
  CINVA Generative Audio
  Based on Tone.js
*/

let isAudioStarted = false;

// Глобальные переменные для доступа из контролов
let noiseNode;
let synthNode;
let chimeDensity = 0.4; // Вероятность звучания

async function initAudio() {
  await Tone.start();
  console.log("Audio Context Started");

  // --- 1. ATMOSPHERE (Wind / Drone) ---
  // Берем начальный тип из HTML селекта
  const initialNoiseType = document.getElementById("type-wind").value;
  const noise = new Tone.Noise(initialNoiseType);
  
  const autoFilter = new Tone.AutoFilter({
    frequency: "8m",
    baseFrequency: 200,
    octaves: 2.6
  }).toDestination();
  
  noise.connect(autoFilter);
  noise.volume.value = document.getElementById("vol-wind").value; 
  autoFilter.start();
  noise.start();
  
  noiseNode = noise;

  // --- 2. STARLIGHT (Chimes) ---
  const reverb = new Tone.Reverb({
    decay: 10,
    wet: 0.6
  }).toDestination();

  // Берем начальный тип осциллятора из HTML селекта
  const initialSynthType = document.getElementById("type-synth").value;

  // PolySynth создает полифонический синтезатор
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

// --- ОБРАБОТЧИКИ НАСТРОЕК ---

// 1. Изменение типа Ветра (Noise Type)
document.getElementById('type-wind').addEventListener('change', function(e) {
  if(noiseNode) {
    noiseNode.type = e.target.value; // pink, brown, white
  }
});

// 2. Изменение громкости Ветра
document.getElementById('vol-wind').addEventListener('input', function(e) {
  if(noiseNode) {
    noiseNode.volume.value = parseFloat(e.target.value);
  }
});

// 3. Изменение типа Синтезатора (Starlight Sound)
document.getElementById('type-synth').addEventListener('change', function(e) {
  if(synthNode) {
    // PolySynth меняет тип осциллятора через set
    synthNode.set({
      oscillator: { type: e.target.value }
    });
  }
});

// 4. Изменение громкости Синтезатора
document.getElementById('vol-synth').addEventListener('input', function(e) {
  if(synthNode) {
    synthNode.volume.value = parseFloat(e.target.value);
  }
});

// 5. Плотность нот
document.getElementById('param-density').addEventListener('input', function(e) {
  chimeDensity = parseFloat(e.target.value);
});