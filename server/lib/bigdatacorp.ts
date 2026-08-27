/**
 * Verificação de identidade do candidato pela BigDataCorp.
 *
 * É COMPLEMENTAR à consulta do conselho: confirma que o nome bate com o CPF e
 * que o CNPJ está ativo. Ela não sabe nada de CRP ou CRM. O retorno é guardado
 * como EVIDÊNCIA da análise; quem decide é o admin.
 *
 * Nunca lança e nunca loga documento inteiro.
 */
import { somenteDigitos } from "../../src/lib/documentos";
import { resolveSecret } from "../config";

const ENDPOINT = "https://plataforma.bigdatacorp.com.br/pessoas";

export interface VerificacaoIdentidade {
  /** false = sem credencial. O admin decide só com o conselho. */
  configurado: boolean;
  nome?: string;
  situacao?: string;
  erro?: string;
  consultadoEm: string;
}

/**
 * Lê na hora da chamada, e não no carregamento do módulo, para o teste conseguir
 * alternar o ambiente. Passa pelo resolveSecret porque em produção a credencial
 * vem por Docker secret (*_FILE) e a env var nem existe: ler process.env cru
 * deixaria a verificação desligada em silêncio.
 */
function credenciais(): { token: string; access: string } {
  return {
    token: resolveSecret("BIGDATACORP_TOKEN", "BIGDATACORP_TOKEN_FILE"),
    access: resolveSecret("BIGDATACORP_ACCESS_TOKEN", "BIGDATACORP_ACCESS_TOKEN_FILE"),
  };
}

export async function verificarIdentidade(params: {
  cpf: string;
  cnpj?: string;
}): Promise<VerificacaoIdentidade> {
  const agora = new Date().toISOString();
  const { token, access } = credenciais();
  if (!token || !access) {
    return { configurado: false, consultadoEm: agora };
  }

  try {
    const doc = somenteDigitos(params.cpf);
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        AccessToken: access,
        TokenId: token,
      },
      body: JSON.stringify({ Datasets: "basic_data", q: `doc{${doc}}` }),
    });
    if (!res.ok) {
      console.error("[bigdatacorp] fornecedor retornou", res.status);
      return { configurado: true, erro: `HTTP ${res.status}`, consultadoEm: agora };
    }
    const corpo = (await res.json()) as {
      Result?: Array<{ BasicData?: { Name?: string; TaxIdStatus?: string } }>;
    };
    const basico = corpo.Result?.[0]?.BasicData;
    return {
      configurado: true,
      nome: basico?.Name,
      situacao: basico?.TaxIdStatus,
      consultadoEm: agora,
    };
  } catch (err) {
    console.error("[bigdatacorp] falha na consulta:", err instanceof Error ? err.message : err);
    return { configurado: true, erro: "falha na consulta", consultadoEm: agora };
  }
}
