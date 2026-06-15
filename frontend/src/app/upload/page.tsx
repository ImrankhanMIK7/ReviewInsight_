"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, CheckCircle2, FileText, Loader2, AlertCircle } from "lucide-react";
import { uploadFile } from "@/lib/api";

export default function UploadPage() {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (uploadedFile: File) => {
    const ext = uploadedFile.name.split(".").pop()?.toLowerCase();
    if (ext === "csv" || ext === "xlsx" || ext === "xls" || ext === "json") {
      setFile(uploadedFile);
      setError(null);
      setResult(null);
    } else {
      setError("Unsupported file format. Please upload a .csv, .xlsx, or .json file.");
      setFile(null);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await uploadFile(file);
      setResult(data);
      localStorage.setItem("selectedRunId", data.run_id);
      
      // Auto redirect to dashboard after a short success delay
      setTimeout(() => {
        router.push("/");
      }, 1500);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during processing.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-8 py-10">
      
      {/* Heading */}
      <div className="text-center md:text-left flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
          Smart Upload Center
        </h1>
        <p className="text-zinc-400 text-sm">
          Drop any raw customer reviews file here. The engine will clean the data, map the schemas, and compute insights automatically.
        </p>
      </div>

      {/* Main Glass Panel Box */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel rounded-3xl p-8 flex flex-col gap-6"
      >
        <form 
          onDragEnter={handleDrag} 
          onSubmit={(e) => e.preventDefault()}
          className="relative"
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".csv, .json, .xlsx, .xls"
            onChange={handleChange}
          />

          {/* Drag area */}
          <div
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center gap-4 text-center cursor-pointer transition-all ${
              dragActive 
                ? "border-violet-500 bg-violet-600/5" 
                : "border-zinc-800 hover:border-zinc-700 bg-black/20"
            }`}
            onClick={onButtonClick}
          >
            <div className={`p-4 rounded-full ${dragActive ? "bg-violet-500/10 text-violet-400" : "bg-zinc-900 text-zinc-400"} transition-all`}>
              <UploadCloud className="h-8 w-8" />
            </div>
            
            <div className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-zinc-200">
                Drag and drop your file here, or <span className="text-violet-400 hover:underline">browse</span>
              </span>
              <span className="text-xs text-zinc-500">
                Supports CSV, Excel (XLSX), or JSON formatted reviews
              </span>
            </div>
          </div>
        </form>

        {/* Action Panel / Feedback */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-start gap-3 p-4 rounded-xl bg-red-950/20 border border-red-900/30 text-red-400 text-sm"
            >
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          {file && !result && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-zinc-800/80"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-zinc-900 text-zinc-400">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-zinc-200">{file.name}</span>
                  <span className="text-xs text-zinc-500">{(file.size / 1024).toFixed(1)} KB</span>
                </div>
              </div>

              <button
                onClick={handleUpload}
                disabled={isLoading}
                className="px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-800 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Analyze Dataset"
                )}
              </button>
            </motion.div>
          )}

          {result && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col gap-4 p-5 rounded-2xl bg-emerald-950/10 border border-emerald-500/20 text-emerald-400"
            >
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-500" />
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-zinc-200">Analysis Completed Successfully!</span>
                  <span className="text-xs text-zinc-400">Auto-detected {result.total_reviews} reviews. Redirecting...</span>
                </div>
              </div>

              {/* Detected mapping summary */}
              <div className="grid grid-cols-2 gap-2.5 mt-2 bg-black/30 p-3.5 rounded-xl border border-zinc-800/50">
                {Object.entries(result.detected_columns).map(([stdName, colName]: any) => (
                  <div key={stdName} className="flex flex-col">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase">{stdName.replace("_", " ")}</span>
                    <span className="text-xs text-zinc-300 font-medium truncate">{colName}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
