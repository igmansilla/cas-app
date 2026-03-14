import { useAuth } from "../hooks/useAuth";
import UserAvatar from "./UserAvatar";

export interface MobileHeaderProps {
  title?: string;
}

export default function MobileHeader({ title }: MobileHeaderProps) {
    const { user } = useAuth()
    if(!user) return null

    return (
        <header className="md:hidden bg-white border-b border-gray-200 shadow-sm">
            <div className="relative flex items-center justify-between gap-3 px-4 py-2.5">
                <img
                    src="/logo_transparent.png"
                    alt="CAS"
                    className="h-9 w-auto shrink-0"
                />

                {title && (
                    <h1 className="pointer-events-none absolute left-1/2 top-1/2 w-[calc(100%-7.5rem)] -translate-x-1/2 -translate-y-1/2 truncate text-center text-lg font-semibold text-gray-900">
                        {title}
                    </h1>
                )}

                <div className="shrink-0">
                    <UserAvatar size="sm" showName={false} showDropdown />
                </div>
            </div>
        </header>
    )
}
