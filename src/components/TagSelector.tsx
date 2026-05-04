"use client";

import { useState } from "react";
import { useTags, useCreateTag } from "@/hooks/useTags";
import { DEFAULT_TAG_COLORS } from "@/lib/task-config";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TagResponse } from "@/types";

interface TagSelectorProps {
  selectedTagIds: string[];
  onChange: (tagIds: string[]) => void;
  availableTags?: TagResponse[];
}

export default function TagSelector({ selectedTagIds, onChange, availableTags }: TagSelectorProps) {
  const { data: fetchedTags } = useTags();
  const createTag = useCreateTag();
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState(DEFAULT_TAG_COLORS[0]);
  const [showCreate, setShowCreate] = useState(false);

  const tags = availableTags || fetchedTags || [];
  const selectedTags = tags.filter((t) => selectedTagIds.includes(t.id));
  const unselectedTags = tags.filter((t) => !selectedTagIds.includes(t.id));

  const toggleTag = (tagId: string) => {
    if (selectedTagIds.includes(tagId)) {
      onChange(selectedTagIds.filter((id) => id !== tagId));
    } else {
      onChange([...selectedTagIds, tagId]);
    }
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    try {
      const tag = await createTag.mutateAsync({ name: newTagName.trim(), color: newTagColor });
      onChange([...selectedTagIds, tag.id]);
      setNewTagName("");
      setShowCreate(false);
    } catch {
      // Error handled by mutation
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 flex-wrap">
        {selectedTags.map((tag) => (
          <Badge
            key={tag.id}
            className="cursor-pointer gap-1 pr-1 transition-all hover:opacity-80"
            style={{ backgroundColor: tag.color + "20", color: tag.color, borderColor: tag.color + "40" }}
            variant="outline"
            onClick={() => toggleTag(tag.id)}
          >
            {tag.name}
            <X className="h-3 w-3" />
          </Badge>
        ))}

        <Popover open={showCreate} onOpenChange={setShowCreate}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-6 text-xs gap-1">
              <Plus className="h-3 w-3" />
              Add tag
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-3" align="start">
            <div className="space-y-3">
              <div className="space-y-1.5">
                <h5 className="text-sm font-medium">Create New Tag</h5>
                <Input
                  placeholder="Tag name"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  className="h-8 text-sm"
                  onKeyDown={(e) => e.key === "Enter" && handleCreateTag()}
                />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {DEFAULT_TAG_COLORS.map((color) => (
                  <button
                    key={color}
                    className={cn(
                      "h-5 w-5 rounded-full transition-all",
                      newTagColor === color && "ring-2 ring-offset-1 ring-primary"
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => setNewTagColor(color)}
                  />
                ))}
              </div>
              <Button size="sm" className="w-full h-7 text-xs" onClick={handleCreateTag} disabled={!newTagName.trim()}>
                Create Tag
              </Button>

              {unselectedTags.length > 0 && (
                <>
                  <div className="text-xs text-muted-foreground pt-1">Or select existing:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {unselectedTags.map((tag) => (
                      <Badge
                        key={tag.id}
                        className="cursor-pointer transition-all hover:opacity-80"
                        style={{ backgroundColor: tag.color + "20", color: tag.color, borderColor: tag.color + "40" }}
                        variant="outline"
                        onClick={() => { toggleTag(tag.id); setShowCreate(false); }}
                      >
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                </>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
