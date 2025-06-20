import fs from 'fs/promises';
import path from 'path';

export class PromptService {
  private static docsDir = path.resolve(__dirname, '../../docs');

  /**
   * Obtém o prompt pelo contexto (nome do arquivo, sem extensão).
   * Exemplo: 'CRIAÇÃO DE CARDS JIRA' => lê 'CRIAÇÃO DE CARDS JIRA.md'
   * @param context Nome do contexto/prompt (sem extensão)
   * @returns Conteúdo do prompt
   */
  static async getPrompt(context: string): Promise<string> {
    const fileName = `${context}.md`;
    const filePath = path.join(this.docsDir, fileName);
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return content;
    } catch {
      // No futuro: buscar no Supabase se não encontrar localmente
      throw new Error(`Prompt not found for context: ${context}`);
    }
  }

  // Interface pronta para futura integração com Supabase
  // static async getPromptFromSupabase(context: string, language = 'pt'): Promise<string> {
  //   // Exemplo de integração futura
  //   // Buscar prompt do Supabase usando context e language
  //   return '';
  // }
} 