let currentMode = '';

// TRANSLATION
function translateText() {
  const text = document.getElementById('textInput')?.value.trim();
  if (!text) {
    alert("Please enter some text or Morse code.");
    return;
  }

  fetch('/translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  })
    .then(response => response.json())
    .then(data => {
      const result = data.result;
      const outputElement = document.getElementById('output');
      if (outputElement) outputElement.innerText = result;
      updateHistory(text, result);
      currentMode = /^[.\- /]+$/.test(result) ? 'morse' : 'text';
    })
    .catch(err => {
      console.error('Error during translation:', err);
      alert('Translation failed. Please try again.');
    });
}

// COPY TO CLIPBOARD
function copyToClipboard() {
  const output = document.getElementById('output')?.innerText;
  if (!output) return;

  navigator.clipboard.writeText(output)
    .then(() => alert('Copied to clipboard!'))
    .catch(() => alert('Failed to copy!'));
}

// UPDATE HISTORY + SAVE TO localStorage
function updateHistory(input, result) {
  const itemText = `"${input}" → ${result}`;
  const list = document.getElementById('historyList');

  if (list) {
    const item = document.createElement('li');
    item.textContent = itemText;
    list.prepend(item);
  }

  let history = JSON.parse(localStorage.getItem('translationHistory')) || [];
  history.unshift(itemText);
  localStorage.setItem('translationHistory', JSON.stringify(history));
}

// LOAD HISTORY from localStorage
function loadHistory() {
  const historyList = document.getElementById('historyList');
  if (!historyList) return;

  const history = JSON.parse(localStorage.getItem('translationHistory')) || [];
  historyList.innerHTML = '';
  history.forEach(item => {
    const li = document.createElement('li');
    li.textContent = item;
    historyList.appendChild(li);
  });
}

// CLEAR HISTORY
function clearHistory() {
  localStorage.removeItem('translationHistory');
  const historyList = document.getElementById('historyList');
  if (historyList) historyList.innerHTML = '';
}

// PLAY MORSE OR TEXT
function playMorse(morse) {
  const dotDuration = 100;
  const dashDuration = dotDuration * 3;
  const spaceDuration = dotDuration * 7;

  const context = new (window.AudioContext || window.webkitAudioContext)();
  let time = context.currentTime;

  function playBeep(duration) {
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(600, context.currentTime);
    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    oscillator.start(time);
    oscillator.stop(time + duration / 1000);
    time += (duration + dotDuration) / 1000;
  }

  for (const char of morse) {
    if (char === '.') playBeep(dotDuration);
    else if (char === '-') playBeep(dashDuration);
    else if (char === ' ') time += dotDuration / 1000;
    else if (char === '/') time += spaceDuration / 1000;
  }
}

function playCurrentMorse() {
  const output = document.getElementById('output')?.innerText.trim();
  if (!output) return;

  if (currentMode === 'morse') {
    playMorse(output);
  } else if (currentMode === 'text') {
    const utterance = new SpeechSynthesisUtterance(output);
    speechSynthesis.speak(utterance);
  } else {
    alert("Unable to play audio: unknown output format.");
  }
}

// THEME TOGGLER
function toggleTheme() {
  const body = document.body;
  const isDark = body.classList.toggle('dark-mode');
  const icon = document.getElementById('themeIcon');
  if (icon) icon.textContent = isDark ? '🌙' : '🌤️';
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

// ON PAGE LOAD: Load theme + Load history
window.onload = function () {
  // Theme
  const savedTheme = localStorage.getItem('theme');
  const isDark = savedTheme === 'dark';
  document.body.classList.toggle('dark-mode', isDark);
  const icon = document.getElementById('themeIcon');
  if (icon) icon.textContent = isDark ? '🌙' : '🌤️';

  // History
  loadHistory();
};
