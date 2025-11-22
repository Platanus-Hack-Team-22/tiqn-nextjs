"use client";

type TranscriptionChunk = {
  offset: number; // Tiempo en segundos desde inicio
  speaker: "caller" | "dispatcher" | "system";
  text: string; // Texto del chunk
};

type TranscriptionFeedProps = {
  chunks?: TranscriptionChunk[];
  fullText?: string; // Texto completo de la transcripción (opcional, para mostrar si está disponible)
};

export function TranscriptionFeed({ chunks = [], fullText }: TranscriptionFeedProps) {
  // Si tenemos texto completo, lo mostramos directamente
  // Si no, construimos el texto desde los chunks ordenados
  const displayText = fullText ?? (() => {
    const sortedChunks = [...chunks].sort((a, b) => a.offset - b.offset);
    return sortedChunks.map(chunk => chunk.text).join(" ");
  })();

  if (!displayText || displayText.trim().length === 0) {
    return (
      <div className="text-center py-10 text-slate-400 text-xs font-mono">
        Establishing audio connection...
      </div>
    );
  }

  // Si tenemos chunks, mostramos con timestamps y speakers
  // Si solo tenemos texto completo, lo mostramos como párrafos
  if (chunks.length > 0 && !fullText) {
    const sortedChunks = [...chunks].sort((a, b) => a.offset - b.offset);
    
    return (
      <div className="flex-1 p-4 overflow-y-auto bg-white scrollbar-hide">
        <div className="space-y-2">
          {sortedChunks.map((chunk, index) => {
            const minutes = Math.floor(chunk.offset / 60);
            const seconds = Math.floor(chunk.offset % 60);
            const timeLabel = `${minutes}:${seconds.toString().padStart(2, "0")}`;
            const isOperator = chunk.speaker === "dispatcher";
            const isSystem = chunk.speaker === "system";
            const label = isOperator ? "OPERATOR" : isSystem ? "SYSTEM" : "CALLER";

            return (
              <div
                key={index}
                className="animate-fade-in-up flex flex-col gap-1"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 font-mono shrink-0">
                    {timeLabel}
                  </span>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider font-mono">
                    {label}
                  </span>
                </div>
                <div className="text-xs leading-relaxed text-slate-900 ml-0">
                  {chunk.text}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Mostrar texto completo como párrafos
  return (
    <div className="flex-1 p-4 overflow-y-auto bg-white scrollbar-hide">
      <div className="text-xs leading-relaxed text-slate-900 whitespace-pre-wrap">
        {displayText}
      </div>
    </div>
  );
}

