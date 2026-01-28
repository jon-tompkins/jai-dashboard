export const dynamic = 'force-dynamic';

// Calculate tracking 1RM: Epley formula * 0.9
function calcTracking1RM(weight, reps) {
  if (reps === 1) return Math.round(weight * 0.9);
  const epley = weight * (1 + reps / 30);
  return Math.round(epley * 0.9);
}

// Fitness data - will move to Supabase
const GOALS = {
  lifts: [
    { name: 'Shoulder Press', current: 175, tracking: null, goal: 225, color: '#a371f7' },
    { name: 'Bench Press', current: 265, tracking: 242, goal: 315, color: '#58a6ff' },
    { name: 'Squat', current: 295, tracking: 306, goal: 405, color: '#3fb950' },
    { name: 'Deadlift', current: 375, tracking: 383, goal: 495, color: '#f85149' }
  ],
  other: [
    { name: '5k Time', current: 'TBD', goal: 'Sub-25 min' },
    { name: 'Weight', current: 186, goal: 178, unit: 'lbs' }
  ]
};

// Historical data for charts (will come from Supabase exercise_sets table)
const LIFT_HISTORY = {
  'Bench Press': [
    { date: '2026-01-10', weight: 225, reps: 5, tracking1RM: calcTracking1RM(225, 5) },
    { date: '2026-01-15', weight: 235, reps: 5, tracking1RM: calcTracking1RM(235, 5) },
    { date: '2026-01-20', weight: 240, reps: 4, tracking1RM: calcTracking1RM(240, 4) },
    { date: '2026-01-27', weight: 245, reps: 3, tracking1RM: calcTracking1RM(245, 3) }
  ],
  'Squat': [
    { date: '2026-01-08', weight: 265, reps: 5, tracking1RM: calcTracking1RM(265, 5) },
    { date: '2026-01-14', weight: 275, reps: 5, tracking1RM: calcTracking1RM(275, 5) },
    { date: '2026-01-20', weight: 285, reps: 5, tracking1RM: calcTracking1RM(285, 5) },
    { date: '2026-01-26', weight: 295, reps: 5, tracking1RM: calcTracking1RM(295, 5) }
  ],
  'Deadlift': [
    { date: '2026-01-12', weight: 315, reps: 5, tracking1RM: calcTracking1RM(315, 5) },
    { date: '2026-01-19', weight: 335, reps: 5, tracking1RM: calcTracking1RM(335, 5) },
    { date: '2026-01-28', weight: 365, reps: 5, tracking1RM: calcTracking1RM(365, 5) }
  ],
  'Shoulder Press': [
    { date: '2026-01-11', weight: 135, reps: 5, tracking1RM: calcTracking1RM(135, 5) },
    { date: '2026-01-18', weight: 145, reps: 5, tracking1RM: calcTracking1RM(145, 5) }
  ]
};

const RECENT_WORKOUTS = [
  {
    date: '2026-01-28',
    type: 'lower',
    description: 'Deadlift 135x5, 225x5, 315x5, 345x5, 365x5. Bent over row 2x10@135. Zercher RDL 1x8@135. KB kickstand DL 2 sets w/2x24kg. Reverse 2KB lunge offset w/24kg. 10 unbroken pull-ups. Ab wheel.',
    notes: 'Good deadlift session - first tracked DL.',
    topSet: { lift: 'Deadlift', weight: 365, reps: 5, hit: true, tracking1RM: calcTracking1RM(365, 5) }
  },
  {
    date: '2026-01-27',
    type: 'upper',
    description: 'Bench 135x5, 185x5, 225x5, 245x3',
    notes: 'Felt weak going in. Missed 5 at 245. Stay at 245 next session.',
    topSet: { lift: 'Bench', weight: 245, reps: 3, hit: false, tracking1RM: calcTracking1RM(245, 3) }
  },
  {
    date: '2026-01-26',
    type: 'lower',
    description: 'Squat 135x5, 185x5, 225x5, 275x5, 295x5',
    notes: 'All reps complete. Go to 305 next.',
    topSet: { lift: 'Squat', weight: 295, reps: 5, hit: true, tracking1RM: calcTracking1RM(295, 5) }
  }
];

// Body weight history (LEFT axis)
const WEIGHT_HISTORY = [
  { date: '2026-01-01', weight: 188 },
  { date: '2026-01-08', weight: 187 },
  { date: '2026-01-15', weight: 186.5 },
  { date: '2026-01-22', weight: 186 },
  { date: '2026-01-27', weight: 186 }
];

// Run history (RIGHT axis - estimated 5k time in minutes)
// Calculated from pace: (pace_min/mi * 3.1) 
const RUN_HISTORY = [
  { date: '2026-01-09', distance: 3.22, time: '27:12', pace: '8:27', est5k: 26.2 },
  { date: '2026-01-13', distance: 3.26, time: '31:57', pace: '9:47', est5k: 30.3 },
  { date: '2026-01-23', distance: 3.20, time: '26:51', pace: '8:23', est5k: 26.0 }
];

export async function GET() {
  return Response.json({
    goals: GOALS,
    recentWorkouts: RECENT_WORKOUTS,
    liftHistory: LIFT_HISTORY,
    weightHistory: WEIGHT_HISTORY,
    runHistory: RUN_HISTORY,
    schedule: {
      daysPerWeek: 5,
      minutesPerDay: 40,
      fixedDay: 'Full body class with wife',
      customDays: 4
    }
  });
}
