/* eslint-disable @next/next/no-img-element */
import { Exam, Result } from '@prisma/client';

type StudentWithResults = {
  id: string;
  name: string;
  surname: string;
  StudentId: string;
  class: {
    name: string;
  };
  results: (Result & {
    exam: (Exam & {
      title: string;
      lesson: {
        subject: {
          name: string;
        };
      };
    }) | null;
  })[];
};

export const ReportCard = ({ 
  student, 
  onLogoLoad 
}: { 
  student: StudentWithResults;
  onLogoLoad?: () => void;
}) => {
  const subjectResults = (student.results || []).reduce((acc, result) => {
    if (!result.exam || !result.exam.lesson || !result.exam.lesson.subject) return acc;
    const subjectName = result.exam.lesson.subject.name;
    if (!acc[subjectName]) {
      acc[subjectName] = [];
    }
    acc[subjectName].push(result);
    return acc;
  }, {} as Record<string, typeof student.results>);

  const subjectScores = Object.entries(subjectResults).map(([subject, results]) => {
    const totalScore = results.reduce((sum, result) => sum + result.score, 0);
    const averageScore = results.length > 0 ? totalScore / results.length : 0;
    return { subject, score: averageScore };
  });

  const totalScore = subjectScores.reduce((sum, subject) => sum + subject.score, 0);
  const averageScore = subjectScores.length > 0 ? totalScore / subjectScores.length : 0;

  const getGrade = (percentage: number) => {
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B';
    if (percentage >= 60) return 'C';
    if (percentage >= 50) return 'D';
    return 'F';
  };
  
  const getGradeColor = (grade: string) => {
    switch(grade) {
      case 'A+': return 'text-emerald-600';
      case 'A': return 'text-green-600';
      case 'B': return 'text-blue-600';
      case 'C': return 'text-amber-600';
      case 'D': return 'text-orange-600';
      default: return 'text-red-600';
    }
  };

  return (
    <div id="report-card" className="bg-white border-0 rounded-lg shadow-xl overflow-hidden max-w-4xl mx-auto print:scale-90">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white p-1 rounded-full">
              <img 
                src="/logo.png" 
                alt="School Logo" 
                width={48} 
                height={48} 
                className="h-12 w-12" 
                onLoad={onLogoLoad}
                crossOrigin="anonymous"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Academix School</h1>
              <p className="text-xs text-blue-100">Excellence in Education</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-blue-100">Academic Year 2023-2024</p>
            <p className="text-xs text-blue-100">Term: Final</p>
          </div>
        </div>
      </div>

      {/* Report Title */}
      <div className="bg-blue-50 py-2 text-center border-b border-blue-100">
        <h2 className="text-lg font-bold text-blue-800 uppercase tracking-wider">Student Report Card</h2>
      </div>

      {/* Student Info */}
      <div className="p-4 bg-white border-b">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <h3 className="text-gray-500 uppercase text-xs font-semibold tracking-wider mb-1">Student Details</h3>
            <div className="space-y-0.5">
              <p className="font-medium text-base">{student.name} {student.surname}</p>
              <p className="text-sm text-gray-600"><span className="font-medium">Student ID:</span> {student.StudentId}</p>
              <p className="text-sm text-gray-600"><span className="font-medium">Class:</span> {student.class.name}</p>
            </div>
          </div>
          <div className="flex justify-end">
            <div className="text-center bg-blue-50 rounded-lg p-3 w-36">
              <div className="text-4xl font-bold text-blue-600 mb-0">{averageScore.toFixed(1)}</div>
              <div className={`text-lg font-bold ${getGradeColor(getGrade(averageScore))}`}>
                {getGrade(averageScore)}
              </div>
              <div className="text-xs text-gray-500">Overall Grade</div>
            </div>
          </div>
        </div>
      </div>

      {/* Academic Table */}
      <div className="p-4">
        <h3 className="text-gray-700 font-semibold mb-2 pb-1 border-b text-sm">Academic Performance</h3>
        {subjectScores.length > 0 ? (
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remarks</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {subjectScores.map((subject, index) => {
                  const grade = getGrade(subject.score);
                  return (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-3 py-2 text-xs font-medium text-gray-900">{subject.subject}</td>
                      <td className="px-3 py-2 text-xs text-center font-medium">{subject.score.toFixed(1)}</td>
                      <td className={`px-3 py-2 text-xs text-center font-bold ${getGradeColor(grade)}`}>{grade}</td>
                      <td className="px-3 py-2 text-xs text-gray-500">
                        {subject.score >= 80 
                          ? 'Excellent' 
                          : subject.score >= 70 
                            ? 'Very Good' 
                            : subject.score >= 60 
                              ? 'Good' 
                              : subject.score >= 50 
                                ? 'Satisfactory' 
                                : 'Needs Improvement'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td className="px-3 py-2 text-xs font-medium text-gray-900">Overall Average</td>
                  <td className="px-3 py-2 text-xs text-center font-bold">{averageScore.toFixed(1)}</td>
                  <td className={`px-3 py-2 text-xs text-center font-bold ${getGradeColor(getGrade(averageScore))}`}>
                    {getGrade(averageScore)}
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-500">
                    {averageScore >= 80 
                      ? 'Outstanding Performance' 
                      : averageScore >= 70 
                        ? 'Excellent Performance' 
                        : averageScore >= 60 
                          ? 'Good Performance' 
                          : averageScore >= 50 
                            ? 'Satisfactory' 
                            : 'Needs Improvement'}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <div className="text-center p-4 text-gray-500 text-sm">No examination results available</div>
        )}
      </div>

      {/* Remarks */}
      <div className="px-4 pb-4">
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-3 py-1.5 border-b">
            <h4 className="font-medium text-gray-700 text-sm">Teacher&apos;s Remarks</h4>
          </div>
          <div className="p-3 bg-white text-gray-700 text-xs min-h-[50px]">
            {averageScore >= 80 
              ? 'An excellent student who has demonstrated outstanding academic performance. Consistently shows great understanding of subjects.' 
              : averageScore >= 70 
                ? 'A very good student who shows strong understanding across subjects. Demonstrates good learning ability.' 
                : averageScore >= 60 
                  ? 'A good student with satisfactory performance. Shows potential, but needs to work on consistency.' 
                  : averageScore >= 50 
                    ? 'Student needs to improve in several subjects. More effort and regular study habits required.' 
                    : 'Student requires significant improvement in most subjects. Regular study time recommended.'}
          </div>
        </div>
      </div>

      {/* Signatures */}
      <div className="px-4 pb-5">
        <div className="grid grid-cols-2 gap-6 mt-4 pt-3 border-t">
          <div className="text-center">
            <div className="h-8 mb-1"></div>
            <div className="border-t border-gray-300 pt-1">
              <p className="text-gray-700 font-medium text-xs">Class Teacher</p>
            </div>
          </div>
          <div className="text-center">
            <div className="h-8 mb-1"></div>
            <div className="border-t border-gray-300 pt-1">
              <p className="text-gray-700 font-medium text-xs">Principal</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-50 p-2 text-center text-gray-500 text-xs border-t">
        <p>Report generated on {new Date().toLocaleDateString()}</p>
        <p className="mt-0.5">Academix Cloud School Management System</p>
      </div>
    </div>
  );
};
