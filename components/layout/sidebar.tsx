
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { NAVIGATION_ITEMS } from '@/lib/constants';
import * as Icons from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col bg-gradient-to-b from-blue-900 to-blue-800 text-white shadow-xl">
      {/* Header */}
      <div className="flex h-16 items-center justify-center border-b border-blue-700 bg-blue-900/50">
        <h1 className="text-xl font-bold text-white">Sistema Agéntico</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2 p-4">
        {NAVIGATION_ITEMS.map((item) => {
          const IconComponent = Icons[item.icon as keyof typeof Icons] as any;
          const isActive = pathname === item.href || 
            (item.href !== '/' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                'flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 hover:bg-blue-700/50',
                isActive
                  ? 'bg-blue-700 text-white shadow-md'
                  : 'text-blue-100 hover:text-white'
              )}
            >
              <IconComponent className="h-5 w-5 flex-shrink-0" />
              <span className="truncate">{item.title}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-blue-700 bg-blue-900/50 p-4">
        <div className="text-xs text-blue-200">
          <p>© 2025 Sistema Agéntico</p>
          <p>Versión 1.0.0</p>
        </div>
      </div>
    </div>
  );
}
