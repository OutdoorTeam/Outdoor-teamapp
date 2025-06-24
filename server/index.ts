import express from 'express';
import dotenv from 'dotenv';
import multer from 'multer';
import { setupStaticServing } from './static-serve.js';
import { db } from './database/connection.js';
import { format, startOfWeek, addDays, parseISO, startOfMonth, endOfMonth } from 'date-fns';

dotenv.config();

const app = express();

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only CSV and PDF files are allowed'));
    }
  }
});

// For demo purposes, we'll use a simple user ID = 1
const DEMO_USER_ID = 1;

// Update user activity log
async function updateUserActivityLog(userId: number, steps: number = 0, habitsCompleted: number = 0, totalPoints: number = 0, dailyNote: string = '') {
  const today = format(new Date(), 'yyyy-MM-dd');
  
  try {
    await db
      .insertInto('user_activity_log')
      .values({
        user_id: userId,
        date: today,
        steps_count: steps,
        habits_completed: habitsCompleted,
        total_points: totalPoints,
        daily_note: dailyNote
      })
      .onConflict((oc) => oc
        .columns(['user_id', 'date'])
        .doUpdateSet({
          steps_count: steps,
          habits_completed: habitsCompleted,
          total_points: totalPoints,
          daily_note: dailyNote,
          updated_at: new Date().toISOString()
        })
      )
      .execute();
  } catch (error) {
    console.error('Error updating activity log:', error);
  }
}

// Get habits calendar data
app.get('/api/habits/calendar', async (req, res) => {
  try {
    const { start, end } = req.query;
    const startDate = start ? start.toString() : format(startOfMonth(new Date()), 'yyyy-MM-dd');
    const endDate = end ? end.toString() : format(endOfMonth(new Date()), 'yyyy-MM-dd');

    console.log('Fetching habits calendar data from', startDate, 'to', endDate);

    const habitsData = await db
      .selectFrom('habit_completions')
      .select([
        'completion_date',
        db.fn.count('id').as('habits_completed')
      ])
      .where('user_id', '=', DEMO_USER_ID)
      .where('completion_date', '>=', startDate)
      .where('completion_date', '<=', endDate)
      .groupBy('completion_date')
      .execute();

    // Convert to object format expected by frontend
    const result = habitsData.reduce((acc, row) => {
      acc[row.completion_date] = Number(row.habits_completed);
      return acc;
    }, {} as Record<string, number>);

    console.log('Habits calendar data:', result);
    res.json(result);
  } catch (error) {
    console.error('Error fetching habits calendar data:', error);
    res.status(500).json({ error: 'Failed to fetch habits calendar data' });
  }
});

// Weekly workout endpoint
app.get('/api/weekly-workout', async (req, res) => {
  try {
    const today = new Date();
    const weekStart = format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    
    const workout = await db
      .selectFrom('weekly_workouts')
      .selectAll()
      .where('week_start_date', '=', weekStart)
      .where('is_active', '=', 1)
      .executeTakeFirst();

    res.json(workout || null);
  } catch (error) {
    console.error('Error fetching weekly workout:', error);
    res.status(500).json({ error: 'Failed to fetch weekly workout' });
  }
});

// Daily workout endpoint
app.get('/api/daily-workout', async (req, res) => {
  try {
    const today = format(new Date(), 'yyyy-MM-dd');
    
    const workout = await db
      .selectFrom('daily_workouts')
      .selectAll()
      .where('workout_date', '=', today)
      .where('is_active', '=', 1)
      .executeTakeFirst();

    res.json(workout || null);
  } catch (error) {
    console.error('Error fetching daily workout:', error);
    res.status(500).json({ error: 'Failed to fetch daily workout' });
  }
});

// Import personalized training plans
app.post('/api/admin/import-personalized-training', upload.single('csvFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const csvContent = req.file.buffer.toString('utf-8');
    const lines = csvContent.trim().split('\n');
    const headers = lines[0].split(',');

    let recordsProcessed = 0;
    const planName = `Plan Personalizado ${format(new Date(), 'dd/MM/yyyy')}`;

    // Get user info
    const user = await db
      .selectFrom('alumnos')
      .select(['nombre'])
      .where('id', '=', parseInt(userId))
      .executeTakeFirst();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Create user training plan record
    const userPlan = await db
      .insertInto('user_training_plans')
      .values({
        user_id: parseInt(userId),
        plan_name: planName,
        plan_data: csvContent,
        is_active: 1
      })
      .returning(['id'])
      .executeTakeFirst();

    // Process each row
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      const row = {} as any;
      
      headers.forEach((header, index) => {
        row[header.trim()] = values[index]?.trim() || null;
      });

      const dia = parseInt(row['dia']);
      
      if (dia && row['ejercicio']) {
        await db
          .insertInto('ejercicios_plan')
          .values({
            plan_id: userPlan!.id,
            dia: dia,
            ejercicio: row['ejercicio'] || '',
            series: row['series'] ? parseInt(row['series']) : null,
            repeticiones: row['repeticiones'] || null,
            pausa: row['pausa'] || null,
            intensidad: row['intensidad'] || null,
            video_url: row['video_url'] || null,
            orden: recordsProcessed
          })
          .execute();

        recordsProcessed++;
      }
    }

    res.json({
      success: true,
      recordsProcessed,
      userName: user.nombre
    });
  } catch (error) {
    console.error('Error importing personalized training plan:', error);
    res.status(500).json({ error: 'Failed to import personalized training plan' });
  }
});

// Import personalized nutrition plans
app.post('/api/admin/import-personalized-nutrition', upload.single('csvFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const fileType = req.file.mimetype;
    let recordsProcessed = 0;
    const planName = `Plan Nutricional ${format(new Date(), 'dd/MM/yyyy')}`;

    // Get user info
    const user = await db
      .selectFrom('alumnos')
      .select(['nombre'])
      .where('id', '=', parseInt(userId))
      .executeTakeFirst();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (fileType === 'application/pdf') {
      // Handle PDF upload - store as binary data
      const pdfContent = req.file.buffer.toString('base64');
      
      await db
        .insertInto('user_nutrition_plans')
        .values({
          user_id: parseInt(userId),
          plan_name: planName,
          plan_data: `PDF:${pdfContent}`, // Prefix to indicate PDF content
          is_active: 1
        })
        .execute();

      recordsProcessed = 1;
    } else {
      // Handle CSV upload
      const csvContent = req.file.buffer.toString('utf-8');
      const lines = csvContent.trim().split('\n');
      const headers = lines[0].split(',');

      // Create user nutrition plan record
      const userPlan = await db
        .insertInto('user_nutrition_plans')
        .values({
          user_id: parseInt(userId),
          plan_name: planName,
          plan_data: csvContent,
          is_active: 1
        })
        .returning(['id'])
        .executeTakeFirst();

      // Process each row
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        const row = {} as any;
        
        headers.forEach((header, index) => {
          row[header.trim()] = values[index]?.trim() || null;
        });

        if (row['tipo_comida'] && row['nombre_comida']) {
          await db
            .insertInto('comidas_plan')
            .values({
              plan_id: userPlan!.id,
              tipo_comida: row['tipo_comida'],
              nombre_comida: row['nombre_comida'],
              ingredientes: row['ingredientes'] || null,
              instrucciones: row['instrucciones'] || null,
              calorias: row['calorias'] ? parseInt(row['calorias']) : null,
              proteinas_g: row['proteinas_g'] ? parseFloat(row['proteinas_g']) : null,
              carbohidratos_g: row['carbohidratos_g'] ? parseFloat(row['carbohidratos_g']) : null,
              grasas_g: row['grasas_g'] ? parseFloat(row['grasas_g']) : null,
              orden: recordsProcessed
            })
            .execute();

          recordsProcessed++;
        }
      }
    }

    res.json({
      success: true,
      recordsProcessed,
      userName: user.nombre,
      fileType: fileType === 'application/pdf' ? 'PDF' : 'CSV'
    });
  } catch (error) {
    console.error('Error importing personalized nutrition plan:', error);
    res.status(500).json({ error: 'Failed to import personalized nutrition plan' });
  }
});

// Import users from spreadsheet
app.post('/api/admin/import-users', upload.single('usersFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const csvContent = req.file.buffer.toString('utf-8');
    const lines = csvContent.trim().split('\n');
    const headers = lines[0].split(',');

    let usersProcessed = 0;

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      const row = {} as any;
      
      headers.forEach((header, index) => {
        row[header.trim()] = values[index]?.trim() || null;
      });

      if (row['email'] && row['nombre']) {
        try {
          await db
            .insertInto('alumnos')
            .values({
              nombre: row['nombre'],
              email: row['email'],
              edad: row['edad'] ? parseInt(row['edad']) : null,
              objetivo: row['objetivo'] || null,
              observaciones: row['observaciones'] || null,
              fecha_pago: row['fecha_pago'] || null,
              fecha_vencimiento: row['fecha_vencimiento'] || null
            })
            .onConflict((oc) => oc
              .column('email')
              .doUpdateSet({
                nombre: row['nombre'],
                updated_at: new Date().toISOString()
              })
            )
            .execute();

          usersProcessed++;
        } catch (error) {
          console.error(`Error processing user ${row['email']}:`, error);
        }
      }
    }

    res.json({
      success: true,
      usersProcessed
    });
  } catch (error) {
    console.error('Error importing users:', error);
    res.status(500).json({ error: 'Failed to import users' });
  }
});

// Get user habits and today's completions
app.get('/api/habits/today', async (req, res) => {
  try {
    const today = format(new Date(), 'yyyy-MM-dd');
    console.log('Fetching habits for date:', today);
    
    const userHabits = await db
      .selectFrom('user_habits')
      .innerJoin('habits', 'habits.id', 'user_habits.habit_id')
      .leftJoin('habit_completions', (join) =>
        join
          .onRef('habit_completions.habit_id', '=', 'habits.id')
          .onRef('habit_completions.user_id', '=', 'user_habits.user_id')
          .on('habit_completions.completion_date', '=', today)
      )
      .select([
        'habits.id',
        'habits.name',
        'habits.description',
        'habits.points',
        'habit_completions.id as completion_id'
      ])
      .where('user_habits.user_id', '=', DEMO_USER_ID)
      .where('user_habits.is_active', '=', 1)
      .where('habits.is_default', '=', 1) // Solo hábitos por defecto
      .orderBy('habits.id') // Orden fijo: ejercicio, pasos, alimentación, respiración
      .execute();

    console.log('User habits found:', userHabits.length);
    res.json(userHabits);
  } catch (error) {
    console.error('Error fetching habits:', error);
    res.status(500).json({ error: 'Failed to fetch habits' });
  }
});

// Toggle habit completion
app.post('/api/habits/:habitId/toggle', async (req, res) => {
  try {
    const habitId = parseInt(req.params.habitId);
    const today = format(new Date(), 'yyyy-MM-dd');
    const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
    
    console.log('Toggling habit:', habitId, 'for date:', today);

    // Check if already completed today
    const existing = await db
      .selectFrom('habit_completions')
      .select(['id', 'points_earned'])
      .where('user_id', '=', DEMO_USER_ID)
      .where('habit_id', '=', habitId)
      .where('completion_date', '=', today)
      .executeTakeFirst();

    if (existing) {
      // Remove completion
      await db
        .deleteFrom('habit_completions')
        .where('id', '=', existing.id)
        .execute();
      
      console.log('Habit completion removed');
    } else {
      // Add completion
      const habit = await db
        .selectFrom('habits')
        .select(['points'])
        .where('id', '=', habitId)
        .executeTakeFirst();

      if (habit) {
        await db
          .insertInto('habit_completions')
          .values({
            user_id: DEMO_USER_ID,
            habit_id: habitId,
            completion_date: today,
            points_earned: habit.points
          })
          .execute();
        
        console.log('Habit completion added');
      }
    }

    // Update weekly points
    await updateWeeklyPoints(DEMO_USER_ID, weekStart);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error toggling habit:', error);
    res.status(500).json({ error: 'Failed to toggle habit' });
  }
});

// Initialize default habits for user
app.post('/api/habits/initialize', async (req, res) => {
  try {
    // Get default habits
    const defaultHabits = await db
      .selectFrom('habits')
      .select(['id'])
      .where('is_default', '=', 1)
      .execute();

    // Add user habits if they don't exist
    for (const habit of defaultHabits) {
      await db
        .insertInto('user_habits')
        .values({
          user_id: DEMO_USER_ID,
          habit_id: habit.id,
          is_active: 1
        })
        .onConflict((oc) => oc.doNothing())
        .execute();
    }

    res.json({ success: true, message: 'Habits initialized' });
  } catch (error) {
    console.error('Error initializing habits:', error);
    res.status(500).json({ error: 'Failed to initialize habits' });
  }
});

// Update weekly points
async function updateWeeklyPoints(userId: number, weekStart: string) {
  try {
    const weekEnd = format(addDays(parseISO(weekStart), 6), 'yyyy-MM-dd');
    
    const weeklyPoints = await db
      .selectFrom('habit_completions')
      .select([db.fn.sum('points_earned').as('total_points')])
      .where('user_id', '=', userId)
      .where('completion_date', '>=', weekStart)
      .where('completion_date', '<=', weekEnd)
      .executeTakeFirst();

    const totalPoints = Number(weeklyPoints?.total_points) || 0;

    await db
      .insertInto('puntos_semanales')
      .values({
        user_id: userId,
        semana_inicio: weekStart,
        total_puntos: totalPoints
      })
      .onConflict((oc) => oc
        .columns(['user_id', 'semana_inicio'])
        .doUpdateSet({
          total_puntos: totalPoints,
          updated_at: new Date().toISOString()
        })
      )
      .execute();
  } catch (error) {
    console.error('Error updating weekly points:', error);
  }
}

// Get points for today
app.get('/api/points/today', async (req, res) => {
  try {
    const today = format(new Date(), 'yyyy-MM-dd');
    const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');

    // Daily points
    const dailyPoints = await db
      .selectFrom('habit_completions')
      .select([
        db.fn.sum('points_earned').as('total_points'),
        db.fn.count('id').as('completed_habits')
      ])
      .where('user_id', '=', DEMO_USER_ID)
      .where('completion_date', '=', today)
      .executeTakeFirst();

    // Weekly points
    const weeklyPoints = await db
      .selectFrom('puntos_semanales')
      .select(['total_puntos'])
      .where('user_id', '=', DEMO_USER_ID)
      .where('semana_inicio', '=', weekStart)
      .executeTakeFirst();

    res.json({
      total_points: Number(dailyPoints?.total_points) || 0,
      completed_habits: Number(dailyPoints?.completed_habits) || 0,
      weekly_points: weeklyPoints?.total_puntos || 0
    });
  } catch (error) {
    console.error('Error fetching points:', error);
    res.status(500).json({ error: 'Failed to fetch points' });
  }
});

// Daily notes endpoints
app.get('/api/notes/today', async (req, res) => {
  try {
    const today = format(new Date(), 'yyyy-MM-dd');
    
    const note = await db
      .selectFrom('daily_notes')
      .select(['content'])
      .where('user_id', '=', DEMO_USER_ID)
      .where('note_date', '=', today)
      .executeTakeFirst();

    res.json(note || { content: '' });
  } catch (error) {
    console.error('Error fetching note:', error);
    res.status(500).json({ error: 'Failed to fetch note' });
  }
});

app.post('/api/notes/today', async (req, res) => {
  try {
    const { content } = req.body;
    const today = format(new Date(), 'yyyy-MM-dd');

    await db
      .insertInto('daily_notes')
      .values({
        user_id: DEMO_USER_ID,
        note_date: today,
        content: content
      })
      .onConflict((oc) => oc
        .columns(['user_id', 'note_date'])
        .doUpdateSet({
          content: content,
          updated_at: new Date().toISOString()
        })
      )
      .execute();

    res.json({ success: true });
  } catch (error) {
    console.error('Error saving note:', error);
    res.status(500).json({ error: 'Failed to save note' });
  }
});

// Training plan endpoints
app.get('/api/plan-entrenamiento', async (req, res) => {
  try {
    const alumno = await db
      .selectFrom('alumnos')
      .selectAll()
      .where('id', '=', DEMO_USER_ID)
      .executeTakeFirst();

    if (!alumno || !alumno.plan_asignado) {
      return res.json(null);
    }

    const plan = await db
      .selectFrom('planes_entrenamiento')
      .selectAll()
      .where('id', '=', alumno.plan_asignado)
      .executeTakeFirst();

    if (!plan) {
      return res.json(null);
    }

    const ejercicios = await db
      .selectFrom('ejercicios_plan')
      .selectAll()
      .where('plan_id', '=', plan.id)
      .orderBy(['dia', 'orden'])
      .execute();

    // Group exercises by day
    const ejercicios_por_dia = ejercicios.reduce((acc, ejercicio) => {
      if (!acc[ejercicio.dia]) {
        acc[ejercicio.dia] = [];
      }
      acc[ejercicio.dia].push(ejercicio);
      return acc;
    }, {} as Record<number, typeof ejercicios>);

    res.json({
      plan,
      alumno,
      ejercicios_por_dia
    });
  } catch (error) {
    console.error('Error fetching training plan:', error);
    res.status(500).json({ error: 'Failed to fetch training plan' });
  }
});

// Nutrition plan endpoints
app.get('/api/plan-nutricion', async (req, res) => {
  try {
    const alumno = await db
      .selectFrom('alumnos')
      .selectAll()
      .where('id', '=', DEMO_USER_ID)
      .executeTakeFirst();

    if (!alumno || !alumno.plan_nutricion_asignado) {
      return res.json(null);
    }

    const plan = await db
      .selectFrom('planes_nutricion')
      .selectAll()
      .where('id', '=', alumno.plan_nutricion_asignado)
      .executeTakeFirst();

    if (!plan) {
      return res.json(null);
    }

    const comidas = await db
      .selectFrom('comidas_plan')
      .selectAll()
      .where('plan_id', '=', plan.id)
      .orderBy(['orden'])
      .execute();

    // Group meals by type
    const comidas_por_tipo = comidas.reduce((acc, comida) => {
      if (!acc[comida.tipo_comida]) {
        acc[comida.tipo_comida] = [];
      }
      acc[comida.tipo_comida].push(comida);
      return acc;
    }, {} as Record<string, typeof comidas>);

    res.json({
      plan,
      alumno,
      comidas_por_tipo
    });
  } catch (error) {
    console.error('Error fetching nutrition plan:', error);
    res.status(500).json({ error: 'Failed to fetch nutrition plan' });
  }
});

// Profile endpoint
app.get('/api/profile', async (req, res) => {
  try {
    const alumno = await db
      .selectFrom('alumnos')
      .selectAll()
      .where('id', '=', DEMO_USER_ID)
      .executeTakeFirst();

    if (!alumno) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get plan name if assigned
    let planName = null;
    if (alumno.plan_asignado) {
      const plan = await db
        .selectFrom('planes_entrenamiento')
        .select(['nombre'])
        .where('id', '=', alumno.plan_asignado)
        .executeTakeFirst();
      planName = plan?.nombre || null;
    }

    // Calculate stats for the last 30 days
    const thirtyDaysAgo = format(addDays(new Date(), -30), 'yyyy-MM-dd');
    const today = format(new Date(), 'yyyy-MM-dd');
    const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');

    // Average daily steps
    const stepsData = await db
      .selectFrom('user_activity_log')
      .select([db.fn.avg('steps_count').as('avg_steps')])
      .where('user_id', '=', DEMO_USER_ID)
      .where('date', '>=', thirtyDaysAgo)
      .where('steps_count', '>', 0)
      .executeTakeFirst();

    // Habits completion rate
    const totalDays = 30;
    const habitsData = await db
      .selectFrom('user_activity_log')
      .select([db.fn.avg('habits_completed').as('avg_habits')])
      .where('user_id', '=', DEMO_USER_ID)
      .where('date', '>=', thirtyDaysAgo)
      .executeTakeFirst();

    // Weekly stats
    const weeklyStats = await db
      .selectFrom('user_activity_log')
      .select([
        db.fn.sum('total_points').as('weekly_points'),
        db.fn.sum('habits_completed').as('weekly_habits')
      ])
      .where('user_id', '=', DEMO_USER_ID)
      .where('date', '>=', weekStart)
      .executeTakeFirst();

    // Meditation sessions this week
    const meditationSessions = await db
      .selectFrom('meditation_sessions')
      .select([db.fn.count('id').as('session_count')])
      .where('user_id', '=', DEMO_USER_ID)
      .where('session_date', '>=', weekStart)
      .executeTakeFirst();

    // Current streak (consecutive days with habits completed)
    const recentDays = await db
      .selectFrom('user_activity_log')
      .select(['date', 'habits_completed'])
      .where('user_id', '=', DEMO_USER_ID)
      .where('date', '<=', today)
      .orderBy('date', 'desc')
      .limit(30)
      .execute();

    let currentStreak = 0;
    for (const day of recentDays) {
      if (day.habits_completed > 0) {
        currentStreak++;
      } else {
        break;
      }
    }

    const profile = {
      id: alumno.id,
      name: alumno.nombre,
      email: alumno.email,
      age: alumno.edad,
      objetivo: alumno.objetivo,
      plan_name: planName,
      subscription_end_date: alumno.fecha_vencimiento,
      stats: {
        average_daily_steps: Math.round(Number(stepsData?.avg_steps) || 0),
        habits_completion_rate: Math.round((Number(habitsData?.avg_habits) || 0) * 100 / 4), // Assuming 4 default habits
        weekly_total_points: Number(weeklyStats?.weekly_points) || 0,
        weekly_habits_completed: Number(weeklyStats?.weekly_habits) || 0,
        weekly_meditation_sessions: Number(meditationSessions?.session_count) || 0,
        current_streak: currentStreak
      }
    };

    res.json(profile);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Meditation endpoints
app.get('/api/meditation/settings', async (req, res) => {
  try {
    const settings = await db
      .selectFrom('user_meditation_settings')
      .select(['inhale_seconds', 'hold_seconds', 'exhale_seconds', 'sound_enabled'])
      .where('user_id', '=', DEMO_USER_ID)
      .executeTakeFirst();

    if (!settings) {
      // Return default settings
      res.json({
        inhale_seconds: 6,
        hold_seconds: 5,
        exhale_seconds: 6,
        sound_enabled: 1
      });
    } else {
      res.json(settings);
    }
  } catch (error) {
    console.error('Error fetching meditation settings:', error);
    res.status(500).json({ error: 'Failed to fetch meditation settings' });
  }
});

app.put('/api/meditation/settings', async (req, res) => {
  try {
    const { inhale_seconds, hold_seconds, exhale_seconds, sound_enabled } = req.body;

    await db
      .insertInto('user_meditation_settings')
      .values({
        user_id: DEMO_USER_ID,
        inhale_seconds,
        hold_seconds,
        exhale_seconds,
        sound_enabled
      })
      .onConflict((oc) => oc
        .column('user_id')
        .doUpdateSet({
          inhale_seconds,
          hold_seconds,
          exhale_seconds,
          sound_enabled,
          updated_at: new Date().toISOString()
        })
      )
      .execute();

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating meditation settings:', error);
    res.status(500).json({ error: 'Failed to update meditation settings' });
  }
});

app.post('/api/meditation/session', async (req, res) => {
  try {
    const { duration_minutes, cycles_completed } = req.body;
    const today = format(new Date(), 'yyyy-MM-dd');

    await db
      .insertInto('meditation_sessions')
      .values({
        user_id: DEMO_USER_ID,
        session_date: today,
        duration_minutes,
        cycles_completed
      })
      .execute();

    res.json({ success: true });
  } catch (error) {
    console.error('Error saving meditation session:', error);
    res.status(500).json({ error: 'Failed to save meditation session' });
  }
});

// Active breaks endpoints
app.get('/api/active-breaks', async (req, res) => {
  try {
    const breaks = await db
      .selectFrom('active_breaks')
      .selectAll()
      .where('is_active', '=', 1)
      .orderBy('display_order')
      .execute();

    res.json(breaks);
  } catch (error) {
    console.error('Error fetching active breaks:', error);
    res.status(500).json({ error: 'Failed to fetch active breaks' });
  }
});

// Plan configurations endpoints
app.get('/api/plan-configs', async (req, res) => {
  try {
    const plans = await db
      .selectFrom('plan_configurations')
      .selectAll()
      .orderBy('display_order')
      .execute();

    // Parse benefits JSON for each plan
    const plansWithBenefits = plans.map(plan => ({
      ...plan,
      benefits: plan.benefits ? JSON.parse(plan.benefits) : []
    }));

    res.json(plansWithBenefits);
  } catch (error) {
    console.error('Error fetching plan configurations:', error);
    res.status(500).json({ error: 'Failed to fetch plan configurations' });
  }
});

// Landing content endpoint
app.get('/api/landing-content', async (req, res) => {
  try {
    const content = await db
      .selectFrom('landing_content')
      .selectAll()
      .where('is_active', '=', 1)
      .orderBy('display_order')
      .execute();

    res.json(content);
  } catch (error) {
    console.error('Error fetching landing content:', error);
    res.status(500).json({ error: 'Failed to fetch landing content' });
  }
});

// Admin endpoints
app.get('/api/admin/students', async (req, res) => {
  try {
    const students = await db
      .selectFrom('alumnos')
      .selectAll()
      .orderBy('nombre')
      .execute();

    res.json(students);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

app.get('/api/admin/user-access', async (req, res) => {
  try {
    const users = await db
      .selectFrom('alumnos')
      .select(['id', 'nombre', 'email', 'plan_asignado', 'fecha_vencimiento'])
      .orderBy('nombre')
      .execute();

    // Get section access for each user
    const usersWithAccess = await Promise.all(
      users.map(async (user) => {
        const sectionAccess = await db
          .selectFrom('user_section_access')
          .select(['section_name', 'is_enabled'])
          .where('user_id', '=', user.id)
          .execute();

        const sections = {
          training: false,
          nutrition: false,
          breaks: false,
          meditation: false
        };

        sectionAccess.forEach(access => {
          if (access.section_name in sections) {
            sections[access.section_name as keyof typeof sections] = Boolean(access.is_enabled);
          }
        });

        return {
          ...user,
          sections
        };
      })
    );

    res.json(usersWithAccess);
  } catch (error) {
    console.error('Error fetching user access:', error);
    res.status(500).json({ error: 'Failed to fetch user access' });
  }
});

app.put('/api/admin/user-access', async (req, res) => {
  try {
    const { user_id, section_name, is_enabled } = req.body;

    await db
      .insertInto('user_section_access')
      .values({
        user_id,
        section_name,
        is_enabled: is_enabled ? 1 : 0
      })
      .onConflict((oc) => oc
        .columns(['user_id', 'section_name'])
        .doUpdateSet({
          is_enabled: is_enabled ? 1 : 0,
          updated_at: new Date().toISOString()
        })
      )
      .execute();

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating user access:', error);
    res.status(500).json({ error: 'Failed to update user access' });
  }
});

// Update user subscription status
app.put('/api/admin/user-subscription', async (req, res) => {
  try {
    const { user_id, subscription_status, fecha_vencimiento } = req.body;

    await db
      .updateTable('alumnos')
      .set({
        fecha_vencimiento: subscription_status === 'active' ? fecha_vencimiento : null,
        updated_at: new Date().toISOString()
      })
      .where('id', '=', user_id)
      .execute();

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating user subscription:', error);
    res.status(500).json({ error: 'Failed to update user subscription' });
  }
});

// Admin active breaks management
app.get('/api/admin/active-breaks', async (req, res) => {
  try {
    const breaks = await db
      .selectFrom('active_breaks')
      .selectAll()
      .orderBy('display_order')
      .execute();

    res.json(breaks);
  } catch (error) {
    console.error('Error fetching active breaks:', error);
    res.status(500).json({ error: 'Failed to fetch active breaks' });
  }
});

app.post('/api/admin/active-breaks', async (req, res) => {
  try {
    const { title, description, duration_minutes, work_type, video_url, gif_url, instructions, is_active, display_order } = req.body;

    await db
      .insertInto('active_breaks')
      .values({
        title,
        description,
        duration_minutes,
        work_type,
        video_url,
        gif_url,
        instructions,
        is_active: is_active ? 1 : 0,
        display_order: display_order || 0
      })
      .execute();

    res.json({ success: true });
  } catch (error) {
    console.error('Error creating active break:', error);
    res.status(500).json({ error: 'Failed to create active break' });
  }
});

app.put('/api/admin/active-breaks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, duration_minutes, work_type, video_url, gif_url, instructions, is_active, display_order } = req.body;

    await db
      .updateTable('active_breaks')
      .set({
        title,
        description,
        duration_minutes,
        work_type,
        video_url,
        gif_url,
        instructions,
        is_active: is_active ? 1 : 0,
        display_order: display_order || 0
      })
      .where('id', '=', parseInt(id))
      .execute();

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating active break:', error);
    res.status(500).json({ error: 'Failed to update active break' });
  }
});

app.delete('/api/admin/active-breaks/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await db
      .deleteFrom('active_breaks')
      .where('id', '=', parseInt(id))
      .execute();

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting active break:', error);
    res.status(500).json({ error: 'Failed to delete active break' });
  }
});

// Admin plan configurations management
app.get('/api/admin/plan-configs', async (req, res) => {
  try {
    const plans = await db
      .selectFrom('plan_configurations')
      .selectAll()
      .orderBy('display_order')
      .execute();

    // Parse benefits JSON for each plan
    const plansWithBenefits = plans.map(plan => ({
      ...plan,
      benefits: plan.benefits ? JSON.parse(plan.benefits) : []
    }));

    res.json(plansWithBenefits);
  } catch (error) {
    console.error('Error fetching plan configurations:', error);
    res.status(500).json({ error: 'Failed to fetch plan configurations' });
  }
});

app.post('/api/admin/plan-configs', async (req, res) => {
  try {
    const { name, description, price, benefits, is_active, display_order } = req.body;

    await db
      .insertInto('plan_configurations')
      .values({
        name,
        description,
        price,
        benefits: JSON.stringify(benefits),
        is_active: is_active ? 1 : 0,
        display_order: display_order || 0
      })
      .execute();

    res.json({ success: true });
  } catch (error) {
    console.error('Error creating plan configuration:', error);
    res.status(500).json({ error: 'Failed to create plan configuration' });
  }
});

app.put('/api/admin/plan-configs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, benefits, is_active, display_order } = req.body;

    await db
      .updateTable('plan_configurations')
      .set({
        name,
        description,
        price,
        benefits: JSON.stringify(benefits),
        is_active: is_active ? 1 : 0,
        display_order: display_order || 0,
        updated_at: new Date().toISOString()
      })
      .where('id', '=', parseInt(id))
      .execute();

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating plan configuration:', error);
    res.status(500).json({ error: 'Failed to update plan configuration' });
  }
});

app.delete('/api/admin/plan-configs/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await db
      .deleteFrom('plan_configurations')
      .where('id', '=', parseInt(id))
      .execute();

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting plan configuration:', error);
    res.status(500).json({ error: 'Failed to delete plan configuration' });
  }
});

// Start server function
export async function startServer(port = 3001) {
  // Setup static file serving
  setupStaticServing(app);

  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

// Only start server if this file is being run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const port = process.env.PORT ? parseInt(process.env.PORT) : 3001;
  startServer(port);
}
