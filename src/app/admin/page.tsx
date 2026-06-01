'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  getWeekAndPartial, 
  getDatesForWeek, 
  formatDate, 
  DAYS_SPANISH, 
  DAYS_ENGLISH_TO_SPANISH,
  toTitleCase
} from '@/lib/utils';
import Link from 'next/link';
import { 
  Check, 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  User, 
  BookOpen,
  Loader2,
  RefreshCcw,
  FileText,
  Lock,
  LogOut,
  Trash2,
  Plus,
  X,
  Bell
} from 'lucide-react';

export default function AdminAttendancePage() {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const [subjects, setSubjects] = useState<any[]>([]);
  const [availableCycles, setAvailableCycles] = useState<any[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedCycle, setSelectedCycle] = useState<string>('');
  
  const [students, setStudents] = useState<any[]>([]);
  const [schedule, setSchedule] = useState<any[]>([]);
  const [currentWeek, setCurrentWeek] = useState(1);
  const [attendanceData, setAttendanceData] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [activities, setActivities] = useState<any[]>([]);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [selectedDateForActivity, setSelectedDateForActivity] = useState<Date | null>(null);
  const [activityTitle, setActivityTitle] = useState('');
  const [activityDescription, setActivityDescription] = useState('');
  const [savingActivity, setSavingActivity] = useState(false);

  // Simple authentication check
  useEffect(() => {
    const auth = localStorage.getItem('admin_auth');
    if (auth === 'true') setIsAuthorized(true);
    // Clear lingering selected_week so it does not persist across reloads
    localStorage.removeItem('selected_week');
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === '200216158') {
      setIsAuthorized(true);
      localStorage.setItem('admin_auth', 'true');
      setError('');
    } else {
      setError('Contraseña incorrecta');
    }
  };

  const handleLogout = () => {
    setIsAuthorized(false);
    localStorage.removeItem('admin_auth');
  };

  // Fetch cycles on mount
  useEffect(() => {
    if (!isAuthorized) return;
    
    async function fetchCycles() {
      const { data } = await supabase.from('academic_cycles').select('*').order('id', { ascending: false });
      if (data) {
        setAvailableCycles(data);
        const savedCycle = localStorage.getItem('selected_cycle');
        const cycleExists = data.some(c => c.id === savedCycle);
        const defaultCycle = (cycleExists && savedCycle) ? data.find(c => c.id === savedCycle) : (data.find(c => c.is_default) || data[0]);
        if (defaultCycle) setSelectedCycle(defaultCycle.id);
      }
    }
    fetchCycles();
    setCurrentWeek(getWeekAndPartial(new Date()).week);
  }, [isAuthorized]);

  // Fetch subjects when cycle changes
  useEffect(() => {
    if (!isAuthorized || !selectedCycle) return;

    async function fetchSubjects() {
      setLoading(true);
      const { data } = await supabase
        .from('subjects')
        .select('*')
        .eq('cycle_id', selectedCycle)
        .order('name');
      if (data) {
        setSubjects(data);
        const savedSubject = localStorage.getItem('selected_subject');
        const subjectExists = data.some(s => s.id === savedSubject);
        if (subjectExists && savedSubject) {
          setSelectedSubject(savedSubject);
        } else if (data.length > 0) {
          setSelectedSubject(data[0].id);
          localStorage.setItem('selected_subject', data[0].id);
        } else {
          setSelectedSubject(null);
          localStorage.removeItem('selected_subject');
        }
      }
      setLoading(false);
    }
    fetchSubjects();
  }, [isAuthorized, selectedCycle]);

  const setDefaultCycle = async () => {
    if (!selectedCycle) return;
    setSaving(true);
    // Reset all defaults
    await supabase.from('academic_cycles').update({ is_default: false }).neq('id', 'void');
    // Set new default
    await supabase.from('academic_cycles').update({ is_default: true }).eq('id', selectedCycle);
    setSaving(false);
  };

  const fetchSubjectData = useCallback(async (subjectId: string, week: number) => {
    setLoading(true);
    const { data: studentsData } = await supabase.from('subject_students').select('students(*)').eq('subject_id', subjectId);
    const { data: scheduleData } = await supabase.from('schedule').select('*').eq('subject_id', subjectId);
    const dates = getDatesForWeek(week);
    const startDateStr = formatDate(dates[0]);
    const endDateStr = formatDate(dates[6]);
    const { data: attData } = await supabase.from('attendance').select('*').eq('subject_id', subjectId).gte('attendance_date', startDateStr).lte('attendance_date', endDateStr);
    const { data: actData } = await supabase.from('activities').select('*').eq('subject_id', subjectId).gte('activity_date', startDateStr).lte('activity_date', endDateStr);

    if (studentsData) setStudents(studentsData.map((s: any) => s.students));
    if (scheduleData) setSchedule(scheduleData);
    if (actData) setActivities(actData);
    else setActivities([]);
    
    const attMap: Record<string, boolean> = {};
    attData?.forEach((record: any) => { attMap[`${record.student_id}_${record.attendance_date}`] = record.is_present; });
    setAttendanceData(attMap);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isAuthorized && selectedSubject) {
      fetchSubjectData(selectedSubject, currentWeek);
    }
  }, [isAuthorized, selectedSubject, currentWeek, fetchSubjectData]);

  const toggleAttendance = async (studentId: string, date: Date) => {
    const dateStr = formatDate(date);
    const key = `${studentId}_${dateStr}`;
    const newStatus = !attendanceData[key];
    const { partial } = getWeekAndPartial(date);
    setSaving(true);
    setAttendanceData(prev => ({ ...prev, [key]: newStatus }));
    const { error } = await supabase.from('attendance').upsert({
      student_id: studentId, subject_id: selectedSubject, attendance_date: dateStr, is_present: newStatus, week_number: currentWeek, partial_number: partial
    }, { onConflict: 'student_id,subject_id,attendance_date' });
    if (error) setAttendanceData(prev => ({ ...prev, [key]: !newStatus }));
    setSaving(false);
  };

  const openActivityModal = (date: Date) => {
    const dateStr = formatDate(date);
    const existing = activities.find(a => a.activity_date === dateStr);
    setSelectedDateForActivity(date);
    setActivityTitle(existing ? existing.title : '');
    setActivityDescription(existing ? existing.description || '' : '');
    setIsActivityModalOpen(true);
  };

  const handleSaveActivity = async () => {
    if (!selectedDateForActivity || !selectedSubject) return;
    const dateStr = formatDate(selectedDateForActivity);
    setSavingActivity(true);
    
    const { data, error } = await supabase
      .from('activities')
      .upsert({
        subject_id: selectedSubject,
        activity_date: dateStr,
        title: activityTitle,
        description: activityDescription
      }, { onConflict: 'subject_id,activity_date' })
      .select();

    if (error) {
      alert('Error al guardar la actividad: ' + error.message);
    } else {
      setActivities(prev => {
        const filtered = prev.filter(a => a.activity_date !== dateStr);
        if (data && data[0]) {
          return [...filtered, data[0]];
        }
        return filtered;
      });
      setIsActivityModalOpen(false);
    }
    setSavingActivity(false);
  };

  const handleDeleteActivity = async (date: Date) => {
    if (!selectedSubject) return;
    const dateStr = formatDate(date);
    if (!confirm('¿Estás seguro de que deseas eliminar la actividad registrada para esta fecha?')) return;
    
    setSavingActivity(true);
    const { error } = await supabase
      .from('activities')
      .delete()
      .eq('subject_id', selectedSubject)
      .eq('activity_date', dateStr);

    if (error) {
      alert('Error al eliminar la actividad: ' + error.message);
    } else {
      setActivities(prev => prev.filter(a => a.activity_date !== dateStr));
      setIsActivityModalOpen(false);
    }
    setSavingActivity(false);
  };

  const weekDates = getDatesForWeek(currentWeek);
  const classesOnDays = Array.from(new Set(schedule.map(s => s.day_of_week)));
  const daysToDisplay = weekDates.filter(d => {
    const dayName = Object.keys(DAYS_ENGLISH_TO_SPANISH).find(key => DAYS_SPANISH[d.getDay()] === DAYS_ENGLISH_TO_SPANISH[key]);
    return classesOnDays.includes(dayName || '');
  });

  if (!isAuthorized) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-main)' }}>
        <div className="card glass animate-fade" style={{ width: '100%', maxWidth: '400px', padding: '3rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ width: '4rem', height: '4rem', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: 'var(--primary)' }}>
              <Lock size={32} />
            </div>
            <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Acceso Administrativo</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Ingresa la contraseña para continuar</p>
          </div>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <input 
                type="password" 
                className="btn" 
                style={{ width: '100%', padding: '1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: 'white', textAlign: 'center' }}
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
              />
              {error && <p style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '0.5rem', textAlign: 'center' }}>{error}</p>}
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem' }}>Entrar</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="container animate-fade">
      <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', background: 'linear-gradient(to right, #6366f1, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 800 }}>
            Assistance
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>Registro de asistencia académica • Ing. Mario Ibarra</p>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Link href="/reports" className="btn" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: 'white' }}>
            <FileText size={18} /> Reportes
          </Link>
          <button onClick={handleLogout} className="btn" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444' }}>
            <LogOut size={18} />
          </button>
          <div className="card glass" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={18} color="var(--primary)" />
              <span style={{ fontWeight: 600 }}>Semana {currentWeek}</span>
            </div>
            <div style={{ width: '1px', height: '1rem', background: 'var(--border)' }}></div>
            <div style={{ color: currentWeek <= 8 ? 'var(--accent)' : 'var(--primary)', fontWeight: 700, fontSize: '0.85rem' }}>
              PARCIAL {currentWeek <= 8 ? 'I' : 'II'}
            </div>
          </div>
        </div>
      </header>

      {(() => {
        // Helper to convert database date string (UTC) to a local Date object matching the calendar view
        const getLocalCalendarDate = (dbDateStr: string) => {
          const utcDate = new Date(dbDateStr + 'T00:00:00.000Z');
          return new Date(utcDate.getFullYear(), utcDate.getMonth(), utcDate.getDate());
        };

        const today = new Date();
        const localToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        
        const visibleActivities = activities.filter(act => {
          const actLocalDate = getLocalCalendarDate(act.activity_date);
          return localToday >= actLocalDate;
        });
        
        if (visibleActivities.length === 0) return null;

        return (
          <div className="card glass animate-fade" style={{ 
            marginBottom: '2rem', 
            border: '1px dashed var(--primary)', 
            background: 'rgba(99, 102, 241, 0.05)', 
            padding: '1.5rem',
            borderRadius: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <div style={{ 
              background: 'rgba(99, 102, 241, 0.1)', 
              color: 'var(--primary)', 
              padding: '0.75rem', 
              borderRadius: '0.75rem', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <Bell size={24} style={{ animation: 'bounce 2s infinite' }} />
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                Recordatorio de Revisión de Actividades
              </h3>
              <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Esta semana tiene las siguientes actividades registradas para revisión:
              </p>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
                {visibleActivities.map(act => {
                  const actDate = getLocalCalendarDate(act.activity_date);
                  const daySpan = DAYS_SPANISH[actDate.getDay()];
                  return (
                    <div 
                      key={act.id} 
                      onClick={() => openActivityModal(actDate)}
                      style={{ 
                        background: 'rgba(255,255,255,0.03)', 
                        border: '1px solid var(--border)', 
                        padding: '0.5rem 1rem', 
                        borderRadius: '0.5rem', 
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '0.85rem',
                        transition: 'all 0.2s'
                      }}
                      className="hover-bright"
                    >
                      <BookOpen size={14} color="var(--primary)" />
                      <span style={{ fontWeight: 600 }}>{daySpan}:</span>
                      <span style={{ color: 'rgba(255,255,255,0.9)' }}>{act.title}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })()}

      <main>
        <div className="card glass" style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            
            <div style={{ minWidth: '150px' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Ciclo</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <select 
                  className="btn" 
                  style={{ background: 'var(--bg-main)', color: 'white', border: '1px solid var(--border)', flex: 1 }} 
                  value={selectedCycle} 
                  onChange={(e) => {
                    setSelectedCycle(e.target.value);
                    localStorage.setItem('selected_cycle', e.target.value);
                  }}
                >
                  {availableCycles.map(c => <option key={c.id} value={c.id}>{c.id}</option>)}
                </select>
                <button 
                  className="btn" 
                  style={{ padding: '0.5rem', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
                  onClick={setDefaultCycle}
                  title="Fijar como predeterminado"
                >
                  <Lock size={14} />
                </button>
              </div>
            </div>

            <div style={{ flex: 1, minWidth: '300px' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Asignatura</label>
              <select 
                className="btn" 
                style={{ width: '100%', background: 'var(--bg-main)', color: 'white', border: '1px solid var(--border)' }} 
                value={selectedSubject || ''} 
                onChange={(e) => {
                  setSelectedSubject(e.target.value);
                  localStorage.setItem('selected_subject', e.target.value);
                }}
              >
                {subjects.map(s => <option key={s.id} value={s.id}>{toTitleCase(s.name)}</option>)}
                {subjects.length === 0 && <option value="">No hay materias en este ciclo</option>}
              </select>
              {selectedSubject && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', gap: '0.5rem' }}>
                  <span>ID de enlace:</span>
                  <code style={{ color: 'var(--primary)', fontWeight: 600 }}>{subjects.find(s => s.id === selectedSubject)?.hash_id}</code>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button className="btn btn-primary" style={{ padding: '0.75rem' }} onClick={() => setCurrentWeek(w => Math.max(1, w - 1))}><ChevronLeft size={20} /></button>
              <div style={{ textAlign: 'center', minWidth: '100px' }}>
                <div style={{ fontSize: '1rem', fontWeight: 700 }}>Semana {currentWeek}</div>
              </div>
              <button className="btn btn-primary" style={{ padding: '0.75rem' }} onClick={() => setCurrentWeek(w => Math.min(16, w + 1))}><ChevronRight size={20} /></button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {saving && <span style={{ fontSize: '0.75rem', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><RefreshCcw size={12} className="animate-spin" /> Guardando...</span>}
              <button className="btn" style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)' }} onClick={() => selectedSubject && fetchSubjectData(selectedSubject, currentWeek)}>
                <RefreshCcw size={18} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '10rem 0', gap: '1rem' }}>
            <Loader2 size={48} className="animate-spin" color="var(--primary)" />
            <p style={{ color: 'var(--text-muted)' }}>Cargando...</p>
          </div>
        ) : (
          <div className="card glass table-container animate-fade">
            <table>
              <thead>
                <tr>
                  <th style={{ width: '300px' }}>Estudiante</th>
                  {daysToDisplay.map(date => (
                    <th key={date.toISOString()} style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                        <div>{DAYS_SPANISH[date.getDay()]}</div>
                        <div style={{ fontSize: '0.65rem', fontWeight: 400 }}>{date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}</div>
                        {/* Interactive Activity Icon */}
                        {(() => {
                          const dateStr = formatDate(date);
                          const hasActivity = activities.some(a => a.activity_date === dateStr);
                          const activity = activities.find(a => a.activity_date === dateStr);
                          return (
                            <button
                              onClick={() => openActivityModal(date)}
                              style={{
                                background: hasActivity ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                                border: hasActivity ? '1px solid rgba(99, 102, 241, 0.3)' : '1px dashed rgba(255,255,255,0.15)',
                                borderRadius: '0.375rem',
                                color: hasActivity ? 'var(--primary)' : 'rgba(255,255,255,0.4)',
                                padding: '0.2rem 0.5rem',
                                marginTop: '0.25rem',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                fontSize: '0.65rem',
                                transition: 'all 0.2s',
                              }}
                              className="activity-indicator"
                              title={hasActivity ? `Actividad: ${activity.title} (Clic para editar)` : 'Registrar actividad para esta fecha'}
                            >
                              <BookOpen size={10} color={hasActivity ? 'var(--primary)' : 'rgba(255,255,255,0.4)'} />
                              <span>{hasActivity ? 'Actividad' : '+ Tarea'}</span>
                            </button>
                          );
                        })()}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {students.map(student => (
                  <tr key={student.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontWeight: 700 }}>{student.name.charAt(0)}</div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{student.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{student.cedula}</div>
                        </div>
                      </div>
                    </td>
                    {daysToDisplay.map(date => {
                      const dateStr = formatDate(date);
                      const isChecked = attendanceData[`${student.id}_${dateStr}`];
                      return (
                        <td key={date.toISOString()} style={{ textAlign: 'center' }}>
                          <div className={`checkbox-custom ${isChecked ? 'checked' : ''}`} style={{ margin: '0 auto' }} onClick={() => toggleAttendance(student.id, date)}>
                            {isChecked && <Check size={14} color="white" />}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Modal para Registrar/Editar Actividad */}
      {isActivityModalOpen && selectedDateForActivity && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }} className="animate-fade">
          <div className="card glass" style={{
            width: '100%',
            maxWidth: '500px',
            padding: '2rem',
            border: '1px solid var(--border)',
            position: 'relative'
          }}>
            <button 
              onClick={() => setIsActivityModalOpen(false)}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer'
              }}
            >
              <X size={20} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <div style={{
                background: 'rgba(99, 102, 241, 0.1)',
                color: 'var(--primary)',
                padding: '0.5rem',
                borderRadius: '0.5rem',
                display: 'flex',
                alignItems: 'center'
              }}>
                <BookOpen size={24} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.25rem', margin: 0 }}>
                  Actividad Académica
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0 }}>
                  {DAYS_SPANISH[selectedDateForActivity.getDay()]} • {selectedDateForActivity.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', fontWeight: 600 }}>
                  Título de la Actividad / Tarea
                </label>
                <input 
                  type="text" 
                  className="btn" 
                  style={{
                    width: '100%',
                    background: 'rgba(0,0,0,0.2)',
                    border: '1px solid var(--border)',
                    color: 'white',
                    padding: '0.75rem',
                    textAlign: 'left',
                    cursor: 'text'
                  }}
                  placeholder="Ej. Tarea 1: Resolución de derivadas"
                  value={activityTitle}
                  onChange={(e) => setActivityTitle(e.target.value)}
                  autoFocus
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', fontWeight: 600 }}>
                  Descripción / Instrucciones (Opcional)
                </label>
                <textarea 
                  className="btn" 
                  style={{
                    width: '100%',
                    minHeight: '100px',
                    background: 'rgba(0,0,0,0.2)',
                    border: '1px solid var(--border)',
                    color: 'white',
                    padding: '0.75rem',
                    textAlign: 'left',
                    cursor: 'text',
                    resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
                  placeholder="Ej. Entregar en formato PDF. Revisar que tenga firma del representante."
                  value={activityDescription}
                  onChange={(e) => setActivityDescription(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
                {activities.some(a => a.activity_date === formatDate(selectedDateForActivity)) && (
                  <button
                    onClick={() => handleDeleteActivity(selectedDateForActivity)}
                    disabled={savingActivity}
                    className="btn"
                    style={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.2)',
                      color: 'var(--danger)',
                      marginRight: 'auto'
                    }}
                  >
                    <Trash2 size={16} /> Eliminar
                  </button>
                )}

                <button
                  onClick={() => setIsActivityModalOpen(false)}
                  disabled={savingActivity}
                  className="btn"
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--border)',
                    color: 'var(--text-muted)'
                  }}
                >
                  Cancelar
                </button>

                <button
                  onClick={handleSaveActivity}
                  disabled={savingActivity || !activityTitle.trim()}
                  className="btn btn-primary"
                >
                  {savingActivity ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .hover-bright:hover {
          background: rgba(255, 255, 255, 0.08) !important;
          border-color: rgba(99, 102, 241, 0.5) !important;
          transform: translateY(-1px);
        }
        .activity-indicator:hover {
          background: rgba(99, 102, 241, 0.25) !important;
          border-color: var(--primary) !important;
          color: white !important;
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
}
