import React from 'react';
import { ConnectionState } from '../types';

interface ConnectionStatusBadgeProps {
  status: ConnectionState;
  showText?: boolean;
  className?: string;
}

export const ConnectionStatusBadge: React.FC<ConnectionStatusBadgeProps> = ({
  status,
  showText = true,
  className = '',
}) => {
  const config = {
    connected: {
      dot: 'bg-emerald-500 shadow-sm shadow-emerald-500/50 animate-pulse',
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      label: 'Tiempo Real Conectado',
    },
    reconnecting: {
      dot: 'bg-amber-500 animate-ping',
      bg: 'bg-amber-50 text-amber-700 border-amber-200',
      label: 'Reconectando...',
    },
    disconnected: {
      dot: 'bg-rose-500',
      bg: 'bg-rose-50 text-rose-700 border-rose-200',
      label: 'Desconectado',
    },
  }[status];

  return (
    <div
      id="realtime-connection-badge"
      className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${config.bg} ${className}`}
      title={`Estado de sincronización en tiempo real: ${config.label}`}
    >
      <span className={`w-2 h-2 rounded-full ${config.dot}`} />
      {showText && <span>{config.label}</span>}
    </div>
  );
};
