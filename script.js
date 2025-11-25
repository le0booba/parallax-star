/*
  CINVA Generative Audio
  Based on Tone.js
*/

let isAudioStarted = false;

// Глобальные переменные для доступа из ползунков
let noiseNode;
let synthNode;
let chimeDensity = 0.4; // Вероятность звучания ноты (40%)

async function initAudio() {
  await Tone.start();
  console.log("Audio Context Started");

  // --- 1. ATMOSPHERE (Wind / Drone) ---
  const noise = new Tone.Noise("pink");
  const autoFilter = new Tone.AutoFilter({
    frequency: "8m",
    baseFrequency: 200,
    octaves: 2.6
  }).toDestination();
  
  noise.connect(autoFilter);
  noise.volume.value = document.getElementById("vol-wind").value; // Берем стартовое значение
  autoFilter.start();
  noise.start();
  
  // Сохраняем ссылку для управления
  noiseNode = noise;


  // --- 2. STARLIGHT (Chimes) ---
  const reverb = new Tone.Reverb({
    decay: 10,
    wet: 0.6
  }).toDestination();

  const synth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: "fatsine" }, // Более насыщенный звук
    envelope: {
      attack: 0.02,
      decay: 0.3,
      sustain: 0,
      release: 3
    }
  }).connect(reverb);
  
  synth.volume.value = document.getElementById("vol-synth").value; // Берем стартовое значение
  
  // Сохраняем ссылку для управления
  synthNode = synth;

  const scale = ["C4", "D4", "Eb4", "G4", "A4", "C5", "D5", "Eb5", "G5"];

  const loop = new Tone.Loop(time => {
    // Используем динамическую переменную плотности
    if (Math.random() < chimeDensity) {
      const note = scale[Math.floor(Math.random() * scale.length)];
      synth.triggerAttackRelease(note, "8n", time);
    }
  }, "4n"); 

  Tone.Transport.start();
  loop.start(0);
}

// Обработка кнопки включения
document.getElementById('btn-audio').addEventListener('click', function() {
  const btn = this;
  const panel = document.getElementById('settings-panel');
  
  if (!isAudioStarted) {
    initAudio().then(() => {
      isAudioStarted = true;
      btn.innerText = "🔇 Mute Audio";
      btn.classList.add("active");
      // Показываем панель настроек
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
      panel.style.opacity = "0.5"; // Приглушаем панель
      panel.style.pointerEvents = "none";
    }
  }
});

// --- СЛУШАТЕЛИ ПОЛЗУНКОВ (Sliders Logic) ---

// 1. Громкость Ветра
document.getElementById('vol-wind').addEventListener('input', function(e) {
  if(noiseNode) {
    noiseNode.volume.value = parseFloat(e.target.value);
  }
});

// 2. Громкость Синтезатора
document.getElementById('vol-synth').addEventListener('input', function(e) {
  if(synthNode) {
    synthNode.volume.value = parseFloat(e.target.value);
  }
});

// 3. Плотность (Вероятность)
document.getElementById('param-density').addEventListener('input', function(e) {
  chimeDensity = parseFloat(e.target.value);
});