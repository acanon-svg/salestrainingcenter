import React, { useEffect, useState } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAnnouncements, type Announcement } from "@/hooks/useAnnouncements";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Bell, ChevronRight, Play, ExternalLink, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export const AnnouncementCarousel: React.FC = () => {
  const { announcements, viewedAnnouncements, isLoading, markAsViewed } = useAnnouncements();
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!api) return;

    setCurrent(api.selectedScrollSnap());

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  // Mark as viewed when slide changes
  useEffect(() => {
    if (announcements.length > 0 && current < announcements.length) {
      const currentAnnouncement = announcements[current];
      if (!viewedAnnouncements.includes(currentAnnouncement.id)) {
        markAsViewed.mutate(currentAnnouncement.id);
      }
    }
  }, [current, announcements, viewedAnnouncements, markAsViewed]);

  if (isLoading) {
    return (
      <Card className="border-border/50 overflow-hidden">
        <CardContent className="p-0">
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (announcements.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Bell className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">Anuncios</h2>
        {announcements.some(a => !viewedAnnouncements.includes(a.id)) && (
          <Badge variant="secondary" className="bg-primary/10 text-primary text-xs">
            <Sparkles className="h-3 w-3 mr-1" />
            Nuevo
          </Badge>
        )}
      </div>

      <Carousel
        setApi={setApi}
        opts={{
          align: "start",
          loop: announcements.length > 1,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-2 md:-ml-4">
          {announcements.map((announcement, index) => (
            <CarouselItem key={announcement.id} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3">
              <AnnouncementCard
                announcement={announcement}
                isNew={!viewedAnnouncements.includes(announcement.id)}
              />
            </CarouselItem>
          ))}
        </CarouselContent>
        {announcements.length > 1 && (
          <>
            <CarouselPrevious className="hidden md:flex -left-4" />
            <CarouselNext className="hidden md:flex -right-4" />
          </>
        )}
      </Carousel>

      {/* Dots indicator for mobile */}
      {announcements.length > 1 && (
        <div className="flex justify-center gap-1.5 md:hidden">
          {announcements.map((_, index) => (
            <button
              key={index}
              className={cn(
                "h-1.5 rounded-full transition-all",
                current === index
                  ? "w-4 bg-primary"
                  : "w-1.5 bg-muted-foreground/30"
              )}
              onClick={() => api?.scrollTo(index)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface AnnouncementCardProps {
  announcement: Announcement;
  isNew: boolean;
}

const AnnouncementCard: React.FC<AnnouncementCardProps> = ({ announcement, isNew }) => {
  const hasMedia = announcement.image_url || announcement.video_url;

  return (
    <Card
      className={cn(
        "h-full overflow-hidden border-border/50 transition-all hover:shadow-md",
        isNew && "ring-2 ring-primary/20"
      )}
    >
      {/* Media section */}
      {hasMedia && (
        <div className="relative aspect-video bg-muted overflow-hidden">
          {announcement.video_url ? (
            <div className="relative h-full w-full">
              <img
                src={announcement.image_url || "/placeholder.svg"}
                alt={announcement.title}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-12 w-12 rounded-full"
                  onClick={() => window.open(announcement.video_url!, "_blank")}
                >
                  <Play className="h-6 w-6" />
                </Button>
              </div>
            </div>
          ) : announcement.image_url ? (
            <img
              src={announcement.image_url}
              alt={announcement.title}
              className="h-full w-full object-cover"
            />
          ) : null}
          
          {isNew && (
            <Badge className="absolute top-2 right-2 bg-primary text-primary-foreground">
              Nuevo
            </Badge>
          )}
        </div>
      )}

      <CardContent className={cn("p-4", !hasMedia && "pt-4")}>
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-sm line-clamp-2">{announcement.title}</h3>
            {!hasMedia && isNew && (
              <Badge variant="secondary" className="shrink-0 bg-primary/10 text-primary text-xs">
                Nuevo
              </Badge>
            )}
          </div>

          {announcement.content && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {announcement.content}
            </p>
          )}

          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-muted-foreground">
              {format(new Date(announcement.starts_at), "d MMM", { locale: es })}
            </span>

            {announcement.points_for_viewing && announcement.points_for_viewing > 0 && (
              <Badge variant="outline" className="text-xs">
                +{announcement.points_for_viewing} pts
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AnnouncementCarousel;
