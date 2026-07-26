let currentReadingUtterance = null;
let currentReadingAudio = null;

function getReadingText() {
  const paragraph = document.querySelector(".reading-body > p:first-of-type");
  return paragraph ? paragraph.innerText.replace(/\s+/g, " ").trim() : "";
}

function getTtsButton() {
  return document.querySelector(".tts-toggle");
}

function getReadingAudioSource() {
  const button = getTtsButton();
  const buttonSource = button?.dataset.audioSrc;
  if (buttonSource) return buttonSource;

  const audio = document.querySelector("audio[data-reading-audio], audio#readingAudio");
  return audio?.currentSrc || audio?.getAttribute("src") || "";
}

function setTtsActive(isActive) {
  const button = getTtsButton();
  if (!button) return;

  button.classList.toggle("is-active", isActive);
  button.setAttribute("aria-pressed", isActive ? "true" : "false");
  button.setAttribute("aria-label", isActive ? "Stop reading" : "Listen to reading");
  button.setAttribute("title", isActive ? "Stop reading" : "Listen to reading");
}

function stopReading() {
  if (currentReadingAudio) {
    currentReadingAudio.pause();
    currentReadingAudio.currentTime = 0;
    currentReadingAudio = null;
  }

  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }

  currentReadingUtterance = null;
  setTtsActive(false);
}

function playReadingAudio(audioSource) {
  stopReading();

  const audio = new Audio(audioSource);
  currentReadingAudio = audio;
  setTtsActive(true);

  audio.addEventListener("ended", () => {
    if (currentReadingAudio === audio) {
      currentReadingAudio = null;
      setTtsActive(false);
    }
  });

  audio.addEventListener("error", () => {
    if (currentReadingAudio === audio) {
      currentReadingAudio = null;
      setTtsActive(false);
      speakReadingText();
    }
  });

  audio.play().catch(() => {
    if (currentReadingAudio === audio) {
      currentReadingAudio = null;
      setTtsActive(false);
      speakReadingText();
    }
  });
}

function speakReadingText() {
  if (!("speechSynthesis" in window)) {
    alert("Text to speech is not supported in this browser.");
    return;
  }

  const text = getReadingText();
  if (!text) return;

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.95;
  utterance.pitch = 1;
  utterance.onend = () => {
    if (currentReadingUtterance === utterance) {
      currentReadingUtterance = null;
      setTtsActive(false);
    }
  };
  utterance.onerror = () => {
    if (currentReadingUtterance === utterance) {
      currentReadingUtterance = null;
      setTtsActive(false);
    }
  };

  currentReadingUtterance = utterance;
  setTtsActive(true);
  window.speechSynthesis.speak(utterance);
}

function listenToReading() {
  const audioSource = getReadingAudioSource();
  if (audioSource) {
    playReadingAudio(audioSource);
    return;
  }

  speakReadingText();
}

function toggleReadingAudio() {
  if (currentReadingAudio || currentReadingUtterance || ("speechSynthesis" in window && window.speechSynthesis.speaking)) {
    stopReading();
    return;
  }

  listenToReading();
}
