/**
 * Política de Privacidade.
 *
 * O texto descreve o que o sistema REALMENTE faz hoje, não um modelo genérico:
 * as tabelas que existem, os sub-processadores que estão no ar e as travas de
 * acesso que estão no banco. Se o produto mudar, este arquivo muda junto.
 *
 * ⚠️ Precisa de revisão por advogado antes de valer como documento definitivo,
 * principalmente na parte de menor de idade. Isso está dito na própria página,
 * para ninguém tratar o rascunho como palavra final.
 */
import React from "react";
import { PaginaLegal, Secao, T, li, tabela, th, td } from "../legal/PaginaLegal";

const ATUALIZADA_EM = "26 de agosto de 2026";

export default function Privacidade(): JSX.Element {
  return (
    <PaginaLegal
      titulo="Política de Privacidade"
      atualizadaEm={ATUALIZADA_EM}
      resumo={
        <>
          Dados de saúde mental são <strong>dados sensíveis</strong>. Coletamos o mínimo para te
          atender, ninguém além de você, do seu profissional e da administração enxerga sua ficha,
          não vendemos nada para ninguém, e você pode pedir tudo de volta ou apagar quando quiser.
        </>
      }
    >
        <Secao n="1" titulo="Quem é o responsável">
          <p style={{ margin: "0 0 8px" }}>
            A plataforma é operada pela iniciativa Revivaz, projeto de saúde mental solidária.
            Contato para qualquer assunto de privacidade, incluindo o exercício dos seus direitos:{" "}
            <a href="mailto:contato@revivaz.com.br" style={{ color: T.teal700 }}>contato@revivaz.com.br</a>.
          </p>
          <p style={{ margin: 0 }}>
            Ainda estamos em constituição jurídica. Assim que o CNPJ estiver ativo, a razão social e
            o encarregado de dados (DPO) aparecem aqui, com nome e canal direto.
          </p>
        </Secao>

        <Secao n="2" titulo="O que coletamos e para quê">
          <table style={tabela}>
            <thead>
              <tr>
                <th style={th}>Dado</th>
                <th style={th}>Quando</th>
                <th style={th}>Para quê</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={td}>E-mail</td>
                <td style={td}>Ao criar conta ou pedir link de acesso</td>
                <td style={td}>É a sua identificação e o único jeito de você entrar</td>
              </tr>
              <tr>
                <td style={td}>Nome, telefone e contato de emergência</td>
                <td style={td}>Ao preencher o perfil ou pedir consulta</td>
                <td style={td}>Marcar a consulta e chegar até você em caso de risco</td>
              </tr>
              <tr>
                <td style={td}>Consultas, receitas e observações clínicas</td>
                <td style={td}>Durante o atendimento</td>
                <td style={td}>Registro do cuidado, feito pelo profissional</td>
              </tr>
              <tr>
                <td style={td}>Triagem PHQ-9 e GAD-7, registro de humor</td>
                <td style={td}>Quando você responde, sempre voluntário</td>
                <td style={td}>Acompanhar sua evolução e orientar o profissional</td>
              </tr>
              <tr>
                <td style={td}>Conversas com a IA dentro da sua conta</td>
                <td style={td}>Quando você usa o chat logado</td>
                <td style={td}>Você retomar de onde parou</td>
              </tr>
              <tr>
                <td style={td}>Avaliação da consulta</td>
                <td style={td}>Quando você avalia</td>
                <td style={td}>Medir a qualidade do atendimento</td>
              </tr>
            </tbody>
          </table>
          <p style={{ margin: "14px 0 0" }}>
            <strong>A conversa da página pública de acolhimento não é gravada.</strong> Ela é enviada
            para gerar a resposta e não fica salva no nosso banco.
          </p>
          <p style={{ margin: "8px 0 0" }}>
            Não usamos cookie de rastreamento, não temos pixel de rede social e não fazemos perfil de
            publicidade. O que o navegador guarda é o necessário para manter você logado.
          </p>
        </Secao>

        <Secao n="3" titulo="Base legal">
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            <li style={li}>
              <strong>Consentimento</strong> para o acolhimento por IA, a triagem e o registro de
              humor. Você aceita antes de usar, e pode retirar depois.
            </li>
            <li style={li}>
              <strong>Tutela da saúde</strong> (art. 11, II, "f" da LGPD) para o registro clínico
              feito por profissional de saúde: consultas, receitas e evolução.
            </li>
            <li style={li}>
              <strong>Proteção da vida</strong> quando houver risco imediato. Nessa situação podemos
              acionar seu contato de emergência ou serviço público de urgência.
            </li>
          </ul>
        </Secao>

        <Secao n="4" titulo="Quem consegue ver o quê">
          <p style={{ margin: "0 0 8px" }}>
            Isso não é promessa de intenção: está implementado como regra no banco de dados, aplicada
            a cada consulta feita ao sistema.
          </p>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            <li style={li}><strong>Você</strong> vê a sua ficha inteira e só a sua.</li>
            <li style={li}>
              <strong>O profissional</strong> vê apenas os pacientes que têm consulta com ele, e
              apenas o necessário para atender.
            </li>
            <li style={li}>
              <strong>A administração</strong> vê o que é preciso para organizar a agenda e a
              operação. É o menor grupo possível de pessoas.
            </li>
            <li style={li}>
              <strong>Ninguém mais.</strong> Não vendemos, não trocamos e não cedemos dado para
              anunciante, seguradora, empregador ou qualquer terceiro comercial.
            </li>
          </ul>
        </Secao>

        <Secao n="5" titulo="Com quem os dados passam (sub-processadores)">
          <p style={{ margin: "0 0 4px" }}>
            Para funcionar, a plataforma usa serviços de terceiros. Eles processam dados por nossa
            conta e sob nossas instruções:
          </p>
          <table style={tabela}>
            <thead>
              <tr>
                <th style={th}>Serviço</th>
                <th style={th}>O que passa por lá</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={td}>Supabase (banco de dados e login)</td>
                <td style={td}>Todo o cadastro e o registro clínico, criptografados em trânsito</td>
              </tr>
              <tr>
                <td style={td}>Contabo (servidor na Alemanha)</td>
                <td style={td}>Hospeda a aplicação e a sala de vídeo</td>
              </tr>
              <tr>
                <td style={td}>Anthropic (Claude)</td>
                <td style={td}>
                  O texto das conversas de acolhimento e as anotações que o profissional escreve para
                  a IA organizar a evolução clínica
                </td>
              </tr>
              <tr>
                <td style={td}>Jitsi (auto-hospedado por nós)</td>
                <td style={td}>Áudio e vídeo da consulta, ao vivo. Não gravamos a consulta</td>
              </tr>
            </tbody>
          </table>
          <p style={{ margin: "14px 0 0" }}>
            Parte desses serviços fica <strong>fora do Brasil</strong>. Isso significa transferência
            internacional de dados, feita com salvaguardas contratuais dos fornecedores.
          </p>
        </Secao>

        <Secao n="6" titulo="A consulta por vídeo não é gravada">
          <p style={{ margin: 0 }}>
            Nem áudio, nem vídeo, nem transcrição automática. O que fica registrado é a
            <strong> evolução clínica escrita pelo profissional</strong>, do jeito que ele revisou e
            salvou. Quando ele usa a IA para organizar essas anotações, o texto que ele digitou ou
            ditou passa pelo serviço de IA, e a versão final é sempre revisada por ele antes de
            entrar na sua ficha.
          </p>
        </Secao>

        <Secao n="7" titulo="Por quanto tempo guardamos">
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            <li style={li}>
              <strong>Registro clínico:</strong> pelo prazo que os conselhos de saúde exigem, hoje
              20 anos a contar do último atendimento. Isso vale mesmo se você apagar a conta, porque
              é obrigação legal do profissional.
            </li>
            <li style={li}>
              <strong>Cadastro, triagens, humor e conversas salvas:</strong> enquanto sua conta
              existir. Você pode apagar quando quiser.
            </li>
            <li style={li}>
              <strong>Pedidos feitos pelo site sem cadastro:</strong> até 12 meses, e depois são
              descartados.
            </li>
          </ul>
        </Secao>

        <Secao n="8" titulo="Seus direitos">
          <p style={{ margin: "0 0 8px" }}>
            Pela LGPD você pode, a qualquer momento: confirmar que tratamos seus dados, acessar tudo
            o que temos, corrigir o que estiver errado, pedir cópia em arquivo, revogar consentimento
            e pedir eliminação (respeitado o prazo legal do registro clínico).
          </p>
          <p style={{ margin: 0 }}>
            Basta escrever para{" "}
            <a href="mailto:contato@revivaz.com.br" style={{ color: T.teal700 }}>contato@revivaz.com.br</a>.
            Respondemos em até 15 dias. Você também pode reclamar à ANPD.
          </p>
        </Secao>

        <Secao n="9" titulo="Criança e adolescente">
          <p style={{ margin: "0 0 8px" }}>
            Sete das nossas especialidades atendem menores de idade: neuropediatria, psiquiatria da
            infância e adolescência, psicologia infantil, terapia ocupacional, fonoaudiologia,
            psicopedagogia e análise do comportamento.
          </p>
          <p style={{ margin: 0 }}>
            <strong>Enquanto o fluxo específico não estiver pronto</strong>, a conta deve ser criada e
            usada pelo <strong>pai, mãe ou responsável legal</strong>, que acompanha o atendimento e
            responde pelo consentimento. Estamos construindo a validação de idade e o registro formal
            do responsável, e esta seção será atualizada quando isso entrar no ar.
          </p>
        </Secao>

        <Secao n="10" titulo="Segurança">
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            <li style={li}>Tudo trafega criptografado (HTTPS).</li>
            <li style={li}>Entrada por link de uso único no e-mail, sem senha para vazar.</li>
            <li style={li}>Separação de acesso aplicada dentro do próprio banco, não só na tela.</li>
            <li style={li}>A sala de vídeo só abre para quem é participante daquela consulta.</li>
          </ul>
          <p style={{ margin: "10px 0 0" }}>
            Nenhum sistema é infalível. Se acontecer um incidente que possa te afetar, comunicamos
            você e a ANPD.
          </p>
        </Secao>

        <Secao n="11" titulo="Emergência">
          <p style={{ margin: 0 }}>
            A plataforma <strong>não é serviço de emergência</strong>. Se houver risco à vida, ligue{" "}
            <a href="tel:188" style={{ color: T.teal700, fontWeight: 800 }}>188 (CVV)</a>, gratuito e
            24 horas, ou <a href="tel:192" style={{ color: T.teal700, fontWeight: 800 }}>192 (SAMU)</a>.
          </p>
        </Secao>

        <Secao n="12" titulo="Mudanças nesta política">
          <p style={{ margin: 0 }}>
            Quando algo mudar, atualizamos a data no topo. Se a mudança afetar seus direitos ou
            ampliar o uso dos dados, avisamos antes de valer.
          </p>
        </Secao>

    </PaginaLegal>
  );
}
