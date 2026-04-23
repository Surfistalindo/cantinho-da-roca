import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBoltLightning, faChevronRight, faCircleCheck, faUserGroup, faUserCheck } from '@fortawesome/free-solid-svg-icons';
import { Button } from '@/components/ui/button';
import InitialsAvatar from '@/components/admin/InitialsAvatar';
import WhatsAppQuickAction from '@/components/admin/WhatsAppQuickAction';
import { cn } from '@/lib/utils';
import {
  type ReengagementCandidate,
  urgencyToneClass,
  urgencyLabel,
} from '@/lib/reengagement';

interface Props {
  candidates: ReengagementCandidate[];
  onSent?: () => void;
  limit?: number;
}

export default function ReengagementQueue({ candidates, onSent, limit = 8 }: Props) {
  const top = candidates.slice(0, limit);
  const totalLeads = candidates.filter((c) => c.kind === 'lead').length;
  const totalCustomers = candidates.filter((c) => c.kind === 'customer').length;

  return (
    <div className="bg-card rounded-2xl border border-border p-6 shadow-soft">
      <div className="flex items-center justify-between mb-4">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <FontAwesomeIcon icon={faBoltLightning} className="w-3.5 h-3.5 text-primary" />
            Fila de reengajamento de hoje
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {totalLeads} lead{totalLeads === 1 ? '' : 's'} sem resposta · {totalCustomers} cliente{totalCustomers === 1 ? '' : 's'} para reativar
          </p>
        </div>
        {candidates.length > limit && (
          <span className="text-[11px] text-muted-foreground tabular-nums">
            +{candidates.length - limit} pendentes
          </span>
        )}
      </div>

      {top.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="w-12 h-12 rounded-2xl bg-success-soft flex items-center justify-center mb-3">
            <FontAwesomeIcon icon={faCircleCheck} className="w-5 h-5 text-success" />
          </div>
          <p className="text-sm font-medium text-foreground">Fila zerada</p>
          <p className="text-xs text-muted-foreground mt-1">Nenhum reengajamento urgente hoje.</p>
        </div>
      ) : (
        <ul className="divide-y divide-border/60 -mx-2">
          {top.map((c) => {
            const detailHref = c.kind === 'lead'
              ? `/admin/leads?focus=${c.id}`
              : `/admin/clients?focus=${c.id}`;
            const productInfo = c.kind === 'lead' ? c.product_interest : c.product_bought;
            const meta = [
              c.kind === 'lead' ? 'Lead' : 'Cliente',
              productInfo,
            ].filter(Boolean).join(' · ');
            const templateLead = c.kind === 'lead'
              ? {
                  id: c.id,
                  name: c.name,
                  phone: c.phone,
                  product_interest: c.product_interest,
                  status: c.status,
                  last_contact_at: c.last_contact_at,
                  created_at: c.created_at,
                }
              : {
                  id: c.id,
                  name: c.name,
                  phone: c.phone,
                  product_bought: c.product_bought,
                  status: 'customer',
                  last_contact_at: c.last_contact_at,
                  created_at: c.purchase_date ?? new Date().toISOString(),
                };
            return (
              <li key={`${c.kind}-${c.id}`}>
                <div className="flex items-center gap-3 px-2 py-3 rounded-xl hover:bg-muted/40 transition-colors">
                  <Link to={detailHref} className="flex items-center gap-3 min-w-0 flex-1">
                    <InitialsAvatar name={c.name} size="md" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground truncate">{c.name}</p>
                        <FontAwesomeIcon
                          icon={c.kind === 'lead' ? faUserGroup : faUserCheck}
                          className="w-3 h-3 text-muted-foreground/60"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {meta} · {c.reason}
                      </p>
                    </div>
                  </Link>
                  <span className={cn(
                    'text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded-full border',
                    urgencyToneClass(c.urgency),
                  )}>
                    {urgencyLabel(c.urgency)}
                  </span>
                  {c.phone && (
                    <WhatsAppQuickAction
                      lead={templateLead}
                      variant="icon"
                      size="sm"
                      onSent={onSent}
                    />
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {candidates.length > limit && (
        <div className="mt-3 pt-3 border-t border-border/60 flex justify-end">
          <Button asChild variant="ghost" size="sm" className="h-7 text-xs">
            <Link to="/admin/clients?view=reactivation">
              Ver painel de reativação <FontAwesomeIcon icon={faChevronRight} className="w-2.5 h-2.5 ml-1" />
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
