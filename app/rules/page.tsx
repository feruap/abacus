
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { RuleEditor } from '@/components/rules/rule-editor';

export default function RulesPage() {
  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Motor de Reglas
          </h1>
          <p className="text-gray-600">
            Configuración de reglas de negocio y automatizaciones
          </p>
        </div>
        <RuleEditor />
      </div>
    </AuthenticatedLayout>
  );
}
