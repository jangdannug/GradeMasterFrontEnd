import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer } from 'lucide-react';
import depedLogo from '../images/deped.jpg';
import depedCircle from '../images/depedcircle.png';

const SF10JHSForm = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { student, sf10Data, section, isBulk, studentsData } = location.state || {};
  const dataList = isBulk ? studentsData : [{ student, sf10Data, section }];

  if (!isBulk && !student) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No student data found</p>
          <button onClick={() => navigate(-1)} className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase">
            Return to Reports
          </button>
        </div>
      </div>
    );
  }

  const SectionHeader = ({ children }) => (
    <div className="bg-[#d8cfaa] border border-black text-center font-bold text-xs py-0.5 mt-2 uppercase tracking-wide">
      {children}
    </div>
  );

  const UnderlinedField = ({ label, value, className = "", flex = "flex-1" }) => (
    <div className={`flex items-baseline gap-1 ${flex} ${className}`}>
      <span className="text-[10px] font-bold whitespace-nowrap uppercase">{label}:</span>
      <div className="flex-1 border-b border-black h-4 px-1 text-xs font-bold uppercase truncate">
        {value}
      </div>
    </div>
  );

  const ScholasticTable = ({ gradeData, gradeLevelLabel, student, section }) => (
    <div className="mt-2 break-inside-avoid">
      <div className="grid grid-cols-5 text-[9px] gap-x-2">
        <UnderlinedField label="School" value={section?.schoolName} flex="col-span-2" />
        <UnderlinedField label="School ID" value={section?.schoolId} />
        <UnderlinedField label="District" value={section?.district || 'N/A'} />
        <UnderlinedField label="Division" value={section?.division} />
        <UnderlinedField label="Region" value={section?.region} />
        <UnderlinedField label="Grade" value={gradeData ? student?.gradeLevel : gradeLevelLabel || ''} />
        <UnderlinedField label="Section" value={section?.name} />
        <UnderlinedField label="SY" value={student?.schoolYear} />
        <UnderlinedField label="Adviser" value={section?.adviserName} />
        <UnderlinedField label="Signature" value="" />
      </div>

      <table className="w-full border-collapse border border-black mt-1 text-[10px]">
        <thead>
          <tr className="border-b border-black divide-x divide-black">
            <th rowSpan="2" className="w-2/5 p-1 uppercase italic text-left">Learning Areas</th>
            <th colSpan="4" className="p-0 uppercase italic text-[9px] text-center">Quarterly Rating</th>
            <th rowSpan="2" className="w-20 p-0 uppercase italic text-[9px] text-center">Final Rating</th>
            <th rowSpan="2" className="p-1 uppercase italic text-[9px] text-center">Remarks</th>
          </tr>
          <tr className="border-b border-black text-center text-[9px] divide-x divide-black">
            <th className="w-8">1</th><th className="w-8">2</th><th className="w-8">3</th><th className="w-8">4</th>
          </tr>
        </thead>
        <tbody>
          {(gradeData?.subjectGrades || []).filter(sub => sub.name).map((sub, idx) => (
            <tr key={idx} className="border-b border-black h-5 divide-x divide-black">
              <td className={`px-2 ${sub.isComposite ? 'font-bold italic' : ''} ${sub.isComponent ? 'pl-6 text-slate-500' : 'text-slate-900'}`}>
                {sub.name}
              </td>
              {Array.from({ length: 4 }).map((_, i) => {
                const qGrade = sub.quarterlyGrades?.find(q => q.quarter === i + 1);
                return (
                  <td key={i} className="text-center font-bold text-xs">
                    {qGrade?.score || ''}
                  </td>
                );
              })}
              <td className="text-center font-black text-xs">{sub.finalGrade || ''}</td>
              <td className="text-center font-bold text-[8px]">{sub.finalGrade >= 75 ? 'PASSED' : sub.finalGrade > 0 ? 'FAILED' : ''}</td>
            </tr>
          ))}
          <tr className="h-5 font-bold bg-slate-50 divide-x divide-black">
            <td className="px-2 text-right italic uppercase text-[9px]">General Average</td>
            <td colSpan={4}></td>
            <td className="text-center text-xs">{gradeData?.genAvg}</td>
            <td className="text-center text-[9px] uppercase">{gradeData?.genAvg >= 75 ? 'PASSED' : ''}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );

  // Promotion logic
  const getNextGrade = (student, sf10Data) => {
    const current = parseInt(student?.gradeLevel);
    if (isNaN(current)) return '___';
    return sf10Data?.genAvg >= 75 ? String(current + 1) : String(current);
  };

  const principalName = "__________________________";

  return (
    <div className="min-h-screen py-8 pb-32 print:min-h-0 print:py-0 print:pb-0 print:bg-white font-serif">
      {/* Floating Toolbar */}
      <div className="fixed top-6 right-6 flex gap-3 print:hidden z-[100] bg-white/80 backdrop-blur-md p-3 rounded-[2rem] border border-white shadow-2xl shadow-indigo-200/50">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-2xl font-bold text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-colors">
          <ArrowLeft size={16} /> Back
        </button>
        <div className="bg-slate-100 px-4 py-2 rounded-2xl text-[10px] font-black uppercase text-slate-500 border border-slate-200">
          {isBulk ? `Bulk: ${dataList.length} Students` : 'Single Record'}
        </div>
        <button onClick={() => window.print()} className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95">
          <Printer size={16} /> Print SF10
        </button>
      </div>

      {dataList.map((data, idx) => (
        <div key={idx} className="w-[8.5in] min-h-[13in] mx-auto bg-white p-[0.5in] shadow-2xl print:shadow-none print:m-0 border border-slate-300 print:border-none relative flex flex-col break-after-page mb-24 print:mb-0">
        <div className="flex justify-between items-start">
          <span className="text-[8px] font-bold">SF10-JHS</span>
        </div>

        <header className="flex items-center justify-between mt-2">
          <div className="size-16 flex items-center justify-center shrink-0">
            <img src={depedCircle} alt="DepEd Seal" className="w-full h-full object-contain" />
          </div>
          <div className="text-center flex-1">
            <p className="text-xs italic">Republic of the Philippines</p>
            <p className="text-sm font-bold uppercase leading-tight">Department of Education</p>
            <h1 className="text-base font-bold mt-2 uppercase leading-tight">Learner Permanent Academic Record for Junior High School (SF10-JHS)</h1>
            <p className="text-[10px] font-bold italic mt-1">(Formerly Form 137)</p>
          </div>
          <div className="size-16 flex items-center justify-center shrink-0">
            <img src={depedLogo} alt="DepEd Logo" className="w-full h-full object-contain" />
          </div>
        </header>

        <SectionHeader>Learner's Information</SectionHeader>
        <div className="space-y-1 mt-2">
          <div className="flex gap-4">
            <UnderlinedField label="Last Name" value={data.student.name.split(',')[0]} />
            <UnderlinedField label="First Name" value={data.student.name.split(',')[1]?.split(' ')[1]} />
            <UnderlinedField label="Name Ext" value="" flex="w-20" />
            <UnderlinedField label="Middle Name" value={data.student.name.split(' ').pop()} />
          </div>
          <div className="flex gap-4">
            <UnderlinedField label="LRN" value={data.student.lrn} />
            <UnderlinedField label="Birthdate" value="N/A" />
            <UnderlinedField label="Gender" value={data.student.gender} flex="w-32" />
          </div>
        </div>

        <SectionHeader>Eligibility for JHS Enrollment</SectionHeader>
        <div className="border border-black p-2 space-y-2 mt-1">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-1">
              <input type="checkbox" checked readOnly className="w-3 h-3 border-black" />
              <label className="text-[10px] font-bold uppercase">Elementary School Completer</label>
            </div>
            <UnderlinedField label="Gen. Avg" value="" flex="w-32" />
          </div>
          <UnderlinedField label="Name of Elementary School" value="" />
          <div className="grid grid-cols-4 gap-y-2 pt-2 border-t border-slate-100">
             <div className="text-[9px] font-bold uppercase italic col-span-4 underline">Other Credentials:</div>
             <div className="flex gap-4 items-center"><input type="checkbox" className="w-3 h-3" /> <span className="text-[8px] font-bold uppercase">PEPT Passer</span></div>
             <div className="flex gap-4 items-center"><input type="checkbox" className="w-3 h-3" /> <span className="text-[8px] font-bold uppercase">ALS A&E Passer</span></div>
             <UnderlinedField label="Rating" value="" />
          </div>
        </div>

        <SectionHeader>Scholastic Record</SectionHeader>
        <div className="space-y-1">
          {/* Slot 1: Current/Active Grade */}
          <ScholasticTable 
            gradeData={data.sf10Data} 
            student={data.student} 
            section={data.section} 
          />
        </div>

        <SectionHeader>Remedial Classes</SectionHeader>
        <div className="flex items-center gap-2 text-[9px] font-bold uppercase mt-1 px-1">
          <span>Conducted from (mm/dd/yyyy)</span>
          <div className="w-24 border-b border-black h-3"></div>
          <span>to (mm/dd/yyyy)</span>
          <div className="w-24 border-b border-black h-3"></div>
        </div>
        <table className="w-full border-collapse border border-black mt-1 text-[9px]">
          <thead>
            <tr className="border-b border-black divide-x divide-black bg-slate-50 italic">
              <th className="p-1 w-1/3">Learning Areas</th>
              <th className="p-1">Final Rating</th>
              <th className="p-1">Remedial Class Mark</th>
              <th className="p-1">Recomputed Final Grade</th>
              <th className="p-1">Remarks</th>
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4, 5].map(i => <tr key={i} className="h-5 border-b border-black divide-x divide-black"><td></td><td></td><td></td><td></td><td></td></tr>)}
          </tbody>
        </table>

        <div className="mt-6 border border-black p-4 space-y-4 mb-4">
          <div className="flex flex-col items-center">
            <p className="text-[10px] font-black uppercase tracking-tighter mb-1 italic">For Transfer Out / JHS Completer Only</p>
            <div className="w-full bg-[#d8cfaa] text-center font-bold text-[10px] py-1 uppercase border border-black shadow-sm">Certification</div>
          </div>
          
          <div className="text-[11px] leading-loose text-justify">
            I CERTIFY that this is a true record of <span className="inline-block border-b border-black w-64 text-center h-4 font-bold">{data.student.name}</span> 
            with LRN <span className="inline-block border-b border-black w-40 text-center h-4 font-bold">{data.student.lrn}</span> 
            and that he/she is eligible for admission to Grade <span className="inline-block border-b border-black w-16 text-center h-4 font-bold">{getNextGrade(data.student, data.sf10Data)}</span>.
          </div>

          <div className="grid grid-cols-2 gap-x-10 gap-y-4">
            <UnderlinedField label="Name of School" value={data.section?.schoolName} />
            <UnderlinedField label="School ID" value={data.section?.schoolId} />
            <UnderlinedField label="Last School Year Attended" value={data.student.schoolYear} />
          </div>

          <div className="flex justify-between items-end pt-8">
            <div className="text-center w-48">
              <div className="border-b border-black w-full h-4"></div>
              <p className="text-[8px] font-bold uppercase mt-1">Date</p>
            </div>
            
            <div className="size-24 border-2 border-slate-200 border-dashed rounded-full flex items-center justify-center text-slate-300 text-[8px] uppercase text-center p-2">
              (Affix School Seal Here)
            </div>

            <div className="text-center w-80">
              <div className="border-b border-black w-full h-4 font-bold uppercase mb-0.5 text-center">{principalName}</div>
              <p className="text-[8px] font-bold uppercase mt-1">Signature of Principal/School Head over Printed Name</p>
            </div>
          </div>
          <p className="text-[7px] italic text-slate-400 mt-2">(May add Certification box if needed)</p>
        </div>

        <footer className="mt-auto flex justify-between items-end border-t border-slate-100 pt-1 pb-4">
           <p className="text-[7px] text-slate-400 italic italic">SF10-JHS (Formerly Form 137)</p>
           <p className="text-[8px] italic font-bold uppercase">Revised 2025 based on DepEd Order No. 10, s. 2024</p>
        </footer>
      </div>
      ))}

      <style>{`
        @media print {
          @page {
            size: legal portrait;
            margin: 0;
          }
          body {
            margin: 0;
            -webkit-print-color-adjust: exact;
          }
          .print-hidden {
            display: none !important;
          }
        }
        /* Times New Roman setup */
        .font-serif {
          font-family: 'Times New Roman', Times, serif;
        }
      `}</style>
    </div>
  );
};

export default SF10JHSForm;