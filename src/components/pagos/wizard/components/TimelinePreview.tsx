/**
 * Timeline visual para mostrar rangos de meses.
 * Mobile-first: tiles se adaptan al ancho disponible en lugar de usar ancho fijo.
 */
import { MESES } from '../wizard-types';

interface TimelinePreviewProps {
    start: number;
    end: number;
    controlMonth?: number;
    toleranceMonths?: number;
}

export function TimelinePreview({ start, end, controlMonth, toleranceMonths = 2 }: TimelinePreviewProps) {
    const startIdx = MESES.findIndex(m => m.val === start);
    const endIdx = MESES.findIndex(m => m.val === end);
    const controlIdx = controlMonth ? MESES.findIndex(m => m.val === controlMonth) : -1;

    // Construir array de meses visibles
    const visible: { val: number; label: string }[] = [];
    if (startIdx !== -1 && endIdx !== -1) {
        let i = startIdx;
        while (true) {
            visible.push(MESES[i]);
            if (i === endIdx) break;
            i = (i + 1) % 12;
            if (visible.length > 12) break;
        }
    }

    if (visible.length === 0) return null;

    return (
        <div className="grid gap-1 py-1" style={{ gridTemplateColumns: `repeat(${Math.min(visible.length, 6)}, 1fr)` }}>
            {visible.map((m) => {
                let color = 'bg-primary/15 text-primary border border-primary/20';
                const mIdx = MESES.findIndex(x => x.val === m.val);
                const isControl = mIdx === controlIdx;
                const isTolerance = controlIdx !== -1
                    && mIdx > controlIdx
                    && mIdx <= controlIdx + toleranceMonths;

                if (isControl) {
                    color = 'bg-red-500 text-white border-red-500';
                } else if (isTolerance) {
                    color = 'bg-orange-400 text-white border-orange-400';
                }

                return (
                    <div
                        key={m.val}
                        className={`flex items-center justify-center rounded py-1.5 text-[10px] sm:text-xs font-medium ${color}`}
                        title={m.label}
                    >
                        {m.label}
                    </div>
                );
            })}
        </div>
    );
}
