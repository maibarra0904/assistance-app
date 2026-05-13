'use client';

import { useState, useEffect } from 'react';
import { toTitleCase } from '@/lib/utils';
import { Copy, Check, Loader2 } from 'lucide-react';

export default function IdsListPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/idslist')
      .then(res => res.json())
      .then(data => {
        setItems(data);
        setLoading(false);
      });
  }, []);

  const copyToClipboard = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedId(hash);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-main)', color: 'white' }}>
        <Loader2 className="animate-spin" size={48} color="var(--primary)" />
      </div>
    );
  }

  return (
    <div className="container animate-fade" style={{ padding: '4rem 2rem' }}>
      <header style={{ marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Lista de Identificadores (Hashes)</h1>
        <p style={{ color: 'var(--text-muted)' }}>Usa estos IDs para generar las URLs de los estudiantes</p>
      </header>

      <div className="card glass table-container">
        <table>
          <thead>
            <tr>
              <th>Materia</th>
              <th>Ciclo</th>
              <th>ID Ofuscado (Hash)</th>
              <th style={{ textAlign: 'center' }}>Acción</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={idx}>
                <td style={{ fontWeight: 600 }}>{toTitleCase(item.name)}</td>
                <td><span style={{ background: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.5rem', borderRadius: '0.4rem', fontSize: '0.8rem' }}>{item.cycle_id}</span></td>
                <td><code style={{ color: 'var(--primary)', fontWeight: 700 }}>{item.hash_id}</code></td>
                <td style={{ textAlign: 'center' }}>
                  <button 
                    className="btn" 
                    style={{ 
                      padding: '0.4rem 0.8rem', 
                      background: copiedId === item.hash_id ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.05)',
                      color: copiedId === item.hash_id ? '#10b981' : 'white',
                      border: '1px solid ' + (copiedId === item.hash_id ? '#10b981' : 'var(--border)')
                    }}
                    onClick={() => copyToClipboard(item.hash_id)}
                  >
                    {copiedId === item.hash_id ? <Check size={14} /> : <Copy size={14} />}
                    <span style={{ marginLeft: '0.5rem', fontSize: '0.8rem' }}>{copiedId === item.hash_id ? 'Copiado' : 'Copiar ID'}</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <style jsx global>{`
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
