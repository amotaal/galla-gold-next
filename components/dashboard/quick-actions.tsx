// components/dashboard/quick-actions.tsx
// Purpose: Quick action buttons for common tasks (Buy/Sell Gold, Deposit/Withdraw, Delivery, Achievements)

'use client';

import { Card } from '@/components/ui/card';
import {
  Plus,
  Minus,
  ArrowDownToLine,
  Send,
  Package,
  Trophy,
  ChevronRight,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export function QuickActions() {
  const router = useRouter();
  const glassCardClasses = 'bg-card/60 backdrop-blur-md border border-border';

  const actions = [
    {
      icon: Plus,
      label: 'Buy Gold',
      description: 'Purchase physical gold',
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      hoverColor: 'hover:bg-green-500/20',
      ringColor: 'ring-green-500/20',
      onClick: () => router.push('/dashboard/buy'),
    },
    {
      icon: Minus,
      label: 'Sell Gold',
      description: 'Convert to cash',
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
      hoverColor: 'hover:bg-orange-500/20',
      ringColor: 'ring-orange-500/20',
      onClick: () => router.push('/dashboard/sell'),
    },
    {
      icon: ArrowDownToLine,
      label: 'Deposit',
      description: 'Add money',
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      hoverColor: 'hover:bg-blue-500/20',
      ringColor: 'ring-blue-500/20',
      onClick: () => router.push('/dashboard/deposit'),
    },
    {
      icon: Send,
      label: 'Withdraw',
      description: 'To bank account',
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      hoverColor: 'hover:bg-purple-500/20',
      ringColor: 'ring-purple-500/20',
      onClick: () => router.push('/dashboard/withdraw'),
    },
    {
      icon: Package,
      label: 'Physical Delivery',
      description: 'Request shipment',
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
      hoverColor: 'hover:bg-amber-500/20',
      ringColor: 'ring-amber-500/20',
      onClick: () => router.push('/dashboard/deliver'),
    },
    {
      icon: Trophy,
      label: 'Achievements',
      description: 'View progress',
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      hoverColor: 'hover:bg-primary/20',
      ringColor: 'ring-primary/20',
      onClick: () => router.push('/dashboard/achievements'),
    },
  ];

  return (
    <Card className={`${glassCardClasses} p-6 flex-shrink-0`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold">Quick Actions</h3>
      </div>
      <div className="space-y-2">
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={action.onClick}
            className={`w-full flex items-center gap-3 p-3 rounded-lg ${action.bgColor} ${action.hoverColor} ring-1 ${action.ringColor} transition-all group`}
          >
            <div className={`p-2 rounded-lg bg-background/50`}>
              <action.icon className={`w-5 h-5 ${action.color}`} />
            </div>
            <div className="flex-1 text-left">
              <div className="text-sm font-medium">{action.label}</div>
              <div className="text-xs text-muted-foreground">
                {action.description}
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          </button>
        ))}
      </div>
    </Card>
  );
}
