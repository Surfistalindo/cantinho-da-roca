import { useEffect, useState } from 'react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { useUserRole } from '@/hooks/useUserRole';
import { useWhatsAppData } from '@/components/whatsapp/useWhatsAppData';
import ConnectionStatusBar from '@/components/whatsapp/ConnectionStatusBar';
import ConversationList from '@/components/whatsapp/ConversationList';
import ConversationThread from '@/components/whatsapp/ConversationThread';
import LeadContextPanel from '@/components/whatsapp/LeadContextPanel';
import SetupDialog from '@/components/whatsapp/SetupDialog';
import AutomationsDialog from '@/components/whatsapp/AutomationsDialog';
import WelcomeBanner from '@/components/whatsapp/WelcomeBanner';
import HelpPanel from '@/components/whatsapp/HelpPanel';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faQuestion } from '@fortawesome/free-solid-svg-icons';
import { cn } from '@/lib/utils';

export default function WhatsAppPage() {
  const { isAdmin } = useUserRole();
  const data = useWhatsAppData();

  const [showSetup, setShowSetup] = useState(false);
  const [showAutomations, setShowAutomations] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [mobileView, setMobileView] = useState<'list' | 'thread'>('list');
  const [showContextSheet, setShowContextSheet] = useState(false);

  const isConfigured = data.config?.is_configured ?? false;

  const handleSelect = (id: string) => {
    data.setSelectedLeadId(id);
    setMobileView('thread');
  };

  // Atalhos globais
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      const isTyping = tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable;

      if (e.key === '?' && !isTyping) {
        e.preventDefault();
        setShowHelp((v) => !v);
        return;
      }
      if (e.key === '/' && !isTyping) {
        e.preventDefault();
        const el = document.querySelector<HTMLInputElement>('[data-wa-search]');
        el?.focus();
        return;
      }
      if (e.key === 'Escape' && mobileView === 'thread') {
        setMobileView('list');
        return;
      }
      if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && !isTyping) {
        const list = data.conversations;
        if (list.length === 0) return;
        const idx = list.findIndex((c) => c.lead.id === data.selectedLeadId);
        let nextIdx = idx;
        if (e.key === 'ArrowDown') nextIdx = idx < 0 ? 0 : Math.min(list.length - 1, idx + 1);
        else nextIdx = idx <= 0 ? 0 : idx - 1;
        const nextLead = list[nextIdx];
        if (nextLead) {
          e.preventDefault();
          data.setSelectedLeadId(nextLead.lead.id);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [data, mobileView]);

  return (
    <div className="-m-4 sm:-m-6 lg:-m-8 h-[calc(100vh-3.5rem)] flex flex-col bg-[hsl(var(--surface-warm))]">
      <WelcomeBanner />

      <ConnectionStatusBar
        isConfigured={isConfigured}
        isAdmin={isAdmin}
        todayStats={data.todayStats}
        onOpenSetup={() => setShowSetup(true)}
        onOpenAutomations={() => setShowAutomations(true)}
      />

      <div className="flex-1 flex overflow-hidden relative">
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
            onChanged={data.reload}
            onApplyFilter={(f) => data.setFilter(f)}
            onOpenAutomations={() => setShowAutomations(true)}
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

        {/* FAB ajuda */}
        <button
          onClick={() => setShowHelp(true)}
          data-tour="wa-help-fab"
          title="Ajuda (?)"
          aria-label="Abrir ajuda"
          className="absolute bottom-4 right-4 z-20 h-11 w-11 rounded-full bg-[hsl(var(--secondary))] hover:bg-[hsl(var(--secondary)/0.9)] text-white shadow-lg flex items-center justify-center transition-transform hover:scale-105"
        >
          <FontAwesomeIcon icon={faQuestion} className="h-4 w-4" />
        </button>
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

      <HelpPanel open={showHelp} onOpenChange={setShowHelp} />
    </div>
  );
}
