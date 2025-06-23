
'use client';

import { useState, useEffect } from 'react';
import { DataTable } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Edit, RefreshCw } from 'lucide-react';
import { Product } from '@/lib/types';

export function ProductsTable() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      const data = await response.json();
      // La API devuelve { products, pagination }, necesitamos solo products
      setProducts(data.products || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]); // Asegurar que siempre sea un array
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      key: 'sku',
      title: 'SKU',
      render: (value: string) => (
        <span className="font-mono text-sm">{value}</span>
      )
    },
    {
      key: 'name',
      title: 'Nombre del Producto',
      render: (value: string, row: Product) => (
        <div className="max-w-xs">
          <p className="font-medium truncate">{value}</p>
          {row.categories.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {row.categories.slice(0, 2).map((category, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {category}
                </Badge>
              ))}
              {row.categories.length > 2 && (
                <Badge variant="outline" className="text-xs">
                  +{row.categories.length - 2}
                </Badge>
              )}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'price',
      title: 'Precio',
      render: (value: number) => (
        <span className="font-medium">
          {value ? `$${value.toLocaleString()} MXN` : 'N/A'}
        </span>
      )
    },
    {
      key: 'stockQuantity',
      title: 'Stock',
      render: (value: number, row: Product) => (
        <div className="text-center">
          <span className="font-medium">{value || 0}</span>
          <StatusBadge status={row.stockStatus} />
        </div>
      )
    },
    {
      key: 'status',
      title: 'Estado',
      render: (value: string) => <StatusBadge status={value} />
    },
    {
      key: 'lastSynced',
      title: 'Última Sync',
      render: (value: Date) => (
        <span className="text-sm text-muted-foreground">
          {new Date(value).toLocaleDateString('es-MX')}
        </span>
      )
    },
    {
      key: 'actions',
      title: 'Acciones',
      render: (_: any, row: Product) => (
        <div className="flex space-x-2">
          <Button variant="ghost" size="sm">
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  if (loading) {
    return <div>Cargando productos...</div>;
  }

  return (
    <DataTable
      data={products}
      columns={columns}
      searchPlaceholder="Buscar productos por nombre o SKU..."
      onExport={() => {
        // TODO: Implement export functionality
        console.log('Exportar productos');
      }}
    />
  );
}
