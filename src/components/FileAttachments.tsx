"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  FileText,
  Image,
  FileCode,
  File,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// ===== Types =====
interface AttachedFile {
  id: string;
  name: string;
  size: number; // bytes
  type: string; // mime type or extension-based category
  uploadedAt: Date;
}

// ===== Helpers =====
function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${Math.round(bytes / 1024)} KB`;
}

function getFileIcon(name: string, type: string) {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  const docExtensions = ["pdf", "doc", "docx", "txt", "rtf", "odt", "xls", "xlsx", "ppt", "pptx", "csv"];
  const imageExtensions = ["png", "jpg", "jpeg", "gif", "svg", "webp", "bmp", "ico"];
  const codeExtensions = ["js", "ts", "tsx", "jsx", "py", "java", "yaml", "yml", "json", "xml", "html", "css", "scss", "sh", "rb", "go", "rs", "c", "cpp"];

  if (type.startsWith("image/") || imageExtensions.includes(ext)) return Image;
  if (docExtensions.includes(ext) || type.startsWith("text/") || type === "application/pdf") return FileText;
  if (codeExtensions.includes(ext)) return FileCode;
  return File;
}

function truncateFileName(name: string, maxLen = 28): string {
  if (name.length <= maxLen) return name;
  const ext = name.includes(".") ? "." + name.split(".").pop() : "";
  const baseName = name.substring(0, name.length - ext.length);
  const available = maxLen - ext.length - 3; // 3 for "..."
  return baseName.substring(0, available) + "..." + ext;
}

// ===== Mock initial attachments =====
const INITIAL_ATTACHMENTS: AttachedFile[] = [
  {
    id: "mock-1",
    name: "requirements-v2.pdf",
    size: 2.4 * 1024 * 1024, // 2.4 MB
    type: "application/pdf",
    uploadedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
  },
  {
    id: "mock-2",
    name: "wireframe.fig",
    size: 856 * 1024, // 856 KB
    type: "application/octet-stream",
    uploadedAt: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
  },
  {
    id: "mock-3",
    name: "api-spec.yaml",
    size: 12 * 1024, // 12 KB
    type: "text/yaml",
    uploadedAt: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
  },
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

interface FileAttachmentsProps {
  onCountChange?: (count: number) => void;
}

export default function FileAttachments({ onCountChange }: FileAttachmentsProps) {
  const [attachments, setAttachments] = useState<AttachedFile[]>(INITIAL_ATTACHMENTS);
  const [isDragOver, setIsDragOver] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync count to parent
  useEffect(() => {
    onCountChange?.(attachments.length);
  }, [attachments.length, onCountChange]);

  // ===== File handling =====
  const addFiles = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const newAttachments: AttachedFile[] = [];

    for (const file of fileArray) {
      if (file.size > MAX_FILE_SIZE) {
        // Skip files over the limit (could also toast a warning)
        continue;
      }
      newAttachments.push({
        id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        name: file.name,
        size: file.size,
        type: file.type || "application/octet-stream",
        uploadedAt: new Date(),
      });
    }

    if (newAttachments.length > 0) {
      setAttachments((prev) => [...prev, ...newAttachments]);
    }
  }, []);

  const handleDelete = useCallback((id: string) => {
    setAttachments((prev) => prev.filter((f) => f.id !== id));
    setDeletingId(null);
  }, []);

  const handleCancelDelete = useCallback(() => {
    setDeletingId(null);
  }, []);

  // ===== Drag & Drop =====
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        addFiles(e.dataTransfer.files);
      }
    },
    [addFiles]
  );

  // ===== Click to browse =====
  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        addFiles(e.target.files);
        // Reset input so the same file can be re-uploaded
        e.target.value = "";
      }
    },
    [addFiles]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Upload className="h-4 w-4" />
          Attachments
          {attachments.length > 0 && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 ml-1">
              {attachments.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Drop zone */}
        <motion.div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
          animate={
            isDragOver
              ? { scale: 1.02, boxShadow: "0 0 20px rgba(var(--primary), 0.15)" }
              : { scale: 1, boxShadow: "0 0 0px rgba(var(--primary), 0)" }
          }
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className={`
            rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-colors duration-200
            ${isDragOver
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-muted-foreground/40 hover:bg-muted/20"
            }
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
          <div className="flex flex-col items-center gap-2">
            <div
              className={`flex items-center justify-center w-12 h-12 rounded-full transition-colors duration-200 ${
                isDragOver ? "bg-primary/15 text-primary" : "bg-muted/50 text-muted-foreground"
              }`}
            >
              <Upload className="h-5 w-5" />
            </div>
            <p className={`text-sm font-medium transition-colors ${isDragOver ? "text-primary" : "text-muted-foreground"}`}>
              Drop files here or click to upload
            </p>
            <p className="text-xs text-muted-foreground/60">Max 10MB per file</p>
          </div>
        </motion.div>

        {/* File list */}
        {attachments.length > 0 && (
          <div className="space-y-1">
            <AnimatePresence initial={false}>
              {attachments.map((file) => {
                const FileIcon = getFileIcon(file.name, file.type);
                const isDeleting = deletingId === file.id;

                return (
                  <motion.div
                    key={file.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -12, height: 0, marginBottom: 0 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="group flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    {/* File icon */}
                    <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-muted/50 shrink-0">
                      <FileIcon className="h-4.5 w-4.5 text-muted-foreground" />
                    </div>

                    {/* File info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" title={file.name}>
                        {truncateFileName(file.name)}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{formatFileSize(file.size)}</span>
                        <span className="text-muted-foreground/40">·</span>
                        <span>
                          {file.uploadedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          {" "}
                          {file.uploadedAt.toLocaleDateString([], { month: "short", day: "numeric" })}
                        </span>
                      </div>
                    </div>

                    {/* Delete area */}
                    <div className="shrink-0">
                      {isDeleting ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-muted-foreground whitespace-nowrap">Are you sure?</span>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="h-6 px-2 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(file.id);
                            }}
                          >
                            Confirm
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-6 px-2 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCancelDelete();
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingId(file.id);
                          }}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
