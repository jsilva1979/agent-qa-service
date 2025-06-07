import { AnaliseErro } from '../../ai-prompting/domain/AnaliseErro';
import { CodeContext } from '../../github-access/domain/CodeContext';

export interface TechnicalInsight {
  title: string;
  service: string;
  error: {
    type: string;
    message: string;
    stacktrace?: string;
  };
  code: CodeContext;
  analysis: AnaliseErro;
  occurrenceDate: string;
  status: 'resolved' | 'in_progress' | 'pending';
  solution?: string;
  preventiveMeasures?: string[];
} 