'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ChevronLeft, FileText, Download, Loader2, Link as LinkIcon, Check } from 'lucide-react';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import { toTitleCase } from '@/lib/utils';

export default function ReportsPage() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedCycle, setSelectedCycle] = useState('2026c1');
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function fetchSubjects() {
      const { data } = await supabase.from('subjects').select('*, hash_id').eq('cycle_id', selectedCycle).order('name');
      if (data) setSubjects(data);
    }
    fetchSubjects();
  }, [selectedCycle]);

  const fetchReport = async (subjectName: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/${selectedCycle}/${encodeURIComponent(subjectName)}`);
      if (!res.ok) {
        const errorText = await res.text();
        console.error('API Error:', errorText);
        setReportData({ error: `Error ${res.status}: ${res.statusText}` });
        return;
      }
      const data = await res.json();
      setReportData(data);
    } catch (err) {
      console.error('Fetch error:', err);
      setReportData({ error: 'Error de conexión' });
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    if (!reportData?.students) return;
    
    const dataToExport = reportData.students.map((s: any) => ({
      'Estudiante': s.name,
      'Cédula': s.cedula,
      'Asistencias': s.attended,
      'Total Clases': s.total,
      'Porcentaje': s.percentage
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Resumen');
    
    // Auto-size columns
    const maxWidth = dataToExport.reduce((w: number, r: any) => Math.max(w, r.Estudiante.length), 10);
    worksheet['!cols'] = [{ wch: maxWidth + 5 }, { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 12 }];

    XLSX.writeFile(workbook, `Resumen_Asistencia_${reportData.subject}_${selectedCycle}.xlsx`);
  };

  const copyStudentLink = () => {
    const subject = subjects.find(s => s.id === selectedSubject);
    if (!subject) return;
    const url = `${window.location.origin}/${selectedCycle}/${subject.hash_id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const exportToDetail = () => {
    if (!reportData?.students || !reportData?.uniqueDates) return;
    
    const dates = reportData.uniqueDates;
    const dataToExport = reportData.students.map((s: any) => {
      const row: any = {
        'Estudiante': s.name,
        'Cédula': s.cedula
      };
      
      dates.forEach((date: string) => {
        row[date] = s.history[date] ? 'P' : 'F';
      });
      
      return row;
    });
    
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Detalle');
    
    // Auto-size columns
    worksheet['!cols'] = [{ wch: 35 }, { wch: 15 }];
    dates.forEach((_: string, i: number) => {
      worksheet['!cols']?.push({ wch: 12 });
    });

    XLSX.writeFile(workbook, `Detalle_Asistencia_${reportData.subject}_${selectedCycle}.xlsx`);
  };

  useEffect(() => {
    if (selectedSubject) {
      const subject = subjects.find(s => s.id === selectedSubject);
      if (subject) fetchReport(subject.name);
    }
  }, [selectedSubject, subjects]);

  return (
    <div className="container animate-fade">
      <header style={{ marginBottom: '2rem' }}>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', textDecoration: 'none', marginBottom: '1rem' }}>
          <ChevronLeft size={16} /> Volver al control
        </Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <h1 style={{ fontSize: '2rem' }}>Reportes de Asistencia</h1>
          <select 
            className="btn" 
            style={{ background: 'var(--bg-card)', color: 'white', border: '1px solid var(--border)' }}
            value={selectedCycle}
            onChange={(e) => setSelectedCycle(e.target.value)}
          >
            <option value="2026c1">2026 Ciclo I</option>
          </select>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '2rem' }}>
        <aside>
          <div className="card glass">
            <h3 style={{ marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Materias</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {subjects.map(s => (
                <button
                  key={s.id}
                  className="btn"
                  style={{ 
                    justifyContent: 'flex-start', 
                    textAlign: 'left',
                    minHeight: '3.5rem',
                    lineHeight: '1.2',
                    background: selectedSubject === s.id ? 'var(--primary)' : 'rgba(255,255,255,0.02)',
                    border: '1px solid ' + (selectedSubject === s.id ? 'var(--primary)' : 'var(--border)'),
                    color: 'white',
                    width: '100%',
                    padding: '0.75rem 1rem'
                  }}
                  onClick={() => setSelectedSubject(s.id)}
                >
                  {toTitleCase(s.name)}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <main>
          {!selectedSubject ? (
            <div className="card glass" style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              Selecciona una materia para ver el reporte consolidado
            </div>
          ) : loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem' }}>
              <Loader2 size={40} className="animate-spin" color="var(--primary)" />
            </div>
          ) : reportData?.error ? (
            <div className="card glass" style={{ padding: '2rem', textAlign: 'center', color: 'var(--danger)', border: '1px solid var(--danger)' }}>
              {reportData.error}
            </div>
          ) : reportData && (
            <div className="animate-fade">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.5rem' }}>{toTitleCase(reportData.subject)}</h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    Basado en {reportData.totalClasses} clases registradas hasta el {reportData.lastUpdate}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button className="btn" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: 'white' }} onClick={copyStudentLink}>
                    {copied ? <Check size={16} color="#10b981" /> : <LinkIcon size={16} />} 
                    {copied ? '¡Copiado!' : 'Link Estudiantes'}
                  </button>
                  <button className="btn" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: 'white' }} onClick={exportToExcel}>
                    <Download size={16} /> Exportar Resumen
                  </button>
                  <button className="btn btn-primary" onClick={exportToDetail}>
                    <Download size={16} /> Exportar Detalle
                  </button>
                </div>
              </div>

              <div className="card glass table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Estudiante</th>
                      <th style={{ textAlign: 'center' }}>P. I (8 sem)</th>
                      <th style={{ textAlign: 'center' }}>P. II (16 sem)</th>
                      <th style={{ textAlign: 'center' }}>Total</th>
                      <th style={{ textAlign: 'center' }}>Porcentaje</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData?.students?.map((student: any) => (
                      <tr key={student.cedula}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{student.name}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{student.cedula}</div>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span style={{ 
                            color: student.p1.percentage === '-' ? 'var(--text-muted)' : (parseFloat(student.p1.percentage) >= 70 ? 'var(--accent)' : 'var(--danger)'), 
                            fontWeight: 600 
                          }}>
                            {student.p1.percentage}
                          </span>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{student.p1.attended}/{student.p1.total}</div>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span style={{ 
                            color: student.p2.percentage === '-' ? 'var(--text-muted)' : (parseFloat(student.p2.percentage) >= 70 ? 'var(--accent)' : 'var(--danger)'), 
                            fontWeight: 600 
                          }}>
                            {student.p2.percentage}
                          </span>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{student.p2.attended}/{student.p2.total}</div>
                        </td>
                        <td style={{ textAlign: 'center' }}>{student.attended}/{student.total}</td>
                        <td style={{ textAlign: 'center' }}>
                          <span style={{ 
                            padding: '0.25rem 0.75rem', 
                            borderRadius: '1rem', 
                            background: parseFloat(student.percentage) >= 70 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                            color: parseFloat(student.percentage) >= 70 ? '#10b981' : '#ef4444',
                            fontSize: '0.8rem',
                            fontWeight: 700
                          }}>
                            {student.percentage}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
