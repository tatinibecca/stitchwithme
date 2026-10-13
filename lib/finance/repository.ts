/**
 * Acesso aos dados de Finanças. Hoje devolve os mocks; na fase com banco,
 * só esta função passa a consultar o Supabase (mesmo formato: PRD §6).
 */
import { MOCK_CURRENT_MEMBER_ID, MOCK_TODAY, emptyFinanceData, mockFinanceData } from "./mock-data";
import type { FinanceData, Id, ISODate } from "./types";

export interface FinanceSnapshot {
  data: FinanceData;
  /** "Hoje" no fuso America/Sao_Paulo. Fixo nos mocks para o cenário não mudar com o tempo. */
  today: ISODate;
  currentMemberId: Id;
}

export async function getFinanceSnapshot(options: { simulateEmpty?: boolean } = {}): Promise<FinanceSnapshot> {
  return {
    data: options.simulateEmpty ? emptyFinanceData : mockFinanceData,
    today: MOCK_TODAY,
    currentMemberId: MOCK_CURRENT_MEMBER_ID,
  };
}
