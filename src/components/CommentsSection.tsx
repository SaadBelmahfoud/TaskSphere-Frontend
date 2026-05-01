"use client";

import { useState, useRef } from "react";
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
import ConfirmDialog from "@/components/ConfirmDialog";
import { Send, Pencil, Trash2, X, Check, MessageSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

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

  return (
    <div className="space-y-4">
      {/* Add comment */}
      <div className="space-y-2">
        <Textarea
          ref={textareaRef}
          placeholder="Write a comment... (Ctrl+Enter to send)"
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={3}
          className="resize-none transition-colors"
        />
        <div className="flex justify-end">
          <Button
            size="sm"
            onClick={handleCreate}
            disabled={!newContent.trim() || createComment.isPending}
            className="gap-2"
          >
            {createComment.isPending ? (
              <span className="animate-pulse">Sending...</span>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Comment
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Comments list */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : comments && comments.length > 0 ? (
        <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-thin pr-2">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="flex gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors"
            >
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback className="text-xs bg-primary/10 text-primary">
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
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      You
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(comment.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                  {comment.updatedAt !== comment.createdAt && (
                    <span className="text-[10px] text-muted-foreground">(edited)</span>
                  )}
                </div>

                {editingId === comment.id ? (
                  <div className="mt-2 space-y-2">
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={3}
                      autoFocus
                      className="resize-none"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => saveEdit(comment.id)}
                        disabled={updateComment.isPending}
                        className="gap-1"
                      >
                        <Check className="h-3 w-3" />
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={cancelEdit}
                      >
                        <X className="h-3 w-3 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="mt-1 text-sm whitespace-pre-wrap leading-relaxed">
                      {comment.content}
                    </p>
                    {(isOwnComment(comment) || isAdmin) && (
                      <div className="flex gap-1 mt-2">
                        {isOwnComment(comment) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 gap-1"
                            onClick={() => startEdit(comment)}
                          >
                            <Pencil className="h-3 w-3" />
                            Edit
                          </Button>
                        )}
                        <ConfirmDialog
                          trigger={
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-destructive hover:text-destructive gap-1"
                            >
                              <Trash2 className="h-3 w-3" />
                              Delete
                            </Button>
                          }
                          title="Delete Comment"
                          description="Are you sure you want to delete this comment?"
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
        <div className="text-center py-8">
          <MessageSquare className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            No comments yet. Be the first to comment!
          </p>
        </div>
      )}
    </div>
  );
}
