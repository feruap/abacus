
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { NAVIGATION_CATEGORIES } from '@/lib/constants';
import * as Icons from 'lucide-react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export function Sidebar() {
  const pathname = usePathname();
  const [openCategories, setOpenCategories] = useState<string[]>(['activity']);

  const toggleCategory = (categoryId: string) => {
    setOpenCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  return (
    <div className="flex h-full w-72 flex-col bg-gradient-to-b from-blue-900 via-blue-800 to-blue-900 text-white shadow-xl">
      {/* Header */}
      <div className="flex h-16 items-center justify-center border-b border-blue-700 bg-blue-900/80 backdrop-blur-sm">
        <div className="flex items-center space-x-2">
          <Icons.Bot className="h-6 w-6 text-blue-300" />
          <h1 className="text-lg font-bold text-white">CRM AI System</h1>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {NAVIGATION_CATEGORIES.map((category) => {
          const CategoryIcon = Icons[category.icon as keyof typeof Icons] as any;
          const isOpen = openCategories.includes(category.id);
          
          return (
            <Collapsible
              key={category.id}
              open={isOpen}
              onOpenChange={() => toggleCategory(category.id)}
            >
              <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold text-blue-200 hover:bg-blue-800/50 hover:text-white transition-all duration-200">
                <div className="flex items-center space-x-2">
                  <CategoryIcon className="h-4 w-4" />
                  <span>{category.title}</span>
                </div>
                {isOpen ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
              </CollapsibleTrigger>
              
              <CollapsibleContent className="space-y-1 pl-2 mt-1">
                {category.items.map((item) => {
                  const ItemIcon = Icons[item.icon as keyof typeof Icons] as any;
                  const isActive = pathname === item.href || 
                    (item.href !== '/' && pathname.startsWith(item.href));

                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      className={cn(
                        'flex items-center space-x-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 group',
                        isActive
                          ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md border-l-2 border-blue-300'
                          : 'text-blue-100 hover:bg-blue-700/40 hover:text-white hover:pl-4'
                      )}
                      title={item.description}
                    >
                      <ItemIcon className={cn(
                        'h-4 w-4 flex-shrink-0 transition-transform duration-200',
                        isActive ? 'text-blue-200' : 'text-blue-300 group-hover:text-white'
                      )} />
                      <span className="truncate">{item.title}</span>
                      {isActive && (
                        <div className="ml-auto w-1.5 h-1.5 bg-blue-300 rounded-full animate-pulse" />
                      )}
                    </Link>
                  );
                })}
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-blue-700 bg-blue-900/50 p-4">
        <div className="flex items-center space-x-2 mb-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-xs text-blue-200">Sistema Activo</span>
        </div>
        <div className="text-xs text-blue-300">
          <p>© 2025 Amunet CRM</p>
          <p>v1.0.0 - Producción</p>
        </div>
      </div>
    </div>
  );
}
