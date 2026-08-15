import { VideoScene, ExtractedProductInfo } from '../types';

export interface RealVideoRenderInput {
  productTitle: string;
  productTitleEn?: string;
  brand?: string;
  price: number;
  discountPrice?: number;
  currency?: string;
  heroImage: string;
  beforeImage?: string;
  afterImage?: string;
  scenes: VideoScene[];
  affiliateUrl: string;
  aspectRatio?: '9:16' | '16:9' | '1:1';
  onProgress?: (percent: number, status: string) => void;
}

export interface RealVideoRenderResult {
  videoBlob: Blob;
  videoUrl: string;
  thumbnailUrl: string;
  durationSeconds: number;
  mimeType: string;
  fileName: string;
}

/**
 * Loads an image with CORS handling and fallback to a styled placeholder if blocked.
 */
async function loadImageSafe(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.referrerPolicy = 'no-referrer';
    
    img.onload = () => resolve(img);
    img.onerror = () => {
      // Fallback SVG data URL if remote image fails CORS
      const fallbackSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
        <defs>
          <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#1e1b4b" />
            <stop offset="100%" stop-color="#0f172a" />
          </linearGradient>
        </defs>
        <rect width="800" height="800" fill="url(#g)" />
        <circle cx="400" cy="350" r="140" fill="#4f46e5" opacity="0.4" />
        <text x="400" y="370" font-size="80" text-anchor="middle" fill="#ffffff" font-family="sans-serif">🛍️</text>
        <text x="400" y="520" font-size="28" text-anchor="middle" fill="#fbbf24" font-weight="bold" font-family="sans-serif">YOUSRA SMILE</text>
        <text x="400" y="560" font-size="20" text-anchor="middle" fill="#94a3b8" font-family="sans-serif">منتج معتمد عالي الجودة</text>
      </svg>`;
      const fallbackImg = new Image();
      fallbackImg.onload = () => resolve(fallbackImg);
      fallbackImg.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(fallbackSvg)}`;
    };
    img.src = src;
  });
}

/**
 * Creates synthetic dynamic audio rhythm beat for background music
 */
function createSyntheticAudioTrack(audioCtx: AudioContext, destination: MediaStreamAudioDestinationNode, durationSec: number) {
  try {
    const tempo = 124;
    const beatLen = 60 / tempo;
    const totalBeats = Math.ceil(durationSec / beatLen);

    for (let i = 0; i < totalBeats; i++) {
      const beatTime = audioCtx.currentTime + (i * beatLen);
      
      // Kick drum every beat
      const kickOsc = audioCtx.createOscillator();
      const kickGain = audioCtx.createGain();
      kickOsc.type = 'sine';
      kickOsc.frequency.setValueAtTime(140, beatTime);
      kickOsc.frequency.exponentialRampToValueAtTime(35, beatTime + 0.08);
      kickGain.gain.setValueAtTime(0.3, beatTime);
      kickGain.gain.exponentialRampToValueAtTime(0.001, beatTime + 0.12);
      kickOsc.connect(kickGain);
      kickGain.connect(destination);
      kickOsc.start(beatTime);
      kickOsc.stop(beatTime + 0.15);

      // Hi-Hat on offbeats
      if (i % 2 === 1) {
        const hatOsc = audioCtx.createOscillator();
        const hatGain = audioCtx.createGain();
        hatOsc.type = 'triangle';
        hatOsc.frequency.setValueAtTime(8000, beatTime + (beatLen / 2));
        hatGain.gain.setValueAtTime(0.08, beatTime + (beatLen / 2));
        hatGain.gain.exponentialRampToValueAtTime(0.001, beatTime + (beatLen / 2) + 0.04);
        hatOsc.connect(hatGain);
        hatGain.connect(destination);
        hatOsc.start(beatTime + (beatLen / 2));
        hatOsc.stop(beatTime + (beatLen / 2) + 0.05);
      }

      // Synth Bass Chord Progression
      const bassNotes = [110, 130.81, 146.83, 164.81]; // A, C, D, E
      const currentNote = bassNotes[Math.floor(i / 4) % bassNotes.length];
      const bassOsc = audioCtx.createOscillator();
      const bassGain = audioCtx.createGain();
      bassOsc.type = 'sawtooth';
      bassOsc.frequency.setValueAtTime(currentNote, beatTime);
      bassGain.gain.setValueAtTime(0.05, beatTime);
      bassGain.gain.exponentialRampToValueAtTime(0.001, beatTime + beatLen * 0.8);
      bassOsc.connect(bassGain);
      bassGain.connect(destination);
      bassOsc.start(beatTime);
      bassOsc.stop(beatTime + beatLen);
    }
  } catch (err) {
    console.warn('Synthetic audio track synthesis note:', err);
  }
}

/**
 * Real Video Generation Engine:
 * Synthesizes a real MP4/WebM video with animations, high-res images, dynamic text captions,
 * price ribbons, visualizer waveforms, and audio track.
 */
export async function renderRealVideoAsset(input: RealVideoRenderInput): Promise<RealVideoRenderResult> {
  const {
    productTitle,
    productTitleEn,
    brand = 'يسرى سمايل',
    price,
    discountPrice = Math.round(price * 0.75),
    currency = '$',
    heroImage,
    beforeImage,
    afterImage,
    scenes = [],
    affiliateUrl,
    aspectRatio = '9:16',
    onProgress
  } = input;

  onProgress?.(10, 'جاري تحضير موارد الصور والخلفيات بجودة عالية...');

  // Setup Dimensions
  let width = 720;
  let height = 1280; // 9:16
  if (aspectRatio === '16:9') {
    width = 1280;
    height = 720;
  } else if (aspectRatio === '1:1') {
    width = 800;
    height = 800;
  }

  // Create Canvas
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D rendering is not supported on this browser.');
  }

  // Preload Images
  const [heroImgEl, beforeImgEl, afterImgEl] = await Promise.all([
    loadImageSafe(heroImage),
    loadImageSafe(beforeImage || heroImage),
    loadImageSafe(afterImage || heroImage)
  ]);

  onProgress?.(25, 'تجهيز مسار الصوت والمؤثرات الإيقاعية...');

  // Audio Context & Destination
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  let audioCtx: AudioContext | null = null;
  let audioDestination: MediaStreamAudioDestinationNode | null = null;

  try {
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
      audioDestination = audioCtx.createMediaStreamDestination();
    }
  } catch {
    console.warn('AudioContext not available for background synth.');
  }

  // Duration calculations
  const sceneCount = Math.max(scenes.length, 3);
  const secondsPerScene = 3.5; // ~3.5s per scene for snappy preview
  const totalDurationSeconds = Math.round(sceneCount * secondsPerScene);

  if (audioCtx && audioDestination) {
    createSyntheticAudioTrack(audioCtx, audioDestination, totalDurationSeconds);
  }

  // Prepare MediaStream & MediaRecorder
  const canvasStream = canvas.captureStream(30); // 30 FPS
  const combinedStream = new MediaStream();

  canvasStream.getVideoTracks().forEach(track => combinedStream.addTrack(track));
  if (audioDestination && audioDestination.stream.getAudioTracks().length > 0) {
    audioDestination.stream.getAudioTracks().forEach(track => combinedStream.addTrack(track));
  }

  // Supported Mime Types
  let mimeType = 'video/webm;codecs=vp9,opus';
  if (!MediaRecorder.isTypeSupported(mimeType)) {
    mimeType = 'video/webm;codecs=vp8,opus';
  }
  if (!MediaRecorder.isTypeSupported(mimeType)) {
    mimeType = 'video/webm';
  }
  if (!MediaRecorder.isTypeSupported(mimeType)) {
    mimeType = 'video/mp4';
  }

  const recordedChunks: Blob[] = [];
  const recorder = new MediaRecorder(combinedStream, {
    mimeType: MediaRecorder.isTypeSupported(mimeType) ? mimeType : undefined,
    videoBitsPerSecond: 2500000 // 2.5 Mbps crisp video
  });

  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) {
      recordedChunks.push(e.data);
    }
  };

  recorder.start(100);

  // Animation Loop Variables
  const totalFrames = totalDurationSeconds * 30;
  let currentFrame = 0;

  // Render Frame Function
  const renderFrame = (frame: number) => {
    const time = frame / 30;
    const currentSceneIdx = Math.min(Math.floor(time / secondsPerScene), sceneCount - 1);
    const sceneTime = time % secondsPerScene;
    const sceneProgress = sceneTime / secondsPerScene;
    const currentScene = scenes[currentSceneIdx] || scenes[0];

    // Clear Canvas
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, width, height);

    // 1. Draw Animated Background Image
    let activeImg = heroImgEl;
    if ((currentScene?.sceneType as string) === 'before_problem') {
      activeImg = beforeImgEl;
    } else if ((currentScene?.sceneType as string) === 'after' || currentScene?.sceneType === 'before_after') {
      activeImg = afterImgEl;
    }

    ctx.save();
    // Ken Burns Zoom effect
    const scale = 1.05 + Math.sin(time * 0.8) * 0.05;
    const panX = Math.sin(time * 0.5) * 15;
    const panY = Math.cos(time * 0.4) * 15;

    ctx.translate(width / 2 + panX, height / 2 + panY);
    ctx.scale(scale, scale);

    if (currentScene?.sceneType === 'before_after') {
      // Split view Before / After
      ctx.drawImage(beforeImgEl, -width / 2, -height / 2, width / 2, height);
      ctx.drawImage(afterImgEl, 0, -height / 2, width / 2, height);
    } else {
      ctx.drawImage(activeImg, -width / 2, -height / 2, width, height);
    }
    ctx.restore();

    // 2. Gradients and Dark Vignette Overlays
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, 'rgba(0,0,0,0.7)');
    grad.addColorStop(0.3, 'rgba(0,0,0,0.2)');
    grad.addColorStop(0.65, 'rgba(0,0,0,0.5)');
    grad.addColorStop(1, 'rgba(0,0,0,0.95)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // 3. Top Branding Header Bar
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.beginPath();
    ctx.roundRect(24, 24, width - 48, 54, 16);
    ctx.fill();
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Live Indicator Dot
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(48, 51, 6, 0, Math.PI * 2);
    ctx.fill();

    // Brand Name
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px Tajawal, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`${brand} • يسرى سمايل`, 64, 57);

    // Scene & Time Counter
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 15px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`مشهد ${currentSceneIdx + 1}/${sceneCount} • ${time.toFixed(1)}s`, width - 40, 56);
    ctx.restore();

    // 4. Split-Screen Line if Before/After Scene
    if (currentScene?.sceneType === 'before_after') {
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(width / 2, 80);
      ctx.lineTo(width / 2, height - 280);
      ctx.stroke();

      // Before Pill
      ctx.fillStyle = 'rgba(220, 38, 38, 0.9)';
      ctx.beginPath();
      ctx.roundRect(30, 90, 90, 32, 8);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px Tajawal, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('قبل ❌', 75, 112);

      // After Pill
      ctx.fillStyle = 'rgba(16, 185, 129, 0.9)';
      ctx.beginPath();
      ctx.roundRect(width - 120, 90, 90, 32, 8);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillText('بعد ✅', width - 75, 112);
    }

    // 5. Animated Visualizer Sound Waves
    ctx.save();
    const waveCount = 20;
    const waveWidth = (width - 120) / waveCount;
    for (let i = 0; i < waveCount; i++) {
      const h = 10 + Math.sin(time * 8 + i * 0.4) * 16 + Math.cos(time * 5 + i) * 8;
      ctx.fillStyle = `rgba(245, 158, 11, ${0.4 + (h / 34) * 0.5})`;
      ctx.beginPath();
      ctx.roundRect(60 + i * waveWidth, height - 320 - h / 2, waveWidth - 4, h, 3);
      ctx.fill();
    }
    ctx.restore();

    // 6. Scene Screen Highlight Pill
    ctx.save();
    const highlightText = currentScene?.screenText || 'عرض حصري ومميز 🔥';
    ctx.font = 'bold 17px Tajawal, sans-serif';
    const textMeasure = ctx.measureText(highlightText);
    const badgeW = Math.max(textMeasure.width + 36, 180);
    const badgeX = (width - badgeW) / 2;

    const bounce = Math.sin(sceneTime * 4) * 4;
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.roundRect(badgeX, height - 310 + bounce, badgeW, 40, 14);
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.textAlign = 'center';
    ctx.fillText(highlightText, width / 2, height - 284 + bounce);
    ctx.restore();

    // 7. Dynamic Voiceover Subtitle Box
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    ctx.beginPath();
    ctx.roundRect(24, height - 260, width - 48, 90, 20);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 18px Cairo, Tajawal, sans-serif';
    ctx.textAlign = 'center';
    ctx.direction = 'rtl';

    const voiceText = currentScene?.voiceoverText || productTitle;
    // Word wrapping for subtitle box
    const words = voiceText.split(' ');
    let line1 = '';
    let line2 = '';
    for (let w = 0; w < words.length; w++) {
      if (w < Math.ceil(words.length / 2)) {
        line1 += (line1 ? ' ' : '') + words[w];
      } else {
        line2 += (line2 ? ' ' : '') + words[w];
      }
    }

    ctx.fillText(`"${line1}"`, width / 2, height - 224);
    if (line2) {
      ctx.fillText(`"${line2}"`, width / 2, height - 192);
    }
    ctx.restore();

    // 8. Price Card & Direct CTA Banner
    ctx.save();
    // Price Ribbon
    ctx.fillStyle = 'rgba(16, 185, 129, 0.95)';
    ctx.beginPath();
    ctx.roundRect(24, height - 158, (width - 60) * 0.42, 54, 16);
    ctx.fill();
    ctx.fillStyle = '#042f2e';
    ctx.font = '900 20px Tajawal, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${currency}${discountPrice} USD`, 24 + ((width - 60) * 0.42) / 2, height - 124);

    // Call to Action Button
    ctx.fillStyle = 'rgba(99, 102, 241, 0.95)';
    ctx.beginPath();
    ctx.roundRect(24 + (width - 60) * 0.42 + 12, height - 158, (width - 60) * 0.58, 54, 16);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px Tajawal, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('اطلب بالخصم من الرابط 🛒', 24 + (width - 60) * 0.42 + 12 + ((width - 60) * 0.58) / 2, height - 124);
    ctx.restore();

    // 9. Bottom Progress Bar
    const progressRatio = time / totalDurationSeconds;
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fillRect(0, height - 8, width, 8);

    ctx.fillStyle = '#ef4444';
    ctx.fillRect(0, height - 8, width * Math.min(progressRatio, 1), 8);
  };

  // Promise that resolves when the recording finishes
  return new Promise<RealVideoRenderResult>((resolve, reject) => {
    recorder.onstop = () => {
      onProgress?.(100, 'تم إنشاء وتوليد ملف الفيديو الحقيقي بنجاح!');
      const blob = new Blob(recordedChunks, { type: mimeType });
      const videoUrl = URL.createObjectURL(blob);
      const fileName = `yousra-video-${Date.now()}.${mimeType.includes('mp4') ? 'mp4' : 'webm'}`;

      resolve({
        videoBlob: blob,
        videoUrl,
        thumbnailUrl: heroImage,
        durationSeconds: totalDurationSeconds,
        mimeType,
        fileName
      });
    };

    recorder.onerror = (err) => {
      reject(err);
    };

    // Run animation frames at 30 FPS
    const frameInterval = 1000 / 30;
    const renderNext = () => {
      if (currentFrame >= totalFrames) {
        recorder.stop();
        if (audioCtx) {
          audioCtx.close().catch(() => {});
        }
        return;
      }

      renderFrame(currentFrame);
      currentFrame++;

      if (currentFrame % 15 === 0) {
        const pct = Math.round(30 + (currentFrame / totalFrames) * 65);
        onProgress?.(pct, `جاري معالجة وتوليد إطارات الفيديو الحقيقي (${currentFrame}/${totalFrames})...`);
      }

      setTimeout(renderNext, frameInterval);
    };

    renderNext();
  });
}
