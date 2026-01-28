export const dynamic = 'force-dynamic';

// Fitness data - could move to Supabase later
const GOALS = {
  lifts: [
    { name: 'Shoulder Press', current: 175, tracking: null, goal: 225 },
    { name: 'Bench Press', current: 265, tracking: 242, goal: 315 },
    { name: 'Squat', current: 295, tracking: 306, goal: 405 },
    { name: 'Deadlift', current: 375, tracking: null, goal: 495 }
  ],
  other: [
    { name: '5k Time', current: 'TBD', goal: 'Sub-25 min' },
    { name: 'Weight', current: 186, goal: 178, unit: 'lbs' }
  ]
};

const RECENT_WORKOUTS = [
  {
    date: '2026-01-27',
    type: 'Chest / Bench',
    weight: 186,
    exercises: [
      { name: 'Bench', sets: [{ weight: 135, reps: 5 }, { weight: 185, reps: 5 }, { weight: 225, reps: 5 }, { weight: 245, reps: 3 }] }
    ],
    notes: 'Felt weak going in. Missed 5 at 245. Stay at 245 next session.',
    topSet: { lift: 'Bench', weight: 245, reps: 3, hit: false }
  },
  {
    date: '2026-01-26',
    type: 'Squats',
    exercises: [
      { name: 'Squat', sets: [{ weight: 135, reps: 5 }, { weight: 185, reps: 5 }, { weight: 225, reps: 5 }, { weight: 275, reps: 5 }, { weight: 295, reps: 5 }] }
    ],
    notes: 'All reps complete. Go to 305 next.',
    topSet: { lift: 'Squat', weight: 295, reps: 5, hit: true }
  }
];

export async function GET() {
  return Response.json({
    goals: GOALS,
    recentWorkouts: RECENT_WORKOUTS,
    schedule: {
      daysPerWeek: 5,
      minutesPerDay: 40,
      fixedDay: 'Full body class with wife',
      customDays: 4
    }
  });
}
