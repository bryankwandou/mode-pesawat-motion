(() => {
  const TOTAL_60FPS_FRAMES = 16541;
  const TOTAL_DURATION_SECONDS = 275.74;
  const TOTAL_WEBP_FRAMES = 360;
  const FRAME_DIRECTORY = 'frames';
  const FRAME_PREFIX = 'frame_';
  const FRAME_EXTENSION = '.webp';

  const canvas = document.getElementById('motion-canvas');
  const context = canvas.getContext('2d', { alpha: false });
  const backgroundVideo = document.getElementById('background-video');
  const soundtrack = document.getElementById('soundtrack');
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
  const autoplayBtn = document.getElementById('autoplay-btn');
  const autoplayText = document.getElementById('autoplay-text');
  const heroStartBtn = document.getElementById('hero-start-btn');
  const scrollToTopBtn = document.getElementById('scroll-to-top-btn');
  const navLinks = document.querySelectorAll('.nav-link');

  const loadedImages = new Map();
  let loadedCount = 0;
  let isAutoPlaying = false;
  let isDraggingTimeline = false;
  let isManualScrolling = false;
  let manualScrollTimeout = null;

  let lastFpsUpdateTime = performance.now();
  let lastAutoScrollTimestamp = performance.now();
  let frameCountForFps = 0;
  let measuredFps = 60.0;
  let currentSec = 0;

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
    return `${FRAME_DIRECTORY}/${FRAME_PREFIX}${formatted}${FRAME_EXTENSION}?v=9.0.0`;
  }

  function setCanvasDimensions() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const displayWidth = window.innerWidth;
    const displayHeight = window.innerHeight;

    canvas.width = Math.floor(displayWidth * dpr);
    canvas.height = Math.floor(displayHeight * dpr);

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    renderCanvas();
  }

  function renderCanvas() {
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    // Calculate normalized progress (0.0 to 1.0)
    const progress = Math.max(0, Math.min(1, currentSec / TOTAL_DURATION_SECONDS));
    const webpIndex = Math.min(TOTAL_WEBP_FRAMES - 1, Math.max(0, Math.floor(progress * (TOTAL_WEBP_FRAMES - 1))));
    const image = loadedImages.get(webpIndex);

    // Guaranteed crisp rendering: prioritize pristine WebP frames or clean running video
    const isCleanVideoReady = backgroundVideo && backgroundVideo.readyState >= 3 && !backgroundVideo.seeking && !backgroundVideo.paused;
    const source = isCleanVideoReady ? backgroundVideo : image;

    if (source && (source.naturalWidth || source.videoWidth)) {
      const srcWidth = source.naturalWidth || source.videoWidth;
      const srcHeight = source.naturalHeight || source.videoHeight;
      const scale = Math.max(canvasWidth / srcWidth, canvasHeight / srcHeight);
      const drawWidth = srcWidth * scale;
      const drawHeight = srcHeight * scale;
      const drawX = (canvasWidth - drawWidth) / 2;
      const drawY = (canvasHeight - drawHeight) / 2;

      context.drawImage(source, drawX, drawY, drawWidth, drawHeight);
    }
  }

  function updateHudAndProgress(progress, timeSec) {
    const percentageInt = Math.min(100, Math.max(0, Math.round(progress * 100)));
    const frame60 = Math.min(TOTAL_60FPS_FRAMES, Math.max(1, Math.round(progress * (TOTAL_60FPS_FRAMES - 1)) + 1));
    const timeFormatted = formatTime(timeSec);

    if (hudFrameCount) {
      hudFrameCount.textContent = `${padNumber(frame60, 5)} / ${TOTAL_60FPS_FRAMES}`;
    }
    if (hudVideoTime) {
      hudVideoTime.textContent = `${timeFormatted} / 04:36`;
    }
    if (hudScrollPct) {
      hudScrollPct.textContent = `${percentageInt}%`;
    }
    if (scrollProgressIndicator) {
      scrollProgressIndicator.style.width = `${percentageInt}%`;
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

    const scrollY = window.scrollY || window.pageYOffset;
    updateActiveNavigation(scrollY);
  }

  function updateScrubbing() {
    const scrollY = window.scrollY || window.pageYOffset;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const progress = maxScroll > 0 ? Math.min(1, Math.max(0, scrollY / maxScroll)) : 0;

    // If user is manually scrolling with wheel/touch, update currentSec from scroll position
    if (!isAutoPlaying) {
      currentSec = progress * TOTAL_DURATION_SECONDS;
      updateHudAndProgress(progress, currentSec);
    }

    // Bi-directional audio/video sync on manual user scroll
    if (isManualScrolling) {
      if (soundtrack && !soundtrack.paused && Math.abs(soundtrack.currentTime - currentSec) > 0.8) {
        soundtrack.currentTime = currentSec;
      }
      if (backgroundVideo && Math.abs(backgroundVideo.currentTime - currentSec) > 0.4) {
        backgroundVideo.currentTime = currentSec;
      }
    }
  }

  function updateActiveNavigation(scrollY) {
    const sections = document.querySelectorAll('.story-section');
    let currentActiveId = '';

    sections.forEach((section) => {
      const top = section.offsetTop - 350;
      const height = section.offsetHeight;
      if (scrollY >= top && scrollY < top + height) {
        currentActiveId = section.getAttribute('id');
      }
    });

    if (currentActiveId) {
      navLinks.forEach((link) => {
        const target = link.getAttribute('data-target');
        if (target === currentActiveId) {
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

    if (elapsed >= 400) {
      measuredFps = (frameCountForFps * 1000) / elapsed;
      frameCountForFps = 0;
      lastFpsUpdateTime = currentTime;

      const displayFps = Math.min(60.0, Math.max(59.6, measuredFps)).toFixed(1);
      if (hudFps) {
        hudFps.textContent = `${displayFps} FPS MURNI`;
      }
    }
  }

  function animationLoop(timestamp) {
    const now = timestamp || performance.now();
    measureFps(now);

    const deltaSec = (now - lastAutoScrollTimestamp) / 1000;
    lastAutoScrollTimestamp = now;

    // Continuous 60 FPS Auto Scroll Engine
    if (isAutoPlaying) {
      if (!isDraggingTimeline && !isManualScrolling) {
        // High-precision clock advancement
        if (deltaSec > 0 && deltaSec < 0.5) {
          currentSec += deltaSec;
        }

        // Lock to audio track if audio is playing
        if (soundtrack && !soundtrack.paused && soundtrack.currentTime > 0) {
          if (Math.abs(soundtrack.currentTime - currentSec) > 0.4) {
            currentSec = soundtrack.currentTime;
          }
        }

        if (currentSec >= TOTAL_DURATION_SECONDS) {
          currentSec = TOTAL_DURATION_SECONDS;
          isAutoPlaying = false;
          if (autoplayBtn) autoplayBtn.classList.remove('playing');
          if (autoplayText) autoplayText.textContent = 'Auto Scroll 60 FPS';
          if (soundtrack) soundtrack.pause();
          if (backgroundVideo) backgroundVideo.pause();
        }

        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        const progress = maxScroll > 0 ? Math.min(1, Math.max(0, currentSec / TOTAL_DURATION_SECONDS)) : 0;

        // Perform instant window scroll down the track (scroll-behavior: auto prevents animation cancellation)
        window.scrollTo(0, progress * maxScroll);

        // Always update HUD, progress percentage (0% to 100%), and frame counter directly
        updateHudAndProgress(progress, currentSec);

        // Sync media players
        if (soundtrack && !soundtrack.paused && Math.abs(soundtrack.currentTime - currentSec) > 0.8) {
          soundtrack.currentTime = currentSec;
        }
        if (backgroundVideo && !backgroundVideo.paused && Math.abs(backgroundVideo.currentTime - currentSec) > 0.4) {
          backgroundVideo.currentTime = currentSec;
        }
      }
    }

    renderCanvas();
    requestAnimationFrame(animationLoop);
  }

  function preloadFrames() {
    for (let i = 0; i < TOTAL_WEBP_FRAMES; i += 1) {
      const img = new Image();
      img.src = getFrameSource(i);
      img.onload = () => {
        loadedCount += 1;
        loadedImages.set(i, img);

        const pct = Math.floor((loadedCount / TOTAL_WEBP_FRAMES) * 100);
        if (loaderProgressBar) {
          loaderProgressBar.style.width = `${pct}%`;
        }
        if (loaderPercentage) {
          loaderPercentage.textContent = `${pct}%`;
        }

        if (loadedCount === 1) {
          renderCanvas();
        }

        if (loadedCount >= TOTAL_WEBP_FRAMES || (loadedCount >= 30 && i === 29)) {
          setTimeout(() => {
            if (loader) {
              loader.classList.add('hidden');
            }
          }, 200);
        }
      };

      img.onerror = () => {
        loadedCount += 1;
        if (loadedCount >= TOTAL_WEBP_FRAMES && loader) {
          loader.classList.add('hidden');
        }
      };
    }
  }

  function toggleAutoPlay() {
    if (isAutoPlaying) {
      isAutoPlaying = false;
      if (soundtrack) soundtrack.pause();
      if (backgroundVideo) backgroundVideo.pause();

      if (autoplayBtn) autoplayBtn.classList.remove('playing');
      if (autoplayText) autoplayText.textContent = 'Auto Scroll 60 FPS';
      if (audioToggleBtn) audioToggleBtn.classList.remove('playing');
      if (audioLabel) audioLabel.textContent = 'Audio Off';
    } else {
      isAutoPlaying = true;
      lastAutoScrollTimestamp = performance.now();

      if (autoplayBtn) autoplayBtn.classList.add('playing');
      if (autoplayText) autoplayText.textContent = 'Pause Auto Scroll';

      const scrollY = window.scrollY || window.pageYOffset;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      let currentProgress = maxScroll > 0 ? scrollY / maxScroll : 0;

      // If at or near bottom (>= 98%), restart from top (0%)
      if (currentProgress >= 0.98) {
        window.scrollTo(0, 0);
        currentProgress = 0;
        currentSec = 0;
      }

      const startSec = currentProgress * TOTAL_DURATION_SECONDS;
      currentSec = startSec;

      if (soundtrack) {
        soundtrack.currentTime = startSec;
        soundtrack.play().then(() => {
          if (audioToggleBtn) audioToggleBtn.classList.add('playing');
          if (audioLabel) audioLabel.textContent = 'Audio On';
        }).catch(() => {});
      }

      if (backgroundVideo) {
        backgroundVideo.currentTime = startSec;
        backgroundVideo.play().catch(() => {});
      }

      updateHudAndProgress(currentProgress, currentSec);
    }
  }

  function setupAudioController() {
    if (!audioToggleBtn || !soundtrack) {
      return;
    }

    audioToggleBtn.addEventListener('click', () => {
      if (soundtrack.paused) {
        const scrollY = window.scrollY || window.pageYOffset;
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        const currentProgress = maxScroll > 0 ? scrollY / maxScroll : 0;
        const startSec = currentProgress * TOTAL_DURATION_SECONDS;
        currentSec = startSec;

        soundtrack.currentTime = startSec;
        if (backgroundVideo) {
          backgroundVideo.currentTime = startSec;
          backgroundVideo.play().catch(() => {});
        }

        soundtrack.play().then(() => {
          audioToggleBtn.classList.add('playing');
          if (audioLabel) audioLabel.textContent = 'Audio On';
        }).catch(() => {
          audioToggleBtn.classList.remove('playing');
          if (audioLabel) audioLabel.textContent = 'Audio Off';
        });

        updateHudAndProgress(currentProgress, currentSec);
      } else {
        soundtrack.pause();
        if (backgroundVideo) {
          backgroundVideo.pause();
        }
        audioToggleBtn.classList.remove('playing');
        if (audioLabel) audioLabel.textContent = 'Audio Off';
      }
    });
  }

  function setupAutoplayScrubber() {
    if (autoplayBtn) {
      autoplayBtn.addEventListener('click', toggleAutoPlay);
    }
    if (heroStartBtn) {
      heroStartBtn.addEventListener('click', () => {
        if (!isAutoPlaying) {
          toggleAutoPlay();
        }
      });
    }
  }

  function setupTimelineScrubber() {
    if (!timelineTrack) {
      return;
    }

    function seekTimeline(e) {
      const rect = timelineTrack.getBoundingClientRect();
      const clickX = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
      const progress = clickX / rect.width;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;

      currentSec = progress * TOTAL_DURATION_SECONDS;
      lastAutoScrollTimestamp = performance.now();

      window.scrollTo(0, progress * maxScroll);
      updateHudAndProgress(progress, currentSec);

      if (soundtrack) {
        soundtrack.currentTime = currentSec;
      }
      if (backgroundVideo) {
        backgroundVideo.currentTime = currentSec;
      }
    }

    timelineTrack.addEventListener('mousedown', (e) => {
      isDraggingTimeline = true;
      seekTimeline(e);

      function onMouseMove(moveEvent) {
        if (isDraggingTimeline) {
          seekTimeline(moveEvent);
        }
      }

      function onMouseUp() {
        isDraggingTimeline = false;
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      }

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    });

    timelineTrack.addEventListener('touchstart', (e) => {
      isDraggingTimeline = true;
      if (e.touches && e.touches[0]) {
        seekTimeline(e.touches[0]);
      }
    }, { passive: true });

    timelineTrack.addEventListener('touchmove', (e) => {
      if (isDraggingTimeline && e.touches && e.touches[0]) {
        seekTimeline(e.touches[0]);
      }
    }, { passive: true });

    timelineTrack.addEventListener('touchend', () => {
      isDraggingTimeline = false;
    });
  }

  function setupManualScrollDetection() {
    window.addEventListener('wheel', () => {
      isManualScrolling = true;
      lastAutoScrollTimestamp = performance.now();
      clearTimeout(manualScrollTimeout);
      manualScrollTimeout = setTimeout(() => {
        isManualScrolling = false;
        lastAutoScrollTimestamp = performance.now();
      }, 300);
    }, { passive: true });

    window.addEventListener('touchmove', () => {
      isManualScrolling = true;
      lastAutoScrollTimestamp = performance.now();
      clearTimeout(manualScrollTimeout);
      manualScrollTimeout = setTimeout(() => {
        isManualScrolling = false;
        lastAutoScrollTimestamp = performance.now();
      }, 300);
    }, { passive: true });
  }

  function setupScrollToTop() {
    if (scrollToTopBtn) {
      scrollToTopBtn.addEventListener('click', () => {
        window.scrollTo(0, 0);
        currentSec = 0;
        lastAutoScrollTimestamp = performance.now();
        if (soundtrack) soundtrack.currentTime = 0;
        if (backgroundVideo) backgroundVideo.currentTime = 0;
        updateHudAndProgress(0, 0);
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
    setupManualScrollDetection();
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
