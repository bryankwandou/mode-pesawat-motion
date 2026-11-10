const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const baseDir = path.resolve(__dirname);
const publicDir = path.join(baseDir, 'public');
const framesDir = path.join(publicDir, 'frames');
const audioDir = path.join(publicDir, 'audio');

if (!fs.existsSync(framesDir)) fs.mkdirSync(framesDir, { recursive: true });
if (!fs.existsSync(audioDir)) fs.mkdirSync(audioDir, { recursive: true });

const videoPath = 'E:\\Download\\MODE PESAWAT - Dandy barakati Ft Dante nababan (Official Music Video).mp4';

console.log('Video path:', videoPath);

// Let's extract an audio clip (e.g. first 45 seconds or high quality audio) for background sound
const audioOutput = path.join(audioDir, 'mode_pesawat.mp3');
if (!fs.existsSync(audioOutput)) {
  console.log('Extracting audio clip...');
  execSync(`ffmpeg -ss 00:00:00 -t 60 -i "${videoPath}" -vn -c:a libmp3lame -b:a 192k "${audioOutput}" -y`, { stdio: 'inherit' });
}

// In the prompt, the instructor says:
// "Nah, di sini nanti si videonya itu bakal diubah ke bentuk format gambar ya. Pakai FFmpeg bisa. Extension-nya... formatnya itu jadi WebP."
// Let's choose a cinematic segment, e.g., 0 to 12s or 0 to 15s.
// At 12 fps for 12 seconds = ~144 frames.
// Or 15 fps for 10 seconds = 150 frames.
// 150 frames is ideal for instant web loading and super smooth scroll scrubbing!
// Resolution: 1280x720 or 960x540. WebP quality 80 gives stunning quality with tiny file size (~30-50KB each).

console.log('Extracting WebP frames...');
// Pattern: frame_%04d.webp
// Let's extract 150 frames from 00:00:00 to 00:00:15 at 10-12 fps
const framePattern = path.join(framesDir, 'frame_%04d.webp');
execSync(`ffmpeg -ss 00:00:02 -t 14 -i "${videoPath}" -vf "fps=12,scale=1280:720:force_original_aspect_ratio=decrease" -c:v libwebp -quality 80 -compression_level 6 "${framePattern}" -y`, { stdio: 'inherit' });

const files = fs.readdirSync(framesDir).filter(f => f.endsWith('.webp'));
console.log(`Successfully generated ${files.length} WebP frames in ${framesDir}`);

