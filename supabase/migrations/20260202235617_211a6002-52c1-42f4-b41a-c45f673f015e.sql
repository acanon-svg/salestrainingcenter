-- Insert default badges for the Training Center
INSERT INTO public.badges (name, description, icon_emoji, criteria_type, criteria_value, points_reward) VALUES
-- Course completion badges
('Primer Paso', 'Completa tu primer curso', '🎯', 'courses_completed', 1, 50),
('Explorador', 'Completa 3 cursos', '🧭', 'courses_completed', 3, 100),
('Aprendiz Dedicado', 'Completa 5 cursos', '📚', 'courses_completed', 5, 150),
('Maestro del Conocimiento', 'Completa 10 cursos', '🎓', 'courses_completed', 10, 250),
('Leyenda del Training', 'Completa 20 cursos', '🏆', 'courses_completed', 20, 500),

-- Points milestones badges
('Cazador de Puntos', 'Acumula 500 puntos', '⭐', 'points_reached', 500, 50),
('Coleccionista de Puntos', 'Acumula 1000 puntos', '🌟', 'points_reached', 1000, 100),
('Magnate de Puntos', 'Acumula 2000 puntos', '💫', 'points_reached', 2000, 150),
('Elite de Puntos', 'Acumula 4000 puntos', '🔥', 'points_reached', 4000, 250),

-- Perfect score badges
('Perfeccionista', 'Obtén 100% en un quiz', '💯', 'perfect_score', 1, 75),
('Mente Brillante', 'Obtén 100% en 3 quizzes', '🧠', 'perfect_score', 3, 150),
('Genio', 'Obtén 100% en 5 quizzes', '🏅', 'perfect_score', 5, 250),

-- Engagement badges
('Lector Ávido', 'Visualiza 10 materiales de consulta', '📖', 'materials_viewed', 10, 50),
('Voz Activa', 'Envía 5 feedbacks', '💬', 'feedback_sent', 5, 75)

ON CONFLICT DO NOTHING;