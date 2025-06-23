
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Upload, Search, Folder, BookOpen, Download } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function KnowledgePage() {
  const mockDocuments = [
    {
      id: 1,
      name: 'Manual de Productos 2025',
      type: 'PDF',
      size: '2.4 MB',
      lastModified: '2025-01-20',
      category: 'Productos',
      status: 'Procesado'
    },
    {
      id: 2,
      name: 'Políticas de Ventas',
      type: 'DOCX',
      size: '856 KB',
      lastModified: '2025-01-19',
      category: 'Políticas',
      status: 'Procesando'
    },
    {
      id: 3,
      name: 'FAQ Técnicas',
      type: 'TXT',
      size: '124 KB',
      lastModified: '2025-01-18',
      category: 'Soporte',
      status: 'Procesado'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Procesado': return 'bg-green-100 text-green-800';
      case 'Procesando': return 'bg-yellow-100 text-yellow-800';
      case 'Error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Base de Conocimiento
            </h1>
            <p className="text-gray-600">
              Gestiona documentos, enlaces y contenido para entrenar al agente IA
            </p>
          </div>
          <Button>
            <Upload className="h-4 w-4 mr-2" />
            Subir Documento
          </Button>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Documentos</p>
                  <p className="text-2xl font-bold text-gray-900">47</p>
                </div>
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Enlaces</p>
                  <p className="text-2xl font-bold text-green-600">23</p>
                </div>
                <BookOpen className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Procesados</p>
                  <p className="text-2xl font-bold text-purple-600">42</p>
                </div>
                <Folder className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Tamaño Total</p>
                  <p className="text-2xl font-bold text-orange-600">127MB</p>
                </div>
                <Download className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Búsqueda y filtros */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Documentos de Conocimiento</CardTitle>
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input placeholder="Buscar documentos..." className="pl-10 w-64" />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockDocuments.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{doc.name}</h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span>{doc.type}</span>
                        <span>{doc.size}</span>
                        <span>Modificado: {doc.lastModified}</span>
                        <span className="px-2 py-1 bg-gray-100 rounded text-xs">{doc.category}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(doc.status)}`}>
                      {doc.status}
                    </span>
                    <Button variant="outline" size="sm">
                      Ver
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
