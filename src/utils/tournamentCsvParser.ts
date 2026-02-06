import type { TournamentQuestion } from '../services/tournamentService';

export interface TournamentCSVParseResult {
  success: boolean;
  questions?: TournamentQuestion[];
  errors?: string[];
}

/**
 * Parse an English questions CSV.
 * Format: question,option1,option2,option3,option4,correctAnswer
 */
export function parseTournamentCSV(csvContent: string): TournamentCSVParseResult {
  const errors: string[] = [];
  const questions: TournamentQuestion[] = [];

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
      errors.push(`Line ${lineNumber}: Expected 6 columns, found ${parts.length}`);
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
      errors.push(`Line ${lineNumber}: Correct answer must be A, B, C, or D`);
      continue;
    }

    questions.push({
      id: `q-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
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

  return { success: errors.length === 0, questions, errors: errors.length > 0 ? errors : undefined };
}

/**
 * Parse an Arabic translations CSV and merge into existing questions by row index.
 * Format: questionAr,option1Ar,option2Ar,option3Ar,option4Ar
 * Each row maps to the corresponding English question by index (row 1 -> question 1, etc.)
 */
export function mergeArabicCSV(
  csvContent: string,
  existingQuestions: TournamentQuestion[]
): TournamentCSVParseResult {
  const errors: string[] = [];
  const lines = csvContent.trim().split('\n');

  if (lines.length === 0) {
    return { success: false, errors: ['Arabic CSV file is empty'] };
  }

  const hasHeader = lines[0].toLowerCase().includes('question') || lines[0].toLowerCase().includes('سؤال');
  const startIndex = hasHeader ? 1 : 0;
  const dataLines = lines.slice(startIndex).filter(l => l.trim());

  if (dataLines.length === 0) {
    return { success: false, errors: ['No data rows found in Arabic CSV'] };
  }

  if (dataLines.length > existingQuestions.length) {
    errors.push(`Arabic CSV has ${dataLines.length} rows but only ${existingQuestions.length} English questions exist. Extra rows will be ignored.`);
  }

  const merged = existingQuestions.map(q => ({ ...q, options: q.options.map(o => ({ ...o })) }));

  for (let i = 0; i < Math.min(dataLines.length, merged.length); i++) {
    const lineNumber = i + startIndex + 1;
    const line = dataLines[i].trim();
    if (!line) continue;

    const parts = parseCSVLine(line);
    if (parts.length < 5) {
      errors.push(`Line ${lineNumber}: Expected 5 columns (questionAr, opt1Ar, opt2Ar, opt3Ar, opt4Ar), found ${parts.length}`);
      continue;
    }

    const [questionAr, opt1Ar, opt2Ar, opt3Ar, opt4Ar] = parts;

    merged[i].textAr = questionAr.trim();
    if (merged[i].options[0]) merged[i].options[0].textAr = opt1Ar.trim();
    if (merged[i].options[1]) merged[i].options[1].textAr = opt2Ar.trim();
    if (merged[i].options[2]) merged[i].options[2].textAr = opt3Ar.trim();
    if (merged[i].options[3]) merged[i].options[3].textAr = opt4Ar.trim();
  }

  return { success: errors.length === 0, questions: merged, errors: errors.length > 0 ? errors : undefined };
}

/**
 * Generate a sample English CSV
 */
export function generateSampleEnglishCSV(): string {
  const header = 'question,option1,option2,option3,option4,correctAnswer\n';
  const samples = [
    'What is the capital of Egypt?,Cairo,Alexandria,Giza,Luxor,A',
    'Which year was e& founded?,2000,2005,1976,2010,C',
    '"What does ""5G"" stand for?",Fifth Generation,Five Gigabytes,Global 5,Fast Network,A',
  ];
  return header + samples.join('\n');
}

/**
 * Generate a sample Arabic translations CSV
 */
export function generateSampleArabicCSV(): string {
  const header = 'questionAr,option1Ar,option2Ar,option3Ar,option4Ar\n';
  const samples = [
    'ما هي عاصمة مصر؟,القاهرة,الإسكندرية,الجيزة,الأقصر',
    'في أي سنة تأسست e&؟,٢٠٠٠,٢٠٠٥,١٩٧٦,٢٠١٠',
    'ماذا يعني "5G"؟,الجيل الخامس,خمسة جيجابايت,عالمي ٥,شبكة سريعة',
  ];
  return header + samples.join('\n');
}

export function downloadCSV(content: string, filename: string): void {
  const bom = '\uFEFF'; // UTF-8 BOM for Arabic support
  const blob = new Blob([bom + content], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
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
