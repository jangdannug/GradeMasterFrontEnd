import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Upload, Printer, ArrowLeft, FileSpreadsheet, X, Image as ImageIcon } from 'lucide-react';
import { motion } from 'motion/react';
// UPDATED: Use xlsx-js-style to ensure cell.s (styles) are read correctly
import * as XLSX from 'xlsx-js-style';

const V_ALIGN_MAP = { top: 'top', center: 'middle', middle: 'middle', bottom: 'bottom', distributed: 'middle', justify: 'middle' };
const H_ALIGN_MAP = { left: 'left', center: 'center', right: 'right', justify: 'justify', distributed: 'center' };

// Helper component for a consistent table cell
const TableCell = ({ children, className = '', colSpan, rowSpan, style = {} }) => (
  <td
    className={`border border-black text-xs align-top p-1 ${className}`}
    colSpan={colSpan}
    rowSpan={rowSpan}
    style={style}
  >
    {children}
  </td>
);

// Helper component for a consistent table header cell
const TableHeaderCell = ({ children, className = '', colSpan, rowSpan, style = {} }) => (
  <th
    className={`border border-black text-xs font-bold align-middle p-1 bg-gray-100 ${className}`}
    colSpan={colSpan}
    rowSpan={rowSpan}
    style={style}
  >
    {children}
  </th>
);

// Helper to map Excel border styles to CSS
const mapBorderStyle = (style) => {
  if (!style || style === 'none') return 'none';
  const styles = {
    thin: '1px solid',
    medium: '2px solid',
    thick: '3px solid',
    double: '3px double',
    hair: '1px dotted',
    dashed: '1px dashed',
    dotted: '1px dotted',
    dashDot: '1px dashed',
    mediumDashDot: '2px dashed',
    mediumDashed: '2px dashed',
    slantDashDot: '1px dashed',
    dashDotDot: '1px dashed'
  };
  return styles[style] || '1px solid';
};

// Helper to extract color from Excel color object (handles AARRGGBB)
const getExcelColor = (colorObj, defaultColor = 'black') => {
  if (!colorObj) return defaultColor;
  if (colorObj.rgb) {
    let rgb = colorObj.rgb;
    // Strip Alpha channel if present (AARRGGBB -> RRGGBB)
    if (rgb.length === 8) rgb = rgb.substring(2);
    return `#${rgb}`;
  }
  return defaultColor;
};

export default function SF9ExcelReplica() {
  const location = useLocation();
  const navigate = useNavigate();
  const { student, reportData, section } = location.state || {};

  // State for dynamic data
  const [currentStudent, setCurrentStudent] = useState(student || null);
  const [currentSection, setCurrentSection] = useState(section || null);
  const [currentReportData, setCurrentReportData] = useState(reportData || null);
  const [excelGrid, setExcelGrid] = useState(null); // NEW: To store the raw grid structure
  const [scale, setScale] = useState(1); // NEW: Track document scale for auto-fitting
  const [rowHeights, setRowHeights] = useState([]); // Store row heights
  const [hasStyleData, setHasStyleData] = useState(false); // Track if the file provides formatting
  const [colWidths, setColWidths] = useState([]); // Store column widths for exact layout
  const [orientation, setOrientation] = useState('portrait'); // NEW: Track page orientation
  const [leftLogo, setLeftLogo] = useState(null);
  const [rightLogo, setRightLogo] = useState(null);

  const { subjectGrades = [], genAvg = 0 } = currentReportData || {};

  // Calculate the absolute total width of the table based on Excel metadata
  const totalTableWidth = React.useMemo(() => colWidths.reduce((a, b) => a + b, 0), [colWidths]);

  // NEW: Automatically adjust scale to fit the page to the screen width
  React.useEffect(() => {
    if (excelGrid && totalTableWidth > 0) {
      // Use actual table width + page padding (approx 1in total) for scaling
      const availableWidth = window.innerWidth - 320; // Subtract sidebar and padding
      const autoScale = Math.min(1, availableWidth / (totalTableWidth + 96)); 
      setScale(autoScale);
    }
  }, [excelGrid, orientation, totalTableWidth]);

  // Filter out component subjects for the main table, but include them for MAPEH breakdown if needed
  const mainSubjects = subjectGrades.filter(sub => !sub.isComponent);
  const mapehComponents = subjectGrades.filter(sub => sub.isComponent && sub.name.includes("MAPEH")); // Assuming MAPEH components are marked

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

    reader.onload = (e) => {
      try {
        let rows = [];
        if (isExcel) {
          const workbook = XLSX.read(e.target.result, { type: 'array', cellStyles: true });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          
          // Strict Range: A1 (0,0) to T43 (42, 19)
          const endRow = 42; 
          const endCol = 19;

          // Capture and process Column Widths from Excel
          const excelCols = worksheet['!cols'] || [];
          const processedCols = Array.from({ length: endCol + 1 }, (_, j) => {
            const col = excelCols[j];
            if (!col) return 'auto';
            if (col.wpx) return `${col.wpx}px`;
            if (col.width) return `${col.width * 8}px`; // Rough conversion for MDW units
            return 'auto';
          });
          setColWidths(processedCols);

          // Capture and process Row Heights from Excel
          const excelRows = worksheet['!rows'] || [];
          const processedRows = Array.from({ length: endRow + 1 }, (_, i) => {
            const row = excelRows[i];
            if (!row) return 'auto';
            if (row.hpx) return `${row.hpx}px`;
            if (row.hpt) return `${row.hpt}pt`;
            return 'auto';
          });
          setRowHeights(processedRows);

          const processedGrid = [];
          let stylesDetected = false;

          // Build the strict structural grid
          for (let r = 0; r <= endRow; r++) {
            const rowData = [];
            for (let c = 0; c <= endCol; c++) {
              const cellAddress = XLSX.utils.encode_cell({ r, c });
              const cell = worksheet[cellAddress];
              
              if (cell?.s) stylesDetected = true;

              // Identify if cell has content or styling (bold)
              const isBold = cell?.s?.font?.bold || false;
              const isItalic = cell?.s?.font?.italic || false;
              const isUnderline = cell?.s?.font?.underline || false;
              const fontSize = cell?.s?.font?.sz ? `${cell.s.font.sz}pt` : '9pt';
              const fontName = cell?.s?.font?.name || 'inherit';
              const fontColor = getExcelColor(cell?.s?.font?.color, 'inherit');
              const bgColor = cell?.s?.fill?.fgColor ? getExcelColor(cell?.s?.fill?.fgColor, 'white') : 'white';

              rowData.push({
                v: cell ? (cell.w || cell.v) : '', // cell.w is formatted string
                rs: 1, // rowSpan
                cs: 1, // colSpan
                isBold: isBold,
                isItalic: isItalic,
                isUnderline: isUnderline,
                fontSize: fontSize,
                fontName: fontName,
                fontColor,
                bgColor,
                // Strict alignment from Excel metadata
                vAlign: cell?.s?.alignment?.vertical,
                hAlign: cell?.s?.alignment?.horizontal,
                wrapText: cell?.s?.alignment?.wrapText || false,
                indent: cell?.s?.alignment?.indent || 0,
                rotation: cell?.s?.alignment?.textRotation || 0,
                borders: cell?.s?.border ? {
                  top: cell.s.border.top?.style && cell.s.border.top.style !== 'none'
                    ? { s: mapBorderStyle(cell.s.border.top.style), c: getExcelColor(cell.s.border.top.color) } : null,
                  bottom: cell.s.border.bottom?.style && cell.s.border.bottom.style !== 'none' 
                    ? { s: mapBorderStyle(cell.s.border.bottom.style), c: getExcelColor(cell.s.border.bottom.color) } : null,
                  left: cell.s.border.left?.style && cell.s.border.left.style !== 'none' 
                    ? { s: mapBorderStyle(cell.s.border.left.style), c: getExcelColor(cell.s.border.left.color) } : null,
                  right: cell.s.border.right?.style && cell.s.border.right.style !== 'none' 
                    ? { s: mapBorderStyle(cell.s.border.right.style), c: getExcelColor(cell.s.border.right.color) } : null,
                } : null,
                skip: false // helper to ignore cells covered by a merge
              });
            }
            processedGrid.push(rowData);
          }

          // Apply merges from Excel to our grid
          const merges = worksheet['!merges'] || [];
          merges.forEach(m => {
            if (m.s.r < processedGrid.length && m.s.c < processedGrid[0].length) {
              processedGrid[m.s.r][m.s.c].rs = m.e.r - m.s.r + 1;
              processedGrid[m.s.r][m.s.c].cs = m.e.c - m.s.c + 1;
              for (let r = m.s.r; r <= m.e.r; r++) {
                for (let c = m.s.c; c <= m.e.c; c++) {
                  if (r === m.s.r && c === m.s.c) continue;
                  if (processedGrid[r] && processedGrid[r][c]) processedGrid[r][c].skip = true;
                }
              }
            }
          });
          
          // Store for visual replication
          setExcelGrid(processedGrid);
          setHasStyleData(stylesDetected);

          // Also get flat rows for the data extraction logic below
          rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
        } else {
          const content = e.target.result;
          rows = content.split(/\r?\n/).map(line => 
            line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c => c.replace(/"/g, '').trim())
          );
        }
        
        if (rows.length === 0) return;
  
        let newStudent = currentStudent ? { ...currentStudent } : { name: '', lrn: '' };
        let newSection = currentSection ? { ...currentSection } : { 
          name: '', gradeLevel: '', schoolYear: '', schoolName: '', 
          division: '', region: '', adviserName: '' 
        };
        let newGrades = [];
        let isParsingGrades = false;
  
        rows.forEach(cells => {
          if (!cells || cells.length === 0) return;
          
          // Join all cell content to search for keywords anywhere in the row
          const rowText = cells.join(' ').toUpperCase();
          
          // Helper to find value following a label in the same row
          const getValueAfter = (keyword) => {
            const idx = cells.findIndex(c => String(c || '').toUpperCase().includes(keyword));
            return idx !== -1 ? (cells[idx + 1] || cells[idx + 2] || '') : null;
          };
  
          if (rowText.includes('NAME')) {
            const val = getValueAfter('NAME');
            if (val) newStudent.name = val;
          }
          if (rowText.includes('LRN')) {
            const val = getValueAfter('LRN');
            if (val) newStudent.lrn = val;
          }
          if (rowText.includes('GRADE')) {
            const val = getValueAfter('GRADE');
            if (val) newSection.gradeLevel = val;
          }
          if (rowText.includes('SECTION')) {
            const val = getValueAfter('SECTION');
            if (val) newSection.name = val;
          }
          if (rowText.includes('SY') || rowText.includes('SCHOOL YEAR')) {
            const val = getValueAfter('SY') || getValueAfter('SCHOOL YEAR');
            if (val) newSection.schoolYear = val;
          }
          
          if (rowText.includes('SUBJECT') || rowText.includes('LEARNING AREAS')) {
            isParsingGrades = true;
            return;
          }
  
          if (isParsingGrades) {
            const name = cells[0] || cells[1]; // Try first or second column for subject name
            const nameStr = String(name || '').trim();
            
            // Stop parsing if we hit General Average or Footer markers
            if (rowText.includes('GENERAL AVERAGE') || rowText.includes('TOTAL') || (newGrades.length > 5 && !nameStr)) {
              isParsingGrades = false;
              return;
            }
  
            if (nameStr && !['SUBJECT', 'LEARNING AREAS', 'QUARTER'].includes(nameStr.toUpperCase())) {
              // Find scores - they usually follow the name
              const scores = cells.slice(1).filter(c => c !== '' && !isNaN(parseFloat(c))).map(c => parseFloat(c));
              
              newGrades.push({
                name: nameStr,
                // Components usually have leading spaces or are found in rows where col 0 is empty
                isComponent: nameStr.startsWith('  ') || String(name || '').startsWith('\u00A0\u00A0') || (!cells[0] && cells[1]),
                quarterlyGrades: [
                  { quarter: 1, score: scores[0] || null },
                  { quarter: 2, score: scores[1] || null },
                  { quarter: 3, score: scores[2] || null },
                  { quarter: 4, score: scores[3] || null }
                ],
                finalGrade: scores[4] || scores[scores.length - 1] || 0
              });
            }
          }
        });
  
        if (newGrades.length > 0) {
          const nonComp = newGrades.filter(g => !g.isComponent);
          const totalFinal = nonComp.reduce((acc, curr) => acc + (curr.finalGrade || 0), 0);
          const newAvg = nonComp.length > 0 ? Math.round(totalFinal / nonComp.length) : 0;
  
          setCurrentStudent(newStudent);
          setCurrentSection(newSection);
          setCurrentReportData({
            subjectGrades: newGrades,
            genAvg: newAvg
          });
          alert("Template and data replicated successfully from file!");
        } else {
          alert("Could not detect any subject or grade data. Please ensure the file contains a row labeled 'Learning Areas' or 'Subject'.");
        }
      } catch (err) {
        console.error("File processing error:", err);
        alert("Failed to process file: " + err.message);
      }
    };

    if (isExcel) {
      reader.readAsArrayBuffer(file);
    } else {
      reader.readAsText(file);
    }
    event.target.value = ''; // Reset input
  };

  const handleLogoUpload = (side, event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      if (side === 'left') setLeftLogo(e.target.result);
      else setRightLogo(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const removeLogo = (side) => {
    if (side === 'left') setLeftLogo(null);
    else setRightLogo(null);
  };

  return (
    <div className="font-sans text-black text-sm p-4 print:p-0 print:m-0 print:w-full print:h-auto print:overflow-visible">
      {/* Floating Toolbar */}
      <div className="fixed top-6 right-6 flex gap-3 print:hidden z-[100] bg-white/80 backdrop-blur-md p-3 rounded-[2rem] border border-white shadow-2xl shadow-indigo-200/50 font-sans">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-2xl font-bold text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-colors">
          <ArrowLeft size={16} /> Back
        </button>
        
        <label className="flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-200 text-indigo-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-100 transition-all cursor-pointer shadow-sm">
          <Upload size={16} /> Import Excel / CSV
          <input type="file" accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" className="hidden" onChange={handleFileUpload} />
        </label>

        <div className="flex items-center gap-2 border-l border-slate-200 pl-3 ml-1">
          <label className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-[9px] uppercase hover:bg-slate-50 transition-all cursor-pointer">
            <ImageIcon size={14} /> Left Logo
            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleLogoUpload('left', e)} />
          </label>

          <label className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-[9px] uppercase hover:bg-slate-50 transition-all cursor-pointer">
            <ImageIcon size={14} /> Right Logo
            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleLogoUpload('right', e)} />
          </label>
        </div>

        <div className="flex items-center gap-3 border-l border-slate-200 pl-3 ml-1">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Zoom</span>
          <input 
            type="range" 
            min="0.3" max="1.2" step="0.01" 
            value={scale} 
            onChange={(e) => setScale(parseFloat(e.target.value))}
            className="w-24 accent-indigo-600"
          />
        </div>

        <div className="flex items-center gap-1 border-l border-slate-200 pl-3 ml-1">
          <button 
            onClick={() => setOrientation('portrait')}
            className={`px-3 py-2 rounded-xl font-bold text-[9px] uppercase transition-all ${orientation === 'portrait' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
          >
            Portrait
          </button>
          <button 
            onClick={() => setOrientation('landscape')}
            className={`px-3 py-2 rounded-xl font-bold text-[9px] uppercase transition-all ${orientation === 'landscape' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
          >
            Landscape
          </button>
        </div>

        <button onClick={() => window.print()} className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95">
          <Printer size={16} /> Print Replica
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col items-center min-h-screen pt-12 pb-32 print:p-0 print:pt-0">
        {!currentStudent && !excelGrid && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-6 print:hidden">
            <div className="size-32 bg-indigo-50 rounded-[3rem] flex items-center justify-center text-indigo-200 border-4 border-dashed border-indigo-100 shadow-inner">
              <FileSpreadsheet size={64} />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-black text-slate-800 uppercase italic tracking-tighter">Ready for Import</h3>
              <p className="text-sm font-medium text-slate-500 max-w-xs mx-auto">Upload an Excel or CSV file to replicate its layout and data as a report card.</p>
            </div>
            <label className="flex items-center gap-3 px-10 py-4 bg-indigo-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all cursor-pointer shadow-2xl shadow-indigo-200 active:scale-95">
              <Upload size={20} /> Select Local File
              <input type="file" accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" className="hidden" onChange={handleFileUpload} />
            </label>
          </div>
        )}

        {excelGrid && (
          <div 
            style={{ 
              transform: `scale(${scale})`, 
              transformOrigin: 'top center' 
            }}
            className="mx-auto bg-white p-[0.5in] shadow-2xl print:shadow-none print:m-0 border border-slate-300 print:border-none relative flex flex-col mb-12 print:mb-0 transition-all duration-500 w-fit min-h-fit"
          >
            {/* Logo Overlays */}
            {leftLogo && (
              <motion.div 
                drag 
                dragMomentum={false}
                className="absolute top-8 left-8 print:top-4 print:left-4 z-50 group cursor-move"
              >
                <img src={leftLogo} alt="Left Logo" className="h-20 w-auto object-contain pointer-events-none" />
                <button onClick={() => removeLogo('left')} className="absolute -top-2 -right-2 bg-rose-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity print:hidden">
                  <X size={12} />
                </button>
              </motion.div>
            )}
            {rightLogo && (
              <motion.div 
                drag 
                dragMomentum={false}
                className="absolute top-8 right-8 print:top-4 print:right-4 z-50 group cursor-move"
              >
                <img src={rightLogo} alt="Right Logo" className="h-20 w-auto object-contain pointer-events-none" />
                <button onClick={() => removeLogo('right')} className="absolute -top-2 -right-2 bg-rose-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity print:hidden">
                  <X size={12} />
                </button>
              </motion.div>
            )}

            <table
              className="table-fixed"
              style={{ width: `${totalTableWidth}px`, borderCollapse: 'collapse', padding: '0px', margin: '0px' }}
            >
              <colgroup>
                {colWidths.map((width, j) => (
                  <col key={j} style={{ width: `${width}px` }} />
                ))}
              </colgroup>
              <tbody>
                {excelGrid.map((row, i) => {
                  const rowHeight = rowHeights[i] || 20;
                  return (
                  <tr key={i} style={{ height: `${rowHeight}px`, minHeight: `${rowHeight}px` }}>
                    {row.map((cell, j) => {
                      if (cell.skip) return null;

                      // Calculate dimensions for merged cells
                      const cellWidth = colWidths.slice(j, j + cell.cs).reduce((a, b) => a + b, 0);
                      const cellHeight = rowHeights.slice(i, i + cell.rs).reduce((a, b) => a + b, 0);

                      const rotAngle = cell.rotation ? (cell.rotation > 90 ? 90 - cell.rotation : cell.rotation) : 0;

                      const borderStyles = {};
                      if (cell.borders) {
                        if (cell.borders.top) borderStyles.borderTop = `${cell.borders.top.s} ${cell.borders.top.c}`;
                        if (cell.borders.bottom) borderStyles.borderBottom = `${cell.borders.bottom.s} ${cell.borders.bottom.c}`;
                        if (cell.borders.left) borderStyles.borderLeft = `${cell.borders.left.s} ${cell.borders.left.c}`;
                        if (cell.borders.right) borderStyles.borderRight = `${cell.borders.right.s} ${cell.borders.right.c}`;
                      }

                      return (
                        <td 
                          key={j} 
                          rowSpan={cell.rs} 
                          colSpan={cell.cs} 
                          style={{
                            width: `${cellWidth}px`,
                            height: `${cellHeight}px`,
                            verticalAlign: V_ALIGN_MAP[String(cell.vAlign).toLowerCase()] || 'middle',
                            textAlign: H_ALIGN_MAP[String(cell.hAlign).toLowerCase()] || 'left',
                            padding: '0px',
                            paddingLeft: cell.indent ? `${cell.indent * 8}px` : '0px',
                            ...borderStyles, 
                            backgroundColor: cell.bgColor,
                            color: cell.fontColor,
                            fontSize: cell.fontSize,
                            fontFamily: cell.fontName,
                            fontWeight: cell.isBold ? 'bold' : 'normal',
                            fontStyle: cell.isItalic ? 'italic' : 'normal',
                            textDecoration: cell.isUnderline ? 'underline' : 'none',
                            whiteSpace: cell.wrapText ? 'normal' : 'nowrap',
                            overflow: 'hidden',
                            lineHeight: '1',
                            boxSizing: 'border-box',
                            transform: rotAngle ? `rotate(${-rotAngle}deg)` : 'none'
                          }}
                        >
                          {cell.v || ''}
                        </td>
                      );
                    })}
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style>{`
        @page {
          size: legal ${orientation};
          margin: 0.5in;
        }
        body {
          margin: 0;
          -webkit-print-color-adjust: exact; /* Ensures background colors are printed */
          print-color-adjust: exact;
          background-color: white !important;
        }
        table {
          border-collapse: collapse;
        }
      `}</style>
    </div>
  );
}