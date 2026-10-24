export interface Lesson {
  id: string;
  title: string;
  minutes: number;
  summary: string;
  objectives: string[];
  sections: { title: string; body: string[]; code?: string }[];
  example: string;
  expectedOutput?: string;
  exercise: {
    prompt: string;
    hint: string;
    starter: string;
    solution: string;
    expectedOutput?: string;
  };
  quiz: { question: string; options: string[]; answer: number; explanation: string };
  references: { label: string; url: string }[];
  tags: string[];
  mode?: 'run' | 'test';
}
export interface CourseModule {
  id: string;
  title: string;
  description: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  lessons: Lesson[];
}
