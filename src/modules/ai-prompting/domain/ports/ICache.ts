/**
 * @fileoverview Define a interface para serviços de cache.
 * @version 1.0.0
 * @since 2024-07-26
 * @author Jefferson Silva
 */

export interface ICache {
  /**
   * Obtém um valor do cache com base em uma chave.
   * @param key A chave para buscar o valor.
   * @returns O valor armazenado ou nulo se não encontrado.
   */
  get(key: string): Promise<any | null>;

  /**
   * Armazena um valor no cache com um tempo de expiração opcional.
   * @param key A chave para armazenar o valor.
   * @param value O valor a ser armazenado.
   * @param ttl O tempo de vida em segundos (opcional).
   */
  set(key: string, value: any, ttl?: number): Promise<void>;

  /**
   * Remove um valor do cache com base em uma chave.
   * @param key A chave do valor a ser removido.
   */
  del(key: string): Promise<void>;
} 