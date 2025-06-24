export interface DatabaseSchema {
  users: {
    id: number;
    email: string;
    name: string;
    password_hash: string;
    subscription_status: string;
    subscription_end_date: string | null;
    is_admin: number;
    created_at: string;
    updated_at: string;
  };
  habits: {
    id: number;
    name: string;
    description: string | null;
    points: number;
    is_default: number;
    created_at: string;
  };
  user_habits: {
    id: number;
    user_id: number;
    habit_id: number;
    is_active: number;
    created_at: string;
  };
  habit_completions: {
    id: number;
    user_id: number;
    habit_id: number;
    completion_date: string;
    points_earned: number;
    created_at: string;
  };
  exercises: {
    id: number;
    name: string;
    description: string | null;
    youtube_url: string | null;
    muscle_groups: string | null;
    difficulty_level: string | null;
    equipment_needed: string | null;
    created_at: string;
  };
  training_plans: {
    id: number;
    user_id: number;
    name: string;
    description: string | null;
    start_date: string | null;
    end_date: string | null;
    is_active: number;
    created_at: string;
  };
  training_plan_exercises: {
    id: number;
    training_plan_id: number;
    exercise_id: number;
    day_of_week: number;
    sets: number | null;
    reps: string | null;
    rest_time: string | null;
    notes: string | null;
  };
  daily_notes: {
    id: number;
    user_id: number;
    note_date: string;
    content: string;
    created_at: string;
    updated_at: string;
  };
  payments: {
    id: number;
    user_id: number;
    amount: number;
    currency: string;
    status: string;
    payment_method: string | null;
    external_payment_id: string | null;
    created_at: string;
  };
  alumnos: {
    id: number;
    nombre: string;
    email: string;
    edad: number | null;
    objetivo: string | null;
    observaciones: string | null;
    plan_asignado: number | null;
    fecha_pago: string | null;
    fecha_vencimiento: string | null;
    puntaje_total: number | null;
    plan_nutricion_asignado: number | null;
    created_at: string;
    updated_at: string;
  };
  planes_entrenamiento: {
    id: number;
    nombre: string;
    objetivo: string | null;
    frecuencia: string | null;
    pasos_diarios: number | null;
    pausas_activas: string | null;
    duracion: string | null;
    descripcion: string | null;
    created_at: string;
  };
  ejercicios_plan: {
    id: number;
    plan_id: number;
    dia: number;
    ejercicio: string;
    series: number | null;
    repeticiones: string | null;
    pausa: string | null;
    intensidad: string | null;
    video_url: string | null;
    orden: number | null;
  };
  puntos_semanales: {
    id: number;
    user_id: number;
    semana_inicio: string;
    total_puntos: number;
    created_at: string;
    updated_at: string;
  };
  planes_nutricion: {
    id: number;
    nombre: string;
    objetivo: string | null;
    descripcion: string | null;
    calorias_diarias: number | null;
    proteinas_g: number | null;
    carbohidratos_g: number | null;
    grasas_g: number | null;
    created_at: string;
  };
  comidas_plan: {
    id: number;
    plan_id: number;
    tipo_comida: string;
    nombre_comida: string;
    ingredientes: string | null;
    instrucciones: string | null;
    calorias: number | null;
    proteinas_g: number | null;
    carbohidratos_g: number | null;
    grasas_g: number | null;
    orden: number | null;
  };
  user_activity_log: {
    id: number;
    user_id: number;
    date: string;
    steps_count: number;
    habits_completed: number;
    total_points: number;
    daily_note: string | null;
    created_at: string;
    updated_at: string;
  };
  plan_configurations: {
    id: number;
    name: string;
    description: string | null;
    price: number;
    benefits: string;
    is_active: number;
    display_order: number;
    allowed_sections: string | null;
    created_at: string;
    updated_at: string;
  };
  active_breaks: {
    id: number;
    title: string;
    description: string | null;
    duration_minutes: number | null;
    work_type: string | null;
    video_url: string | null;
    gif_url: string | null;
    instructions: string | null;
    is_active: number;
    display_order: number;
    created_at: string;
  };
  notifications: {
    id: number;
    user_id: number | null;
    title: string;
    message: string;
    type: string;
    is_read: number;
    scheduled_at: string | null;
    sent_at: string | null;
    created_at: string;
  };
  landing_content: {
    id: number;
    section: string;
    title: string | null;
    content: string | null;
    image_url: string | null;
    link_url: string | null;
    display_order: number;
    is_active: number;
    updated_at: string;
  };
  user_meditation_settings: {
    id: number;
    user_id: number;
    inhale_seconds: number;
    hold_seconds: number;
    exhale_seconds: number;
    sound_enabled: number;
    created_at: string;
    updated_at: string;
  };
  meditation_sessions: {
    id: number;
    user_id: number;
    session_date: string;
    duration_minutes: number;
    cycles_completed: number;
    created_at: string;
  };
  user_section_access: {
    id: number;
    user_id: number;
    section_name: string;
    is_enabled: number;
    enabled_by_plan: number;
    created_at: string;
    updated_at: string;
  };
  daily_workouts: {
    id: number;
    workout_date: string;
    title: string;
    description: string | null;
    exercises_json: string | null;
    video_url: string | null;
    is_active: number;
    created_at: string;
  };
}