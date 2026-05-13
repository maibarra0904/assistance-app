'use client';

import { GraduationCap, Info, ExternalLink } from 'lucide-react';

export default function HomePage() {
  return (
    <div style={{ background: 'var(--bg-main)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div className="container animate-fade" style={{ maxWidth: '800px', textAlign: 'center' }}>
        <div style={{ width: '5rem', height: '5rem', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem', color: 'var(--primary)' }}>
          <GraduationCap size={48} />
        </div>
        
        <h1 style={{ fontSize: '3.5rem', marginBottom: '1.5rem', background: 'linear-gradient(to right, #6366f1, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 800 }}>
          Assistance
        </h1>
        
        <h2 style={{ fontSize: '1.5rem', color: 'white', marginBottom: '3rem', fontWeight: 500 }}>
          Ing. Mario Ibarra
        </h2>

        <div className="card glass" style={{ padding: '3rem', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', textAlign: 'left' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '1rem', borderRadius: '1rem' }}>
              <Info size={32} />
            </div>
            <div>
              <p style={{ fontSize: '1.1rem', lineHeight: '1.6', color: 'rgba(255,255,255,0.9)' }}>
                Bienvenido al portal oficial de control académico. Este sistema gestiona el seguimiento y las calificaciones del período lectivo actual.
              </p>
            </div>
          </div>

          <div style={{ height: '1px', background: 'var(--border)' }}></div>

          <div style={{ background: 'rgba(99, 102, 241, 0.05)', padding: '2rem', borderRadius: '1rem', border: '1px dashed var(--primary)' }}>
            <p style={{ fontSize: '1.2rem', color: 'var(--primary)', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
              <ExternalLink size={24} />
              El enlace a las asistencias de la clase se publicará en la plataforma Teams
            </p>
          </div>
        </div>

        <footer style={{ marginTop: '4rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          <p>© 2026 Universidad - Gestión Académica</p>
        </footer>
      </div>

      <style jsx global>{`
        .glass {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }
      `}</style>
    </div>
  );
}
