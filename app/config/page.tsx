
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { SystemConfigForm } from '@/components/config/system-config-form';

export default function ConfigPage() {
  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Configuración del Sistema
          </h1>
          <p className="text-gray-600">
            Configuración de APIs, integraciones y parámetros del sistema
          </p>
        </div>
        <SystemConfigForm />
      </div>
    </AuthenticatedLayout>
  );
}
