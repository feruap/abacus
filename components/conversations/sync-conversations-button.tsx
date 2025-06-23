
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function SyncConversationsButton({ onSyncComplete }: { onSyncComplete?: () => void }) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSync = async () => {
    setIsLoading(true);
    
    try {
      console.log('🔄 Iniciando sincronización de conversaciones...');
      
      const response = await fetch('/api/sync/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (result.success) {
        console.log('✅ Sincronización exitosa:', result);
        
        toast({
          title: "✅ Sincronización Exitosa",
          description: result.message,
          variant: "default",
        });

        // Refresh the page to show new conversations
        if (onSyncComplete) {
          onSyncComplete();
        } else {
          window.location.reload();
        }
      } else {
        console.error('❌ Error en sincronización:', result);
        
        toast({
          title: "❌ Error en Sincronización",
          description: result.error || "No se pudo sincronizar las conversaciones",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('❌ Error de red:', error);
      
      toast({
        title: "❌ Error de Conexión",
        description: "No se pudo conectar con el servidor",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleSync}
      disabled={isLoading}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      {isLoading ? (
        <>
          <RefreshCw className="h-4 w-4 animate-spin" />
          Sincronizando...
        </>
      ) : (
        <>
          <RefreshCw className="h-4 w-4" />
          Sincronizar Conversaciones
        </>
      )}
    </Button>
  );
}
