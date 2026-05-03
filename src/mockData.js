export const USERS = [
  { 
    id: 'admin-1', 
    name: 'SYSTEM ADMINISTRATOR', 
    username: 'admin',
    password: 'pass',
    role: 'admin', 
    assignedSubjectIds: [] 
  },
  { 
    id: 't1', 
    name: 'JUAN DELA CRUZ', 
    username: 'teacher1',
    password: 'pass',
    role: 'teacher', 
    assignedSubjectIds: ['math', 'science'] 
  },
  { 
    id: 't2', 
    name: 'MARIA SANTOS', 
    username: 'teacher2',
    password: 'pass',
    role: 'adviser', 
    assignedSectionId: 'sec-1', 
    assignedSubjectIds: [] 
  },
  { 
    id: 't3', 
    name: 'PEDRO PENDUKO', 
    username: 'teacher3',
    password: 'pass',
    role: 'teacher', 
    assignedSubjectIds: ['english', 'filipino'] 
  },
];

export const INITIAL_STUDENTS = [
  { id: '1', name: 'AGUSTIN, PAUL JAKE, DELA CRUZ', gender: 'MALE', sectionId: 'sec-1', grades: {} },
  { id: '2', name: 'BALBUENA, KHIEL DWYNE, GREGORIO', gender: 'MALE', sectionId: 'sec-1', grades: {} },
  { id: '3', name: 'BALIUAG, KLENHARD XYREN, CARAMAT', gender: 'MALE', sectionId: 'sec-1', grades: {} },
  { id: '4', name: 'BINOSA, CHARLES GREG', gender: 'MALE', sectionId: 'sec-1', grades: {} },
  { id: '5', name: 'CABATIC, MIGUEL PERRY, MARIANO', gender: 'MALE', sectionId: 'sec-1', grades: {} },
  { id: '6', name: 'GREGORIO, KRISTOFFER JOSH, RAMOS', gender: 'MALE', sectionId: 'sec-1', grades: {} },
  { id: '7', name: 'JAVONITALLA, JOHN DALE, DURWIN', gender: 'MALE', sectionId: 'sec-1', grades: {} },
  { id: '8', name: 'DELA CRUZ, ANNA MARIE, REYES', gender: 'FEMALE', gradeLevel: '10', schoolYear: '2025-2026', sectionId: null, grades: {} },
  { id: '9', name: 'SANTOS, MARK ANTHONY, LIM', gender: 'MALE', gradeLevel: '10', schoolYear: '2025-2026', sectionId: null, grades: {} },
  { id: '10', name: 'REYES, CARLA MAE, GARCIA', gender: 'FEMALE', gradeLevel: '9', schoolYear: '2025-2026', sectionId: null, grades: {} },
  { id: '11', name: 'GONZALES, PETER JOHN, CO', gender: 'MALE', gradeLevel: '9', schoolYear: '2025-2026', sectionId: null, grades: {} },
  { id: '12', name: 'LIM, JESSICA ANNE, TAN', gender: 'FEMALE', gradeLevel: '10', schoolYear: '2025-2026', sectionId: 'sec-2', grades: {} },
];

export const INITIAL_SECTIONS = [
  { 
    id: 'sec-1',
    name: 'RUBY',
    gradeLevel: '10',
    adviserId: 't2',
    schoolYear: '2025-2026',
    region: 'REGION I',
    division: 'PANGASINAN II',
    schoolId: '123456',
    schoolName: 'MABINI HIGH SCHOOL'
  },
  { 
    id: 'sec-2',
    name: 'DIAMOND',
    gradeLevel: '10',
    adviserId: '',
    schoolYear: '2025-2026',
    region: 'REGION I',
    division: 'PANGASINAN II',
    schoolId: '123456',
    schoolName: 'MABINI HIGH SCHOOL'
  },
  { 
    id: 'sec-3',
    name: 'ROSE',
    gradeLevel: '9',
    adviserId: '',
    schoolYear: '2025-2026',
    region: 'REGION I',
    division: 'PANGASINAN II',
    schoolId: '123456',
    schoolName: 'MABINI HIGH SCHOOL'
  },
  { 
    id: 'sec-4',
    name: 'SAMPAGUITA',
    gradeLevel: '9',
    adviserId: '',
    schoolYear: '2025-2026',
    region: 'REGION I',
    division: 'PANGASINAN II',
    schoolId: '123456',
    schoolName: 'MABINI HIGH SCHOOL'
  }
];

export const INITIAL_SECTION = INITIAL_SECTIONS[0];

export const DEFAULT_SUBJECTS = [
  { 
    id: 'math', 
    name: 'MATHEMATICS', 
    teacherName: 'JUAN DELA CRUZ', 
    teacherId: 't1', 
    sectionId: 'sec-1',
    code: 'G10-MATH',
    gradeLevel: '10',
    categories: [
      { id: 'cat-ww', name: 'WRITTEN WORKS / ORAL', weight: 0.2 },
      { id: 'cat-st', name: 'SUMMATIVE TESTS', weight: 0.2 },
      { id: 'cat-pt', name: 'PRODUCT / PERFORMANCE', weight: 0.4 },
      { id: 'cat-te', name: 'TERM EXAMINATION', weight: 0.2 }
    ]
  },
  { 
    id: 'science', 
    name: 'SCIENCE', 
    teacherName: 'JUAN DELA CRUZ', 
    teacherId: 't1', 
    sectionId: 'sec-1',
    code: 'G10-SCI',
    gradeLevel: '10',
    categories: [
      { id: 'cat-ww', name: 'WRITTEN WORKS / ORAL', weight: 0.2 },
      { id: 'cat-st', name: 'SUMMATIVE TESTS', weight: 0.2 },
      { id: 'cat-pt', name: 'PRODUCT / PERFORMANCE', weight: 0.4 },
      { id: 'cat-te', name: 'TERM EXAMINATION', weight: 0.2 }
    ] 
  },
  { 
    id: 'english', 
    name: 'ENGLISH', 
    teacherName: 'PEDRO PENDUKO', 
    teacherId: 't3', 
    sectionId: 'sec-1',
    code: 'G10-ENG',
    gradeLevel: '10',
    categories: [
      { id: 'cat-ww', name: 'WRITTEN WORKS / ORAL', weight: 0.2 },
      { id: 'cat-st', name: 'SUMMATIVE TESTS', weight: 0.2 },
      { id: 'cat-pt', name: 'PRODUCT / PERFORMANCE', weight: 0.4 },
      { id: 'cat-te', name: 'TERM EXAMINATION', weight: 0.2 }
    ] 
  },
  { 
    id: 'filipino', 
    name: 'FILIPINO', 
    teacherName: 'PEDRO PENDUKO', 
    teacherId: 't3', 
    sectionId: 'sec-2',
    code: 'G10-FIL',
    gradeLevel: '10',
    categories: [
      { id: 'cat-ww', name: 'WRITTEN WORKS / ORAL', weight: 0.2 },
      { id: 'cat-st', name: 'SUMMATIVE TESTS', weight: 0.2 },
      { id: 'cat-pt', name: 'PRODUCT / PERFORMANCE', weight: 0.4 },
      { id: 'cat-te', name: 'TERM EXAMINATION', weight: 0.2 }
    ] 
  },
  { 
    id: 'ap', 
    name: 'ARALING PANLIPUNAN', 
    teacherName: 'MR. CRUZ', 
    teacherId: 't-external', 
    sectionId: 'sec-3',
    code: 'G9-AP',
    gradeLevel: '9',
    categories: [
      { id: 'cat-ww', name: 'WRITTEN WORKS / ORAL', weight: 0.2 },
      { id: 'cat-st', name: 'SUMMATIVE TESTS', weight: 0.2 },
      { id: 'cat-pt', name: 'PRODUCT / PERFORMANCE', weight: 0.4 },
      { id: 'cat-te', name: 'TERM EXAMINATION', weight: 0.2 }
    ] 
  },
];