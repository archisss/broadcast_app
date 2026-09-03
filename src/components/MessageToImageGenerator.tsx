import React, { useState, useRef, useEffect } from 'react';
import { Type, Sparkles, Download, Check, Palette, Image as ImageIcon, ShieldCheck, Heart } from 'lucide-react';

interface MessageToImageGeneratorProps {
  onImageGenerated: (dataUrl: string, title?: string, message?: string) => void;
  defaultRoom?: string;
  defaultDoctor?: string;
}

type CardTheme = 'maternity' | 'medical' | 'celebration' | 'suite';

interface ThemeConfig {
  id: CardTheme;
  name: string;
  description: string;
  bgGradient: string[];
  textColor: string;
  accentColor: string;
  borderColor: string;
  fontDisplay: string;
}

const THEMES: Record<CardTheme, ThemeConfig> = {
  maternity: {
    id: 'maternity',
    name: 'Bienvenida Neonato',
    description: 'Tonos cálidos de bienvenida para recién nacidos y familiares',
    bgGradient: ['#0f172a', '#1e293b', '#0c4a6e'],
    textColor: '#f8fafc',
    accentColor: '#38bdf8',
    borderColor: 'rgba(56, 189, 248, 0.3)',
    fontDisplay: 'sans-serif',
  },
  celebration: {
    id: 'celebration',
    name: 'Felicitación Familiar',
    description: 'Elegante y festivo con destellos dorados para habitaciones y suites',
    bgGradient: ['#1c1917', '#292524', '#451a03'],
    textColor: '#fafaf9',
    accentColor: '#fbbf24',
    borderColor: 'rgba(251, 191, 36, 0.3)',
    fontDisplay: 'serif',
  },
  medical: {
    id: 'medical',
    name: 'Comunicado Médico Oficial',
    description: 'Institucional, sobrio y claro para avisos médicos hospitalarios',
    bgGradient: ['#0b1329', '#0f2744', '#1e3a8a'],
    textColor: '#ffffff',
    accentColor: '#60a5fa',
    borderColor: 'rgba(96, 165, 250, 0.3)',
    fontDisplay: 'sans-serif',
  },
  suite: {
    id: 'suite',
    name: 'Master Suite & Privado',
    description: 'Minimalista y premium para pantallas de habitaciones exclusivas',
    bgGradient: ['#09090b', '#18181b', '#27272a'],
    textColor: '#f4f4f5',
    accentColor: '#a1a1aa',
    borderColor: 'rgba(161, 161, 170, 0.2)',
    fontDisplay: 'sans-serif',
  },
};

export const MessageToImageGenerator: React.FC<MessageToImageGeneratorProps> = ({
  onImageGenerated,
  defaultRoom = '',
  defaultDoctor = '',
}) => {
  const [theme, setTheme] = useState<CardTheme>('maternity');
  const [title, setTitle] = useState('¡Bienvenido al Mundo!');
  const [subtitle, setSubtitle] = useState('Familia Martínez Ruiz');
  const [message, setMessage] = useState(
    'Con inmensa alegría y gratitud celebramos la llegada de este hermoso bebé. Les deseamos salud, amor y bendiciones en esta maravillosa nueva etapa de sus vidas.'
  );
  const [author, setAuthor] = useState(defaultDoctor || 'Servicio de Maternidad');
  const [room, setRoom] = useState(defaultRoom || 'Master Suite');
  const [dateTime, setDateTime] = useState(() => {
    const d = new Date();
    return d.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  });

  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Render high-res 1920x1080 canvas and convert to JPG
  const renderCardToCanvas = (): string => {
    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = 1920;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    const currentTheme = THEMES[theme];

    // 1. Background Gradient
    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    grad.addColorStop(0, currentTheme.bgGradient[0]);
    grad.addColorStop(0.5, currentTheme.bgGradient[1]);
    grad.addColorStop(1, currentTheme.bgGradient[2]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Subtle Glow Orbs in Corners
    const radial = ctx.createRadialGradient(960, 400, 100, 960, 400, 800);
    radial.addColorStop(0, currentTheme.accentColor + '18');
    radial.addColorStop(1, 'transparent');
    ctx.fillStyle = radial;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 3. Elegant Inner Border
    ctx.strokeStyle = currentTheme.borderColor;
    ctx.lineWidth = 3;
    ctx.strokeRect(80, 80, canvas.width - 160, canvas.height - 160);

    // Decorative corner notches
    const cornerSize = 40;
    ctx.strokeStyle = currentTheme.accentColor;
    ctx.lineWidth = 6;
    // Top-left
    ctx.beginPath();
    ctx.moveTo(80, 80 + cornerSize);
    ctx.lineTo(80, 80);
    ctx.lineTo(80 + cornerSize, 80);
    ctx.stroke();
    // Top-right
    ctx.beginPath();
    ctx.moveTo(canvas.width - 80 - cornerSize, 80);
    ctx.lineTo(canvas.width - 80, 80);
    ctx.lineTo(canvas.width - 80, 80 + cornerSize);
    ctx.stroke();
    // Bottom-left
    ctx.beginPath();
    ctx.moveTo(80, canvas.height - 80 - cornerSize);
    ctx.lineTo(80, canvas.height - 80);
    ctx.lineTo(80 + cornerSize, canvas.height - 80);
    ctx.stroke();
    // Bottom-right
    ctx.beginPath();
    ctx.moveTo(canvas.width - 80 - cornerSize, canvas.height - 80);
    ctx.lineTo(canvas.width - 80, canvas.height - 80);
    ctx.lineTo(canvas.width - 80, canvas.height - 80 - cornerSize);
    ctx.stroke();

    // 4. Header: Hospital San Lucas & Logo badge
    ctx.fillStyle = currentTheme.accentColor;
    ctx.font = 'bold 32px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('HOSPITAL SAN LUCAS • BROADCAST HOSPITALARIO', 960, 170);

    // Subtle line divider
    ctx.strokeStyle = currentTheme.accentColor + '40';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(700, 195);
    ctx.lineTo(1220, 195);
    ctx.stroke();

    // 5. Title
    ctx.fillStyle = '#ffffff';
    if (theme === 'celebration') {
      ctx.font = 'bold 72px Georgia, serif';
    } else {
      ctx.font = 'bold 68px "Plus Jakarta Sans", sans-serif';
    }
    ctx.fillText(title || 'Aviso Hospitalario', 960, 310);

    // 6. Subtitle / Room Pill
    if (subtitle || room) {
      const subText = [subtitle, room ? `[ ${room} ]` : ''].filter(Boolean).join('  •  ');
      ctx.fillStyle = currentTheme.accentColor;
      ctx.font = '600 36px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(subText, 960, 385);
    }

    // 7. Message Box (Multi-line word wrap)
    ctx.fillStyle = '#f1f5f9';
    ctx.font = '400 38px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';

    const maxLineWidth = 1300;
    const lineHeight = 62;
    const words = (message || '').split(' ');
    let line = '';
    let startY = 510;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > maxLineWidth && n > 0) {
        ctx.fillText(line.trim(), 960, startY);
        line = words[n] + ' ';
        startY += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line.trim(), 960, startY);

    // 8. Footer Section: Doctor / Department & Date
    ctx.strokeStyle = currentTheme.borderColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(300, 890);
    ctx.lineTo(1620, 890);
    ctx.stroke();

    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 28px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(author ? `Emitido por: ${author}` : 'Servicio Médico Hospitalario', 320, 950);

    ctx.textAlign = 'right';
    ctx.fillText(dateTime, 1600, 950);

    // Convert to JPG Data URL with 92% quality
    return canvas.toDataURL('image/jpeg', 0.92);
  };

  // Re-generate preview whenever inputs change
  useEffect(() => {
    const url = renderCardToCanvas();
    setPreviewUrl(url);
  }, [theme, title, subtitle, message, author, room, dateTime]);

  const handleApply = () => {
    setIsGenerating(true);
    const finalUrl = renderCardToCanvas();
    onImageGenerated(finalUrl, title, message);
    setIsGenerating(false);
  };

  const handleDownloadJpg = () => {
    const finalUrl = renderCardToCanvas();
    const link = document.createElement('a');
    link.download = `comunicado_${theme}_${Date.now()}.jpg`;
    link.href = finalUrl;
    link.click();
  };

  return (
    <div id="message-to-image-generator" className="space-y-6">
      {/* Hidden processing canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Header Info */}
      <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4 flex items-start gap-3 text-xs text-sky-900">
        <Sparkles className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-sm">Generador Gráfico de Mensajes a JPG (Gratuito y 100% Nativo)</p>
          <p className="text-sky-800 leading-relaxed">
            Escribe un mensaje de bienvenida, comunicado familiar o aviso para una habitación y el sistema lo convertirá instantáneamente en una imagen JPG de alta definición (1920x1080) lista para emitir a la pantalla deseada o incorporarse al bucle de rotación.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form & Controls */}
        <div className="lg:col-span-5 space-y-4">
          {/* Theme Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Estilo / Plantilla Visual
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(THEMES) as CardTheme[]).map((key) => {
                const item = THEMES[key];
                const isSelected = theme === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setTheme(key)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-sky-600 bg-sky-50 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-slate-900">{item.name}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-sky-600" />}
                    </div>
                    <p className="text-[10px] text-slate-500 line-clamp-2 leading-tight">
                      {item.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Título Principal
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej. ¡Bienvenido al Mundo!"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {/* Subtitle / Family */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Subtítulo / Familia
              </label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="Ej. Familia Martínez"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Habitación / Espacio
              </label>
              <input
                type="text"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                placeholder="Ej. Master Suite / Cuarto 22"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          {/* Message Area */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Mensaje o Comunicado
            </label>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Escribe el mensaje que se mostrará en la pantalla..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none leading-relaxed"
            />
          </div>

          {/* Doctor / Author & Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Doctor / Firma
              </label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Ej. Dra. Elena Ruiz"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Fecha
              </label>
              <input
                type="text"
                value={dateTime}
                onChange={(e) => setDateTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          {/* Quick presets */}
          <div className="pt-2">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
              Plantillas Rápidas:
            </span>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setTitle('¡Bienvenido al Mundo!');
                  setSubtitle('Hermoso Recién Nacido');
                  setMessage('Le damos la más cálida bienvenida a este pequeño angelito y enviamos nuestras más sentidas felicitaciones a sus queridos padres y familiares.');
                }}
                className="text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
              >
                👶 Nacimiento Estándar
              </button>
              <button
                type="button"
                onClick={() => {
                  setTitle('Felicidades Familia');
                  setSubtitle('Master Suite');
                  setMessage('Hospital San Lucas les agradece la confianza y les desea que estos primeros momentos juntos estén llenos de paz, amor y alegría.');
                }}
                className="text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
              >
                🎉 Suite Familiar
              </button>
              <button
                type="button"
                onClick={() => {
                  setTitle('Aviso de Habitación');
                  setSubtitle('Cuidados y Reposo');
                  setMessage('Horario de visitas especiales: 10:00 a 20:00 hrs. Agradecemos mantener silencio para favorecer el descanso de la madre y el recién nacido.');
                }}
                className="text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
              >
                📋 Aviso Clínico
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Live High-Def Preview */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-sky-600" />
                <span>Vista Previa de la Imagen Generada (16:9)</span>
              </span>
              <span className="text-[11px] font-mono text-slate-400">1920 × 1080 JPEG</span>
            </div>

            {/* Preview Frame */}
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-xl border border-slate-800 bg-black flex items-center justify-center">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Vista previa del mensaje"
                  className="w-full h-full object-contain select-none"
                />
              ) : (
                <div className="text-xs text-slate-500">Generando vista previa...</div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button
              id="btn-use-generated-card"
              type="button"
              onClick={handleApply}
              disabled={isGenerating || !previewUrl}
              className="w-full sm:flex-1 py-3 px-6 bg-sky-700 hover:bg-sky-600 active:scale-[0.99] text-white rounded-xl text-xs font-bold shadow-md shadow-sky-900/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>Usar esta imagen para publicar</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadJpg}
              disabled={!previewUrl}
              className="w-full sm:w-auto py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer"
              title="Guardar archivo JPG en tu computadora"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>Descargar JPG</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
