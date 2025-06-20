import { PromptService } from './prompt.service';

describe('PromptService', () => {
  it('should read an existing prompt file', async () => {
    const content = await PromptService.getPrompt('CRIAÇÃO DE CARDS JIRA');
    expect(content).toContain('Como especialista em QA');
    expect(content).toContain('JIRA');
  });

  it('should throw an error for a non-existent prompt', async () => {
    await expect(PromptService.getPrompt('PROMPT_INEXISTENTE'))
      .rejects
      .toThrow('Prompt not found for context: PROMPT_INEXISTENTE');
  });
}); 