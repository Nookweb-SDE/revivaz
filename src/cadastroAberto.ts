/**
 * Chave do cadastro e do agendamento no site público.
 *
 * Desligada até o banco de dados novo (Diogo) entrar no ar: sem banco, um
 * cadastro ou pedido de consulta se perderia. Desligada, somem os botões de
 * Entrar/Cadastre-se, Agendar consulta, voluntário e o botão "Abrir minha conta"
 * (a seção dos celulares fica, só sem o botão);
 * "Quero conversar" leva à conversa de acolhimento, que não depende de cadastro.
 * /conta continua acessível pelo endereço direto (admin e profissionais).
 * Para reabrir: trocar para true e publicar.
 */
export const CADASTRO_ABERTO = false;
