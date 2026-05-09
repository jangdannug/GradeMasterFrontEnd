
const roundToTwo = (num) => {
  return Math.round((num + Number.EPSILON) * 100) / 100;
};

export const calculateSubjectResult = (
  sg, 
  subject,
  transmutationTable,
  descriptors
) => {
  // 1. Composite Subject Calculation (e.g., MAPEH = Music + Arts + PE + Health)
  if (subject.categories?.some(cat => cat.isComponent)) {
    const componentResults = subject.categories.map(component => {
      // Create a new sg object for the component, containing only its relevant categoryGrades
      const componentSg = {
        categoryGrades: {}
      };

      if (sg && sg.categoryGrades) {
        component.categories.forEach(compCat => {
          if (sg.categoryGrades[compCat.id]) {
            componentSg.categoryGrades[compCat.id] = sg.categoryGrades[compCat.id];
          }
        });
      }

      // Recursively calculate for each sub-component
      const result = calculateSubjectResult(
        componentSg, // Pass the component-specific sg
        { ...subject, categories: component.categories || [] }, 
        transmutationTable, 
        descriptors
      );
      return { ...result, id: component.id }; // Attach the component ID for the UI to find
    });

    // Average the transmuted (quarterly) grades of all components
    const totalQuarterly = componentResults.reduce((acc, res) => acc + (res.quarterly || 0), 0);
    const finalQuarterly = componentResults.length > 0 ? Math.round(totalQuarterly / componentResults.length) : 0;
    const avgInitial = componentResults.length > 0 ? componentResults.reduce((acc, res) => acc + (res.initial || 0), 0) / componentResults.length : 0;
    
    // Find descriptor for the final averaged grade
    const finalDescriptor = descriptors.find(d => finalQuarterly >= d.min && finalQuarterly <= d.max) || (descriptors.length > 0 ? descriptors[descriptors.length - 1] : { label: '', color: 'text-slate-400' });

    return {
      initial: roundToTwo(avgInitial),
      quarterly: finalQuarterly,
      descriptor: finalDescriptor,
      components: componentResults, // Keep individual component details
      isVerified: componentResults.every(r => r.quarterly > 0),
      isComposite: true
    };
  }

  // 2. Standard Subject Calculation (Normal subjects or individual components)
  const categories = (subject.categories || []).map(cat => {
    const cg = sg?.categoryGrades?.[cat.id];
    const total = (cg?.scores || []).reduce((acc, curr) => acc + ((curr?.points ?? 0)), 0);
    const hpsTotal = (cg?.hps || []).reduce((a, b) => a + ((b ?? 0)), 0);
    const ps = hpsTotal > 0 ? roundToTwo((total / hpsTotal) * 100) : 0;
    const ws = roundToTwo(ps * (cat.weight || 0));
    
    return {
      categoryId: cat.id,
      total,
      ps,
      ws: roundToTwo(ws)
    };
  });

  const initialGrade = roundToTwo((categories || []).reduce((acc, curr) => acc + curr.ws, 0));
  
  // Transmute
  const sortedTable = [...transmutationTable].sort((a, b) => a.min - b.min);
  const transEntry = sortedTable.find(t => initialGrade >= t.min && initialGrade <= t.max);
  const quarterly = transEntry ? transEntry.transmutedValue : (sortedTable[0]?.transmutedValue || 60);

  // Descriptor
  const descriptor = descriptors.find(d => quarterly >= d.min && quarterly <= d.max) || (descriptors.length > 0 ? descriptors[descriptors.length - 1] : { label: '', color: 'text-slate-400' });
  
  // For backward compatibility with the UI until I refactor it fully
  const wwResult = categories.find(c => c.categoryId === 'cat-ww') || { total: 0, ps: 0, ws: 0 };
  const ptResult = categories.find(c => c.categoryId === 'cat-pt') || { total: 0, ps: 0, ws: 0 };

  return {
    initial: initialGrade,
    quarterly,
    descriptor,
    ww: wwResult,
    pt: ptResult,
    categories // Return all category results
  };
};