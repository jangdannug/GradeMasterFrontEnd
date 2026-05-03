
export interface ScoreEntry {
  points: number | null;
}

export interface CategoryGrades {
  categoryId: string;
  scores: ScoreEntry[];
  hps: number[];
  columnNames: string[];
}

export interface SubjectGrades {
  subjectId: string;
  categoryGrades: Record<string, CategoryGrades>; // Key: categoryId
}

export interface TransmutationEntry {
  min: number;
  max: number;
  transmutedValue: number;
}

export interface DescriptorEntry {
  min: number;
  max: number;
  label: string;
  color: string;
}

export interface Student {
  id: string;
  name: string;
  gender: 'MALE' | 'FEMALE';
  sectionId: string;
  grades: Record<string, SubjectGrades>; // Key: subjectId
}

export interface UserRoleAssignment {
  subjectId: string;
  sectionId: string;
}

export interface User {
  id: string;
  name: string;
  username: string;
  password?: string;
  role: 'admin' | 'adviser' | 'teacher' | 'pending';
  assignedSectionId?: string; // If adviser
  assignedSubjectIds: string[]; // Subject IDs they teach
  assignments?: UserRoleAssignment[];
}

export interface UserRegistration {
  id: string;
  name: string;
  username: string;
  password: string;
  email: string;
  requestedRole: 'teacher' | 'adviser';
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface GradingCategory {
  id: string;
  name: string;
  weight: number;
}

export interface Subject {
  id: string;
  name: string;
  teacherName: string;
  teacherId: string;
  sectionId: string;
  categories: GradingCategory[];
}

export interface ClassSection {
  id: string;
  name: string;
  gradeLevel: string;
  adviserId: string;
  schoolYear: string;
  region: string;
  division: string;
  schoolName: string;
  schoolId: string;
}
