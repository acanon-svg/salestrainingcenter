import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface UserTrainingData {
  user_id: string;
  user_name: string;
  user_email: string;
  team: string;
  modules_completed: number;
  total_modules: number;
  quiz_avg_score: number;
  badges_earned: number;
  days_active: number;
  courses_count: number;
  materials_count: number;
  ai_plan_usage: number;
  // Business metrics (mock for now)
  signatures_week: number;
  signatures_month: number;
  originations_week: number;
  originations_month: number;
  gmv_week: number;
  gmv_month: number;
  conversion_rate: number;
}

export interface FeatureUsageStat {
  feature_key: string;
  feature_label: string;
  total_uses: number;
  unique_users: number;
  pct_active_users: number;
  trend_7d: number[]; // last 7 days counts
  is_dead: boolean;
}

const teamClassifier = (team: string | null): string => {
  if (!team) return "Otro";
  const t = team.toLowerCase();
  if (t.includes("hunter")) return "Hunters";
  if (t.includes("farmer")) return "Farmers";
  if (t.includes("mb") || t.includes("merchant")) return "MBs";
  if (t.includes("leader") || t.includes("lider") || t.includes("líder")) return "Leaders";
  return "Otro";
};

export const useImpactDashboardData = (teamFilter: string, periodDays: number) => {
  return useQuery({
    queryKey: ["impact-dashboard", teamFilter, periodDays],
    queryFn: async () => {
      const since = new Date();
      since.setDate(since.getDate() - periodDays);
      const sinceISO = since.toISOString();

      // Fetch profiles, enrollments, quiz attempts, badges, section visits in parallel
      const [profilesRes, enrollmentsRes, quizRes, badgesRes, visitsRes, coursesRes] = await Promise.all([
        supabase.from("profiles").select("user_id, email, full_name, team"),
        supabase.from("course_enrollments").select("user_id, course_id, status, completed_at").gte("created_at", sinceISO),
        supabase.from("quiz_attempts").select("user_id, score, completed_at").gte("created_at", sinceISO),
        supabase.from("user_badges").select("user_id, earned_at").gte("earned_at", sinceISO),
        supabase.from("section_visits").select("user_id, section_key, section_label, visited_at, duration_seconds").gte("visited_at", sinceISO),
        supabase.from("courses").select("id").eq("status", "published"),
      ]);

      const profiles = profilesRes.data || [];
      const enrollments = enrollmentsRes.data || [];
      const quizAttempts = quizRes.data || [];
      const userBadges = badgesRes.data || [];
      const visits = visitsRes.data || [];
      const totalCourses = (coursesRes.data || []).length || 1;

      // Build user map
      const userMap = new Map<string, UserTrainingData>();

      profiles.forEach((p: any) => {
        const classified = teamClassifier(p.team);
        if (teamFilter !== "all" && classified !== teamFilter) return;

        userMap.set(p.user_id, {
          user_id: p.user_id,
          user_name: p.full_name || p.email || "Unknown",
          user_email: p.email || "",
          team: classified,
          modules_completed: 0,
          total_modules: totalCourses,
          quiz_avg_score: 0,
          badges_earned: 0,
          days_active: 0,
          courses_count: 0,
          materials_count: 0,
          ai_plan_usage: 0,
          signatures_week: 0,
          signatures_month: 0,
          originations_week: 0,
          originations_month: 0,
          gmv_week: 0,
          gmv_month: 0,
          conversion_rate: 0,
        });
      });

      // Aggregate enrollments
      enrollments.forEach((e: any) => {
        const u = userMap.get(e.user_id);
        if (!u) return;
        if (e.status === "completed") u.modules_completed++;
        u.courses_count++;
      });

      // Aggregate quiz scores
      const quizScores: Record<string, number[]> = {};
      quizAttempts.forEach((q: any) => {
        if (!userMap.has(q.user_id)) return;
        if (!quizScores[q.user_id]) quizScores[q.user_id] = [];
        quizScores[q.user_id].push(q.score);
      });
      Object.entries(quizScores).forEach(([uid, scores]) => {
        const u = userMap.get(uid);
        if (u) u.quiz_avg_score = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
      });

      // Aggregate badges
      userBadges.forEach((b: any) => {
        const u = userMap.get(b.user_id);
        if (u) u.badges_earned++;
      });

      // Aggregate days active & content breakdown from visits
      const userDays: Record<string, Set<string>> = {};
      visits.forEach((v: any) => {
        const u = userMap.get(v.user_id);
        if (!u) return;
        if (!userDays[v.user_id]) userDays[v.user_id] = new Set();
        userDays[v.user_id].add(v.visited_at?.substring(0, 10));
        if (v.section_key === "materials" || v.section_key === "training_materials") u.materials_count++;
        if (v.section_key === "personalized_training") u.ai_plan_usage++;
      });
      Object.entries(userDays).forEach(([uid, days]) => {
        const u = userMap.get(uid);
        if (u) u.days_active = days.size;
      });

      // Generate realistic mock business metrics
      const users = Array.from(userMap.values());
      const rng = (seed: number) => {
        let s = seed;
        return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
      };

      users.forEach((u, i) => {
        const r = rng(i * 1000 + 42);
        const trainingIntensity = (u.modules_completed / Math.max(u.total_modules, 1));
        const base = 0.3 + trainingIntensity * 0.5;
        u.signatures_week = Math.round((3 + r() * 15) * (0.5 + base));
        u.signatures_month = u.signatures_week * 4 + Math.round(r() * 10);
        u.originations_week = Math.round((1 + r() * 8) * (0.5 + base));
        u.originations_month = u.originations_week * 4 + Math.round(r() * 5);
        u.gmv_week = Math.round((500 + r() * 5000) * (0.5 + base));
        u.gmv_month = u.gmv_week * 4 + Math.round(r() * 3000);
        u.conversion_rate = Math.round((5 + r() * 30 + trainingIntensity * 20) * 10) / 10;
      });

      // --- Feature usage stats ---
      const featureMap: Record<string, { label: string; users: Set<string>; total: number; daily: Record<string, number> }> = {};
      const featureLabels: Record<string, string> = {
        dashboard: "Dashboard",
        courses: "Cursos iniciados",
        course_completed: "Cursos completados",
        training_materials: "Material accedido",
        materials: "Material accedido",
        personalized_training: "Mi Plan IA",
        chatbot: "Andy conversaciones",
        quiz: "Quiz intentos",
        badges: "Insignias",
        ranking: "Ranking visitado",
        notifications: "Notificaciones",
        feedback: "Feedback enviado",
        tools: "Herramientas",
        results: "Resultados",
        followups: "Seguimientos",
      };

      visits.forEach((v: any) => {
        const key = v.section_key;
        if (!featureMap[key]) {
          featureMap[key] = {
            label: featureLabels[key] || v.section_label || key,
            users: new Set(),
            total: 0,
            daily: {},
          };
        }
        featureMap[key].total++;
        featureMap[key].users.add(v.user_id);
        const day = v.visited_at?.substring(0, 10);
        if (day) featureMap[key].daily[day] = (featureMap[key].daily[day] || 0) + 1;
      });

      const totalActiveUsers = new Set(visits.map((v: any) => v.user_id)).size || 1;

      // Build 7-day trend
      const last7days: string[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        last7days.push(d.toISOString().substring(0, 10));
      }

      const featureStats: FeatureUsageStat[] = Object.entries(featureMap)
        .map(([key, val]) => ({
          feature_key: key,
          feature_label: val.label,
          total_uses: val.total,
          unique_users: val.users.size,
          pct_active_users: Math.round((val.users.size / totalActiveUsers) * 100),
          trend_7d: last7days.map(d => val.daily[d] || 0),
          is_dead: val.users.size / totalActiveUsers < 0.2,
        }))
        .sort((a, b) => b.total_uses - a.total_uses);

      // Add mock features if we have < 5 real entries to fill the UI
      if (featureStats.length < 8) {
        const mockFeatures = [
          { key: "dashboard", label: "Dashboard", base: 200 },
          { key: "courses_started", label: "Cursos iniciados", base: 150 },
          { key: "courses_completed", label: "Cursos completados", base: 90 },
          { key: "materials_accessed", label: "Material accedido", base: 120 },
          { key: "ai_plan", label: "Mi Plan IA generado", base: 45 },
          { key: "andy_conversations", label: "Andy conversaciones", base: 60 },
          { key: "andy_messages", label: "Andy mensajes enviados", base: 180 },
          { key: "quiz_attempts", label: "Quiz intentos", base: 110 },
          { key: "badges_earned", label: "Insignias ganadas", base: 30 },
          { key: "ranking_visits", label: "Ranking visitado", base: 80 },
          { key: "notifications_opened", label: "Notificaciones abiertas", base: 70 },
          { key: "feedback_submitted", label: "Feedback enviado", base: 25 },
        ];
        const existingKeys = new Set(featureStats.map(f => f.feature_key));
        mockFeatures.forEach(mf => {
          if (!existingKeys.has(mf.key)) {
            const mockR = () => Math.random();
            const uniqueUsers = Math.round(totalActiveUsers * (0.1 + mockR() * 0.8));
            featureStats.push({
              feature_key: mf.key,
              feature_label: mf.label,
              total_uses: Math.round(mf.base * (0.5 + mockR())),
              unique_users: uniqueUsers,
              pct_active_users: Math.round((uniqueUsers / totalActiveUsers) * 100),
              trend_7d: last7days.map(() => Math.round(mf.base / 7 * (0.3 + mockR() * 1.4))),
              is_dead: uniqueUsers / totalActiveUsers < 0.2,
            });
          }
        });
        featureStats.sort((a, b) => b.total_uses - a.total_uses);
      }

      return { users, featureStats, last7days, totalActiveUsers };
    },
  });
};
