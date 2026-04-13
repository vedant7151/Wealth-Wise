"use client";

import { useRef, useState } from "react";
import { scanReceipt } from "@/actions/transactions";
import { Button } from "@/components/ui/button";
import { Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function ReceiptScanner({ onScanSuccess }: { onScanSuccess: (data: any) => void }) {
  const [isScanning, setIsScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      return;
    }

    setIsScanning(true);
    const formData = new FormData();
    formData.append("receipt", file);

    try {
      const result = await scanReceipt(formData);
      if (result.error) {
        toast.error(result.error);
      } else if (result.data) {
        onScanSuccess(result.data);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to scan receipt");
    } finally {
      setIsScanning(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="flex items-center gap-2">
      <input 
        type="file" 
        accept="image/*" 
        capture="environment"
        className="hidden" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
      />
      
      <Button 
        type="button" 
        variant="secondary"
        className="w-full bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)] transition-all"
        onClick={() => fileInputRef.current?.click()}
        disabled={isScanning}
      >
        {isScanning ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Scanning Receipt...
          </>
        ) : (
          <>
            <Camera className="w-4 h-4 mr-2" />
            Scan Receipt with AI
          </>
        )}
      </Button>
    </div>
  );
}
