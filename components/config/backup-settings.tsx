
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Database, 
  Download, 
  Upload, 
  Calendar,
  CheckCircle,
  AlertCircle,
  Play
} from 'lucide-react';

export function BackupSettings() {
  const [backupConfig, setBackupConfig] = useState({
    enabled: true,
    type: 'incremental',
    schedule: '0 2 * * *', // Daily at 2 AM
    retention: 30,
    storageType: 'local'
  });

  const [backupInProgress, setBackupInProgress] = useState(false);
  const [backupProgress, setBackupProgress] = useState(0);

  const recentBackups = [
    {
      id: '1',
      date: new Date('2025-06-19T02:00:00'),
      type: 'incremental',
      size: '234 MB',
      status: 'completed',
      duration: '2m 34s'
    },
    {
      id: '2',
      date: new Date('2025-06-18T02:00:00'),
      type: 'incremental',
      size: '189 MB',
      status: 'completed',
      duration: '2m 12s'
    },
    {
      id: '3',
      date: new Date('2025-06-17T02:00:00'),
      type: 'full',
      size: '1.2 GB',
      status: 'completed',
      duration: '8m 45s'
    }
  ];

  const handleManualBackup = async () => {
    setBackupInProgress(true);
    setBackupProgress(0);

    try {
      // Simulate backup progress
      for (let i = 0; i <= 100; i += 10) {
        setBackupProgress(i);
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Call actual backup API
      const response = await fetch('/api/backup/manual', {
        method: 'POST'
      });
      
      if (response.ok) {
        console.log('Backup completed successfully');
      }
    } catch (error) {
      console.error('Backup failed:', error);
    } finally {
      setBackupInProgress(false);
      setBackupProgress(0);
    }
  };

  const handleRestore = async (backupId: string) => {
    if (confirm('¿Estás seguro de que quieres restaurar este backup? Esta acción no se puede deshacer.')) {
      try {
        const response = await fetch(`/api/backup/restore/${backupId}`, {
          method: 'POST'
        });
        
        if (response.ok) {
          console.log('Restore completed successfully');
        }
      } catch (error) {
        console.error('Restore failed:', error);
      }
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Backup Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Configuración de Backup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="backupEnabled">Backup Automático</Label>
              <p className="text-sm text-muted-foreground">
                Realizar copias de seguridad programadas
              </p>
            </div>
            <Switch
              id="backupEnabled"
              checked={backupConfig.enabled}
              onCheckedChange={(checked) => setBackupConfig(prev => ({ 
                ...prev, 
                enabled: checked 
              }))}
            />
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="backupType">Tipo de Backup</Label>
              <Select value={backupConfig.type} onValueChange={(value) => 
                setBackupConfig(prev => ({ ...prev, type: value }))
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">Completo</SelectItem>
                  <SelectItem value="incremental">Incremental</SelectItem>
                  <SelectItem value="differential">Diferencial</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="retention">Retención (días)</Label>
              <Input
                id="retention"
                type="number"
                value={backupConfig.retention}
                onChange={(e) => setBackupConfig(prev => ({ 
                  ...prev, 
                  retention: parseInt(e.target.value) 
                }))}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="schedule">Programación (Cron)</Label>
            <Input
              id="schedule"
              value={backupConfig.schedule}
              onChange={(e) => setBackupConfig(prev => ({ 
                ...prev, 
                schedule: e.target.value 
              }))}
              placeholder="0 2 * * * (Diario a las 2:00 AM)"
            />
          </div>
        </CardContent>
      </Card>

      {/* Manual Backup */}
      <Card>
        <CardHeader>
          <CardTitle>Backup Manual</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Crear Backup Inmediato</p>
              <p className="text-sm text-muted-foreground">
                Ejecutar una copia de seguridad completa ahora
              </p>
            </div>
            <Button 
              onClick={handleManualBackup} 
              disabled={backupInProgress}
              className="min-w-32"
            >
              <Database className="mr-2 h-4 w-4" />
              {backupInProgress ? 'Creando...' : 'Crear Backup'}
            </Button>
          </div>
          
          {backupInProgress && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progreso del backup</span>
                <span>{backupProgress}%</span>
              </div>
              <Progress value={backupProgress} className="h-2" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Backups */}
      <Card>
        <CardHeader>
          <CardTitle>Backups Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentBackups.map((backup) => (
              <div
                key={backup.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  {getStatusIcon(backup.status)}
                  <div>
                    <p className="font-medium text-sm">
                      {backup.date.toLocaleDateString('es-MX')} {backup.date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Badge variant="outline" className="text-xs">
                        {backup.type}
                      </Badge>
                      <span>{backup.size}</span>
                      <span>•</span>
                      <span>{backup.duration}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRestore(backup.id)}
                  >
                    <Upload className="h-4 w-4 mr-1" />
                    Restaurar
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-1" />
                    Descargar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
