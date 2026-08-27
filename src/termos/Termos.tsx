/**
 * Termos de Uso.
 *
 * Mesma regra da Política de Privacidade: descreve o que a plataforma REALMENTE
 * faz hoje, não um modelo genérico. Onde algo ainda não existe (cobrança,
 * cadastro de responsável legal), o texto diz que não existe em vez de fingir.
 *
 * ⚠️ Precisa de revisão por advogado. O aviso está na própria página.
 */
import React from "react";
import { PaginaLegal, Secao, T, li } from "../legal/PaginaLegal";

const ATUALIZADA_EM = "26 de agosto de 2026";

export default function Termos(): JSX.Element {
  return (
    <PaginaLegal
      titulo="Termos de Uso"
      atualizadaEm={ATUALIZADA_EM}
      resumo={
        <>
          A Revivaz <strong>conecta</strong> você a profissionais de saúde mental que atendem em
          regime solidário. Quem cuida de você é o <strong>profissional</strong>, e é dele a
          responsabilidade clínica. A plataforma é o meio. E ela{" "}
          <strong>não é serviço de emergência</strong>: em risco de vida, ligue 188 ou 192.
        </>
      }
    >
      <Secao n="1" titulo="O que é a Revivaz">
        <p style={{ margin: "0 0 8px" }}>
          Uma plataforma de saúde mental solidária. Você conta o que está sentindo, recebe
          acolhimento imediato e é encaminhado a um profissional com registro no conselho da área.
          O atendimento acontece por vídeo, dentro da própria plataforma.
        </p>
        <p style={{ margin: 0 }}>
          Ao usar o site, você concorda com estes termos. Se não concordar, não use.
        </p>
      </Secao>

      <Secao n="2" titulo="O que a Revivaz NÃO é">
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          <li style={li}>
            <strong>Não é serviço de emergência.</strong> Não temos plantão 24h com pessoa do outro
            lado. Em risco à vida, ligue <a href="tel:188" style={{ color: T.teal700, fontWeight: 800 }}>188 (CVV)</a>,
            gratuito e 24 horas, ou <a href="tel:192" style={{ color: T.teal700, fontWeight: 800 }}>192 (SAMU)</a>.
          </li>
          <li style={li}>
            <strong>A IA de acolhimento não é profissional de saúde.</strong> Ela ouve, ajuda a se
            acalmar e mostra o caminho. Não dá diagnóstico, não indica remédio e não faz terapia.
          </li>
          <li style={li}>
            <strong>Não substitui tratamento em curso.</strong> Se você já faz acompanhamento, não
            interrompa por conta própria.
          </li>
        </ul>
      </Secao>

      <Secao n="3" titulo="Quem pode usar">
        <p style={{ margin: "0 0 8px" }}>
          Maiores de 18 anos, em nome próprio.
        </p>
        <p style={{ margin: 0 }}>
          Sete das especialidades atendem <strong>criança e adolescente</strong>. Enquanto o
          cadastro específico de responsável legal não fica pronto, a conta deve ser criada e usada
          pelo <strong>pai, mãe ou responsável legal</strong>, que acompanha o atendimento e responde
          pelo consentimento.
        </p>
      </Secao>

      <Secao n="4" titulo="Sua conta">
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          <li style={li}>
            A entrada é por <strong>link enviado ao seu e-mail</strong>. Não existe senha. O mesmo
            link serve para quem já tem conta e para quem está criando a sua.
          </li>
          <li style={li}>
            Esse link dá acesso à sua ficha de saúde. <strong>Não repasse a ninguém</strong> e
            mantenha seu e-mail protegido.
          </li>
          <li style={li}>Uma conta por pessoa. Não crie conta em nome de outro adulto.</li>
        </ul>
      </Secao>

      <Secao n="5" titulo="Como funciona o atendimento">
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          <li style={li}>
            Você pede a consulta pelo site ou pelo acolhimento. <strong>Pedido não é consulta
            marcada:</strong> a equipe entra em contato para combinar dia e horário.
          </li>
          <li style={li}>
            O encaixe depende de haver profissional disponível na especialidade. Não prometemos
            prazo.
          </li>
          <li style={li}>
            A consulta acontece por vídeo, na sala da plataforma, que só abre para quem é
            participante daquela consulta.
          </li>
          <li style={li}>
            Se não puder comparecer, cancele pela sua conta. Faltar sem avisar ocupa a vaga de
            outra pessoa que está esperando.
          </li>
        </ul>
      </Secao>

      <Secao n="6" titulo="De quem é a responsabilidade clínica">
        <p style={{ margin: "0 0 8px" }}>
          <strong>Do profissional que atende você.</strong> Ele responde pela conduta, pela
          prescrição e pelo registro, perante o conselho dele. A Revivaz é intermediária: organiza
          a agenda, guarda o registro e fornece a sala.
        </p>
        <p style={{ margin: 0 }}>
          Conferimos o registro no cadastro do profissional, mas isso não transfere para a
          plataforma a responsabilidade pelo ato clínico.
        </p>
      </Secao>

      <Secao n="7" titulo="Receita digital">
        <p style={{ margin: 0 }}>
          A receita é emitida pelo profissional e fica disponível em PDF dentro da sua conta.{" "}
          <strong>Hoje ela ainda não tem assinatura digital ICP-Brasil</strong>, o que significa que
          farmácias podem recusá-la. Estamos trabalhando nisso e avisaremos aqui quando mudar.
        </p>
      </Secao>

      <Secao n="8" titulo="Quanto custa">
        <p style={{ margin: "0 0 8px" }}>
          <strong>Hoje o atendimento é gratuito.</strong> Não existe cobrança na plataforma: não há
          checkout, não pedimos cartão e não guardamos dado de pagamento.
        </p>
        <p style={{ margin: 0 }}>
          Quando houver cobrança, o valor aparece antes de você marcar, e estes termos serão
          atualizados antes de valer. Doação é voluntária e não dá prioridade de atendimento.
        </p>
      </Secao>

      <Secao n="9" titulo="O que você não pode fazer">
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          <li style={li}>
            <strong>Gravar a consulta</strong> sem o consentimento do profissional, ou publicar
            qualquer trecho dela.
          </li>
          <li style={li}>Ofender, ameaçar ou assediar profissional ou equipe.</li>
          <li style={li}>Usar a plataforma para obter receita de forma indevida.</li>
          <li style={li}>
            Informar dados falsos, criar conta em nome de terceiro ou tentar acessar a ficha de
            outra pessoa.
          </li>
          <li style={li}>Automatizar acesso, raspar conteúdo ou sobrecarregar o serviço.</li>
        </ul>
        <p style={{ margin: "10px 0 0" }}>
          Podemos suspender ou encerrar a conta que descumprir isto, principalmente quando houver
          risco a alguém. Quando der, avisamos antes.
        </p>
      </Secao>

      <Secao n="10" titulo="Seus dados">
        <p style={{ margin: 0 }}>
          Dado de saúde mental é sensível e tem tratamento próprio, descrito na{" "}
          <a href="/privacidade" style={{ color: T.teal700, fontWeight: 700 }}>Política de Privacidade</a>,
          que faz parte destes termos. Lá está o que coletamos, quem enxerga o quê, por quanto tempo
          guardamos e como você pede tudo de volta ou apaga.
        </p>
      </Secao>

      <Secao n="11" titulo="Encerrar sua conta">
        <p style={{ margin: 0 }}>
          A qualquer momento, escrevendo para{" "}
          <a href="mailto:contato@revivaz.com.br" style={{ color: T.teal700 }}>contato@revivaz.com.br</a>.
          O registro clínico feito por profissional permanece pelo prazo que o conselho exige, mesmo
          após o encerramento: é obrigação legal dele, não escolha nossa.
        </p>
      </Secao>

      <Secao n="12" titulo="Disponibilidade e limites">
        <p style={{ margin: "0 0 8px" }}>
          O serviço é oferecido no estado em que se encontra. Pode ficar fora do ar para manutenção
          ou por falha de terceiros, e não garantimos funcionamento ininterrupto. Por isso mesmo:{" "}
          <strong>não conte com a plataforma em emergência</strong>.
        </p>
        <p style={{ margin: 0 }}>
          Não respondemos por decisões que você tome com base apenas no acolhimento automatizado,
          nem por conduta clínica do profissional, que responde por ela.
        </p>
      </Secao>

      <Secao n="13" titulo="Mudanças nestes termos">
        <p style={{ margin: 0 }}>
          Quando algo mudar, atualizamos a data no topo. Se a mudança afetar seus direitos ou criar
          cobrança, avisamos antes de valer.
        </p>
      </Secao>

      <Secao n="14" titulo="Lei e foro">
        <p style={{ margin: 0 }}>
          Estes termos seguem a lei brasileira. Questões de consumo podem ser levadas ao foro do seu
          domicílio, conforme o Código de Defesa do Consumidor.
        </p>
      </Secao>
    </PaginaLegal>
  );
}
