import type { Tour, TourRegistryEntry } from '../types';
import { dashboardTour } from './dashboard';
import { leadsTour } from './leads';
import { pipelineTour } from './pipeline';
import { clientsTour } from './clients';
import { iaHomeTour } from './ia-home';
import { iaExcelTour } from './ia-excel';
import { iaClassifyTour } from './ia-classify';
import { iaScoreTour } from './ia-score';
import { iaDuplicatesTour } from './ia-duplicates';
import { iaAssistantTour } from './ia-assistant';
import { iaInsightsTour } from './ia-insights';
import { iaCsvTour, iaPasteTour, iaWhatsAppImportTour } from './ia-imports';
import { whatsappTour } from './whatsapp';
import { boardsTour } from './boards';
import { myWorkTour } from './my-work';
import { taskBoardTour } from './task-board';
import { telemetryTour } from './telemetry';
import { fallbackTour } from './shared';

// IMPORTANTE: rotas mais específicas vêm ANTES das mais genéricas
// (ex.: /admin/ia/classify antes de /admin/ia).
const REGISTRY: TourRegistryEntry[] = [
  { match: '/admin/dashboard', tour: dashboardTour },
  { match: '/admin/leads', tour: leadsTour },
  { match: '/admin/pipeline', tour: pipelineTour },
  { match: '/admin/clients', tour: clientsTour },
  { match: '/admin/my-work', tour: myWorkTour },
  { match: '/admin/whatsapp', tour: whatsappTour },
  { match: '/admin/telemetry', tour: telemetryTour },
  // IA — específicos primeiro
  { match: '/admin/ia/classify', tour: iaClassifyTour },
  { match: '/admin/ia/score', tour: iaScoreTour },
  { match: '/admin/ia/duplicates', tour: iaDuplicatesTour },
  { match: '/admin/ia/assistant', tour: iaAssistantTour },
  { match: '/admin/ia/insights', tour: iaInsightsTour },
  { match: '/admin/ia/excel', tour: iaExcelTour },
  { match: '/admin/ia/csv', tour: iaCsvTour },
  { match: '/admin/ia/paste', tour: iaPasteTour },
  { match: '/admin/ia/whatsapp', tour: iaWhatsAppImportTour },
  { match: '/admin/ia', tour: iaHomeTour },
  // Boards (regex)
  { match: /^\/admin\/boards\//, tour: boardsTour },
  { match: '/admin/task-boards', tour: taskBoardTour },
];

export function resolveTour(pathname: string): Tour {
  // Ordena por especificidade (string mais longa vence) para evitar que
  // /admin/ia "engula" /admin/ia/classify, independente da ordem do array.
  const stringEntries = REGISTRY.filter((e) => typeof e.match === 'string') as Array<
    TourRegistryEntry & { match: string }
  >;
  const regexEntries = REGISTRY.filter((e) => e.match instanceof RegExp);

  const matchingStrings = stringEntries
    .filter((e) => pathname === e.match || pathname.startsWith(e.match + '/'))
    .sort((a, b) => b.match.length - a.match.length);

  if (matchingStrings[0]) return matchingStrings[0].tour;

  for (const entry of regexEntries) {
    if ((entry.match as RegExp).test(pathname)) return entry.tour;
  }

  return fallbackTour;
}

export { fallbackTour };
