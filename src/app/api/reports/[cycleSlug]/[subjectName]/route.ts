import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ cycleSlug: string; subjectName: string }> }
) {
  const { cycleSlug, subjectName } = await params;
  
  // Clean subject name from URL (replace %20 with space, etc)
  const decodedSubjectName = decodeURIComponent(subjectName).replace(/-/g, ' ');

  try {
    // 1. Get the subject and cycle info (lookup by hash_id or name)
    const { data: subject, error: subError } = await supabase
      .from('subjects')
      .select('id, name, academic_cycles(start_date)')
      .eq('cycle_id', cycleSlug)
      .or(`hash_id.eq.${decodedSubjectName},name.ilike.${decodedSubjectName}`)
      .maybeSingle();

    if (subError || !subject) {
      return NextResponse.json({ error: 'Subject not found in this cycle' }, { status: 404 });
    }

    const subjectId = subject.id;

    // 2. Get all enrolled students
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('subject_students')
      .select('students:student_id(id, name, cedula)')
      .eq('subject_id', subjectId);

    if (enrollmentError) throw enrollmentError;
    
    const enrolledStudents = (enrollment || [])
      .map((e: any) => e.students)
      .filter((s: any) => s !== null);

    // 3. Get all attendance records
    const { data: attendanceRecords, error: attError } = await supabase
      .from('attendance')
      .select('student_id, attendance_date, is_present, partial_number')
      .eq('subject_id', subjectId)
      .order('attendance_date', { ascending: true });

    if (attError) throw attError;
    const safeAttendance = attendanceRecords || [];

    // 4. Process the records
    const uniqueDates = Array.from(new Set(safeAttendance.map(r => r.attendance_date))).sort();
    const totalClasses = uniqueDates.length;
    const lastDate = totalClasses > 0 ? uniqueDates[totalClasses - 1] : 'Sin registros';

    // Get unique dates per partial
    const uniqueDatesP1 = Array.from(new Set(safeAttendance.filter(r => r.partial_number === 1).map(r => r.attendance_date)));
    const uniqueDatesP2 = Array.from(new Set(safeAttendance.filter(r => r.partial_number === 2).map(r => r.attendance_date)));
    
    const totalP1 = uniqueDatesP1.length;
    const totalP2 = uniqueDatesP2.length;

    const results = enrolledStudents.map(student => {
      const studentAtt = safeAttendance.filter(r => r.student_id === student.id);
      const attendedCount = studentAtt.filter(r => r.is_present).length;
      
      const attendedP1 = studentAtt.filter(r => r.is_present && r.partial_number === 1).length;
      const attendedP2 = studentAtt.filter(r => r.is_present && r.partial_number === 2).length;
      
      // Map attendance by date for the detailed report
      const history: Record<string, boolean> = {};
      studentAtt.forEach(r => {
        history[r.attendance_date] = r.is_present;
      });

      return {
        id: student.id,
        name: student.name,
        cedula: student.cedula,
        attended: attendedCount,
        total: totalClasses,
        percentage: totalClasses > 0 ? ((attendedCount / totalClasses) * 100).toFixed(2) + '%' : '0.00%',
        p1: { attended: attendedP1, total: totalP1, percentage: totalP1 > 0 ? ((attendedP1 / totalP1) * 100).toFixed(2) + '%' : '-' },
        p2: { attended: attendedP2, total: totalP2, percentage: totalP2 > 0 ? ((attendedP2 / totalP2) * 100).toFixed(2) + '%' : '-' },
        history
      };
    });

    return NextResponse.json({
      subject: subject.name,
      cycle: cycleSlug,
      totalClasses,
      totalP1,
      totalP2,
      uniqueDates,
      lastUpdate: lastDate,
      students: results
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
