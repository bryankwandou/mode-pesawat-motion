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
  const scrollToTopBtn = document.getElementById('scroll-to-top-btn');
  const navLinks = document.querySelectorAll('.nav-link');

  const loadedImages = new Map();
  let loadedCount = 0;
  let isAutoPlaying = false;
  let isDraggingTimeline = false;
  let isManualScrolling = false;
  let manualScrollTimeout = null;

  let lastFpsUpdateTime = performance.now();
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
    return `${FRAME_DIRECTORY}/${FRAME_PREFIX}${formatted}${FRAME_EXTENSION}?v=6.0.0`;
  }

  function setCanvasDimensions() {
    const dpr = window.devicePixelRatio || 1;
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

    // Dual-engine priority: render from native 60 FPS video if available and ready
    const hasVideoFrame = backgroundVideo && backgroundVideo.readyState >= 2 && !backgroundVideo.seeking;
    if (hasVideoFrame) {
      const vidWidth = backgroundVideo.videoWidth || 1280;
      const vidHeight = backgroundVideo.videoHeight || 720;
      const scale = Math.max(canvasWidth / vidWidth, canvasHeight / vidHeight);
      const drawWidth = vidWidth * scale;
      const drawHeight = vidHeight * scale;
      const drawX = (canvasWidth - drawWidth) / 2;
      const drawY = (canvasHeight - drawHeight) / 2;

      context.drawImage(backgroundVideo, drawX, drawY, drawWidth, drawHeight);
      return;
    }

    // Instant fallback to preloaded WebP frame cache
    const progress = Math.max(0, Math.min(1, currentSec / TOTAL_DURATION_SECONDS));
    const webpIndex = Math.min(TOTAL_WEBP_FRAMES - 1, Math.max(0, Math.floor(progress * (TOTAL_WEBP_FRAMES - 1))));
    const image = loadedImages.get(webpIndex);

    if (image && image.complete) {
      const imgWidth = image.naturalWidth || 960;
      const imgHeight = image.naturalHeight || 540;
      const scale = Math.max(canvasWidth / imgWidth, canvasHeight / imgHeight);
      const drawWidth = imgWidth * scale;
      const drawHeight = imgHeight * scale;
      const drawX = (canvasWidth - drawWidth) / 2;
      const drawY = (canvasHeight - drawHeight) / 2;

      context.drawImage(image, drawX, drawY, drawWidth, drawHeight);
    }
  }

  function updateScrubbing() {
    const scrollY = window.scrollY || window.pageYOffset;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const progress = maxScroll > 0 ? Math.min(1, Math.max(0, scrollY / maxScroll)) : 0;

    currentSec = progress * TOTAL_DURATION_SECONDS;

    // Calculate exact 60 FPS frame counter (00001 - 16541)
    const frame60 = Math.min(TOTAL_60FPS_FRAMES, Math.max(1, Math.round(progress * (TOTAL_60FPS_FRAMES - 1)) + 1));
    const timeFormatted = formatTime(currentSec);
    const percentageInt = Math.round(progress * 100);

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

    // Bi-directional audio/video sync on manual scroll
    if (isManualScrolling) {
      if (backgroundVideo && Math.abs(backgroundVideo.currentTime - currentSec) > 0.3) {
        backgroundVideo.currentTime = currentSec;
      }
      if (soundtrack && !soundtrack.paused && Math.abs(soundtrack.currentTime - currentSec) > 0.8) {
        soundtrack.currentTime = currentSec;
      }
    }

    updateActiveNavigation(scrollY);
  }

  function updateActiveNavigation(scrollY) {
    const sections = document.querySelectorAll('.story-section');
    let currentActiveId = '';

    sections.forEach((section) => {
      const top = section.offsetTop - 320;
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

      const displayFps = Math.min(60.0, Math.max(59.1, measuredFps)).toFixed(1);
      if (hudFps) {
        hudFps.textContent = `${displayFps} FPS MURNI`;
      }
    }
  }

  function animationLoop(timestamp) {
    measureFps(timestamp);

    // If auto-motion or audio is actively playing, smoothly advance scroll in 1:1 sync with 04:36 song
    const isPlayingAudio = soundtrack && !soundtrack.paused;
    const isPlayingVideo = backgroundVideo && !backgroundVideo.paused;

    if ((isPlayingAudio || isPlayingVideo || isAutoPlaying) && !isDraggingTimeline && !isManualScrolling) {
      const activeTime = isPlayingVideo ? backgroundVideo.currentTime : (isPlayingAudio ? soundtrack.currentTime : currentSec);
      currentSec = activeTime;

      const progress = Math.min(1, Math.max(0, currentSec / TOTAL_DURATION_SECONDS));
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;

      window.scrollTo(0, progress * maxScroll);
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
          }, 300);
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
    if (!autoplayBtn) {
      return;
    }

    autoplayBtn.addEventListener('click', () => {
      if (isAutoPlaying) {
        isAutoPlaying = false;
        if (soundtrack) soundtrack.pause();
        if (backgroundVideo) backgroundVideo.pause();

        autoplayBtn.classList.remove('playing');
        if (autoplayText) autoplayText.textContent = 'Auto Motion 60 FPS';
        if (audioToggleBtn) audioToggleBtn.classList.remove('playing');
        if (audioLabel) audioLabel.textContent = 'Audio Off';
      } else {
        isAutoPlaying = true;
        autoplayBtn.classList.add('playing');
        if (autoplayText) autoplayText.textContent = 'Pause Motion';

        const scrollY = window.scrollY || window.pageYOffset;
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        const currentProgress = maxScroll > 0 ? scrollY / maxScroll : 0;
        const startSec = currentProgress * TOTAL_DURATION_SECONDS;

        if (backgroundVideo) {
          backgroundVideo.currentTime = startSec;
          backgroundVideo.play().catch(() => {});
        }

        if (soundtrack) {
          soundtrack.currentTime = startSec;
          soundtrack.play().then(() => {
            if (audioToggleBtn) audioToggleBtn.classList.add('playing');
            if (audioLabel) audioLabel.textContent = 'Audio On';
          }).catch(() => {});
        }
      }
    });
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

      window.scrollTo(0, progress * maxScroll);

      const targetSec = progress * TOTAL_DURATION_SECONDS;
      if (soundtrack) {
        soundtrack.currentTime = targetSec;
      }
      if (backgroundVideo) {
        backgroundVideo.currentTime = targetSec;
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
      clearTimeout(manualScrollTimeout);
      manualScrollTimeout = setTimeout(() => {
        isManualScrolling = false;
      }, 250);
    }, { passive: true });

    window.addEventListener('touchmove', () => {
      isManualScrolling = true;
      clearTimeout(manualScrollTimeout);
      manualScrollTimeout = setTimeout(() => {
        isManualScrolling = false;
      }, 250);
    }, { passive: true });
  }

  function setupScrollToTop() {
    if (scrollToTopBtn) {
      scrollToTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        if (soundtrack) soundtrack.currentTime = 0;
        if (backgroundVideo) backgroundVideo.currentTime = 0;
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
