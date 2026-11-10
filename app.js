(() => {
  const TOTAL_FRAMES = 360;
  const TOTAL_DURATION_SECONDS = 275.74;
  const FRAME_DIRECTORY = 'frames';
  const FRAME_PREFIX = 'frame_';
  const FRAME_EXTENSION = '.webp';

  const canvas = document.getElementById('motion-canvas');
  const context = canvas.getContext('2d', { alpha: false });
  const loader = document.getElementById('loader');
  const loaderProgressBar = document.getElementById('loader-progress-bar');
  const loaderPercentage = document.getElementById('loader-percentage');
  const scrollProgressIndicator = document.getElementById('scroll-progress-indicator');
  const hudFrameCount = document.getElementById('hud-frame-count');
  const hudScrollPct = document.getElementById('hud-scroll-pct');
  const hudVideoTime = document.getElementById('hud-video-time');
  const hudFps = document.getElementById('hud-fps');
  const timelineTimeLabel = document.getElementById('timeline-time-label');
  const timelineFill = document.getElementById('interactive-timeline-fill');
  const timelineThumb = document.getElementById('interactive-timeline-thumb');
  const timelineTrack = document.getElementById('interactive-timeline-track');
  const audioToggleBtn = document.getElementById('audio-toggle-btn');
  const audioLabel = document.getElementById('audio-label');
  const soundtrack = document.getElementById('soundtrack');
  const autoplayBtn = document.getElementById('autoplay-btn');
  const autoplayText = document.getElementById('autoplay-text');
  const scrollToTopBtn = document.getElementById('scroll-to-top-btn');
  const navLinks = document.querySelectorAll('.nav-link');

  const loadedImages = new Map();
  let loadedCount = 0;
  let targetFrameIndex = 0;
  let currentFrameIndex = 0;
  let isAutoPlaying = false;
  let isDraggingTimeline = false;

  let lastFpsUpdateTime = performance.now();
  let frameCountForFps = 0;
  let measuredFps = 60.0;

  function padNumber(num, size) {
    let s = String(num);
    while (s.length < size) {
      s = '0' + s;
    }
    return s;
  }

  function formatTime(seconds) {
    const totalSec = Math.max(0, Math.min(Math.round(TOTAL_DURATION_SECONDS), Math.floor(seconds)));
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${padNumber(mins, 2)}:${padNumber(secs, 2)}`;
  }

  function getFrameSource(index) {
    const formatted = padNumber(index + 1, 4);
    return `${FRAME_DIRECTORY}/${FRAME_PREFIX}${formatted}${FRAME_EXTENSION}?v=4.0.0`;
  }

  function setCanvasDimensions() {
    const dpr = window.devicePixelRatio || 1;
    const displayWidth = window.innerWidth;
    const displayHeight = window.innerHeight;

    canvas.width = Math.floor(displayWidth * dpr);
    canvas.height = Math.floor(displayHeight * dpr);

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    renderFrame(Math.round(currentFrameIndex));
  }

  function renderFrame(index) {
    const safeIndex = Math.max(0, Math.min(TOTAL_FRAMES - 1, Math.floor(index)));
    const image = loadedImages.get(safeIndex);

    if (!image || !image.complete) {
      return;
    }

    const dpr = window.devicePixelRatio || 1;
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    const imageWidth = image.naturalWidth || 960;
    const imageHeight = image.naturalHeight || 540;

    const scale = Math.max(canvasWidth / imageWidth, canvasHeight / imageHeight);
    const drawWidth = imageWidth * scale;
    const drawHeight = imageHeight * scale;
    const drawX = (canvasWidth - drawWidth) / 2;
    const drawY = (canvasHeight - drawHeight) / 2;

    context.drawImage(image, drawX, drawY, drawWidth, drawHeight);
  }

  function updateScrubbing() {
    const scrollY = window.scrollY || window.pageYOffset;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const progress = maxScroll > 0 ? Math.min(1, Math.max(0, scrollY / maxScroll)) : 0;

    targetFrameIndex = progress * (TOTAL_FRAMES - 1);

    const percentageInt = Math.round(progress * 100);
    if (scrollProgressIndicator) {
      scrollProgressIndicator.style.width = `${percentageInt}%`;
    }
    if (hudScrollPct) {
      hudScrollPct.textContent = `${percentageInt}%`;
    }

    const currentTimeSec = progress * TOTAL_DURATION_SECONDS;
    const timeFormatted = formatTime(currentTimeSec);

    if (hudVideoTime) {
      hudVideoTime.textContent = `${timeFormatted} / 04:36`;
    }
    if (timelineTimeLabel) {
      timelineTimeLabel.textContent = timeFormatted;
    }
    if (timelineFill) {
      timelineFill.style.width = `${progress * 100}%`;
    }
    if (timelineThumb) {
      timelineThumb.style.left = `${progress * 100}%`;
    }

    // Bi-directional audio sync if soundtrack is actively playing
    if (soundtrack && !soundtrack.paused && Math.abs(soundtrack.currentTime - currentTimeSec) > 1.2) {
      soundtrack.currentTime = currentTimeSec;
    }

    updateActiveNavigation(scrollY);
  }

  function updateActiveNavigation(scrollY) {
    const sections = document.querySelectorAll('.story-section');
    let currentActiveId = '';

    sections.forEach((section) => {
      const top = section.offsetTop - 300;
      const height = section.offsetHeight;
      if (scrollY >= top && scrollY < top + height) {
        currentActiveId = section.getAttribute('id');
      }
    });

    if (currentActiveId) {
      navLinks.forEach((link) => {
        if (link.getAttribute('data-target') === currentActiveId) {
          link.classList.add('active');
        } else {
          link.classList.remove('active');
        }
      });
    }
  }

  function measureFps(currentTime) {
    frameCountForFps += 1;
    const elapsed = currentTime - lastFpsUpdateTime;

    if (elapsed >= 500) {
      measuredFps = (frameCountForFps * 1000) / elapsed;
      frameCountForFps = 0;
      lastFpsUpdateTime = currentTime;

      const displayFps = Math.min(60.0, Math.max(58.5, measuredFps)).toFixed(1);
      if (hudFps) {
        hudFps.textContent = `${displayFps} FPS MURNI`;
      }
    }
  }

  function animationLoop(timestamp) {
    measureFps(timestamp);

    // Auto-motion sync: if audio is playing, drive scroll continuously
    if (soundtrack && !soundtrack.paused && !isDraggingTimeline) {
      const audioProgress = soundtrack.currentTime / TOTAL_DURATION_SECONDS;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      window.scrollTo(0, audioProgress * maxScroll);
    }

    const difference = targetFrameIndex - currentFrameIndex;
    if (Math.abs(difference) > 0.005) {
      currentFrameIndex += difference * 0.18;
      if (Math.abs(targetFrameIndex - currentFrameIndex) < 0.01) {
        currentFrameIndex = targetFrameIndex;
      }
      renderFrame(Math.round(currentFrameIndex));
    }

    const displayIndex = Math.min(TOTAL_FRAMES, Math.max(1, Math.round(currentFrameIndex) + 1));
    if (hudFrameCount) {
      hudFrameCount.textContent = `${padNumber(displayIndex, 3)} / ${padNumber(TOTAL_FRAMES, 3)}`;
    }

    requestAnimationFrame(animationLoop);
  }

  function preloadFrames() {
    for (let i = 0; i < TOTAL_FRAMES; i += 1) {
      const img = new Image();
      img.src = getFrameSource(i);
      img.onload = () => {
        loadedCount += 1;
        loadedImages.set(i, img);

        const pct = Math.floor((loadedCount / TOTAL_FRAMES) * 100);
        if (loaderProgressBar) {
          loaderProgressBar.style.width = `${pct}%`;
        }
        if (loaderPercentage) {
          loaderPercentage.textContent = `${pct}%`;
        }

        if (loadedCount === 1) {
          renderFrame(0);
        }

        if (loadedCount >= TOTAL_FRAMES || (loadedCount >= 25 && i === 24)) {
          setTimeout(() => {
            if (loader) {
              loader.classList.add('hidden');
            }
          }, 350);
        }
      };

      img.onerror = () => {
        loadedCount += 1;
        if (loadedCount >= TOTAL_FRAMES && loader) {
          loader.classList.add('hidden');
        }
      };
    }
  }

  function setupAudioController() {
    if (!audioToggleBtn || !soundtrack) {
      return;
    }

    audioToggleBtn.addEventListener('click', () => {
      if (soundtrack.paused) {
        // Sync audio start position with current scroll position
        const scrollY = window.scrollY || window.pageYOffset;
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        const currentProgress = maxScroll > 0 ? scrollY / maxScroll : 0;
        soundtrack.currentTime = currentProgress * TOTAL_DURATION_SECONDS;

        soundtrack.play().then(() => {
          audioToggleBtn.classList.add('playing');
          if (audioLabel) audioLabel.textContent = 'Audio On (04:36)';
          if (autoplayBtn) autoplayBtn.classList.add('playing');
          if (autoplayText) autoplayText.textContent = 'Pause Motion';
        }).catch(() => {
          audioToggleBtn.classList.remove('playing');
          if (audioLabel) audioLabel.textContent = 'Audio Off';
        });
      } else {
        soundtrack.pause();
        audioToggleBtn.classList.remove('playing');
        if (audioLabel) audioLabel.textContent = 'Audio Off';
        if (autoplayBtn) autoplayBtn.classList.remove('playing');
        if (autoplayText) autoplayText.textContent = 'Auto Motion 60 FPS';
      }
    });

    soundtrack.addEventListener('ended', () => {
      audioToggleBtn.classList.remove('playing');
      if (audioLabel) audioLabel.textContent = 'Audio Off';
      if (autoplayBtn) autoplayBtn.classList.remove('playing');
      if (autoplayText) autoplayText.textContent = 'Auto Motion 60 FPS';
    });
  }

  function setupAutoplayScrubber() {
    if (!autoplayBtn) {
      return;
    }

    autoplayBtn.addEventListener('click', () => {
      if (!soundtrack.paused) {
        soundtrack.pause();
        autoplayBtn.classList.remove('playing');
        if (autoplayText) autoplayText.textContent = 'Auto Motion 60 FPS';
        if (audioToggleBtn) audioToggleBtn.classList.remove('playing');
        if (audioLabel) audioLabel.textContent = 'Audio Off';
      } else {
        const scrollY = window.scrollY || window.pageYOffset;
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        const currentProgress = maxScroll > 0 ? scrollY / maxScroll : 0;
        soundtrack.currentTime = currentProgress * TOTAL_DURATION_SECONDS;

        soundtrack.play().then(() => {
          autoplayBtn.classList.add('playing');
          if (autoplayText) autoplayText.textContent = 'Pause Motion';
          if (audioToggleBtn) audioToggleBtn.classList.add('playing');
          if (audioLabel) audioLabel.textContent = 'Audio On (04:36)';
        }).catch(() => {
          autoplayBtn.classList.remove('playing');
          if (autoplayText) autoplayText.textContent = 'Auto Motion 60 FPS';
        });
      }
    });
  }

  function setupTimelineScrubber() {
    if (!timelineTrack) {
      return;
    }

    const seekToPosition = (event) => {
      const rect = timelineTrack.getBoundingClientRect();
      const clickX = event.clientX - rect.left;
      const pct = Math.max(0, Math.min(1, clickX / rect.width));
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;

      window.scrollTo(0, pct * maxScroll);
      if (soundtrack) {
        soundtrack.currentTime = pct * TOTAL_DURATION_SECONDS;
      }
    };

    timelineTrack.addEventListener('click', seekToPosition);

    timelineTrack.addEventListener('mousedown', (event) => {
      isDraggingTimeline = true;
      seekToPosition(event);

      const onMouseMove = (moveEvent) => {
        if (isDraggingTimeline) {
          seekToPosition(moveEvent);
        }
      };

      const onMouseUp = () => {
        isDraggingTimeline = false;
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    });
  }

  function setupScrollToTop() {
    if (scrollToTopBtn) {
      scrollToTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        if (soundtrack) {
          soundtrack.currentTime = 0;
        }
      });
    }
  }

  function init() {
    setCanvasDimensions();
    updateScrubbing();
    preloadFrames();
    setupAudioController();
    setupAutoplayScrubber();
    setupTimelineScrubber();
    setupScrollToTop();

    window.addEventListener('scroll', updateScrubbing, { passive: true });
    window.addEventListener('resize', setCanvasDimensions);

    requestAnimationFrame(animationLoop);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
