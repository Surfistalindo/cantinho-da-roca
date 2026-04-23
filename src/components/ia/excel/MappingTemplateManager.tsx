import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFloppyDisk, faFolderOpen, faTrash, faXmark, faWandMagicSparkles } from '@fortawesome/free-solid-svg-icons';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { listTemplates, type MappingTemplate } from '@/services/ia/mappingTemplates';
import { CRM_FIELD_LABELS } from '@/lib/ia/fieldDictionary';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { ColumnMapping } from '@/services/ia/columnMapper';

interface MappingTemplateManagerProps {
  mappings: ColumnMapping[];
  onSave: (name: string) => void;
  onApply: (id: string) => void;
  onDelete: (id: string) => void;
  detectedTemplate: MappingTemplate | null;
  onDismissDetected: () => void;
}

export default function MappingTemplateManager({
  mappings, onSave, onApply, onDelete, detectedTemplate, onDismissDetected,
}: MappingTemplateManagerProps) {
  const [saveOpen, setSaveOpen] = useState(false);
  const [loadOpen, setLoadOpen] = useState(false);
  const [name, setName] = useState('');
  const [templates, setTemplates] = useState<MappingTemplate[]>(() => listTemplates());

  const refreshTemplates = () => setTemplates(listTemplates());

  const handleSave = () => {
    if (!name.trim()) return;
    onSave(name.trim());
    setName('');
    setSaveOpen(false);
    refreshTemplates();
  };

  const handleApply = (id: string) => {
    onApply(id);
    setLoadOpen(false);
  };

  const handleDelete = (id: string) => {
    onDelete(id);
    refreshTemplates();
  };

  const mappedCount = mappings.filter((m) => m.target !== 'ignore').length;
  const canSave = mappedCount > 0;

  return (
    <>
      {/* Banner de template detectado */}
      {detectedTemplate && (
        <div className="rounded-xl border-2 border-primary/30 bg-primary/5 px-4 py-3 flex items-center gap-3 mb-3">
          <span className="h-8 w-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0">
            <FontAwesomeIcon icon={faWandMagicSparkles} className="h-3.5 w-3.5" />
          </span>
          <div className="flex-1 min-w-0">
            <div className="text-[12.5px] font-semibold text-foreground">
              Template detectado: "{detectedTemplate.name}"
            </div>
            <p className="text-[11.5px] text-muted-foreground">
              As colunas desta planilha combinam com um template salvo. Aplicar agora?
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={onDismissDetected} className="h-7 text-[11.5px]">
            Ignorar
          </Button>
          <Button size="sm" onClick={() => onApply(detectedTemplate.id)} className="h-7 text-[11.5px]">
            Aplicar
          </Button>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          size="sm" variant="outline"
          onClick={() => setSaveOpen(true)}
          disabled={!canSave}
          className="h-8 text-[11.5px] gap-1.5"
        >
          <FontAwesomeIcon icon={faFloppyDisk} className="h-3 w-3" />
          Salvar template
        </Button>
        <Button
          size="sm" variant="outline"
          onClick={() => { refreshTemplates(); setLoadOpen(true); }}
          className="h-8 text-[11.5px] gap-1.5"
        >
          <FontAwesomeIcon icon={faFolderOpen} className="h-3 w-3" />
          Carregar template
          {templates.length > 0 && (
            <span className="ml-0.5 text-[10px] font-mono bg-muted px-1 rounded">{templates.length}</span>
          )}
        </Button>
      </div>

      {/* Save dialog */}
      <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Salvar template de mapeamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-[12px] font-medium text-foreground">Nome do template</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Planilha de vendas mensal"
                className="mt-1"
                autoFocus
              />
            </div>
            <div className="rounded-lg border bg-muted/20 p-3 max-h-48 overflow-y-auto">
              <div className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground mb-2">
                {mappedCount} {mappedCount === 1 ? 'mapeamento' : 'mapeamentos'} a salvar
              </div>
              <ul className="space-y-1">
                {mappings.filter((m) => m.target !== 'ignore').map((m) => (
                  <li key={m.source} className="text-[12px] flex items-center justify-between gap-2">
                    <span className="font-mono text-foreground/80 truncate">{m.source}</span>
                    <span className="text-muted-foreground">→</span>
                    <span className="font-medium text-foreground shrink-0">{CRM_FIELD_LABELS[m.target]}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setSaveOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={!name.trim()}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Load dialog */}
      <Dialog open={loadOpen} onOpenChange={setLoadOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Templates salvos</DialogTitle>
          </DialogHeader>
          {templates.length === 0 ? (
            <div className="py-8 text-center">
              <div className="mx-auto h-10 w-10 rounded-full bg-muted text-muted-foreground flex items-center justify-center mb-2">
                <FontAwesomeIcon icon={faFolderOpen} className="h-4 w-4" />
              </div>
              <p className="text-[13px] font-medium text-foreground">Nenhum template salvo ainda</p>
              <p className="text-[12px] text-muted-foreground mt-1">
                Configure o mapeamento e clique em "Salvar template" para reutilizar depois.
              </p>
            </div>
          ) : (
            <ul className="divide-y border rounded-lg max-h-[400px] overflow-y-auto">
              {templates.map((t) => (
                <li key={t.id} className="px-3 py-3 flex items-center gap-3 hover:bg-muted/20 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium text-foreground truncate">{t.name}</div>
                    <div className="text-[11px] text-muted-foreground flex items-center gap-2 mt-0.5">
                      <span>{formatDistanceToNow(new Date(t.createdAt), { addSuffix: true, locale: ptBR })}</span>
                      <span>·</span>
                      <span className="font-mono">{t.mappings.length} campos</span>
                    </div>
                  </div>
                  <Button
                    size="sm" variant="ghost"
                    onClick={() => handleDelete(t.id)}
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                    aria-label={`Excluir ${t.name}`}
                  >
                    <FontAwesomeIcon icon={faTrash} className="h-3 w-3" />
                  </Button>
                  <Button size="sm" onClick={() => handleApply(t.id)} className="h-7 text-[11.5px]">
                    Aplicar
                  </Button>
                </li>
              ))}
            </ul>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setLoadOpen(false)}>
              <FontAwesomeIcon icon={faXmark} className="h-3 w-3 mr-1.5" />
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
