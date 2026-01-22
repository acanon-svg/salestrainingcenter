-- Training dimensions enum
CREATE TYPE public.training_dimension AS ENUM ('onboarding', 'refuerzo', 'taller', 'entrenamiento');

-- Difficulty levels enum
CREATE TYPE public.difficulty_level AS ENUM ('basico', 'medio', 'avanzado');

-- Content types enum
CREATE TYPE public.content_type AS ENUM ('video', 'documento', 'link', 'quiz', 'encuesta');

-- Course status enum
CREATE TYPE public.course_status AS ENUM ('draft', 'published', 'archived');

-- Process categories for course organization
CREATE TABLE public.processes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES public.processes(id) ON DELETE SET NULL,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Main courses table
CREATE TABLE public.courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    cover_image_url TEXT,
    process_id UUID REFERENCES public.processes(id) ON DELETE SET NULL,
    dimension training_dimension NOT NULL DEFAULT 'entrenamiento',
    difficulty difficulty_level NOT NULL DEFAULT 'basico',
    status course_status NOT NULL DEFAULT 'draft',
    points INTEGER NOT NULL DEFAULT 100,
    estimated_duration_minutes INTEGER,
    language TEXT NOT NULL DEFAULT 'es',
    subtitles_enabled BOOLEAN NOT NULL DEFAULT false,
    target_audience TEXT[], -- Array of team names this course targets
    tags TEXT[],
    objectives TEXT[],
    expires_at TIMESTAMP WITH TIME ZONE,
    published_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Course content/materials
CREATE TABLE public.course_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    type content_type NOT NULL,
    content_url TEXT,
    content_text TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    duration_minutes INTEGER,
    is_required BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Quizzes for courses
CREATE TABLE public.quizzes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    passing_score INTEGER NOT NULL DEFAULT 70,
    max_attempts INTEGER DEFAULT 3,
    time_limit_minutes INTEGER,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Quiz questions
CREATE TABLE public.quiz_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE NOT NULL,
    question TEXT NOT NULL,
    question_type TEXT NOT NULL DEFAULT 'multiple_choice', -- multiple_choice, true_false, open
    options JSONB, -- Array of {text, is_correct}
    points INTEGER NOT NULL DEFAULT 10,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User course enrollments and progress
CREATE TABLE public.course_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
    status TEXT NOT NULL DEFAULT 'enrolled', -- enrolled, in_progress, completed, expired
    progress_percentage INTEGER NOT NULL DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    score INTEGER,
    points_earned INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, course_id)
);

-- User progress on course materials
CREATE TABLE public.material_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    material_id UUID REFERENCES public.course_materials(id) ON DELETE CASCADE NOT NULL,
    completed BOOLEAN NOT NULL DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, material_id)
);

-- Quiz attempts
CREATE TABLE public.quiz_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE NOT NULL,
    score INTEGER NOT NULL,
    passed BOOLEAN NOT NULL,
    answers JSONB, -- Store user answers
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Badges/Achievements
CREATE TABLE public.badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    icon_url TEXT,
    icon_emoji TEXT,
    criteria_type TEXT NOT NULL, -- courses_completed, score_threshold, streak, custom
    criteria_value INTEGER,
    points_reward INTEGER NOT NULL DEFAULT 50,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User earned badges
CREATE TABLE public.user_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    badge_id UUID REFERENCES public.badges(id) ON DELETE CASCADE NOT NULL,
    earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, badge_id)
);

-- Notifications
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'info', -- info, course, badge, feedback
    related_id UUID, -- Reference to course, badge, etc.
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Feedback/Suggestions
CREATE TABLE public.feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    recipient_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Course creator
    course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, in_progress, implemented, rejected
    response TEXT,
    responded_at TIMESTAMP WITH TIME ZONE,
    points_awarded INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Announcements/Banners from course creators
CREATE TABLE public.announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT,
    image_url TEXT,
    video_url TEXT,
    type TEXT NOT NULL DEFAULT 'banner', -- banner, notification, carousel
    target_teams TEXT[], -- Empty means all teams
    points_for_viewing INTEGER DEFAULT 0,
    starts_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Announcement views/interactions
CREATE TABLE public.announcement_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    announcement_id UUID REFERENCES public.announcements(id) ON DELETE CASCADE NOT NULL,
    viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    reaction TEXT, -- thumbs_up, thumbs_down
    UNIQUE(user_id, announcement_id)
);

-- Enable RLS on all tables
ALTER TABLE public.processes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcement_views ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Processes: Everyone authenticated can view, creators/admins can manage
CREATE POLICY "Everyone can view processes" ON public.processes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Creators can manage processes" ON public.processes FOR ALL USING (public.has_role(auth.uid(), 'creator') OR public.has_role(auth.uid(), 'admin'));

-- Courses: Everyone can view published, creators/admins can manage
CREATE POLICY "Everyone can view published courses" ON public.courses FOR SELECT TO authenticated USING (status = 'published' OR created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Creators can manage courses" ON public.courses FOR ALL USING (public.has_role(auth.uid(), 'creator') OR public.has_role(auth.uid(), 'admin'));

-- Course materials: View if course is visible
CREATE POLICY "View materials of accessible courses" ON public.course_materials FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.courses WHERE id = course_id AND (status = 'published' OR created_by = auth.uid() OR public.has_role(auth.uid(), 'admin')))
);
CREATE POLICY "Creators can manage materials" ON public.course_materials FOR ALL USING (public.has_role(auth.uid(), 'creator') OR public.has_role(auth.uid(), 'admin'));

-- Quizzes: Same as materials
CREATE POLICY "View quizzes of accessible courses" ON public.quizzes FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.courses WHERE id = course_id AND (status = 'published' OR created_by = auth.uid() OR public.has_role(auth.uid(), 'admin')))
);
CREATE POLICY "Creators can manage quizzes" ON public.quizzes FOR ALL USING (public.has_role(auth.uid(), 'creator') OR public.has_role(auth.uid(), 'admin'));

-- Quiz questions: Same as quizzes
CREATE POLICY "View quiz questions" ON public.quiz_questions FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.quizzes q JOIN public.courses c ON q.course_id = c.id WHERE q.id = quiz_id AND (c.status = 'published' OR c.created_by = auth.uid() OR public.has_role(auth.uid(), 'admin')))
);
CREATE POLICY "Creators can manage quiz questions" ON public.quiz_questions FOR ALL USING (public.has_role(auth.uid(), 'creator') OR public.has_role(auth.uid(), 'admin'));

-- Enrollments: Users manage their own
CREATE POLICY "Users can view own enrollments" ON public.course_enrollments FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'creator'));
CREATE POLICY "Users can enroll themselves" ON public.course_enrollments FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own enrollments" ON public.course_enrollments FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- Material progress: Users manage their own
CREATE POLICY "Users can view own progress" ON public.material_progress FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own progress" ON public.material_progress FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own progress" ON public.material_progress FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- Quiz attempts: Users manage their own
CREATE POLICY "Users can view own attempts" ON public.quiz_attempts FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can insert own attempts" ON public.quiz_attempts FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Badges: Everyone can view
CREATE POLICY "Everyone can view badges" ON public.badges FOR SELECT TO authenticated USING (true);
CREATE POLICY "Creators can manage badges" ON public.badges FOR ALL USING (public.has_role(auth.uid(), 'creator') OR public.has_role(auth.uid(), 'admin'));

-- User badges: Users can view their own
CREATE POLICY "Users can view own badges" ON public.user_badges FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "System can award badges" ON public.user_badges FOR INSERT TO authenticated WITH CHECK (true);

-- Notifications: Users see their own
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Creators can create notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'creator') OR public.has_role(auth.uid(), 'admin'));

-- Feedback: Users can create and view their own
CREATE POLICY "Users can view relevant feedback" ON public.feedback FOR SELECT TO authenticated USING (sender_id = auth.uid() OR recipient_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can create feedback" ON public.feedback FOR INSERT TO authenticated WITH CHECK (sender_id = auth.uid());
CREATE POLICY "Creators can update feedback" ON public.feedback FOR UPDATE TO authenticated USING (recipient_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Announcements: Everyone can view active
CREATE POLICY "View active announcements" ON public.announcements FOR SELECT TO authenticated USING (starts_at <= now() AND (expires_at IS NULL OR expires_at > now()));
CREATE POLICY "Creators can manage announcements" ON public.announcements FOR ALL USING (public.has_role(auth.uid(), 'creator') OR public.has_role(auth.uid(), 'admin'));

-- Announcement views: Users manage their own
CREATE POLICY "Users can view own announcement views" ON public.announcement_views FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can create announcement views" ON public.announcement_views FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own views" ON public.announcement_views FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- Triggers for updated_at
CREATE TRIGGER update_processes_updated_at BEFORE UPDATE ON public.processes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON public.courses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_course_enrollments_updated_at BEFORE UPDATE ON public.course_enrollments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_feedback_updated_at BEFORE UPDATE ON public.feedback FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();