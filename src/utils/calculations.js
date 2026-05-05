
const roundToTwo = (num) => {
  return Math.round((num + Number.EPSILON) * 100) / 100;
};

export const calculateSubjectResult = (
  sg, 
  subject,
  transmutationTable,
  descriptors
) => {
  const categories = (subject.categories || []).map(cat => {
    const cg = sg?.categoryGrades?.[cat.id];
    const total = (cg?.scores || []).reduce((acc, curr) => acc + ((curr?.points ?? 0)), 0);
    const hpsTotal = (cg?.hps || []).reduce((a, b) => a + ((b ?? 0)), 0) || 1;
    const ps = roundToTwo((total / hpsTotal) * 100);
    const ws = roundToTwo(ps * (cat.weight || 0));
    
    return {
      categoryId: cat.id,
      total,
      ps,
      ws
    };
  });

  const initialGrade = roundToTwo((categories || []).reduce((acc, curr) => acc + curr.ws, 0));
  
  // Transmute
  const transEntry = transmutationTable.find(t => initialGrade >= t.min && initialGrade <= t.max);
  const quarterly = transEntry ? transEntry.transmutedValue : (transmutationTable.sort((a,b) => a.min - b.min)[0]?.transmutedValue || 60);

  // Descriptor
  const descriptor = descriptors.find(d => quarterly >= d.min && quarterly <= d.max) || descriptors[descriptors.length - 1];
  
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