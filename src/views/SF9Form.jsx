import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer } from 'lucide-react';
import depedLogo from '../images/deped.jpg';
import depedCircle from '../images/depedcircle.png';

const SF9Form = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { student, reportData, section } = location.state || {};

  if (!student) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-4 font-sans">
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No report data found</p>
          <button onClick={() => navigate(-1)} className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase">
            Return to Reports
          </button>
        </div>
      </div>
    );
  }

  const months = ["Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "Total"];

  const coreValues = [
    {
      value: "1. Maka-Diyos",
      statements: [
        "Expresses spiritual beliefs while respecting the spiritual beliefs of others",
        "Shows adherence to ethical principles by upholding truth"
      ]
    },
    {
      value: "2. Makatao",
      statements: [
        "Is sensitive to individual, social, and cultural differences",
        "Demonstrates contributions toward solidarity"
      ]
    },
    {
      value: "3. Makakalikasan",
      statements: [
        "Cares for the environment and utilizes resources wisely, judiciously, and economically"
      ]
    },
    {
      value: "4. Makabansa",
      statements: [
        "Demonstrates pride in being a Filipino; exercises the rights and responsibilities of a Filipino citizen",
        "Demonstrates appropriate behavior in carrying out activities in the school, community, and country"
      ]
    }
  ];

  const UnderlinedField = ({ label, value, flex = "flex-1" }) => (
    <div className={`flex items-baseline gap-1 ${flex}`}>
      <span className="text-[11px] font-bold whitespace-nowrap uppercase">{label}:</span>
      <div className="flex-1 border-b border-black h-4 px-1 text-xs font-bold uppercase truncate">
        {value}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen py-8 pb-32 print:min-h-0 print:py-0 print:pb-0 print:bg-white font-serif text-black">
      <div className="fixed top-6 right-6 flex gap-3 print:hidden z-[100] bg-white/80 backdrop-blur-md p-3 rounded-[2rem] border border-white shadow-2xl shadow-indigo-200/50 font-sans">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-2xl font-bold text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-colors">
          <ArrowLeft size={16} /> Back
        </button>
        <button onClick={() => window.print()} className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95">
          <Printer size={16} /> Print SF9
        </button>
      </div>

      {/* FRONT PAGE */}
      <div className="w-[8.5in] min-h-[13in] mx-auto bg-white p-[0.5in] shadow-2xl print:shadow-none print:m-0 break-after-page border border-slate-300 print:border-none relative flex flex-col">
        <header className="flex items-center justify-between mb-4">
          <div className="size-16 flex items-center justify-center shrink-0">
            <img src={depedCircle} alt="DepEd Seal" className="w-full h-full object-contain" />
          </div>
          <div className="text-center flex-1">
            <p className="text-[10px] italic leading-none">Republic of the Philippines</p>
            <p className="text-xs font-bold uppercase">Department of Education</p>
            <div className="flex justify-center gap-4 text-[9px] uppercase font-bold mt-1">
              <span>Region: {section?.region}</span>
              <span>Division: {section?.division}</span>
            </div>
            <p className="text-sm font-bold uppercase mt-1 tracking-tight border-b border-black inline-block px-4">{section?.schoolName}</p>
            <p className="text-[9px] italic leading-none mt-1">(Name of School)</p>
          </div>
          <div className="size-16 flex items-center justify-center shrink-0">
            <img src={depedLogo} alt="DepEd Logo" className="w-full h-full object-contain" />
          </div>
        </header>

        <h1 className="text-center text-lg font-black uppercase tracking-tight mb-6">SF9 - Learner's Progress Report Card</h1>

        <section className="space-y-2 mb-6 text-[11px]">
          <div className="flex gap-4">
            <UnderlinedField label="Name" value={student.name} flex="flex-[2]" />
            <UnderlinedField label="LRN" value={student.id} />
          </div>
          <div className="flex gap-4">
            <UnderlinedField label="Grade & Section" value={`Grade ${student.gradeLevel} - ${section?.name}`} />
            <UnderlinedField label="School Year" value={student.schoolYear} flex="w-48" />
          </div>
          <UnderlinedField label="Adviser" value={section?.adviserName} />
          <p className="text-[9px] mt-4 leading-relaxed text-justify italic">
            Dear Parent/Guardian: This report card shows the ability and progress your child has made in the different learning areas as well as his/her core values. The school welcomes you should you desire to know more about your child's progress.
          </p>
        </section>

        <section className="mb-6">
          <table className="w-full border-collapse border border-black text-[10px]">
            <thead>
              <tr className="border-b border-black divide-x divide-black bg-slate-50 italic">
                <th rowSpan="2" className="p-1 w-1/3 uppercase text-left">Learning Areas</th>
                <th colSpan="4" className="p-0 uppercase text-center">Quarter</th>
                <th rowSpan="2" className="p-1 w-16 uppercase text-center">Final Rating</th>
                <th rowSpan="2" className="p-1 w-20 uppercase text-center">Remarks</th>
              </tr>
              <tr className="border-b border-black divide-x divide-black text-center">
                <th className="w-8">1</th><th className="w-8">2</th><th className="w-8">3</th><th className="w-8">4</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black">
              {(reportData.subjectGrades || []).map((sub, idx) => (
                <tr key={idx} className={`divide-x divide-black h-5 ${sub.isComposite ? 'font-bold italic bg-slate-50' : ''}`}>
                  <td className={`px-2 uppercase ${sub.isComponent ? 'pl-6 text-slate-600' : ''}`}>{sub.name}</td>
                  {Array.from({ length: 4 }).map((_, i) => {
                    const qGrade = sub.quarters?.find(q => q?.quarter === i + 1) || sub.quarterlyGrades?.find(q => q?.quarter === i + 1);
                    return <td key={i} className="text-center font-bold">{qGrade?.score || ''}</td>;
                  })}
                  <td className="text-center font-black">{sub.finalRating || sub.finalGrade || ''}</td>
                  <td className="text-center font-bold text-[8px] uppercase">
                    {(sub.finalRating || sub.finalGrade) >= 75 ? 'PASSED' : (sub.finalRating || sub.finalGrade) > 0 ? 'FAILED' : ''}
                  </td>
                </tr>
              ))}
              <tr className="divide-x divide-black font-bold h-6 uppercase bg-slate-50">
                <td className="px-2 text-right italic uppercase text-[9px]">General Average</td>
                <td colSpan={4}></td>
                <td className="text-center text-xs">{reportData.genAvg}</td>
                <td className="text-center text-[9px]">{reportData.genAvg >= 75 ? 'PASSED' : ''}</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section className="mb-4">
          <p className="text-[9px] font-bold uppercase italic mb-1 px-1">Attendance Record</p>
          <table className="w-full border-collapse border border-black text-[8px] text-center">
            <thead>
              <tr className="border-b border-black divide-x divide-black bg-slate-50 italic uppercase">
                <th className="p-1 text-left w-32">Month</th>
                {months.map(m => <th key={m} className="p-1">{m}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-black">
              {["No. of school days", "No. of days present", "No. of days absent"].map(row => (
                <tr key={row} className="divide-x divide-black h-5">
                  <td className="px-1 text-left font-bold uppercase">{row}</td>
                  {months.map((_, i) => <td key={i}></td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <div className="mt-auto border-t border-black pt-4">
           <p className="text-[9px] font-black uppercase italic mb-4">Parent/Guardian Signature per Quarter:</p>
           <div className="grid grid-cols-4 gap-4 px-2">
              {[1,2,3,4].map(q => (
                <div key={q} className="text-center">
                   <div className="border-b border-black w-full h-4 mb-1"></div>
                   <p className="text-[8px] font-bold tracking-tighter">Q{q} Signature</p>
                </div>
              ))}
           </div>
        </div>
      </div>

      {/* BACK PAGE */}
      <div className="w-[8.5in] min-h-[13in] mx-auto bg-white p-[0.5in] shadow-2xl print:shadow-none print:m-0 border border-slate-300 print:border-none mt-12 print:mt-0 relative flex flex-col">
        <h2 className="text-center font-black uppercase text-sm py-1 bg-slate-100 border border-black mb-4 italic">Report on Learner's Observed Values</h2>
        <table className="w-full border-collapse border border-black text-[10px]">
          <thead>
            <tr className="border-b border-black divide-x divide-black bg-slate-50 uppercase italic text-center text-[9px]">
              <th rowSpan="2" className="p-1 w-1/4">Core Values</th>
              <th rowSpan="2" className="p-1 w-1/2">Behavior Statements</th>
              <th colSpan="4" className="p-1">Quarter</th>
            </tr>
            <tr className="border-b border-black divide-x divide-black text-center text-[8px]">
              <th className="w-8">1</th><th className="w-8">2</th><th className="w-8">3</th><th className="w-8">4</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black">
            {coreValues.map((cv, vIdx) => (
              <React.Fragment key={vIdx}>
                {cv.statements.map((stmt, sIdx) => (
                  <tr key={sIdx} className="divide-x divide-black h-8 text-[9px]">
                    {sIdx === 0 && <td rowSpan={cv.statements.length} className="p-1 font-bold align-middle uppercase">{cv.value}</td>}
                    <td className="p-1 text-justify leading-tight italic">{stmt}</td>
                    <td></td><td></td><td></td><td></td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>

        <div className="grid grid-cols-2 gap-8 my-6">
          <div className="border border-black p-2">
            <p className="text-[9px] font-black uppercase italic border-b border-black mb-1">Marking Non-Numerical Rating</p>
            <div className="grid grid-cols-2 text-[8px] gap-y-0.5 uppercase font-bold tracking-tighter">
              <span>AO - Always Observed</span><span>RO - Rarely Observed</span>
              <span>SO - Sometimes Observed</span><span>NO - Not Observed</span>
            </div>
          </div>
          <div className="border border-black p-2">
            <p className="text-[9px] font-black uppercase italic border-b border-black mb-1">Grading Scale</p>
            <table className="w-full text-[8px] uppercase font-bold tracking-tighter">
              <tbody>
                <tr><td>Outstanding (90-100)</td><td className="text-right">Satisfactory (80-84)</td></tr>
                <tr><td>Very Satisfactory (85-89)</td><td className="text-right italic">Did Not Meet Exp. (&lt;75)</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-auto space-y-10 pt-10">
          <div className="grid grid-cols-2 gap-20">
            <div className="text-center"><div className="border-b border-black w-full h-4 font-bold uppercase mb-1">{section?.adviserName}</div><p className="text-[9px] font-black uppercase">Class Adviser</p></div>
            <div className="text-center"><div className="border-b border-black w-full h-4 mb-1"></div><p className="text-[9px] font-black uppercase">Principal / School Head</p></div>
          </div>
          <div className="w-2/3 mx-auto text-center"><div className="border-b border-black w-full h-4 mb-1 italic text-slate-300">Signature</div><p className="text-[9px] font-black uppercase">Parent/Guardian Signature</p></div>
        </div>

        <footer className="mt-12 flex justify-between items-end border-t border-slate-100 pt-1">
           <p className="text-[7px] text-slate-400 italic font-sans">SF9 (Progress Report Card) - DepEd Order 8, s. 2015</p>
           <p className="text-[8px] italic font-bold uppercase font-sans">GradeMaster Systems</p>
        </footer>
      </div>

      <style>{`
        @media print { @page { size: legal portrait; margin: 0; } body { margin: 0; -webkit-print-color-adjust: exact; } }
        .font-serif { font-family: 'Times New Roman', Times, serif; }
      `}</style>
    </div>
  );
};

export default SF9Form;