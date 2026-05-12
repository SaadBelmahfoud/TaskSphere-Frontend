"use client";

import { useRef } from "react";
import { useAttachments, useUploadAttachment, useDeleteAttachment } from "@/hooks/useAttachments";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Upload, Download, Trash2, Paperclip } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

interface AttachmentUploadProps {
  taskId: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1048576).toFixed(1) + " MB";
}

function getFileIcon(contentType: string): string {
  if (contentType.startsWith("image/")) return "🖼️";
  if (contentType.includes("pdf")) return "📄";
  if (contentType.includes("word") || contentType.includes("document")) return "📝";
  if (contentType.includes("sheet") || contentType.includes("excel")) return "📊";
  if (contentType.includes("zip") || contentType.includes("compressed")) return "📦";
  return "📎";
}

export default function AttachmentUpload({ taskId }: AttachmentUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: attachments = [], isLoading } = useAttachments(taskId);
  const uploadAttachment = useUploadAttachment();
  const deleteAttachment = useDeleteAttachment();
  const { auth } = useAuth();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`File ${file.name} exceeds 10MB limit`);
        continue;
      }
      uploadAttachment.mutate({ taskId, file });
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDownload = async (attachmentId: string, filename: string) => {
    try {
      // FIX : Use axios api instance instead of raw fetch.
      // The api instance includes the auth token interceptor and
      // handles automatic token refresh on 401 responses.
      const apiModule = await import("@/lib/api");
      const api = apiModule.default;
      const res = await api.get(`/attachments/${attachmentId}/download`, {
        responseType: "blob",
      });
      const blob = res.data;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Failed to download file");
    }
  };

  const handleDelete = (id: string) => {
    deleteAttachment.mutate({ id, taskId });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Paperclip className="h-4 w-4" />
            Attachments ({attachments.length})
          </CardTitle>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileSelect}
              accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.xls,.xlsx,.zip,.txt,.md"
            />
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadAttachment.isPending}
            >
              <Upload className="h-3 w-3" />
              Upload
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : attachments.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground text-sm">
            No attachments yet. Click Upload to add files.
          </div>
        ) : (
          <div className="space-y-2">
            {attachments.map((att) => (
              <div
                key={att.id}
                className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors group"
              >
                <span className="text-lg">{getFileIcon(att.contentType)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{att.originalFilename}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(att.fileSize)} · {att.uploadedBy} · {formatDistanceToNow(new Date(att.createdAt), { addSuffix: true })}
                  </p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleDownload(att.id, att.originalFilename)}
                  >
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                  {(auth?.role === "ADMIN" || auth?.email === att.uploadedBy) && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(att.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
