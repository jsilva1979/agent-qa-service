export interface AnaliseErro {
  causa: string;
  verificacoesAusentes: string[];
  sugestaoCorrecao: string;
  explicacao: string;
  nivelConfianca: number; // 0-100
} 