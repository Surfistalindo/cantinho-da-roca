import { useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { MSym } from '@/components/crm/MSym';

interface Props {
  userId: string;
  currentUrl?: string | null;
  name?: string | null;
  onUploaded: (publicUrl: string) => void;
  size?: number;
}

export default function AvatarUploader({ userId, currentUrl, name, onUploaded, size = 96 }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null);

  const initials = (name ?? '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('') || '?';

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Selecione um arquivo de imagem');
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      toast.error('Imagem muito grande (máx 4MB)');
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
      const path = `${userId}/avatar-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('avatars').upload(path, file, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type,
      });
      if (error) throw error;
      const { data } = supabase.storage.from('avatars').getPublicUrl(path);
      const url = `${data.publicUrl}?v=${Date.now()}`;
      setPreview(url);
      onUploaded(url);
      toast.success('Foto atualizada');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro no upload';
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <div
        className="rounded-full overflow-hidden bg-gradient-to-br from-primary to-primary/60 text-primary-foreground flex items-center justify-center font-bold ring-2 ring-card shadow-sm shrink-0"
        style={{ width: size, height: size, fontSize: size / 3 }}
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt={name ?? 'Avatar'} className="w-full h-full object-cover" />
        ) : (
          <span>{initials}</span>
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            e.target.value = '';
          }}
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          <MSym name="upload" size={14} className="mr-1.5" />
          {uploading ? 'Enviando...' : preview ? 'Trocar foto' : 'Enviar foto'}
        </Button>
        {preview && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="text-destructive hover:text-destructive"
            disabled={uploading}
            onClick={() => {
              setPreview(null);
              onUploaded('');
            }}
          >
            <MSym name="delete" size={14} className="mr-1.5" />
            Remover
          </Button>
        )}
      </div>
    </div>
  );
}
