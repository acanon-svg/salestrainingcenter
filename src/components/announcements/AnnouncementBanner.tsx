import React, { useState, useEffect } from "react";
import { useAnnouncements, type Announcement } from "@/hooks/useAnnouncements";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Bell, Play, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export const AnnouncementBanner: React.FC = () => {
  const { announcements, viewedAnnouncements, isLoading, markAsViewed } = useAnnouncements();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dismissed, setDismissed] = useState<string[]>([]);

  // Filter to show only unviewed announcements first, then viewed ones
  const sortedAnnouncements = [...announcements].sort((a, b) => {
    const aViewed = viewedAnnouncements.includes(a.id);
    const bViewed = viewedAnnouncements.includes(b.id);
    if (aViewed && !bViewed) return 1;
    if (!aViewed && bViewed) return -1;
    return 0;
  });

  // Filter out dismissed announcements
  const visibleAnnouncements = sortedAnnouncements.filter(a => !dismissed.includes(a.id));

  // Auto-rotate announcements every 8 seconds
  useEffect(() => {
    if (visibleAnnouncements.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % visibleAnnouncements.length);
    }, 8000);

    return () => clearInterval(interval);
  }, [visibleAnnouncements.length]);

  // Mark current announcement as viewed
  useEffect(() => {
    if (visibleAnnouncements.length > 0 && currentIndex < visibleAnnouncements.length) {
      const current = visibleAnnouncements[currentIndex];
      if (!viewedAnnouncements.includes(current.id)) {
        markAsViewed.mutate(current.id);
      }
    }
  }, [currentIndex, visibleAnnouncements, viewedAnnouncements, markAsViewed]);

  if (isLoading || visibleAnnouncements.length === 0) {
    return null;
  }

  const currentAnnouncement = visibleAnnouncements[currentIndex];
  const isNew = !viewedAnnouncements.includes(currentAnnouncement.id);

  const handleDismiss = () => {
    setDismissed(prev => [...prev, currentAnnouncement.id]);
    if (currentIndex >= visibleAnnouncements.length - 1) {
      setCurrentIndex(0);
    }
  };

  const handlePrev = () => {
    setCurrentIndex(prev => 
      prev === 0 ? visibleAnnouncements.length - 1 : prev - 1
    );
  };

  const handleNext = () => {
    setCurrentIndex(prev => 
      (prev + 1) % visibleAnnouncements.length
    );
  };

  return (
    <div className={cn(
      "relative w-full rounded-lg overflow-hidden transition-all",
      "bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10",
      "border border-primary/20",
      isNew && "ring-2 ring-primary/30"
    )}>
      <div className="flex items-center gap-4 p-4">
        {/* Icon */}
        <div className="hidden sm:flex items-center justify-center w-10 h-10 rounded-full bg-primary/20 shrink-0">
          <Bell className="w-5 h-5 text-primary" />
        </div>

        {/* Image/Video preview */}
        {currentAnnouncement.image_url && (
          <div className="hidden md:block w-16 h-16 rounded-lg overflow-hidden shrink-0">
            {currentAnnouncement.video_url ? (
              <div className="relative w-full h-full">
                <img
                  src={currentAnnouncement.image_url}
                  alt=""
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <Play className="w-6 h-6 text-white" />
                </div>
              </div>
            ) : (
              <img
                src={currentAnnouncement.image_url}
                alt=""
                className="w-full h-full object-cover"
              />
            )}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {isNew && (
              <Badge className="bg-primary text-primary-foreground text-xs">
                Nuevo
              </Badge>
            )}
            <h3 className="font-semibold text-sm truncate">
              {currentAnnouncement.title}
            </h3>
          </div>
          {currentAnnouncement.content && (
            <p className="text-xs text-muted-foreground line-clamp-1">
              {currentAnnouncement.content}
            </p>
          )}
        </div>

        {/* Points badge */}
        {currentAnnouncement.points_for_viewing && currentAnnouncement.points_for_viewing > 0 && (
          <Badge variant="outline" className="shrink-0 text-xs">
            +{currentAnnouncement.points_for_viewing} pts
          </Badge>
        )}

        {/* Video link */}
        {currentAnnouncement.video_url && (
          <Button
            size="sm"
            variant="outline"
            className="shrink-0 gap-1"
            onClick={() => window.open(currentAnnouncement.video_url!, "_blank")}
          >
            <Play className="w-3 h-3" />
            Ver
          </Button>
        )}

        {/* Navigation controls */}
        {visibleAnnouncements.length > 1 && (
          <div className="flex items-center gap-1 shrink-0">
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={handlePrev}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-xs text-muted-foreground min-w-[3ch] text-center">
              {currentIndex + 1}/{visibleAnnouncements.length}
            </span>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={handleNext}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Dismiss button */}
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 shrink-0"
          onClick={handleDismiss}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default AnnouncementBanner;
