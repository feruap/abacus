
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { ConversationsMonitor } from '@/components/conversations/conversations-monitor';

export default function ConversationsPage() {
  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Área de Conversaciones
          </h1>
          <p className="text-gray-600">
            Monitor en tiempo real de todas las conversaciones activas
          </p>
        </div>
        <ConversationsMonitor />
      </div>
    </AuthenticatedLayout>
  );
}
