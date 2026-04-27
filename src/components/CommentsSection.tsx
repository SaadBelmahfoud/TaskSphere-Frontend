"use client";

import { useState, useRef, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  useComments,
  useCreateComment,
  useUpdateComment,
  useDeleteComment,
} from "@/hooks/useComments";
import type { CommentResponse } from "@/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import ConfirmDialog from "@/components/ConfirmDialog";
import {
  Send,
  Pencil,
  Trash2,
  Check,
  ArrowUpDown,
  MessageSquare,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const MAX_CHARS = 2000;

interface CommentsSectionProps {
  taskId: string;
}

export default function CommentsSection({ taskId }: CommentsSectionProps) {
  const { auth } = useAuth();
  const { data: comments, isLoading } = useComments(taskId);
  const createComment = useCreateComment(taskId);
  const updateComment = useUpdateComment(taskId);
  const deleteComment = useDeleteComment(taskId);

  const [newContent, setNewContent] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleCreate = () => {
    if (!newContent.trim()) return;
    createComment.mutate({ content: newContent.trim() }, {
      onSuccess: () => setNewContent(""),
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && e.ctrlKey) {
      e.preventDefault();
      handleCreate();
    }
  };

  const startEdit = (comment: CommentResponse) => {
    setEditingId(comment.id);
    setEditContent(comment.content);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditContent("");
  };

  const saveEdit = (commentId: string) => {
    if (!editContent.trim()) return;
    updateComment.mutate(
      { commentId, data: { content: editContent.trim() } },
      {
        onSuccess: () => {
          setEditingId(null);
          setEditContent("");
        },
      }
    );
  };

  const handleDelete = (commentId: string) => {
    deleteComment.mutate(commentId);
  };

  const isOwnComment = (comment: CommentResponse) =>
    auth?.username && comment.username === auth.username;

  const isAdmin = auth?.role === "ADMIN";

  // Sort comments
  const sortedComments = useMemo(() => {
    if (!comments) return [];
    const sorted = [...comments];
    sorted.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });
    return sorted;
  }, [comments, sortOrder]);

  // Render comment content with @mention highlighting
  const renderContent = (content: string) => {
    const parts = content.split(/(@\w+)/g);
    return parts.map((part, i) => {
      if (part.startsWith("@")) {
        return (
          <span
            key={i}
            className="text-primary font-medium bg-primary/10 px-1 rounded"
          >
            {part}
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className="space-y-5">
      {/* Header with count and sort */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">
            {comments?.length ?? 0} {comments?.length === 1 ? "comment" : "comments"}
          </span>
        </div>
        {comments && comments.length > 1 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={() => setSortOrder(sortOrder === "newest" ? "oldest" : "newest")}
          >
            <ArrowUpDown className="h-3 w-3" />
            {sortOrder === "newest" ? "Newest first" : "Oldest first"}
          </Button>
        )}
      </div>

      <Separator />

      {/* Add comment */}
      <div className="space-y-2">
        <Textarea
          ref={textareaRef}
          placeholder="Write a comment... (Ctrl+Enter to send, @mention users)"
          value={newContent}
          onChange={(e) => setNewContent(e.target.value.slice(0, MAX_CHARS))}
          onKeyDown={handleKeyDown}
          rows={3}
          className="resize-none"
        />
        <div className="flex items-center justify-between">
          <span
            className={`text-xs ${
              newContent.length > MAX_CHARS * 0.9
                ? "text-destructive"
                : "text-muted-foreground"
            }`}
          >
            {newContent.length}/{MAX_CHARS}
          </span>
          <Button
            size="sm"
            onClick={handleCreate}
            disabled={!newContent.trim() || createComment.isPending}
          >
            {createComment.isPending ? (
              <span className="animate-pulse">Sending...</span>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Comment
              </>
            )}
          </Button>
        </div>
      </div>

      <Separator />

      {/* Comments list */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-8 w-8 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-16 w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : sortedComments.length > 0 ? (
        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
          {sortedComments.map((comment) => (
            <div
              key={comment.id}
              className="flex gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors"
            >
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback className="text-xs bg-primary/10">
                  {comment.username
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .substring(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm">{comment.username}</span>
                  {isOwnComment(comment) && (
                    <Badge variant="secondary" className="text-xs">
                      You
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(comment.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                  {comment.updatedAt !== comment.createdAt && (
                    <span className="text-xs text-muted-foreground italic">
                      (edited)
                    </span>
                  )}
                </div>

                {editingId === comment.id ? (
                  <div className="mt-2 space-y-2">
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value.slice(0, MAX_CHARS))}
                      rows={3}
                      autoFocus
                      className="resize-none"
                    />
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs ${
                          editContent.length > MAX_CHARS * 0.9
                            ? "text-destructive"
                            : "text-muted-foreground"
                        }`}
                      >
                        {editContent.length}/{MAX_CHARS}
                      </span>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => saveEdit(comment.id)}
                          disabled={updateComment.isPending}
                        >
                          <Check className="mr-1 h-3 w-3" />
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={cancelEdit}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="mt-1.5 text-sm whitespace-pre-wrap leading-relaxed">
                      {renderContent(comment.content)}
                    </p>
                    {(isOwnComment(comment) || isAdmin) && (
                      <div className="flex gap-1 mt-2">
                        {isOwnComment(comment) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={() => startEdit(comment)}
                          >
                            <Pencil className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                        )}
                        <ConfirmDialog
                          trigger={
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Delete
                            </Button>
                          }
                          title="Delete Comment"
                          description="Are you sure you want to delete this comment? This action cannot be undone."
                          onConfirm={() => handleDelete(comment.id)}
                          confirmText="Delete"
                          variant="destructive"
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
          <MessageSquare className="h-10 w-10 mb-3 opacity-40" />
          <p className="text-sm font-medium">No comments yet</p>
          <p className="text-xs mt-1">Be the first to share your thoughts!</p>
        </div>
      )}
    </div>
  );
}
