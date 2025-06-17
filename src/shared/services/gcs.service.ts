import { storage, bucketName } from '../config/gcs';
import { v4 as uuidv4 } from 'uuid';

export class GoogleCloudStorageService {
  private bucket;

  constructor() {
    this.bucket = storage.bucket(bucketName);
  }

  /**
   * Faz upload de um arquivo para o Google Cloud Storage.
   * @param filePath O caminho completo do arquivo local para upload.
   * @param destinationFileName O nome do arquivo no bucket do GCS (opcional, um UUID será gerado se não fornecido).
   * @returns O URL público do arquivo no GCS.
   */
  async uploadFile(filePath: string, destinationFileName?: string): Promise<string> {
    const fileName = destinationFileName || `${uuidv4()}-${filePath.split('/').pop()}`;
    const file = this.bucket.file(fileName);

    await file.upload(filePath, {
      destination: fileName,
      resumable: true, // Permite uploads grandes
      validation: 'crc32c', // Garante a integridade dos dados
      metadata: {
        cacheControl: 'public, max-age=31536000', // Cache por 1 ano
      },
    });

    await file.makePublic(); // Torna o arquivo acessível publicamente (ajustar conforme necessidade de segurança)

    console.log(`✅ Arquivo ${fileName} enviado para ${bucketName}.`);
    return `https://storage.googleapis.com/${bucketName}/${fileName}`;
  }

  /**
   * Faz download de um arquivo do Google Cloud Storage.
   * @param fileName O nome do arquivo no bucket do GCS.
   * @param destinationPath O caminho local para salvar o arquivo (opcional, será salvo no diretório atual se não fornecido).
   */
  async downloadFile(fileName: string, destinationPath?: string): Promise<string> {
    const destination = destinationPath || fileName;
    const options = { destination };

    await this.bucket.file(fileName).download(options);

    console.log(`✅ Arquivo ${fileName} baixado para ${destination}.`);
    return destination;
  }

  /**
   * Deleta um arquivo do Google Cloud Storage.
   * @param fileName O nome do arquivo no bucket do GCS.
   */
  async deleteFile(fileName: string): Promise<void> {
    await this.bucket.file(fileName).delete();
    console.log(`✅ Arquivo ${fileName} deletado do bucket.`);
  }
} 