'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { User, Send, Trash2, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import ConfirmDialog from '@/components/ConfirmDialog';
import {
  useTaskCommentsQuery,
  useCreateCommentMutation,
  useDeleteCommentMutation,
} from '@/hooks/useComments';

interface CommentsSectionProps {
  taskId: string;
}

export default function CommentsSection({ taskId }: CommentsSectionProps) {
  const { auth } = useAuth();
  const [content, setContent] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const { data: comments, isLoading } = useTaskCommentsQuery(taskId);
  const createMutation = useCreateCommentMutation(taskId);
  const deleteMutation = useDeleteCommentMutation(taskId);

  const handleSend = useCallback(async () => {
    const trimmed = content.trim();
    if (!trimmed) {
      toast.error('Comment cannot be empty');
      return;
    }
    try {
      await createMutation.mutateAsync({ content: trimmed });
      setContent('');
    } catch {
      // Error handled by mutation
    }
  }, [content, createMutation]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget);
      setDeleteTarget(null);
    } catch {
      // Error handled by mutation
    }
  }, [deleteTarget, deleteMutation]);

  const canDelete = (commentUsername: string) => {
    return auth.email === commentUsername || auth.role === 'ADMIN';
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Comments
            {comments && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {comments.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* New comment */}
          <div className="space-y-2">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Write a comment... (Ctrl+Enter to send)"
              rows={3}
              className="resize-none"
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Ctrl+Enter to send
              </span>
              <Button
                size="sm"
                onClick={handleSend}
                disabled={!content.trim() || createMutation.isPending}
              >
                <Send className="h-4 w-4 mr-1" />
                Send
              </Button>
            </div>
          </div>

          {/* Comments list */}
          <div className="max-h-96 overflow-y-auto space-y-3 pr-1">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex gap-3 p-3 rounded-lg bg-muted/30">
                  <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </div>
              ))
            ) : comments && comments.length > 0 ? (
              comments.map((comment) => (
                <div
                  key={comment.id}
                  className="flex gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-foreground">
                        {comment.username}
                      </span>
                      {auth.email === comment.username && (
                        <Badge variant="outline" className="text-xs px-1.5 py-0">
                          You
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {formatDate(comment.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-foreground mt-1 whitespace-pre-wrap break-words">
                      {comment.content}
                    </p>
                  </div>
                  {canDelete(comment.username) && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => setDeleteTarget(comment.id)}
                      title="Delete comment"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">
                No comments yet
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete comment"
        message="Are you sure you want to delete this comment? This action is irreversible."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
