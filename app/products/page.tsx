
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { ProductTrainingSimulator } from '@/components/products/product-training-simulator';

export default function ProductsPage() {
  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Entrenamiento de Productos
          </h1>
          <p className="text-gray-600">
            Gestión del catálogo y entrenamiento del agente IA
          </p>
        </div>
        <ProductTrainingSimulator />
      </div>
    </AuthenticatedLayout>
  );
}
