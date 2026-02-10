import React from "react";
import { Link } from "react-router-dom";
import { Course, dimensionLabels, difficultyLabels } from "@/lib/types";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Clock, Users, Star, BookOpen, Trophy, Calendar, Timer, UserPlus } from "lucide-react";
import { format, isPast, isFuture } from "date-fns";
import { es } from "date-fns/locale";
import { useCourseTagsWithAssignments, CourseTag } from "@/hooks/useCourseTags";

interface CourseCardProps {
  course: Course;
  enrollment?: {
    progress_percentage: number;
    status: string;
  };
  showEnrollButton?: boolean;
  onEnroll?: () => void;
}

export const CourseCard: React.FC<CourseCardProps> = ({
  course,
  enrollment,
  showEnrollButton = false,
  onEnroll,
}) => {
  const { data: tagData } = useCourseTagsWithAssignments();
  
  const isExpired = course.expires_at && isPast(new Date(course.expires_at));
  const isScheduled = course.scheduled_at && isFuture(new Date(course.scheduled_at)) && course.status === "draft";

  // Get course tags for this course
  const courseTags = React.useMemo(() => {
    if (!tagData) return [];
    const assignedTagIds = tagData.assignments
      .filter(a => a.course_id === course.id)
      .map(a => a.tag_id);
    return tagData.tags.filter(t => assignedTagIds.includes(t.id));
  }, [tagData, course.id]);

  const getDimensionColor = (dimension: string) => {
    switch (dimension) {
      case "onboarding":
        return "bg-addi-cyan text-secondary";
      case "refuerzo":
        return "bg-addi-orange text-secondary";
      case "taller":
        return "bg-primary text-primary-foreground";
      case "entrenamiento":
        return "bg-secondary text-secondary-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "basico":
        return "bg-success/20 text-success";
      case "medio":
        return "bg-warning/20 text-warning-foreground";
      case "avanzado":
        return "bg-destructive/20 text-destructive";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <Card
      className={`group overflow-hidden border-border/50 transition-all hover:shadow-lg hover:border-primary/30 ${
        isExpired ? "opacity-60" : ""
      }`}
    >
      {/* Cover Image */}
      <div className="relative h-40 bg-gradient-to-br from-primary/20 to-secondary/20 overflow-hidden">
        {course.cover_image_url ? (
          <img
            src={course.cover_image_url}
            alt={course.title}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen className="w-16 h-16 text-primary/30" />
          </div>
        )}

        {/* Badges overlay */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-2">
          <Badge className={getDimensionColor(course.dimension)}>
            {dimensionLabels[course.dimension]}
          </Badge>
          <Badge variant="outline" className={getDifficultyColor(course.difficulty)}>
            {difficultyLabels[course.difficulty]}
          </Badge>
        </div>

        {/* Course Type Tags */}
        {courseTags.length > 0 && (
          <div className="absolute bottom-3 left-3 flex flex-wrap gap-1">
            {courseTags.map((tag) => (
              <Badge
                key={tag.id}
                style={{ backgroundColor: tag.color }}
                className="text-white text-xs"
              >
                {tag.name}
              </Badge>
            ))}
          </div>
        )}

        {/* Points badge */}
        <div className="absolute top-3 right-3">
          <Badge className="bg-addi-orange text-secondary gap-1">
            <Trophy className="w-3 h-3" />
            {course.points} pts
          </Badge>
        </div>

        {isExpired && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center flex-col gap-1">
            <Badge className="bg-warning text-warning-foreground text-sm">
              Curso Vencido
            </Badge>
            <span className="text-xs text-muted-foreground font-medium">50% de puntos</span>
          </div>
        )}

        {isScheduled && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center flex-col gap-2">
            <Badge className="bg-addi-cyan text-secondary text-sm gap-1">
              <Timer className="w-3 h-3" />
              Programado
            </Badge>
            <span className="text-xs text-muted-foreground">
              {format(new Date(course.scheduled_at!), "d MMM yyyy, HH:mm", { locale: es })}
            </span>
          </div>
        )}
      </div>

      <CardHeader className="pb-2">
        <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors">
          {course.title}
        </h3>
        {course.process && (
          <p className="text-xs text-muted-foreground">{course.process.name}</p>
        )}
      </CardHeader>

      <CardContent className="pb-3">
        {course.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {course.description}
          </p>
        )}

        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          {course.estimated_duration_minutes && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {course.estimated_duration_minutes} min
            </span>
          )}
          {course.expires_at && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Vence: {format(new Date(course.expires_at), "d MMM", { locale: es })}
            </span>
          )}
          {isScheduled && (
            <span className="flex items-center gap-1 text-addi-cyan">
              <Timer className="w-3 h-3" />
              Publica: {format(new Date(course.scheduled_at!), "d MMM", { locale: es })}
            </span>
          )}
        </div>

        {/* Tags */}
        {course.tags && course.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {course.tags.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {course.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{course.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Target Teams and Users */}
        {((course.target_teams && course.target_teams.length > 0) ||
          (course.target_users && course.target_users.length > 0)) && (
          <div className="flex flex-wrap gap-1 mt-3">
            {course.target_teams?.slice(0, 2).map((team) => (
              <Badge key={team} variant="secondary" className="text-xs gap-1">
                <Users className="w-3 h-3" />
                {team}
              </Badge>
            ))}
            {course.target_teams && course.target_teams.length > 2 && (
              <Badge variant="secondary" className="text-xs">
                +{course.target_teams.length - 2} equipos
              </Badge>
            )}
            {course.target_users && course.target_users.length > 0 && (
              <Badge variant="outline" className="text-xs gap-1 border-primary/30 text-primary">
                <UserPlus className="w-3 h-3" />
                {course.target_users.length} persona{course.target_users.length > 1 ? "s" : ""}
              </Badge>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-0">
        {enrollment ? (
          <div className="w-full space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progreso</span>
              <span className="font-medium">{enrollment.progress_percentage}%</span>
            </div>
            <Progress value={enrollment.progress_percentage} className="h-2" />
            <Link to={`/courses/${course.id}`} className="block w-full">
              <Button className="w-full" size="sm">
                {enrollment.status === "completed" ? "Revisar" : "Continuar"}
              </Button>
            </Link>
          </div>
        ) : showEnrollButton ? (
          <Button onClick={onEnroll} className="w-full">
            {isExpired ? "Inscribirme (50% pts)" : "Inscribirme"}
          </Button>
        ) : (
          <Link to={`/courses/${course.id}`} className="block w-full">
            <Button variant="outline" className="w-full">
              Ver Curso
            </Button>
          </Link>
        )}
      </CardFooter>
    </Card>
  );
};
