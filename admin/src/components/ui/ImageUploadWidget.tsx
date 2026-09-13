import { RefreshCw, Upload, X, XCircle } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { API, authHFile, cls, resolveMediaUrl } from "../../utils/helpers";
import ManualUrlInput from "./Forms";

export function useImageUpload(category: "tours" | "hotels" | "facilities" | "vehicles" | "guides" | "misc") {
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);
    const uploadFiles = useCallback(async (files: FileList | File[]): Promise<string[]> => {
            setUploading(true);
            setUploadError("");
            try {
              const fileArr = Array.from(files);
              for (const f of fileArr) {
                if (f.size > 8 * 1024 * 1024) throw new Error(`File ${f.name} exceeds 8MB limit`);
              }
              const fd = new FormData();
              fileArr.forEach(f => fd.append("files", f));
              const res = await fetch(`${API}/upload/${category}`, {
                method: "POST", headers: authHFile(), body: fd,
              });
              const data = await res.json();
              if (!res.ok) throw new Error(data.message || "Upload failed");
              return data.urls as string[];
            } catch (e: unknown) {
              const msg = e instanceof Error ? e.message : "Upload failed";
              setUploadError(msg);
              return [];
            } finally {
              setUploading(false);
            }
          }, [category]);
    const trigger = () => inputRef.current?.click();
    return { uploading, uploadError, inputRef, trigger, uploadFiles };
}

export default function ImageUploadWidget({
      category, label = "Photos", urls, onChange,
    }: {
          category: "tours" | "hotels" | "facilities" | "vehicles" | "guides" | "misc";
          label?: string;
          urls: string[];
          onChange: (urls: string[]) => void;
        }) {
    const { uploading, uploadError, inputRef, trigger, uploadFiles } = useImageUpload(category);
    const [dragOver, setDragOver] = useState(false);
    const handleFiles = async (files: FileList | null) => {
            if (!files || files.length === 0) return;
            const newUrls = await uploadFiles(files);
            if (newUrls.length > 0) onChange([...urls, ...newUrls]);
            if (inputRef.current) inputRef.current.value = "";
          };
    const removeUrl = (u: string) => onChange(urls.filter(x => x !== u));
    return (
    <div>
      <label className="text-xs uppercase tracking-widest text-ink-800/50 font-semibold block mb-1.5">{label}</label>
      { }
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
        className={cls(
          "border-2 border-dashed rounded-2xl p-5 text-center transition-all cursor-pointer hover:border-leaf-600 hover:bg-leaf-700/3",
          dragOver ? "border-leaf-600 bg-leaf-700/5" : "border-sand-200",
          uploading && "opacity-60 pointer-events-none",
        )}
        onClick={trigger}
      >
        {uploading ? (
          <div className="flex items-center justify-center gap-2 text-leaf-700">
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span className="text-sm font-medium">Uploading…</span>
          </div>
        ) : (
          <>
            <Upload className="w-7 h-7 text-ink-800/30 mx-auto mb-2" />
            <p className="text-sm font-medium text-ink-800/60">Click or drag & drop images here</p>
            <p className="text-xs text-ink-800/30 mt-1">JPEG, PNG, WEBP, GIF · max 8MB each · up to 10 files</p>
          </>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
        multiple
        className="hidden"
        onChange={e => handleFiles(e.target.files)}
      />
      {uploadError && (
        <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
          <XCircle className="w-3.5 h-3.5" />{uploadError}
        </p>
      )}
      { }
      <div className="mt-3">
        <ManualUrlInput label="Or paste image URL" onAdd={u => { if (u) onChange([...urls, u]); }} />
      </div>
      { }
      {urls.length > 0 && (
        <div className="grid grid-cols-4 gap-2 mt-3">
          {urls.map((u, i) => (
            <div key={i} className="relative group rounded-xl overflow-hidden aspect-square bg-sand-200">
              <img src={resolveMediaUrl(u)} alt="" className="w-full h-full object-cover" onError={e => (e.currentTarget.style.display = "none")} />
              
              <div className="absolute inset-0 bg-ink-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                {i !== 0 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      const newUrls = [...urls];
                      newUrls.splice(i, 1);
                      newUrls.unshift(u);
                      onChange(newUrls);
                    }}
                    className="text-[10px] bg-ink-900 text-sand-50 rounded-full px-2 py-1 font-semibold hover:bg-leaf-700 transition-colors"
                  >
                    Set as Cover
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={(e) => { e.preventDefault(); removeUrl(u); }}
                className="absolute top-1 right-1 w-6 h-6 z-10 rounded-full bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-red-500"
              >
                <X className="w-3 h-3" />
              </button>
              {i === 0 && <div className="absolute bottom-1 left-1 text-[9px] bg-ink-900/90 text-sand-50 rounded-full px-1.5 py-0.5 font-semibold z-10 border border-sand-50/20">Cover</div>}
            </div>
          ))}
        </div>
      )}
    </div>
    );
}
