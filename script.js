/*
  Generative Audio script using Tone.js
  Concepts:
  1. Space Drone (Wind) using filtered Noise.
  2. Star Twinkles (Chimes) using PolySynth with random loop.
*/

let isAudioStarted = false;

// Основная функция запуска аудио
async function initAudio() {
  await Tone.start(); // Разрешаем браузеру проигрывание
  console.log("Audio is ready");

  // --- 1. Слой атмосферы (Космический ветер) ---
  // Создаем "Розовый шум" (похож на ветер или водопад)
  const noise = new Tone.Noise("pink");
  
  // Авто-фильтр заставляет звук "плавать" влево-вправо и менять частоту
  const autoFilter = new Tone.AutoFilter({
    frequency: "8m", // Очень медленная модуляция (8 тактов)
    baseFrequency: 200,
    octaves: 2.6
  }).toDestination();
  
  // Подключаем шум к фильтру и понижаем громкость
  noise.connect(autoFilter);
  noise.volume.value = -20; // Тихий фон
  autoFilter.start();
  noise.start();


  // --- 2. Слой звезд (Перезвон) ---
  // Эффект реверберации (эхо) для космоса
  const reverb = new Tone.Reverb({
    decay: 5, // Длинное эхо
    wet: 0.5
  }).toDestination();

  // Синтезатор для звуков
  const synth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: "sine" }, // Мягкая волна
    envelope: {
      attack: 0.05,
      decay: 0.1,
      sustain: 0.1,
      release: 3 // Очень длинное затухание
    }
  }).connect(reverb);
  
  synth.volume.value = -12;

  // Музыкальная гамма (Минорная пентатоника для загадочности)
  const scale = ["C4", "D4", "Eb4", "G4", "A4", "C5", "D5", "Eb5"];

  // Бесконечный цикл, который играет случайную ноту
  const loop = new Tone.Loop(time => {
    // 30% шанс, что нота сыграет в этот такт (чтобы не было слишком часто)
    if (Math.random() < 0.4) {
      const note = scale[Math.floor(Math.random() * scale.length)];
      synth.triggerAttackRelease(note, "8n", time);
    }
  }, "4n"); // Проверка каждые пол-секунды (четвертная нота)

  Tone.Transport.start();
  loop.start(0);
}

// Обработка кнопки
document.getElementById('btn-audio').addEventListener('click', function() {
  const btn = this;
  
  if (!isAudioStarted) {
    initAudio().then(() => {
      isAudioStarted = true;
      btn.innerText = "🔇 Mute Audio";
      btn.classList.add("active");
    });
  } else {
    // Переключение Mute/Unmute
    if (Tone.Destination.mute) {
      Tone.Destination.mute = false;
      btn.innerText = "🔇 Mute Audio";
      btn.classList.add("active");
    } else {
      Tone.Destination.mute = true;
      btn.innerText = "🔈 Enable Audio";
      btn.classList.remove("active");
    }
  }
});