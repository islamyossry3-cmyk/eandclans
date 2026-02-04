import type { Question } from '../types/session';

export interface CSVParseResult {
  success: boolean;
  questions?: Question[];
  errors?: string[];
}

export function parseCSV(csvContent: string): CSVParseResult {
  const errors: string[] = [];
  const questions: Question[] = [];

  const lines = csvContent.trim().split('\n');

  if (lines.length === 0) {
    return { success: false, errors: ['CSV file is empty'] };
  }

  const hasHeader = lines[0].toLowerCase().includes('question');
  const startIndex = hasHeader ? 1 : 0;

  for (let i = startIndex; i < lines.length; i++) {
    const lineNumber = i + 1;
    const line = lines[i].trim();

    if (!line) continue;

    const parts = parseCSVLine(line);

    if (parts.length < 6) {
      errors.push(`Line ${lineNumber}: Expected 6 columns (question, option1, option2, option3, option4, correctAnswer), found ${parts.length}`);
      continue;
    }

    const [questionText, opt1, opt2, opt3, opt4, correctAnswer] = parts;

    if (!questionText.trim()) {
      errors.push(`Line ${lineNumber}: Question text is empty`);
      continue;
    }

    if (!opt1.trim() || !opt2.trim() || !opt3.trim() || !opt4.trim()) {
      errors.push(`Line ${lineNumber}: All options must have text`);
      continue;
    }

    const correctAnswerUpper = correctAnswer.trim().toUpperCase();
    if (!['A', 'B', 'C', 'D'].includes(correctAnswerUpper)) {
      errors.push(`Line ${lineNumber}: Correct answer must be A, B, C, or D (found: ${correctAnswer})`);
      continue;
    }

    questions.push({
      id: crypto.randomUUID(),
      text: questionText.trim(),
      options: [
        { id: 'A', text: opt1.trim() },
        { id: 'B', text: opt2.trim() },
        { id: 'C', text: opt3.trim() },
        { id: 'D', text: opt4.trim() },
      ],
      correctAnswer: correctAnswerUpper,
    });
  }

  if (questions.length === 0 && errors.length === 0) {
    return { success: false, errors: ['No valid questions found in CSV'] };
  }

  return {
    success: errors.length === 0,
    questions,
    errors: errors.length > 0 ? errors : undefined,
  };
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}

export function generateSampleCSV(): string {
  const header = 'question,option1,option2,option3,option4,correctAnswer\n';
  const samples = [
    'What is the capital of France?,London,Paris,Berlin,Madrid,B',
    'What is 2 + 2?,3,4,5,6,B',
    '"Which planet is known as the ""Red Planet""?",Venus,Mars,Jupiter,Saturn,B',
  ];

  return header + samples.join('\n');
}

export function downloadSampleCSV(): void {
  const csv = generateSampleCSV();
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'sample-questions.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
