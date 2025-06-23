
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import AgentControlPanel from '@/components/agent/agent-control-panel';

export default function AgentPage() {
  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Agente LLM
          </h1>
          <p className="text-gray-600">
            Control y configuración del agente inteligente de ventas
          </p>
        </div>
        <AgentControlPanel />
      </div>
    </AuthenticatedLayout>
  );
}
