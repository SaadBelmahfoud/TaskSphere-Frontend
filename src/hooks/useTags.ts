import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { TagResponse, TagCreateRequest } from "@/types";
import { toast } from "sonner";

/**
 * Query key factory for tag-related queries.
 * Provides a consistent and type-safe way to generate query keys
 * for cache invalidation and query identification.
 */
export const tagKeys = {
  all: ["tags"] as const,
  list: () => [...tagKeys.all, "list"] as const,
};

/**
 * Fetches the list of all tags available to the current user.
 *
 * @returns {UseQueryResult<TagResponse[]>} Query result containing an array of tags.
 *
 * @example
 * ```tsx
 * const { data: tags, isLoading } = useTags();
 * ```
 */
export function useTags() {
  return useQuery<TagResponse[]>({
    queryKey: tagKeys.list(),
    queryFn: async () => {
      const res = await api.get("/tags");
      return res.data;
    },
  });
}

/**
 * Creates a new tag.
 * Invalidates the tag list query and shows a success toast on completion.
 * Shows an error toast if the creation fails.
 *
 * @returns {UseMutationResult<TagResponse, Error, TagCreateRequest>} Mutation result — pass a `TagCreateRequest` to `mutate`.
 *
 * @example
 * ```tsx
 * const createTag = useCreateTag();
 * createTag.mutate({ name: "Bug", color: "#FF0000" });
 * ```
 */
export function useCreateTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: TagCreateRequest) => {
      const res = await api.post("/tags", data);
      return res.data as TagResponse;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tagKeys.all });
      toast.success("Tag created successfully");
    },
    onError: () => {
      toast.error("Failed to create tag");
    },
  });
}

/**
 * Deletes a tag by its ID.
 * Invalidates the tag list query and shows a success toast on completion.
 * Shows an error toast if the deletion fails.
 *
 * @returns {UseMutationResult<void, Error, string>} Mutation result — pass the tag `id` to `mutate`.
 *
 * @example
 * ```tsx
 * const deleteTag = useDeleteTag();
 * deleteTag.mutate(tagId);
 * ```
 */
export function useDeleteTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/tags/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tagKeys.all });
      toast.success("Tag deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete tag");
    },
  });
}
