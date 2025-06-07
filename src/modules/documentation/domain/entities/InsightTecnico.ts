import crypto from 'crypto';

export interface InsightTecnico {
  id: string;
  servico: string;
  erro: {
    tipo: string;
    mensagem: string;
    stackTrace?: string;
  };
  arquivo: string;
  linha: number;
  sugestao: string;
  contexto?: Record<string, any>;
  timestamp: Date;
  metadados: {
    autor: string;
    status: 'rascunho' | 'publicado' | 'arquivado';
    tags: string[];
    versao: string;
  };
}

export class InsightTecnicoEntity implements InsightTecnico {
  constructor(
    public readonly id: string,
    public readonly servico: string,
    public readonly erro: {
      tipo: string;
      mensagem: string;
      stackTrace?: string;
    },
    public readonly arquivo: string,
    public readonly linha: number,
    public readonly sugestao: string,
    public readonly contexto?: Record<string, any>,
    public readonly timestamp: Date = new Date(),
    public readonly metadados: {
      autor: string;
      status: 'rascunho' | 'publicado' | 'arquivado';
      tags: string[];
      versao: string;
    } = {
      autor: 'Sistema',
      status: 'rascunho',
      tags: [],
      versao: '1.0'
    }
  ) {}

  static create(props: Omit<InsightTecnico, 'id' | 'timestamp' | 'metadados'>): InsightTecnicoEntity {
    return new InsightTecnicoEntity(
      crypto.randomUUID(),
      props.servico,
      props.erro,
      props.arquivo,
      props.linha,
      props.sugestao,
      props.contexto
    );
  }
} 