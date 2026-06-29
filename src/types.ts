export interface QuizQuestion {
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
}

export type FossilCategory = 'AMMONITE' | 'TRILOBITE' | 'MEGALODON_TOOTH' | 'LEAF_IMPRINT' | 'AMBER_INSECT' | 'DINOSAUR_BONE';

export interface FossilExhibit {
  id: string;
  fossilName: string;
  groupName: string;
  geologicEra: 'Paleozoico' | 'Mesozoico' | 'Cenozoico';
  age: string;
  location: string;
  description: string;
  fossilType: FossilCategory;
  color: string;
  wearFactor: number;
  size: number;
  ridges: number;
  scientificFacts: string[];
  fossilizationProcess: string[];
  curiosities: string[];
  quizQuestions: QuizQuestion[];
  likesCount: number;
  createdBy: string;
  createdAt: string; // ISO String or Firestore timestamp representation
}
