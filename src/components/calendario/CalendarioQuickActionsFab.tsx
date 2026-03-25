import { useState, type ComponentType } from "react";
import { CalendarPlus2, Clock3, Plus } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "../ui/sheet";

interface CalendarioQuickActionsFabProps {
  onQuickEvent: () => void;
  onQuickMeeting: () => void;
  onGoToday: () => void;
}

interface ActionButtonProps {
  title: string;
  description: string;
  onClick: () => void;
  icon: ComponentType<{ className?: string }>;
}

function ActionButton({ title, description, onClick, icon: Icon }: ActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-xl border border-orange-100 bg-white p-4 text-left shadow-sm transition hover:border-orange-300 hover:bg-orange-50"
    >
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-orange-100 p-2 text-orange-600">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">{title}</p>
          <p className="text-xs text-gray-600">{description}</p>
        </div>
      </div>
    </button>
  );
}

export function CalendarioQuickActionsFab({
  onQuickEvent,
  onQuickMeeting,
  onGoToday,
}: CalendarioQuickActionsFabProps) {
  const [open, setOpen] = useState(false);

  const handleAction = (action: () => void) => {
    action();
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-24 right-4 z-40 flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-[#FF6B35] to-[#E55A2B] text-white shadow-xl transition active:scale-95 md:hidden"
        aria-label="Acciones rápidas de calendario"
      >
        <Plus className="h-8 w-8" />
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl pb-[max(1rem,env(safe-area-inset-bottom))] md:hidden">
          <SheetHeader className="pb-2 text-left">
            <SheetTitle>Acciones</SheetTitle>
            <SheetDescription>Calendario</SheetDescription>
          </SheetHeader>

          <div className="grid gap-3 px-4 pb-4">
            <ActionButton
              title="Evento"
              description="Nuevo"
              icon={CalendarPlus2}
              onClick={() => handleAction(onQuickEvent)}
            />

            <ActionButton
              title="Reunión"
              description="Nueva"
              icon={Clock3}
              onClick={() => handleAction(onQuickMeeting)}
            />

            <button
              type="button"
              onClick={() => handleAction(onGoToday)}
              className="w-full rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm font-semibold text-orange-700 transition hover:bg-orange-100"
            >
              Hoy
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
