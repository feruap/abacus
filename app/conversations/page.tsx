import { SyncControlPanel } from '@/components/conversations/sync-control-panel';
import { RealConversationsTable } from '@/components/conversations/real-conversations-table';
import { MyAliceDashboardReplica } from '@/components/conversations/myalice-dashboard-replica';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ConversationsPage() {
  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Conversaciones MyAlice.ai</h2>
          <p className="text-muted-foreground">
            Interfaz replicada de MyAlice.ai con gestión avanzada de conversaciones
          </p>
        </div>
      </div>
      
      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard MyAlice</TabsTrigger>
          <TabsTrigger value="conversations">Vista de Tabla</TabsTrigger>
          <TabsTrigger value="sync">Control de Sincronización</TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard" className="space-y-4">
          <MyAliceDashboardReplica />
        </TabsContent>
        
        <TabsContent value="conversations" className="space-y-4">
          <RealConversationsTable />
        </TabsContent>
        
        <TabsContent value="sync" className="space-y-4">
          <SyncControlPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
