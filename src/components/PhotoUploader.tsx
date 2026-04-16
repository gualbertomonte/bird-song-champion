import { useState, useRef, useCallback } from 'react';
import { Camera, ImagePlus, X, Star, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

interface Props {
  photos: string[];
  onChange: (photos: string[]) => void;
  maxPhotos?: number;
}

function resizeImageToBlob(dataUrl: string, maxSize = 800): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let w = img.width, h = img.height;
      if (w > h) { h = (maxSize * h) / w; w = maxSize; }
      else { w = (maxSize * w) / h; h = maxSize; }
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
      canvas.toBlob(b => b ? resolve(b) : reject(new Error('blob fail')), 'image/jpeg', 0.85);
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}

async function uploadToCloud(dataUrl: string, userId: string): Promise<string> {
  const blob = await resizeImageToBlob(dataUrl);
  const path = `${userId}/${crypto.randomUUID()}.jpg`;
  const { error } = await supabase.storage.from('bird-photos').upload(path, blob, {
    contentType: 'image/jpeg', upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from('bird-photos').getPublicUrl(path);
  return data.publicUrl;
}

export default function PhotoUploader({ photos, onChange, maxPhotos = 5 }: Props) {
  const { user } = useAuth();
  const [showCamera, setShowCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const openCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setCameraStream(stream);
      setShowCamera(true);
      setTimeout(() => { if (videoRef.current) videoRef.current.srcObject = stream; }, 100);
    } catch { alert('Câmera não disponível neste dispositivo.'); }
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d')!.drawImage(videoRef.current, 0, 0);
    setPreview(canvas.toDataURL('image/jpeg', 0.9));
  }, []);

  const closeCamera = useCallback(() => {
    cameraStream?.getTracks().forEach(t => t.stop());
    setCameraStream(null);
    setShowCamera(false);
    setPreview(null);
  }, [cameraStream]);

  const confirmPhoto = useCallback(async () => {
    if (!preview || !user) return;
    setUploading(true);
    try {
      const url = await uploadToCloud(preview, user.id);
      onChange([...photos, url]);
      closeCamera();
    } catch (e) {
      console.error(e); toast.error('Erro ao enviar foto.');
    } finally { setUploading(false); }
  }, [preview, photos, onChange, closeCamera, user]);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const url = await uploadToCloud(reader.result as string, user.id);
        onChange([...photos, url]);
      } catch (err) {
        console.error(err); toast.error('Erro ao enviar foto.');
      } finally { setUploading(false); }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }, [photos, onChange, user]);

  const removePhoto = (idx: number) => onChange(photos.filter((_, i) => i !== idx));
  const setMain = (idx: number) => {
    const newPhotos = [...photos];
    const [photo] = newPhotos.splice(idx, 1);
    newPhotos.unshift(photo);
    onChange(newPhotos);
  };

  return (
    <div className="space-y-3">
      <label className="text-xs font-medium text-muted-foreground">Fotos ({photos.length}/{maxPhotos})</label>

      <div className="flex flex-wrap gap-2">
        {photos.map((photo, i) => (
          <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border-2 border-border group">
            <img src={photo} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
            {i === 0 && <Star className="absolute top-0.5 left-0.5 w-3 h-3 text-secondary fill-secondary" />}
            <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
              {i !== 0 && (
                <button type="button" onClick={() => setMain(i)} className="p-0.5 rounded bg-secondary/20 text-secondary">
                  <Star className="w-3 h-3" />
                </button>
              )}
              <button type="button" onClick={() => removePhoto(i)} className="p-0.5 rounded bg-destructive/20 text-destructive">
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {photos.length < maxPhotos && (
        <div className="flex gap-2 items-center">
          <button type="button" disabled={uploading} onClick={openCamera}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs hover:bg-primary/20 transition-colors disabled:opacity-50">
            <Camera className="w-3.5 h-3.5" /> Câmera
          </button>
          <button type="button" disabled={uploading} onClick={() => fileRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary/10 text-secondary text-xs hover:bg-secondary/20 transition-colors disabled:opacity-50">
            <ImagePlus className="w-3.5 h-3.5" /> Galeria
          </button>
          {uploading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
        </div>
      )}

      {showCamera && (
        <div className="fixed inset-0 bg-background/80 z-[60] flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl border shadow-xl w-full max-w-sm p-4 space-y-3 animate-scale-in">
            <div className="flex justify-between items-center">
              <h3 className="font-heading font-semibold text-sm">Capturar Foto</h3>
              <button onClick={closeCamera}><X className="w-5 h-5 text-muted-foreground" /></button>
            </div>
            {!preview ? (
              <>
                <video ref={videoRef} autoPlay playsInline className="w-full rounded-lg bg-muted aspect-square object-cover" />
                <button onClick={capturePhoto} className="w-full btn-primary justify-center">
                  <Camera className="w-4 h-4" /> Capturar
                </button>
              </>
            ) : (
              <>
                <img src={preview} alt="Preview" className="w-full rounded-lg aspect-square object-cover" />
                <div className="flex gap-2">
                  <button disabled={uploading} onClick={() => setPreview(null)} className="flex-1 px-4 py-2 text-sm rounded-lg border hover:bg-muted transition-colors disabled:opacity-50">
                    Tirar outra
                  </button>
                  <button disabled={uploading} onClick={confirmPhoto} className="flex-1 btn-primary justify-center disabled:opacity-50">
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Usar foto'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
