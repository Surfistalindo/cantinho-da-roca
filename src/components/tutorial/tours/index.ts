import type { Tour, TourRegistryEntry } from '../types';
import { dashboardTour } from './dashboard';
import { leadsTour } from './leads';
import { pipelineTour } from './pipeline';
import { clientsTour } from './clients';
import { iaHomeTour } from './ia-home';
import { iaExcelTour } from './ia-excel';
import { whatsappTour } from './whatsapp';
import { boardsTour } from './boards';
import { fallbackTour } from './shared';

const REGISTRY: TourRegistryEntry[] = [
  { match: '/admin/dashboard', tour: dashboardTour },
  { match: '/admin/leads', tour: leadsTour },
  { match: '/admin/pipeline', tour: pipelineTour },
  { match: '/admin/clients', tour: clientsTour },
  { match: '/admin/ia/excel', tour: iaExcelTour },
  { match: '/admin/ia', tour: iaHomeTour },
  { match: '/admin/whatsapp', tour: whatsappTour },
  { match: /^\/admin\/boards\//, tour: boardsTour },
];

export function resolveTour(pathname: string): Tour {
  for (const entry of REGISTRY) {
    if (entry.match instanceof RegExp) {
      if (entry.match.test(pathname)) return entry.tour;
    } else if (pathname === entry.match || pathname.startsWith(entry.match + '/')) {
      return entry.tour;
    }
  }
  return fallbackTour;
}

export { fallbackTour };
