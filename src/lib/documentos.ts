/**
 * Validação de documento. Fica separada porque o servidor valida na entrada da
 * candidatura e a tela valida antes de enviar: a regra tem que ser a mesma.
 */

/** Só os dígitos. Aceita máscara, espaço e lixo no meio. */
export function somenteDigitos(bruto: string): string {
  return (bruto || "").replace(/\D/g, "");
}

/**
 * CPF pelo dígito verificador. Sequências de dígito repetido passam na conta
 * mas não existem na Receita, então são recusadas explicitamente.
 */
export function cpfValido(bruto: string): boolean {
  const d = somenteDigitos(bruto);
  if (d.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(d)) return false;

  const digito = (ate: number): number => {
    let soma = 0;
    for (let i = 0; i < ate; i++) soma += Number(d[i]) * (ate + 1 - i);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };

  return digito(9) === Number(d[9]) && digito(10) === Number(d[10]);
}
