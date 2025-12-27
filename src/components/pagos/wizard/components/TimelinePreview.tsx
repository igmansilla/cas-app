/**
 * Timeline visual para mostrar rangos de meses.
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

    return (
        <div className="flex gap-1 overflow-x-auto py-2 px-1">
            {visible.map((m, idx) => {
                let color = 'bg-primary/20 text-primary';
                const mIdx = MESES.findIndex(x => x.val === m.val);
                const isControl = mIdx === controlIdx;
                const isTolerance = controlIdx !== -1
                    && mIdx > controlIdx
                    && mIdx <= controlIdx + toleranceMonths;

                if (isControl) {
                    color = 'bg-red-500 text-white';
                } else if (isTolerance) {
                    color = 'bg-orange-400 text-white';
                }

                return (
                    <div
                        key={m.val}
                        className={`flex-shrink-0 w-12 h-10 flex items-center justify-center rounded text-xs font-medium ${color}`}
                        title={m.label}
                    >
                        {m.label.slice(0, 3)}
                    </div>
                );
            })}
        </div>
    );
}
