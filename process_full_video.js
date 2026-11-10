const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const baseDir = __dirname;
const framesDir = path.join(baseDir, 'frames');
const audioDir = path.join(baseDir, 'audio');
const videoPath = 'E:\\Download\\MODE PESAWAT - Dandy barakati Ft Dante nababan (Official Music Video).mp4';

// 1. Get exact duration
const durationStr = execSync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${videoPath}"`, { encoding: 'utf8' }).trim();
const duration = parseFloat(durationStr);
console.log(`Video full duration: ${duration} seconds (${Math.floor(duration / 60)}m ${Math.round(duration % 60)}s)`);

// 2. Extract FULL audio (all 275 seconds)
const audioPath = path.join(audioDir, 'mode_pesawat.mp3');
console.log('Extracting full audio from start to finish...');
execSync(`ffmpeg -i "${videoPath}" -vn -c:a libmp3lame -b:a 128k "${audioPath}" -y`, { stdio: 'inherit' });
const audioSize = fs.statSync(audioPath).size;
console.log(`Full audio generated: ${(audioSize / (1024*1024)).toFixed(2)} MB`);

// 3. Clear old frames directory
console.log('Cleaning old frames...');
const existingFrames = fs.readdirSync(framesDir);
for (const f of existingFrames) {
  if (f.endsWith('.webp')) {
    fs.unlinkSync(path.join(framesDir, f));
  }
}

// 4. Extract frames across the ENTIRE video from second 0 to end (duration)
// We want ~360 frames (1 frame every ~0.76s).
// 360 frames gives a complete sequence spanning the entire music video without overloading browser memory.
// fps = 360 / duration = 360 / 275.74 = 1.305578 fps
const TARGET_FRAMES = 360;
const targetFps = (TARGET_FRAMES / duration).toFixed(6);
console.log(`Extracting ${TARGET_FRAMES} frames across the ENTIRE video at ${targetFps} fps...`);

// Resolution: 960x540 (16:9), WebP quality 70, compression level 6
const framePattern = path.join(framesDir, 'frame_%04d.webp');
execSync(`ffmpeg -i "${videoPath}" -vf "fps=${targetFps},scale=960:540:force_original_aspect_ratio=decrease" -c:v libwebp -quality 70 -compression_level 6 "${framePattern}" -y`, { stdio: 'inherit' });

const generated = fs.readdirSync(framesDir).filter(f => f.endsWith('.webp')).sort();
console.log(`Successfully generated ${generated.length} frames covering 100% of the video!`);

let totalBytes = 0;
for (const f of generated) {
  totalBytes += fs.statSync(path.join(framesDir, f)).size;
}
console.log(`Total frames size: ${(totalBytes / (1024*1024)).toFixed(2)} MB`);
console.log(`Average frame size: ${(totalBytes / generated.length / 1024).toFixed(1)} KB`);
