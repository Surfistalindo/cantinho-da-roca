export type TourPlacement = 'top' | 'bottom' | 'left' | 'right' | 'auto';

export interface TourStep {
  id: string;
  /** CSS selector. Ex.: '[data-tour="leads-search"]'. Use '__viewport__' p/ centralizar sem spotlight. */
  target: string;
  title: string;
  /** Suporta texto + tags simples (<strong>, <em>, <br/>, <ul>/<li>). */
  body: string;
  placement?: TourPlacement;
  /** Aguarda até retornar true antes de mostrar o passo. Útil pra esperar render. */
  waitFor?: () => boolean;
  /** Disparada antes do passo (abrir aba, modal, etc). */
  action?: () => void | Promise<void>;
  /** Texto opcional para o botão "Próximo" (ex.: "Entendi", "Vamos lá"). */
  nextLabel?: string;
}

export interface Tour {
  id: string;
  title: string;
  /** Resumo curto exibido no menu de ajuda. */
  summary: string;
  steps: TourStep[];
  /** Bumpar quando o conteúdo mudar para reexibir o badge "Novo". */
  version?: number;
}

export interface TourRegistryEntry {
  /** Casa por igualdade exata; senão por startsWith. */
  match: string | RegExp;
  tour: Tour;
}
