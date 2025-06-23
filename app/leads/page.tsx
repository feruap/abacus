
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Phone, Mail, Calendar, TrendingUp, Filter } from 'lucide-react';

export default function LeadsPage() {
  const mockLeads = [
    {
      id: 1,
      name: 'María González',
      email: 'maria@empresa.com',
      phone: '+52 55 1234 5678',
      status: 'hot',
      source: 'Website',
      lastContact: '2025-01-20',
      value: '$5,000',
      stage: 'Negociación'
    },
    {
      id: 2,
      name: 'Carlos Ruiz',
      email: 'carlos@startup.mx',
      phone: '+52 81 2345 6789',
      status: 'warm',
      source: 'MyAlice.ai',
      lastContact: '2025-01-19',
      value: '$3,200',
      stage: 'Propuesta'
    },
    {
      id: 3,
      name: 'Ana López',
      email: 'ana@corporativo.com',
      phone: '+52 33 3456 7890',
      status: 'cold',
      source: 'Referencia',
      lastContact: '2025-01-18',
      value: '$8,500',
      stage: 'Primer contacto'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'hot': return 'bg-red-100 text-red-800';
      case 'warm': return 'bg-yellow-100 text-yellow-800';
      case 'cold': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Gestión de Leads
            </h1>
            <p className="text-gray-600">
              Administra y da seguimiento a todos los prospectos generados por el sistema IA
            </p>
          </div>
          <div className="flex space-x-3">
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filtros
            </Button>
            <Button>
              <Users className="h-4 w-4 mr-2" />
              Nuevo Lead
            </Button>
          </div>
        </div>

        {/* Métricas de leads */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Leads Totales</p>
                  <p className="text-2xl font-bold text-gray-900">89</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Leads Calientes</p>
                  <p className="text-2xl font-bold text-red-600">23</p>
                </div>
                <TrendingUp className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Tasa Conversión</p>
                  <p className="text-2xl font-bold text-green-600">68.5%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Valor Pipeline</p>
                  <p className="text-2xl font-bold text-purple-600">$127K</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de leads */}
        <Card>
          <CardHeader>
            <CardTitle>Leads Recientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockLeads.map((lead) => (
                <div key={lead.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{lead.name}</h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span className="flex items-center space-x-1">
                          <Mail className="h-3 w-3" />
                          <span>{lead.email}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Phone className="h-3 w-3" />
                          <span>{lead.phone}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="font-medium text-gray-900">{lead.value}</p>
                      <p className="text-sm text-gray-600">{lead.stage}</p>
                    </div>
                    <Badge className={getStatusColor(lead.status)}>
                      {lead.status.toUpperCase()}
                    </Badge>
                    <Button variant="outline" size="sm">
                      Ver Detalles
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
