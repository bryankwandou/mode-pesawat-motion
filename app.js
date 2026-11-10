(() => {
  const TOTAL_FRAMES = 168;
  const FRAME_DIRECTORY = 'frames';
  const FRAME_PREFIX = 'frame_';
  const FRAME_EXTENSION = '.webp';

  const canvas = document.getElementById('motion-canvas');
  const context = canvas.getContext('2d');
  const loader = document.getElementById('loader');
  const loaderProgressBar = document.getElementById('loader-progress-bar');
  const loaderPercentage = document.getElementById('loader-percentage');
  const scrollProgressIndicator = document.getElementById('scroll-progress-indicator');
  const hudFrameCount = document.getElementById('hud-frame-count');
  const hudScrollPct = document.getElementById('hud-scroll-pct');
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
  let autoPlayTimerId = null;

  function padNumber(num, size) {
    let s = String(num);
    while (s.length < size) {
      s = '0' + s;
    }
    return s;
  }

  function getFrameSource(index) {
    const formatted = padNumber(index + 1, 4);
    return `${FRAME_DIRECTORY}/${FRAME_PREFIX}${formatted}${FRAME_EXTENSION}`;
  }

  function setCanvasDimensions() {
    const dpr = window.devicePixelRatio || 1;
    const displayWidth = window.innerWidth;
    const displayHeight = window.innerHeight;

    canvas.width = Math.floor(displayWidth * dpr);
    canvas.height = Math.floor(displayHeight * dpr);

    context.scale(dpr, dpr);
    renderFrame(Math.round(currentFrameIndex));
  }

  function renderFrame(index) {
    const safeIndex = Math.max(0, Math.min(TOTAL_FRAMES - 1, Math.floor(index)));
    const image = loadedImages.get(safeIndex);

    if (!image || !image.complete) {
      return;
    }

    const canvasWidth = window.innerWidth;
    const canvasHeight = window.innerHeight;

    context.clearRect(0, 0, canvasWidth, canvasHeight);

    const imageWidth = image.naturalWidth || 1280;
    const imageHeight = image.naturalHeight || 720;

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
    scrollProgressIndicator.style.width = `${percentageInt}%`;
    hudScrollPct.textContent = `${percentageInt}%`;

    updateActiveNavigation(scrollY);
  }

  function updateActiveNavigation(scrollY) {
    const sections = document.querySelectorAll('.story-section');
    let currentActiveId = '';

    sections.forEach((section) => {
      const top = section.offsetTop - 200;
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

  function animationLoop() {
    const difference = targetFrameIndex - currentFrameIndex;
    if (Math.abs(difference) > 0.01) {
      currentFrameIndex += difference * 0.16;
      renderFrame(Math.round(currentFrameIndex));

      const displayIndex = Math.min(TOTAL_FRAMES, Math.max(1, Math.round(currentFrameIndex) + 1));
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
        loaderProgressBar.style.width = `${pct}%`;
        loaderPercentage.textContent = `${pct}%`;

        if (loadedCount === 1) {
          renderFrame(0);
        }

        if (loadedCount >= TOTAL_FRAMES) {
          setTimeout(() => {
            loader.classList.add('hidden');
          }, 300);
        }
      };

      img.onerror = () => {
        loadedCount += 1;
        if (loadedCount >= TOTAL_FRAMES) {
          loader.classList.add('hidden');
        }
      };
    }
  }

  function setupAudioController() {
    let isPlaying = false;

    audioToggleBtn.addEventListener('click', () => {
      if (!isPlaying) {
        soundtrack.play().then(() => {
          isPlaying = true;
          audioToggleBtn.classList.add('playing');
          audioLabel.textContent = 'Audio On';
        }).catch(() => {
          isPlaying = false;
          audioToggleBtn.classList.remove('playing');
          audioLabel.textContent = 'Audio Off';
        });
      } else {
        soundtrack.pause();
        isPlaying = false;
        audioToggleBtn.classList.remove('playing');
        audioLabel.textContent = 'Audio Off';
      }
    });
  }

  function setupAutoplayScrubber() {
    autoplayBtn.addEventListener('click', () => {
      if (isAutoPlaying) {
        clearInterval(autoPlayTimerId);
        isAutoPlaying = false;
        autoplayBtn.classList.remove('playing');
        autoplayText.textContent = 'Auto Motion';
      } else {
        isAutoPlaying = true;
        autoplayBtn.classList.add('playing');
        autoplayText.textContent = 'Pause Motion';

        autoPlayTimerId = setInterval(() => {
          const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
          const currentScroll = window.scrollY || window.pageYOffset;
          const step = 6;

          if (currentScroll >= maxScroll - 5) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          } else {
            window.scrollBy({ top: step, behavior: 'auto' });
          }
        }, 16);
      }
    });

    window.addEventListener('wheel', () => {
      if (isAutoPlaying) {
        clearInterval(autoPlayTimerId);
        isAutoPlaying = false;
        autoplayBtn.classList.remove('playing');
        autoplayText.textContent = 'Auto Motion';
      }
    }, { passive: true });
  }

  function setupScrollToTop() {
    if (scrollToTopBtn) {
      scrollToTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
  }

  function init() {
    setCanvasDimensions();
    preloadFrames();
    setupAudioController();
    setupAutoplayScrubber();
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

