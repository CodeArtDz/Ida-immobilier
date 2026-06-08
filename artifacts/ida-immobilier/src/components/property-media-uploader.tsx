import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { X, ImagePlus, Video, Loader2, Star } from "lucide-react";

interface MediaItem {
  id: number;
  url: string;
  watermarkedUrl: string | null;
  type: "photo" | "video" | "floor_plan" | "pdf";
  caption: string | null;
  order: number;
}

interface PropertyMediaUploaderProps {
  propertyId: number;
  onCountChange?: (count: number) => void;
}

export default function PropertyMediaUploader({
  propertyId,
  onCountChange,
}: PropertyMediaUploaderProps) {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const getToken = () => localStorage.getItem("token") ?? "";

  useEffect(() => {
    fetch(`/api/properties/${propertyId}/media`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then((r) => (r.ok ? r.json() : []))
      .then((data: MediaItem[]) => {
        setMedia(data);
        onCountChange?.(data.length);
      })
      .catch(() => setMedia([]))
      .finally(() => setLoadingMedia(false));
  }, [propertyId]);

  const handleFiles = useCallback(
    async (files: FileList) => {
      const allowed = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "video/mp4",
        "video/quicktime",
      ];
      const valid = Array.from(files).filter((f) => allowed.includes(f.type));
      if (valid.length === 0) {
        toast({
          title: "Format non supporté",
          description: "Acceptés : JPG, PNG, WebP, MP4, MOV",
          variant: "destructive",
        });
        return;
      }

      setUploading(true);
      for (const file of valid) {
        try {
          const formData = new FormData();
          formData.append("file", file);
          const res = await fetch(
            `/api/properties/${propertyId}/media/upload`,
            {
              method: "POST",
              headers: { Authorization: `Bearer ${getToken()}` },
              body: formData,
            },
          );
          if (!res.ok) throw new Error("Upload failed");
          const item = (await res.json()) as MediaItem;
          setMedia((prev) => {
            const next = [...prev, item];
            onCountChange?.(next.length);
            return next;
          });
        } catch {
          toast({
            title: "Erreur",
            description: `Impossible d'uploader ${file.name}`,
            variant: "destructive",
          });
        }
      }
      setUploading(false);
    },
    [propertyId, toast, onCountChange],
  );

  const handleSetMain = async (mediaId: number) => {
    try {
      const res = await fetch(
        `/api/properties/${propertyId}/media/${mediaId}/main`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${getToken()}` },
        },
      );
      if (!res.ok) throw new Error();
      const updated = (await res.json()) as MediaItem[];
      setMedia(updated);
      toast({
        title: "Photo principale mise à jour",
        description: "Cette photo apparaîtra en premier sur l'annonce.",
      });
    } catch {
      toast({
        title: "Erreur",
        description: "Impossible de définir la photo principale",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (mediaId: number) => {
    try {
      const res = await fetch(
        `/api/properties/${propertyId}/media/${mediaId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${getToken()}` },
        },
      );
      if (!res.ok) throw new Error();
      setMedia((prev) => {
        const next = prev.filter((m) => m.id !== mediaId);
        onCountChange?.(next.length);
        return next;
      });
    } catch {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le média",
        variant: "destructive",
      });
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files);
  };

  const photos = media.filter((m) => m.type === "photo");
  const videos = media.filter((m) => m.type === "video");

  return (
    <div className="space-y-6">
      <div
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
          dragOver
            ? "border-primary bg-primary/10"
            : "border-border hover:border-primary/50 hover:bg-primary/5"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime"
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
        {uploading ? (
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <span className="font-medium">Upload en cours...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <ImagePlus className="w-10 h-10 text-primary/60" />
            <span className="font-semibold text-foreground">
              Glissez vos fichiers ici ou cliquez pour parcourir
            </span>
            <span className="text-sm">
              Photos (JPG, PNG, WebP) · Vidéos (MP4, MOV) · Max 50 Mo par
              fichier
            </span>
            <span className="text-xs text-amber-600 font-medium mt-1 flex items-center gap-1">
              <Star className="w-3 h-3" />
              Les photos sont automatiquement filigranées avec le logo I.D.A
              Immobilier
            </span>
          </div>
        )}
      </div>

      {loadingMedia && (
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          Chargement des médias...
        </div>
      )}

      {photos.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
            Photos ({photos.length})
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {photos.map((item, i) => (
              <div
                key={item.id}
                className="relative group rounded-lg overflow-hidden border border-border aspect-video bg-muted"
              >
                <img
                  src={item.watermarkedUrl || item.url}
                  alt=""
                  className="w-full h-full object-cover"
                />
                {i === 0 && (
                  <div className="absolute top-1.5 left-1.5 bg-primary text-primary-foreground text-[10px] px-2 py-0.5 rounded font-semibold flex items-center gap-1">
                    <Star className="w-2.5 h-2.5 fill-current" />
                    Principale
                  </div>
                )}
                {item.watermarkedUrl && (
                  <div className="absolute bottom-1.5 left-1.5 bg-amber-500/90 text-white text-[10px] px-1.5 py-0.5 rounded font-medium">
                    Filigrané
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => handleDelete(item.id)}
                  className="absolute top-1.5 right-1.5 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow"
                >
                  <X className="w-3 h-3" />
                </button>
                {i !== 0 && (
                  <button
                    type="button"
                    onClick={() => handleSetMain(item.id)}
                    className="absolute bottom-1.5 right-1.5 bg-primary text-primary-foreground text-[10px] px-2 py-0.5 rounded font-medium opacity-0 group-hover:opacity-100 transition-opacity shadow flex items-center gap-1 hover:bg-primary/90"
                  >
                    <Star className="w-2.5 h-2.5" />
                    Définir principale
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {videos.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
            Vidéos ({videos.length})
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {videos.map((item) => (
              <div
                key={item.id}
                className="relative group rounded-lg overflow-hidden border border-border aspect-video bg-muted flex flex-col items-center justify-center gap-2 text-muted-foreground"
              >
                <Video className="w-8 h-8" />
                <span className="text-xs font-medium">Vidéo</span>
                <button
                  type="button"
                  onClick={() => handleDelete(item.id)}
                  className="absolute top-1.5 right-1.5 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loadingMedia && media.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          Aucun média pour ce bien. Ajoutez des photos ou vidéos ci-dessus.
        </p>
      )}
    </div>
  );
}
