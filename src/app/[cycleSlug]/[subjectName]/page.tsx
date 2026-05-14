'use client';

import { useState, useEffect } from 'react';
import { use } from 'react';
import { 
  Calendar, 
  User, 
  BookOpen, 
  Loader2, 
  Download,
  AlertCircle
} from 'lucide-react';
import { toTitleCase } from '@/lib/utils';

export default function StudentReportPage({ 
  params 
}: { 
  params: Promise<{ cycleSlug: string; subjectName: string }> 
}) {
  const { cycleSlug, subjectName } = use(params);
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReport() {
      try {
        const res = await fetch(`/api/reports/${cycleSlug}/${subjectName}`);
        const data = await res.json();
        setReportData(data);
      } catch (error) {
        console.error('Error fetching report:', error);
        setReportData({ error: 'No se pudo cargar el reporte' });
      } finally {
        setLoading(false);
      }
    }
    fetchReport();
  }, [cycleSlug, subjectName]);


  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: '1rem', background: 'var(--bg-main)', color: 'white' }}>
        <Loader2 size={48} className="animate-spin" color="var(--primary)" />
        <p>Cargando información de asistencia...</p>
      </div>
    );
  }

  if (reportData?.error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: '1rem', background: 'var(--bg-main)', color: 'white', padding: '2rem', textAlign: 'center' }}>
        <AlertCircle size={64} color="var(--danger)" />
        <h1 style={{ fontSize: '1.5rem' }}>Reporte no encontrado</h1>
        <p style={{ color: 'var(--text-muted)' }}>La materia o el ciclo especificado no existen o no tienen registros aún.</p>
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--bg-main)', minHeight: '100vh', color: 'white' }}>
      <div className="container animate-fade">
        <header style={{ marginBottom: '3rem', borderBottom: '1px solid var(--border)', paddingBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{ background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', color: 'white', padding: '0.4rem 0.8rem', borderRadius: '0.5rem', fontSize: '0.9rem', fontWeight: 800 }}>
                  Assistance
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 500 }}>
                  Ing. Mario Ibarra
                </div>
              </div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)', padding: '0.4rem 0.8rem', borderRadius: '2rem', fontSize: '0.75rem', fontWeight: 700, marginBottom: '1rem', textTransform: 'uppercase' }}>
                <BookOpen size={14} /> Ciclo {cycleSlug.toUpperCase()}
              </div>
              <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{toTitleCase(reportData.subject)}</h1>
              <p style={{ color: 'var(--text-muted)' }}>Reporte oficial de asistencia estudiantil</p>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '2rem', marginTop: '2rem' }}>
            <div className="card glass" style={{ padding: '1rem 1.5rem', flex: 1 }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>CLASES REGISTRADAS</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{reportData.totalClasses}</div>
            </div>
            <div className="card glass" style={{ padding: '1rem 1.5rem', flex: 1 }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>ÚLTIMA ACTUALIZACIÓN</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{reportData.lastUpdate}</div>
            </div>
          </div>
        </header>

        <main>
          <div className="card glass table-container">
            <table>
              <thead>
                <tr>
                  <th>Estudiante</th>
                  <th style={{ textAlign: 'center' }}>P. I (1-8)</th>
                  <th style={{ textAlign: 'center' }}>P. II (9-16)</th>
                  <th style={{ textAlign: 'center' }}>Total</th>
                  <th style={{ textAlign: 'center' }}>Asistencia %</th>
                </tr>
              </thead>
              <tbody>
                {reportData.students.map((student: any) => (
                  <tr key={student.cedula}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontWeight: 600 }}>
                          {student.name.charAt(0)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{student.name}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{student.cedula}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ fontWeight: 600, color: parseFloat(student.p1.percentage) >= 70 ? 'var(--accent)' : 'var(--danger)' }}>{student.p1.percentage}</div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{student.p1.attended}/{student.p1.total}</div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ fontWeight: 600, color: parseFloat(student.p2.percentage) >= 70 ? 'var(--accent)' : 'var(--danger)' }}>{student.p2.percentage}</div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{student.p2.attended}/{student.p2.total}</div>
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 600 }}>{student.attended}/{student.total}</td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '4rem', height: '0.4rem', background: 'rgba(255,255,255,0.1)', borderRadius: '1rem', overflow: 'hidden' }}>
                          <div style={{ width: student.percentage, height: '100%', background: parseFloat(student.percentage) >= 70 ? 'var(--accent)' : 'var(--danger)' }}></div>
                        </div>
                        <span style={{ 
                          fontSize: '0.85rem',
                          fontWeight: 700,
                          color: parseFloat(student.percentage) >= 70 ? '#10b981' : '#ef4444'
                        }}>
                          {student.percentage}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
        
        <footer style={{ marginTop: '4rem', padding: '2rem 0', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            © 2026 Sistema de Control de Asistencias - Universidad
          </p>
        </footer>
      </div>

      <style jsx global>{`
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
