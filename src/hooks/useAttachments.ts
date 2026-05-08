import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { AttachmentResponse } from "@/types";
import { toast } from "sonner";

/**
 * Query key factory for attachment-related queries.
 * Keys are scoped per task so that uploading or deleting a file
 * only invalidates the relevant task's attachment list.
 */
export const attachmentKeys = {
  all: ["attachments"] as const,
  byTask: (taskId: string) => [...attachmentKeys.all, taskId] as const,
};

/**
 * Fetches all attachments for a given task.
 * The query is automatically disabled when `taskId` is falsy.
 *
 * @param {string} taskId — The ID of the task whose attachments to fetch.
 * @returns {UseQueryResult<AttachmentResponse[]>} Query result containing an array of attachments.
 *
 * @example
 * ```tsx
 * const { data: attachments, isLoading } = useAttachments(taskId);
 * ```
 */
export function useAttachments(taskId: string) {
  return useQuery<AttachmentResponse[]>({
    queryKey: attachmentKeys.byTask(taskId),
    queryFn: async () => {
      const res = await api.get(`/tasks/${taskId}/attachments`);
      return res.data;
    },
    enabled: !!taskId,
  });
}

/**
 * Uploads a file as an attachment to a task.
 * Uses `multipart/form-data` encoding for the file payload.
 * Invalidates the task's attachment list and shows a success toast on completion.
 * Shows an error toast if the upload fails.
 *
 * @returns {UseMutationResult<AttachmentResponse, Error, { taskId: string; file: File }>}
 *   Mutation result — pass an object with `taskId` and `file` to `mutate`.
 *
 * @example
 * ```tsx
 * const upload = useUploadAttachment();
 * upload.mutate({ taskId: "123", file: selectedFile });
 * ```
 */
export function useUploadAttachment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId, file }: { taskId: string; file: File }) => {
      const formData = new FormData();
      formData.append("file", file);
      const res = await api.post(`/tasks/${taskId}/attachments`, formData, { headers: { "Content-Type": "multipart/form-data" } });
      return res.data as AttachmentResponse;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: attachmentKeys.byTask(variables.taskId) });
      toast.success("File uploaded successfully");
    },
    onError: () => {
      toast.error("Failed to upload file");
    },
  });
}

/**
 * Deletes an attachment by its ID.
 * Requires both the attachment `id` and the parent `taskId` so that
 * the correct attachment list query can be invalidated.
 * Shows a success toast on completion and an error toast on failure.
 *
 * @returns {UseMutationResult<void, Error, { id: string; taskId: string }>}
 *   Mutation result — pass an object with `id` and `taskId` to `mutate`.
 *
 * @example
 * ```tsx
 * const remove = useDeleteAttachment();
 * remove.mutate({ id: attachmentId, taskId: "123" });
 * ```
 */
export function useDeleteAttachment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, taskId }: { id: string; taskId: string }) => {
      await api.delete(`/attachments/${id}`);
      return taskId;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: attachmentKeys.byTask(variables.taskId) });
      toast.success("Attachment deleted");
    },
    onError: () => {
      toast.error("Failed to delete attachment");
    },
  });
}
