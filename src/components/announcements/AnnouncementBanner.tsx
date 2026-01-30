import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAnnouncements, type Announcement } from "@/hooks/useAnnouncements";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Bell, Play, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

export const AnnouncementBanner: React.FC = () => {
  const navigate = useNavigate();
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

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissed(prev => [...prev, currentAnnouncement.id]);
    if (currentIndex >= visibleAnnouncements.length - 1) {
      setCurrentIndex(0);
    }
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => 
      prev === 0 ? visibleAnnouncements.length - 1 : prev - 1
    );
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => 
      (prev + 1) % visibleAnnouncements.length
    );
  };

  const handleBannerClick = () => {
    // Check if there's a course link
    if (currentAnnouncement.course_link) {
      // Check if it's an internal link (same origin)
      try {
        const url = new URL(currentAnnouncement.course_link);
        const currentOrigin = window.location.origin;
        
        if (url.origin === currentOrigin) {
          // Internal navigation
          navigate(url.pathname);
        } else {
          // External link - open in new tab
          window.open(currentAnnouncement.course_link, "_blank");
        }
      } catch {
        // If URL parsing fails, try as relative path
        if (currentAnnouncement.course_link.startsWith("/")) {
          navigate(currentAnnouncement.course_link);
        } else {
          window.open(currentAnnouncement.course_link, "_blank");
        }
      }
    }
  };

  const hasCourseLink = !!currentAnnouncement.course_link;

  return (
    <div 
      className={cn(
        "relative w-full rounded-lg overflow-hidden transition-all",
        "bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10",
        "border border-primary/20",
        isNew && "ring-2 ring-primary/30",
        hasCourseLink && "cursor-pointer hover:border-primary/40 hover:bg-primary/10"
      )}
      onClick={hasCourseLink ? handleBannerClick : undefined}
    >
      {/* Banner image if available - 728x90 aspect ratio */}
      {currentAnnouncement.image_url && (
        <div className="w-full" style={{ aspectRatio: "728/90" }}>
          <img
            src={currentAnnouncement.image_url}
            alt={currentAnnouncement.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Content overlay or standalone */}
      <div className={cn(
        "flex items-center gap-4 p-4",
        currentAnnouncement.image_url && "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent"
      )}>
        {/* Icon - only show if no image */}
        {!currentAnnouncement.image_url && (
          <div className="hidden sm:flex items-center justify-center w-10 h-10 rounded-full bg-primary/20 shrink-0">
            <Bell className="w-5 h-5 text-primary" />
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
            <h3 className={cn(
              "font-semibold text-sm truncate",
              currentAnnouncement.image_url && "text-white"
            )}>
              {currentAnnouncement.title}
            </h3>
            {hasCourseLink && (
              <ExternalLink className={cn(
                "w-3 h-3 shrink-0",
                currentAnnouncement.image_url ? "text-white/70" : "text-muted-foreground"
              )} />
            )}
          </div>
          {currentAnnouncement.content && (
            <p className={cn(
              "text-xs line-clamp-1",
              currentAnnouncement.image_url ? "text-white/80" : "text-muted-foreground"
            )}>
              {currentAnnouncement.content}
            </p>
          )}
        </div>

        {/* Points badge */}
        {currentAnnouncement.points_for_viewing && currentAnnouncement.points_for_viewing > 0 && (
          <Badge variant="outline" className={cn(
            "shrink-0 text-xs",
            currentAnnouncement.image_url && "border-white/30 text-white"
          )}>
            +{currentAnnouncement.points_for_viewing} pts
          </Badge>
        )}

        {/* Video link */}
        {currentAnnouncement.video_url && (
          <Button
            size="sm"
            variant="outline"
            className={cn(
              "shrink-0 gap-1",
              currentAnnouncement.image_url && "border-white/30 text-white hover:bg-white/20"
            )}
            onClick={(e) => {
              e.stopPropagation();
              window.open(currentAnnouncement.video_url!, "_blank");
            }}
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
              className={cn(
                "h-7 w-7",
                currentAnnouncement.image_url && "text-white hover:bg-white/20"
              )}
              onClick={handlePrev}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className={cn(
              "text-xs min-w-[3ch] text-center",
              currentAnnouncement.image_url ? "text-white/70" : "text-muted-foreground"
            )}>
              {currentIndex + 1}/{visibleAnnouncements.length}
            </span>
            <Button
              size="icon"
              variant="ghost"
              className={cn(
                "h-7 w-7",
                currentAnnouncement.image_url && "text-white hover:bg-white/20"
              )}
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
          className={cn(
            "h-7 w-7 shrink-0",
            currentAnnouncement.image_url && "text-white hover:bg-white/20"
          )}
          onClick={handleDismiss}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default AnnouncementBanner;
