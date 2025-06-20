import { pool } from '../shared/config/database';
import axios from 'axios';

async function main() {
    const projectKey = process.argv[2];
    const userId = process.argv[3];

    if (!projectKey || !userId) {
        throw new Error('A chave do projeto (ex: CQ) e o ID do usuário (ex: U0902Q1ELP2) são obrigatórios.');
    }

    try {
        const tokenResult = await pool.query('SELECT access_token, cloud_id FROM jira_tokens WHERE user_id = $1', [userId]);

        if (tokenResult.rows.length === 0) {
            throw new Error(`Nenhum token encontrado para o usuário ${userId}`);
        }
        const { access_token, cloud_id } = tokenResult.rows[0];
        
        const url = `https://api.atlassian.com/ex/jira/${cloud_id}/rest/api/3/issue/createmeta?projectKeys=${projectKey}&expand=projects.issuetypes`;
        
        const response = await axios.get(url, {
            headers: {
                Authorization: `Bearer ${access_token}`,
                Accept: 'application/json',
            },
        });

        const metadata = response.data;

        console.log(`Tipos de Itens Válidos para o Projeto '${projectKey}':`);
        metadata.projects?.forEach((project: any) => {
            project.issuetypes?.forEach((type: any) => {
                console.log(`- Nome: ${type.name}, ID: ${type.id}`);
            });
        });

    } catch (error: any) {
        if (axios.isAxiosError(error)) {
            console.error('Erro na chamada da API do Jira:', JSON.stringify(error.response?.data, null, 2));
        } else {
            console.error('Erro ao listar tipos de issue:', error.message);
        }
    } finally {
        await pool.end();
    }
}

main(); 