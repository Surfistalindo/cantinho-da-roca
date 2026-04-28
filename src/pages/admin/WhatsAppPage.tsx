import { useState } from 'react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { useUserRole } from '@/hooks/useUserRole';
import { useWhatsAppData } from '@/components/whatsapp/useWhatsAppData';
import ConnectionStatusBar from '@/components/whatsapp/ConnectionStatusBar';
import ConversationList from '@/components/whatsapp/ConversationList';
import ConversationThread from '@/components/whatsapp/ConversationThread';
import LeadContextPanel from '@/components/whatsapp/LeadContextPanel';
import SetupDialog from '@/components/whatsapp/SetupDialog';
import AutomationsDialog from '@/components/whatsapp/AutomationsDialog';
import { cn } from '@/lib/utils';

/**
 * WhatsApp Studio — Inbox unificada (3 colunas → 2 → 1).
 * - Coluna 1: lista de conversas com filtros
 * - Coluna 2: thread + composer
 * - Coluna 3: contexto do lead + status da automação
 *
 * Mobile: 1 coluna, lista por padrão; ao tocar numa conversa, navega pra thread em fullscreen.
 * Tablet: 2 colunas (lista + thread); contexto vira Sheet à direita.
 * Desktop ≥1280: 3 colunas.
 */
export default function WhatsAppPage() {
  const { isAdmin } = useUserRole();
  const data = useWhatsAppData();

  const [showSetup, setShowSetup] = useState(false);
  const [showAutomations, setShowAutomations] = useState(false);
  const [mobileView, setMobileView] = useState<'list' | 'thread'>('list');
  const [showContextSheet, setShowContextSheet] = useState(false);

  const isConfigured = data.config?.is_configured ?? false;

  const handleSelect = (id: string) => {
    data.setSelectedLeadId(id);
    setMobileView('thread');
  };

  return (
    <div className="-m-4 sm:-m-6 lg:-m-8 h-[calc(100vh-3.5rem)] flex flex-col bg-[hsl(var(--surface-warm))]">
      <ConnectionStatusBar
        isConfigured={isConfigured}
        isAdmin={isAdmin}
        todayStats={data.todayStats}
        onOpenSetup={() => setShowSetup(true)}
        onOpenAutomations={() => setShowAutomations(true)}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Coluna 1: lista */}
        <div
          className={cn(
            'border-r border-border w-full lg:w-[320px] xl:w-[340px] shrink-0',
            mobileView === 'thread' && 'hidden lg:flex',
            'flex-col',
          )}
        >
          <ConversationList
            conversations={data.conversations}
            totalCount={data.totalConversations}
            selectedLeadId={data.selectedLeadId}
            onSelect={handleSelect}
            search={data.search}
            onSearch={data.setSearch}
            filter={data.filter}
            onFilter={data.setFilter}
          />
        </div>

        {/* Coluna 2: thread */}
        <div
          className={cn(
            'flex-1 min-w-0',
            mobileView === 'list' && 'hidden lg:flex',
            'flex flex-col',
          )}
        >
          <ConversationThread
            lead={data.selectedLead}
            messages={data.selectedMessages}
            templates={data.templates}
            isConfigured={isConfigured}
            onBack={() => setMobileView('list')}
            onShowContext={() => setShowContextSheet(true)}
            onSent={data.reload}
          />
        </div>

        {/* Coluna 3: contexto (xl em diante) */}
        {data.selectedLead && (
          <div className="hidden xl:block w-[340px] shrink-0">
            <LeadContextPanel
              lead={data.selectedLead}
              messages={data.selectedMessages}
              templates={data.templates}
            />
          </div>
        )}
      </div>

      {/* Sheet contexto para tablet/mobile */}
      <Sheet open={showContextSheet} onOpenChange={setShowContextSheet}>
        <SheetContent side="right" className="w-full sm:max-w-md p-0 xl:hidden">
          {data.selectedLead && (
            <LeadContextPanel
              lead={data.selectedLead}
              messages={data.selectedMessages}
              templates={data.templates}
            />
          )}
        </SheetContent>
      </Sheet>

      <SetupDialog
        open={showSetup}
        onOpenChange={setShowSetup}
        config={data.config}
        onSaved={data.reload}
      />

      <AutomationsDialog
        open={showAutomations}
        onOpenChange={setShowAutomations}
        templates={data.templates}
        onChanged={data.reload}
      />
    </div>
  );
}
