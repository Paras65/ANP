import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Download, Share2, Sparkles, Image as ImageIcon, Check } from 'lucide-react';
import type { Article } from '../types';

interface NewsCardGeneratorModalProps {
  article: Article;
  isDark: boolean;
  onClose: () => void;
}

export const NewsCardGeneratorModal: React.FC<NewsCardGeneratorModalProps> = ({
  article,
  isDark,
  onClose
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [format, setFormat] = useState<'square' | 'banner'>('square');
  const [isGenerating, setIsGenerating] = useState(true);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const renderCard = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsGenerating(true);

    const width = format === 'square' ? 1080 : 1200;
    const height = format === 'square' ? 1080 : 675;
    canvas.width = width;
    canvas.height = height;

    // Load Image
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = article.coverImage || '/logo.png';

    const drawContent = (imageElement: HTMLImageElement | null) => {
      // 1. Draw Background Image or Fallback Gradient
      if (imageElement && imageElement.naturalWidth > 0) {
        // Cover crop
        const imgRatio = imageElement.width / imageElement.height;
        const canvasRatio = width / height;
        let sx = 0, sy = 0, sWidth = imageElement.width, sHeight = imageElement.height;

        if (imgRatio > canvasRatio) {
          sWidth = imageElement.height * canvasRatio;
          sx = (imageElement.width - sWidth) / 2;
        } else {
          sHeight = imageElement.width / canvasRatio;
          sy = (imageElement.height - sHeight) / 2;
        }
        ctx.drawImage(imageElement, sx, sy, sWidth, sHeight, 0, 0, width, height);
      } else {
        // Fallback dark gradient
        const bgGrad = ctx.createLinearGradient(0, 0, width, height);
        bgGrad.addColorStop(0, '#0f172a');
        bgGrad.addColorStop(1, '#1e293b');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);
      }

      // 2. Dark Vignette / Gradient Overlay for readability
      const grad = ctx.createLinearGradient(0, height * 0.25, 0, height);
      grad.addColorStop(0, 'rgba(0, 0, 0, 0.1)');
      grad.addColorStop(0.5, 'rgba(10, 15, 30, 0.75)');
      grad.addColorStop(1, 'rgba(5, 7, 14, 0.98)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Top Header Gradient
      const topGrad = ctx.createLinearGradient(0, 0, 0, height * 0.25);
      topGrad.addColorStop(0, 'rgba(5, 7, 14, 0.85)');
      topGrad.addColorStop(1, 'rgba(5, 7, 14, 0)');
      ctx.fillStyle = topGrad;
      ctx.fillRect(0, 0, width, height * 0.25);

      // 3. Top Header Bar
      // Left: Ambition News Badge
      const pad = 40;
      ctx.fillStyle = '#dc2626'; // red-600
      roundRect(ctx, pad, pad, 260, 56, 16);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 28px sans-serif';
      ctx.textBaseline = 'middle';
      ctx.fillText('AMBITION NEWS', pad + 24, pad + 28);

      // Right: District Badge
      const distText = `📍 ${article.district || 'छत्तीसगढ़'}`;
      ctx.font = 'bold 24px sans-serif';
      const distWidth = ctx.measureText(distText).width + 36;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      roundRect(ctx, width - pad - distWidth, pad, distWidth, 54, 16);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.fillText(distText, width - pad - distWidth + 18, pad + 27);

      // 4. Center / Bottom Content Area
      const contentBottom = height - 100;

      // Breaking ribbon
      const ribbonY = format === 'square' ? contentBottom - 260 : contentBottom - 200;
      ctx.fillStyle = '#e11d48'; // rose-600
      roundRect(ctx, pad, ribbonY, 210, 42, 12);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText('⚡ ब्रेकिंग न्यूज़', pad + 24, ribbonY + 21);

      // 5. Headline Text (Auto-wrapped Devanagari)
      ctx.fillStyle = '#ffffff';
      ctx.font = format === 'square' ? 'bold 44px sans-serif' : 'bold 36px sans-serif';
      ctx.textBaseline = 'top';

      const maxTextWidth = width - (pad * 2);
      const headline = article.title;
      const lineHeight = format === 'square' ? 58 : 48;
      const textStartY = ribbonY + 54;

      wrapText(ctx, headline, pad, textStartY, maxTextWidth, lineHeight, 3);

      // 6. Byline & Footer Bar
      const footerY = height - 60;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(pad, footerY - 14);
      ctx.lineTo(width - pad, footerY - 14);
      ctx.stroke();

      // Reporter Name
      ctx.fillStyle = '#fbbf24'; // amber-400
      ctx.font = 'bold 20px sans-serif';
      ctx.textBaseline = 'middle';
      const reporterText = `✍️ रिपोर्ट: ${article.author || 'ब्यूरो डेस्क'}`;
      ctx.fillText(reporterText, pad, footerY + 10);

      // Website / Portal tag
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 20px sans-serif';
      const siteTag = 'www.ambitionnews.in • सबसे पहले सबसे सटीक';
      const siteTagWidth = ctx.measureText(siteTag).width;
      ctx.fillText(siteTag, width - pad - siteTagWidth, footerY + 10);

      setIsGenerating(false);
    };

    img.onload = () => drawContent(img);
    img.onerror = () => drawContent(null);
  }, [article, format]);

  useEffect(() => {
    renderCard();
  }, [renderCard]);

  // Helper: Rounded Rectangle
  function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // Helper: Text Wrapping
  function wrapText(
    ctx: CanvasRenderingContext2D, 
    text: string, 
    x: number, 
    y: number, 
    maxWidth: number, 
    lineHeight: number, 
    maxLines: number
  ) {
    const words = text.split(' ');
    let line = '';
    let currentY = y;
    let lineCount = 0;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;

      if (testWidth > maxWidth && n > 0) {
        lineCount++;
        if (lineCount >= maxLines) {
          ctx.fillText(line.trim() + '...', x, currentY);
          return;
        }
        ctx.fillText(line, x, currentY);
        line = words[n] + ' ';
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, currentY);
  }

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `ambition-news-${article.district || 'card'}-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  const handleShare = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], 'ambition-news-card.png', { type: 'image/png' });
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: article.title,
            text: `🔴 Ambition News: ${article.title}`
          });
        } else {
          handleDownload();
        }
      });
    } catch {
      handleDownload();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div 
        className={`w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[95vh] ${
          isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold">
              <ImageIcon size={18} />
            </div>
            <div>
              <h3 className="text-sm font-black tracking-wide leading-tight">
                🖼️ सोशल मीडिया फोटो कार्ड जनरेटर
              </h3>
              <p className="text-[10px] text-red-100">व्हाट्सएप स्टेटस, इंस्टाग्राम व फेसबुक के लिए रेडी कार्ड</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center text-xs font-bold transition"
          >
            ✕
          </button>
        </div>

        {/* Format Selector */}
        <div className="px-4 pt-3 flex items-center justify-between border-b border-white/10 pb-2">
          <span className="text-xs font-bold text-slate-400">फॉर्मेट चुनें:</span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setFormat('square')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                format === 'square'
                  ? 'bg-red-600 text-white shadow'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              1:1 चौकोर (Status/Insta)
            </button>
            <button
              onClick={() => setFormat('banner')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                format === 'banner'
                  ? 'bg-red-600 text-white shadow'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              16:9 बैनर (FB/X)
            </button>
          </div>
        </div>

        {/* Canvas Display Area */}
        <div className="p-4 overflow-y-auto flex-1 flex flex-col items-center justify-center bg-black/40">
          <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/20 max-h-[380px] max-w-full flex items-center justify-center">
            <canvas 
              ref={canvasRef} 
              className="max-h-[360px] w-auto object-contain rounded-xl"
            />
            {isGenerating && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-xs font-bold">
                <Sparkles size={18} className="animate-spin text-amber-400 mr-2" />
                कार्ड तैयार हो रहा है...
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className={`p-4 border-t flex items-center gap-2.5 ${
          isDark ? 'border-slate-800 bg-slate-900/80' : 'border-slate-200 bg-slate-50'
        }`}>
          <button
            onClick={handleDownload}
            className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition shadow active:scale-95 ${
              downloadSuccess
                ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                : 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/30'
            }`}
          >
            {downloadSuccess ? <Check size={14} /> : <Download size={14} />}
            <span>{downloadSuccess ? 'डाउनलोड पूरा हुआ! ✓' : '📥 HD फोटो कार्ड डाउनलोड करें'}</span>
          </button>

          <button
            onClick={handleShare}
            className="p-2.5 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition active:scale-95 flex items-center justify-center"
            title="सीधे शेयर करें"
          >
            <Share2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

