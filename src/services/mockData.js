/**
 * Mock Mode Configuration
 * 
 * When VITE_MOCK_MODE=true, the app will:
 * - Skip all backend API calls
 * - Use mock user data (auto-authenticated)
 * - Use mock mood entries, groups, and statistics
 * - Persist data to localStorage for the session
 * 
 * Usage: Set VITE_MOCK_MODE=true in .env.local or run:
 *   VITE_MOCK_MODE=true npm run dev
 */

// Check if mock mode is enabled
export const isMockMode = import.meta.env.VITE_MOCK_MODE === 'true';

// LocalStorage keys for mock persistence
const STORAGE_KEYS = {
    ENTRIES: 'twilightio_mock_entries',
    GROUPS: 'twilightio_mock_groups',
    GOALS: 'twilightio_mock_goals',
    REMINDERS: 'twilightio_mock_reminders',
};

// Mock user data
export const mockUser = {
    id: 'mock-user-001',
    name: 'Demo User',
    email: 'demo@mock.local',
    picture: '',
    created_at: new Date().toISOString(),
};

// Helper to create date N days ago
const daysAgo = (days) => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    date.setHours(Math.floor(Math.random() * 12) + 8, Math.floor(Math.random() * 60), 0, 0);
    return date.toISOString();
};

// Default mock mood entries - 35+ entries spanning 6 weeks for a realistic demo
const defaultMockEntries = [
    // Today
    {
        id: 'mock-entry-1',
        user_id: 'mock-user-001',
        mood: 5,
        note: "Had a fantastic day! Went for a long run in the park and enjoyed the sunshine. Met a friend for coffee afterward. Feeling grateful for the little things.",
        created_at: daysAgo(0),
        updated_at: daysAgo(0),
        selections: [
            { id: 'sel-1', option_id: 'opt-1', option_name: 'Running', group_name: 'Exercise' },
            { id: 'sel-2', option_id: 'opt-2', option_name: 'Nature', group_name: 'Activities' },
            { id: 'sel-3', option_id: 'opt-3', option_name: 'Friends', group_name: 'Social' },
            { id: 'sel-4', option_id: 'opt-4', option_name: 'Coffee', group_name: 'Food & Drink' },
        ],
        media: [],
    },
    // Yesterday
    {
        id: 'mock-entry-2',
        user_id: 'mock-user-001',
        mood: 4,
        note: "Productive morning at work. Finished that big presentation I've been working on. Had a nice lunch with colleagues to celebrate.",
        created_at: daysAgo(1),
        updated_at: daysAgo(1),
        selections: [
            { id: 'sel-5', option_id: 'opt-5', option_name: 'Work', group_name: 'Activities' },
            { id: 'sel-6', option_id: 'opt-6', option_name: 'Colleagues', group_name: 'Social' },
            { id: 'sel-7', option_id: 'opt-7', option_name: 'Achievement', group_name: 'Emotions' },
        ],
        media: [],
    },
    // 2 days ago
    {
        id: 'mock-entry-3',
        user_id: 'mock-user-001',
        mood: 3,
        note: "Average day. Nothing special happened but nothing bad either. Spent the evening reading a new novel I started.",
        created_at: daysAgo(2),
        updated_at: daysAgo(2),
        selections: [
            { id: 'sel-8', option_id: 'opt-8', option_name: 'Reading', group_name: 'Hobbies' },
            { id: 'sel-9', option_id: 'opt-9', option_name: 'Relaxing', group_name: 'Activities' },
        ],
        media: [],
    },
    // 3 days ago
    {
        id: 'mock-entry-4',
        user_id: 'mock-user-001',
        mood: 4,
        note: "Great yoga session this morning! Feeling centered and calm. Made a healthy smoothie afterward.",
        created_at: daysAgo(3),
        updated_at: daysAgo(3),
        selections: [
            { id: 'sel-10', option_id: 'opt-10', option_name: 'Yoga', group_name: 'Exercise' },
            { id: 'sel-11', option_id: 'opt-11', option_name: 'Calm', group_name: 'Emotions' },
            { id: 'sel-12', option_id: 'opt-12', option_name: 'Healthy Eating', group_name: 'Health' },
        ],
        media: [],
    },
    // 4 days ago
    {
        id: 'mock-entry-5',
        user_id: 'mock-user-001',
        mood: 2,
        note: "Felt a bit stressed today. Work deadlines piling up. Had trouble sleeping last night which didn't help. Need to focus on self-care this week.",
        created_at: daysAgo(4),
        updated_at: daysAgo(4),
        selections: [
            { id: 'sel-13', option_id: 'opt-5', option_name: 'Work', group_name: 'Activities' },
            { id: 'sel-14', option_id: 'opt-13', option_name: 'Stress', group_name: 'Emotions' },
            { id: 'sel-15', option_id: 'opt-14', option_name: 'Poor Sleep', group_name: 'Health' },
        ],
        media: [],
    },
    // 5 days ago
    {
        id: 'mock-entry-6',
        user_id: 'mock-user-001',
        mood: 5,
        note: "Great weekend! Tried a new restaurant with my partner. The food was amazing. Walked around the city afterward enjoying the weather.",
        created_at: daysAgo(5),
        updated_at: daysAgo(5),
        selections: [
            { id: 'sel-16', option_id: 'opt-15', option_name: 'Partner', group_name: 'Social' },
            { id: 'sel-17', option_id: 'opt-16', option_name: 'Restaurant', group_name: 'Food & Drink' },
            { id: 'sel-18', option_id: 'opt-2', option_name: 'Nature', group_name: 'Activities' },
        ],
        media: [],
    },
    // 6 days ago
    {
        id: 'mock-entry-7',
        user_id: 'mock-user-001',
        mood: 4,
        note: "Saturday morning farmer's market run. Bought fresh vegetables and made a big batch of soup. Feeling domestic and content.",
        created_at: daysAgo(6),
        updated_at: daysAgo(6),
        selections: [
            { id: 'sel-19', option_id: 'opt-17', option_name: 'Cooking', group_name: 'Hobbies' },
            { id: 'sel-20', option_id: 'opt-18', option_name: 'Shopping', group_name: 'Activities' },
            { id: 'sel-21', option_id: 'opt-12', option_name: 'Healthy Eating', group_name: 'Health' },
        ],
        media: [],
    },
    // 7 days ago
    {
        id: 'mock-entry-8',
        user_id: 'mock-user-001',
        mood: 3,
        note: "Friday at work was okay. Looking forward to the weekend. Started watching a new TV series in the evening.",
        created_at: daysAgo(7),
        updated_at: daysAgo(7),
        selections: [
            { id: 'sel-22', option_id: 'opt-5', option_name: 'Work', group_name: 'Activities' },
            { id: 'sel-23', option_id: 'opt-19', option_name: 'TV/Movies', group_name: 'Entertainment' },
        ],
        media: [],
    },
    // 8 days ago
    {
        id: 'mock-entry-9',
        user_id: 'mock-user-001',
        mood: 4,
        note: "Had a great video call with old friends I haven't seen in months. Really lifted my spirits!",
        created_at: daysAgo(8),
        updated_at: daysAgo(8),
        selections: [
            { id: 'sel-24', option_id: 'opt-3', option_name: 'Friends', group_name: 'Social' },
            { id: 'sel-25', option_id: 'opt-20', option_name: 'Grateful', group_name: 'Emotions' },
        ],
        media: [],
    },
    // 9 days ago
    {
        id: 'mock-entry-10',
        user_id: 'mock-user-001',
        mood: 5,
        note: "Crushed my workout today! New personal best on deadlifts. Feeling strong and accomplished.",
        created_at: daysAgo(9),
        updated_at: daysAgo(9),
        selections: [
            { id: 'sel-26', option_id: 'opt-21', option_name: 'Gym', group_name: 'Exercise' },
            { id: 'sel-27', option_id: 'opt-7', option_name: 'Achievement', group_name: 'Emotions' },
        ],
        media: [],
    },
    // 10 days ago
    {
        id: 'mock-entry-11',
        user_id: 'mock-user-001',
        mood: 3,
        note: "Bit of a slow day. Worked from home and stayed in most of the day. Did some light cleaning.",
        created_at: daysAgo(10),
        updated_at: daysAgo(10),
        selections: [
            { id: 'sel-28', option_id: 'opt-22', option_name: 'Work from Home', group_name: 'Activities' },
            { id: 'sel-29', option_id: 'opt-23', option_name: 'Chores', group_name: 'Activities' },
        ],
        media: [],
    },
    // 11 days ago
    {
        id: 'mock-entry-12',
        user_id: 'mock-user-001',
        mood: 1,
        note: "Really tough day. Got some bad news about a family situation. Couldn't focus on anything. Talked to my partner about it which helped a little.",
        created_at: daysAgo(11),
        updated_at: daysAgo(11),
        selections: [
            { id: 'sel-30', option_id: 'opt-24', option_name: 'Family', group_name: 'Social' },
            { id: 'sel-31', option_id: 'opt-25', option_name: 'Sad', group_name: 'Emotions' },
            { id: 'sel-32', option_id: 'opt-15', option_name: 'Partner', group_name: 'Social' },
        ],
        media: [],
    },
    // 12 days ago
    {
        id: 'mock-entry-13',
        user_id: 'mock-user-001',
        mood: 4,
        note: "Went hiking with friends. Beautiful trail with amazing views. Got some great photos!",
        created_at: daysAgo(12),
        updated_at: daysAgo(12),
        selections: [
            { id: 'sel-33', option_id: 'opt-26', option_name: 'Hiking', group_name: 'Exercise' },
            { id: 'sel-34', option_id: 'opt-2', option_name: 'Nature', group_name: 'Activities' },
            { id: 'sel-35', option_id: 'opt-3', option_name: 'Friends', group_name: 'Social' },
            { id: 'sel-36', option_id: 'opt-27', option_name: 'Photography', group_name: 'Hobbies' },
        ],
        media: [],
    },
    // 13 days ago
    {
        id: 'mock-entry-14',
        user_id: 'mock-user-001',
        mood: 4,
        note: "Productive Saturday! Deep-cleaned the apartment and reorganized my closet. Feels good to have a fresh space.",
        created_at: daysAgo(13),
        updated_at: daysAgo(13),
        selections: [
            { id: 'sel-37', option_id: 'opt-23', option_name: 'Chores', group_name: 'Activities' },
            { id: 'sel-38', option_id: 'opt-7', option_name: 'Achievement', group_name: 'Emotions' },
        ],
        media: [],
    },
    // 14 days ago
    {
        id: 'mock-entry-15',
        user_id: 'mock-user-001',
        mood: 3,
        note: "Long week finally over. Ordered pizza and watched movies. Sometimes you just need a lazy evening.",
        created_at: daysAgo(14),
        updated_at: daysAgo(14),
        selections: [
            { id: 'sel-39', option_id: 'opt-19', option_name: 'TV/Movies', group_name: 'Entertainment' },
            { id: 'sel-40', option_id: 'opt-28', option_name: 'Takeout', group_name: 'Food & Drink' },
            { id: 'sel-41', option_id: 'opt-9', option_name: 'Relaxing', group_name: 'Activities' },
        ],
        media: [],
    },
    // 15 days ago
    {
        id: 'mock-entry-16',
        user_id: 'mock-user-001',
        mood: 2,
        note: "Didn't sleep well. Headache all day. Tried to push through work but wasn't very productive.",
        created_at: daysAgo(15),
        updated_at: daysAgo(15),
        selections: [
            { id: 'sel-42', option_id: 'opt-14', option_name: 'Poor Sleep', group_name: 'Health' },
            { id: 'sel-43', option_id: 'opt-29', option_name: 'Headache', group_name: 'Health' },
            { id: 'sel-44', option_id: 'opt-5', option_name: 'Work', group_name: 'Activities' },
        ],
        media: [],
    },
    // 16 days ago
    {
        id: 'mock-entry-17',
        user_id: 'mock-user-001',
        mood: 4,
        note: "Started learning guitar! Watched some tutorials and practiced basic chords. Fingers hurt but it's fun.",
        created_at: daysAgo(16),
        updated_at: daysAgo(16),
        selections: [
            { id: 'sel-45', option_id: 'opt-30', option_name: 'Music', group_name: 'Hobbies' },
            { id: 'sel-46', option_id: 'opt-31', option_name: 'Learning', group_name: 'Activities' },
        ],
        media: [],
    },
    // 17 days ago
    {
        id: 'mock-entry-18',
        user_id: 'mock-user-001',
        mood: 5,
        note: "Date night! Went to a concert with my partner. The band was incredible and we had so much fun dancing.",
        created_at: daysAgo(17),
        updated_at: daysAgo(17),
        selections: [
            { id: 'sel-47', option_id: 'opt-32', option_name: 'Concert', group_name: 'Entertainment' },
            { id: 'sel-48', option_id: 'opt-15', option_name: 'Partner', group_name: 'Social' },
            { id: 'sel-49', option_id: 'opt-33', option_name: 'Excited', group_name: 'Emotions' },
        ],
        media: [],
    },
    // 18 days ago
    {
        id: 'mock-entry-19',
        user_id: 'mock-user-001',
        mood: 3,
        note: "Regular Wednesday. Nothing to report. Made dinner at home and went to bed early.",
        created_at: daysAgo(18),
        updated_at: daysAgo(18),
        selections: [
            { id: 'sel-50', option_id: 'opt-17', option_name: 'Cooking', group_name: 'Hobbies' },
            { id: 'sel-51', option_id: 'opt-34', option_name: 'Good Sleep', group_name: 'Health' },
        ],
        media: [],
    },
    // 19 days ago
    {
        id: 'mock-entry-20',
        user_id: 'mock-user-001',
        mood: 4,
        note: "Morning meditation session was really helpful. Felt more centered throughout the day. Might make this a regular thing.",
        created_at: daysAgo(19),
        updated_at: daysAgo(19),
        selections: [
            { id: 'sel-52', option_id: 'opt-35', option_name: 'Meditation', group_name: 'Health' },
            { id: 'sel-53', option_id: 'opt-11', option_name: 'Calm', group_name: 'Emotions' },
        ],
        media: [],
    },
    // 20 days ago
    {
        id: 'mock-entry-21',
        user_id: 'mock-user-001',
        mood: 5,
        note: "Got promoted at work!! 🎉 All that hard work paid off. Celebrated with champagne with the team.",
        created_at: daysAgo(20),
        updated_at: daysAgo(20),
        selections: [
            { id: 'sel-54', option_id: 'opt-5', option_name: 'Work', group_name: 'Activities' },
            { id: 'sel-55', option_id: 'opt-7', option_name: 'Achievement', group_name: 'Emotions' },
            { id: 'sel-56', option_id: 'opt-6', option_name: 'Colleagues', group_name: 'Social' },
            { id: 'sel-57', option_id: 'opt-33', option_name: 'Excited', group_name: 'Emotions' },
        ],
        media: [],
    },
    // 22 days ago
    {
        id: 'mock-entry-22',
        user_id: 'mock-user-001',
        mood: 4,
        note: "Finally finished that book I've been reading for weeks. Really satisfying ending. Started browsing for my next read.",
        created_at: daysAgo(22),
        updated_at: daysAgo(22),
        selections: [
            { id: 'sel-58', option_id: 'opt-8', option_name: 'Reading', group_name: 'Hobbies' },
            { id: 'sel-59', option_id: 'opt-7', option_name: 'Achievement', group_name: 'Emotions' },
        ],
        media: [],
    },
    // 24 days ago
    {
        id: 'mock-entry-23',
        user_id: 'mock-user-001',
        mood: 2,
        note: "Feeling under the weather. Think I'm coming down with something. Stayed in bed most of the day.",
        created_at: daysAgo(24),
        updated_at: daysAgo(24),
        selections: [
            { id: 'sel-60', option_id: 'opt-36', option_name: 'Sick', group_name: 'Health' },
            { id: 'sel-61', option_id: 'opt-9', option_name: 'Relaxing', group_name: 'Activities' },
        ],
        media: [],
    },
    // 25 days ago
    {
        id: 'mock-entry-24',
        user_id: 'mock-user-001',
        mood: 3,
        note: "Still not 100% but feeling better. Worked from home and took it easy.",
        created_at: daysAgo(25),
        updated_at: daysAgo(25),
        selections: [
            { id: 'sel-62', option_id: 'opt-22', option_name: 'Work from Home', group_name: 'Activities' },
            { id: 'sel-63', option_id: 'opt-36', option_name: 'Sick', group_name: 'Health' },
        ],
        media: [],
    },
    // 27 days ago
    {
        id: 'mock-entry-25',
        user_id: 'mock-user-001',
        mood: 5,
        note: "Family gathering for my mom's birthday! So nice to see everyone. Great food, lots of laughs, and heartwarming memories.",
        created_at: daysAgo(27),
        updated_at: daysAgo(27),
        selections: [
            { id: 'sel-64', option_id: 'opt-24', option_name: 'Family', group_name: 'Social' },
            { id: 'sel-65', option_id: 'opt-37', option_name: 'Celebration', group_name: 'Activities' },
            { id: 'sel-66', option_id: 'opt-20', option_name: 'Grateful', group_name: 'Emotions' },
        ],
        media: [],
    },
    // 28 days ago
    {
        id: 'mock-entry-26',
        user_id: 'mock-user-001',
        mood: 4,
        note: "Tried a new coffee shop that just opened. Their lattes are amazing! Might become my new regular spot.",
        created_at: daysAgo(28),
        updated_at: daysAgo(28),
        selections: [
            { id: 'sel-67', option_id: 'opt-4', option_name: 'Coffee', group_name: 'Food & Drink' },
            { id: 'sel-68', option_id: 'opt-8', option_name: 'Reading', group_name: 'Hobbies' },
        ],
        media: [],
    },
    // 30 days ago
    {
        id: 'mock-entry-27',
        user_id: 'mock-user-001',
        mood: 3,
        note: "Just an ordinary day. Sometimes ordinary is nice.",
        created_at: daysAgo(30),
        updated_at: daysAgo(30),
        selections: [
            { id: 'sel-69', option_id: 'opt-5', option_name: 'Work', group_name: 'Activities' },
        ],
        media: [],
    },
    // 32 days ago
    {
        id: 'mock-entry-28',
        user_id: 'mock-user-001',
        mood: 5,
        note: "Beach day! 🏖️ Perfect weather, crystal clear water. Built sandcastles like a kid. So refreshing.",
        created_at: daysAgo(32),
        updated_at: daysAgo(32),
        selections: [
            { id: 'sel-70', option_id: 'opt-38', option_name: 'Beach', group_name: 'Activities' },
            { id: 'sel-71', option_id: 'opt-2', option_name: 'Nature', group_name: 'Activities' },
            { id: 'sel-72', option_id: 'opt-3', option_name: 'Friends', group_name: 'Social' },
        ],
        media: [],
    },
    // 35 days ago
    {
        id: 'mock-entry-29',
        user_id: 'mock-user-001',
        mood: 4,
        note: "Hosted a game night with friends. Competitive Monopoly got intense but all in good fun!",
        created_at: daysAgo(35),
        updated_at: daysAgo(35),
        selections: [
            { id: 'sel-73', option_id: 'opt-39', option_name: 'Games', group_name: 'Entertainment' },
            { id: 'sel-74', option_id: 'opt-3', option_name: 'Friends', group_name: 'Social' },
        ],
        media: [],
    },
    // 38 days ago
    {
        id: 'mock-entry-30',
        user_id: 'mock-user-001',
        mood: 2,
        note: "Monday blues hit hard. Long meetings all day. Need to find ways to recharge during the workweek.",
        created_at: daysAgo(38),
        updated_at: daysAgo(38),
        selections: [
            { id: 'sel-75', option_id: 'opt-5', option_name: 'Work', group_name: 'Activities' },
            { id: 'sel-76', option_id: 'opt-13', option_name: 'Stress', group_name: 'Emotions' },
            { id: 'sel-77', option_id: 'opt-40', option_name: 'Tired', group_name: 'Health' },
        ],
        media: [],
    },
    // 40 days ago
    {
        id: 'mock-entry-31',
        user_id: 'mock-user-001',
        mood: 4,
        note: "Art museum visit with my partner. Discovered a new favorite artist. The sculptures were breathtaking.",
        created_at: daysAgo(40),
        updated_at: daysAgo(40),
        selections: [
            { id: 'sel-78', option_id: 'opt-41', option_name: 'Museum', group_name: 'Entertainment' },
            { id: 'sel-79', option_id: 'opt-15', option_name: 'Partner', group_name: 'Social' },
            { id: 'sel-80', option_id: 'opt-42', option_name: 'Inspired', group_name: 'Emotions' },
        ],
        media: [],
    },
    // 42 days ago
    {
        id: 'mock-entry-32',
        user_id: 'mock-user-001',
        mood: 3,
        note: "Rainy day, stayed in. Caught up on emails and household admin. Not exciting but necessary.",
        created_at: daysAgo(42),
        updated_at: daysAgo(42),
        selections: [
            { id: 'sel-81', option_id: 'opt-23', option_name: 'Chores', group_name: 'Activities' },
            { id: 'sel-82', option_id: 'opt-43', option_name: 'Weather', group_name: 'External' },
        ],
        media: [],
    },
];

// Default mock groups with options - comprehensive categories
const defaultMockGroups = [
    {
        id: 'group-1',
        name: 'Exercise',
        icon: '💪',
        user_id: 'mock-user-001',
        options: [
            { id: 'opt-1', name: 'Running', icon: 'Activity', group_id: 'group-1' },
            { id: 'opt-10', name: 'Yoga', icon: 'Heart', group_id: 'group-1' },
            { id: 'opt-21', name: 'Gym', icon: 'Dumbbell', group_id: 'group-1' },
            { id: 'opt-26', name: 'Hiking', icon: 'Sun', group_id: 'group-1' },
            { id: 'opt-44', name: 'Swimming', icon: 'Activity', group_id: 'group-1' },
            { id: 'opt-45', name: 'Cycling', icon: 'Bike', group_id: 'group-1' },
        ],
    },
    {
        id: 'group-2',
        name: 'Activities',
        icon: '🎯',
        user_id: 'mock-user-001',
        options: [
            { id: 'opt-2', name: 'Nature', icon: 'Sun', group_id: 'group-2' },
            { id: 'opt-5', name: 'Work', icon: 'Briefcase', group_id: 'group-2' },
            { id: 'opt-9', name: 'Relaxing', icon: 'Coffee', group_id: 'group-2' },
            { id: 'opt-18', name: 'Shopping', icon: 'ShoppingBag', group_id: 'group-2' },
            { id: 'opt-22', name: 'Work from Home', icon: 'Home', group_id: 'group-2' },
            { id: 'opt-23', name: 'Chores', icon: 'Home', group_id: 'group-2' },
            { id: 'opt-31', name: 'Learning', icon: 'BookOpen', group_id: 'group-2' },
            { id: 'opt-37', name: 'Celebration', icon: 'Zap', group_id: 'group-2' },
            { id: 'opt-38', name: 'Beach', icon: 'Sun', group_id: 'group-2' },
        ],
    },
    {
        id: 'group-3',
        name: 'Social',
        icon: '👥',
        user_id: 'mock-user-001',
        options: [
            { id: 'opt-3', name: 'Friends', icon: 'Users', group_id: 'group-3' },
            { id: 'opt-6', name: 'Colleagues', icon: 'Users', group_id: 'group-3' },
            { id: 'opt-15', name: 'Partner', icon: 'Heart', group_id: 'group-3' },
            { id: 'opt-24', name: 'Family', icon: 'Users', group_id: 'group-3' },
            { id: 'opt-46', name: 'Alone Time', icon: 'Moon', group_id: 'group-3' },
        ],
    },
    {
        id: 'group-4',
        name: 'Food & Drink',
        icon: '🍽️',
        user_id: 'mock-user-001',
        options: [
            { id: 'opt-4', name: 'Coffee', icon: 'Coffee', group_id: 'group-4' },
            { id: 'opt-16', name: 'Restaurant', icon: 'Utensils', group_id: 'group-4' },
            { id: 'opt-28', name: 'Takeout', icon: 'Utensils', group_id: 'group-4' },
            { id: 'opt-47', name: 'Home Cooked', icon: 'Utensils', group_id: 'group-4' },
            { id: 'opt-48', name: 'Drinks', icon: 'Coffee', group_id: 'group-4' },
        ],
    },
    {
        id: 'group-5',
        name: 'Hobbies',
        icon: '🎨',
        user_id: 'mock-user-001',
        options: [
            { id: 'opt-8', name: 'Reading', icon: 'BookOpen', group_id: 'group-5' },
            { id: 'opt-17', name: 'Cooking', icon: 'Utensils', group_id: 'group-5' },
            { id: 'opt-27', name: 'Photography', icon: 'Smile', group_id: 'group-5' },
            { id: 'opt-30', name: 'Music', icon: 'Music', group_id: 'group-5' },
            { id: 'opt-49', name: 'Gaming', icon: 'Gamepad2', group_id: 'group-5' },
            { id: 'opt-50', name: 'Gardening', icon: 'Sun', group_id: 'group-5' },
        ],
    },
    {
        id: 'group-6',
        name: 'Emotions',
        icon: '💭',
        user_id: 'mock-user-001',
        options: [
            { id: 'opt-7', name: 'Achievement', icon: 'Zap', group_id: 'group-6' },
            { id: 'opt-11', name: 'Calm', icon: 'Moon', group_id: 'group-6' },
            { id: 'opt-13', name: 'Stress', icon: 'CloudRain', group_id: 'group-6' },
            { id: 'opt-20', name: 'Grateful', icon: 'Heart', group_id: 'group-6' },
            { id: 'opt-25', name: 'Sad', icon: 'CloudRain', group_id: 'group-6' },
            { id: 'opt-33', name: 'Excited', icon: 'Zap', group_id: 'group-6' },
            { id: 'opt-42', name: 'Inspired', icon: 'Smile', group_id: 'group-6' },
            { id: 'opt-51', name: 'Anxious', icon: 'CloudRain', group_id: 'group-6' },
        ],
    },
    {
        id: 'group-7',
        name: 'Health',
        icon: '❤️',
        user_id: 'mock-user-001',
        options: [
            { id: 'opt-12', name: 'Healthy Eating', icon: 'Utensils', group_id: 'group-7' },
            { id: 'opt-14', name: 'Poor Sleep', icon: 'Moon', group_id: 'group-7' },
            { id: 'opt-29', name: 'Headache', icon: 'CloudRain', group_id: 'group-7' },
            { id: 'opt-34', name: 'Good Sleep', icon: 'Moon', group_id: 'group-7' },
            { id: 'opt-35', name: 'Meditation', icon: 'Heart', group_id: 'group-7' },
            { id: 'opt-36', name: 'Sick', icon: 'CloudRain', group_id: 'group-7' },
            { id: 'opt-40', name: 'Tired', icon: 'Moon', group_id: 'group-7' },
        ],
    },
    {
        id: 'group-8',
        name: 'Entertainment',
        icon: '🎬',
        user_id: 'mock-user-001',
        options: [
            { id: 'opt-19', name: 'TV/Movies', icon: 'Tv', group_id: 'group-8' },
            { id: 'opt-32', name: 'Concert', icon: 'Music', group_id: 'group-8' },
            { id: 'opt-39', name: 'Games', icon: 'Gamepad2', group_id: 'group-8' },
            { id: 'opt-41', name: 'Museum', icon: 'Home', group_id: 'group-8' },
            { id: 'opt-52', name: 'Theater', icon: 'Tv', group_id: 'group-8' },
        ],
    },
    {
        id: 'group-9',
        name: 'External',
        icon: '🌤️',
        user_id: 'mock-user-001',
        options: [
            { id: 'opt-43', name: 'Weather', icon: 'CloudRain', group_id: 'group-9' },
            { id: 'opt-53', name: 'Travel', icon: 'Plane', group_id: 'group-9' },
            { id: 'opt-54', name: 'News', icon: 'BookOpen', group_id: 'group-9' },
        ],
    },
];

// Default mock goals - varied goals with different progress levels
const defaultMockGoals = [
    {
        id: 'goal-1',
        user_id: 'mock-user-001',
        title: 'Exercise 3x per week',
        description: 'Stay active with running, yoga, or gym sessions',
        frequency_per_week: 3,
        frequency_type: 'weekly',
        target_count: 3,
        current_count: 2,
        created_at: daysAgo(30),
        is_completed: false,
    },
    {
        id: 'goal-2',
        user_id: 'mock-user-001',
        title: 'Daily reading',
        description: 'Read at least 30 minutes every day',
        frequency_per_week: 7,
        frequency_type: 'daily',
        target_count: 7,
        current_count: 5,
        created_at: daysAgo(21),
        is_completed: false,
    },
    {
        id: 'goal-3',
        user_id: 'mock-user-001',
        title: 'Meditate weekly',
        description: 'Practice mindfulness at least twice a week',
        frequency_per_week: 2,
        frequency_type: 'weekly',
        target_count: 2,
        current_count: 2,
        created_at: daysAgo(14),
        is_completed: true,
    },
    {
        id: 'goal-4',
        user_id: 'mock-user-001',
        title: 'Cook at home more',
        description: 'Prepare homemade meals 4 times per week',
        frequency_per_week: 4,
        frequency_type: 'weekly',
        target_count: 4,
        current_count: 3,
        created_at: daysAgo(28),
        is_completed: false,
    },
    {
        id: 'goal-5',
        user_id: 'mock-user-001',
        title: 'Connect with friends',
        description: 'Reach out to friends or family at least once a week',
        frequency_per_week: 1,
        frequency_type: 'weekly',
        target_count: 1,
        current_count: 1,
        created_at: daysAgo(35),
        is_completed: true,
    },
];

// Mock statistics - reflects 32 entries with realistic distribution
export const mockStatistics = {
    total_entries: 32,
    average_mood: 3.7,
    mood_distribution: { 1: 1, 2: 5, 3: 8, 4: 12, 5: 6 },
    entries_this_week: 7,
    entries_this_month: 27,
    most_common_mood: 4,
    mood_trend: 'improving',
};

// Mock streak - longer streak reflecting consistent journaling
export const mockStreak = {
    current_streak: 12,
    longest_streak: 18,
};

// Helper to get data from localStorage or use defaults
function getStoredData(key, defaultData) {
    try {
        const stored = localStorage.getItem(key);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (e) {
        console.warn('[MOCK] Failed to parse stored data:', e);
    }
    return [...defaultData];
}

// Helper to save data to localStorage
function saveData(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
        console.warn('[MOCK] Failed to save data:', e);
    }
}

// Simulated network delay
const delay = (ms = 200) => new Promise(resolve => setTimeout(resolve, ms));

const mockAchievementDefinitions = [
    { achievement_type: 'first_entry', name: 'First Entry', description: 'Log your first mood entry', icon: 'Zap', rarity: 'common', category: 'milestones', secret: false, target: 1 },
    { achievement_type: 'week_warrior', name: 'Week Warrior', description: 'Maintain a 7-day streak', icon: 'Flame', rarity: 'uncommon', category: 'streak', secret: false, target: 7 },
    { achievement_type: 'consistency_king', name: 'Consistency King', description: 'Maintain a 30-day streak', icon: 'Crown', rarity: 'rare', category: 'streak', secret: false, target: 30 },
    { achievement_type: 'data_lover', name: 'Data Lover', description: 'View statistics 10 times', icon: 'BarChart3', rarity: 'uncommon', category: 'analytics', secret: false, target: 10 },
    { achievement_type: 'mood_master', name: 'Mood Master', description: 'Log 100 total entries', icon: 'Target', rarity: 'legendary', category: 'milestones', secret: false, target: 100 },
    { achievement_type: 'complex_person', name: 'Complex Person', description: 'Experience all 5 mood levels', icon: 'Sparkles', rarity: 'uncommon', category: 'moods', secret: false, target: 5 },
    { achievement_type: 'half_year', name: 'Half Year Hero', description: 'Maintain a 180-day streak', icon: 'Medal', rarity: 'legendary', category: 'streak', secret: false, target: 180 },
    { achievement_type: 'devoted', name: 'Devoted', description: 'Maintain a 365-day streak', icon: 'Trophy', rarity: 'legendary', category: 'streak', secret: true, target: 365 },
    { achievement_type: 'photographer', name: 'Photographer', description: 'Attach 50 photos to entries', icon: 'Camera', rarity: 'rare', category: 'media', secret: false, target: 50 },
    { achievement_type: 'goal_crusher', name: 'Goal Crusher', description: 'Complete 10 goals', icon: 'CheckCircle2', rarity: 'rare', category: 'goals', secret: false, target: 10 },
    { achievement_type: 'comeback_king', name: 'Comeback King', description: 'Return to a 7-day streak after losing a longer one', icon: 'RefreshCw', rarity: 'rare', category: 'streak', secret: true, target: 7 },
    { achievement_type: 'milestone_50', name: 'Getting Started', description: 'Log 50 entries', icon: 'Award', rarity: 'uncommon', category: 'milestones', secret: false, target: 50 },
    { achievement_type: 'milestone_250', name: 'Journaling Journey', description: 'Log 250 entries', icon: 'Star', rarity: 'rare', category: 'milestones', secret: false, target: 250 },
    { achievement_type: 'milestone_500', name: 'Prolific Writer', description: 'Log 500 entries', icon: 'Gem', rarity: 'legendary', category: 'milestones', secret: false, target: 500 },
];

let mockDaylioJobSeq = 1;
const mockDaylioJobs = new Map();

// Mock API service that mirrors the real API interface
export const mockApiService = {
    token: 'mock-token',

    setAuthToken() {
        // No-op in mock mode
    },

    // Auth
    async googleAuth() {
        await delay(300);
        return { token: 'mock-token', user: mockUser };
    },

    async localLogin() {
        await delay(300);
        return { token: 'mock-token', user: mockUser };
    },

    async verifyToken() {
        await delay(100);
        return { user: mockUser };
    },

    async getPublicConfig() {
        await delay(100);
        return { enable_google_oauth: false };
    },

    // Mood entries
    async getMoodEntries() {
        await delay(300);
        const entries = getStoredData(STORAGE_KEYS.ENTRIES, defaultMockEntries);
        // Normalize entries to ensure they have a date field (derive from created_at if missing)
        // Use ISO date format (YYYY-MM-DD) for reliable parsing
        const normalized = entries.map(entry => {
            if (entry.date) return entry;
            const dateObj = entry.created_at ? new Date(entry.created_at) : new Date();
            const isoDate = dateObj.toISOString().split('T')[0]; // YYYY-MM-DD
            return { ...entry, date: isoDate };
        });
        return normalized.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    },

    async createMoodEntry(entryData) {
        await delay(300);
        const entries = getStoredData(STORAGE_KEYS.ENTRIES, defaultMockEntries);
        const newEntry = {
            id: `mock-entry-${Date.now()}`,
            user_id: 'mock-user-001',
            mood: entryData.mood,
            content: entryData.content || entryData.note || '',
            date: entryData.date || new Date().toLocaleDateString(),
            time: entryData.time || new Date().toISOString(),
            created_at: entryData.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString(),
            selections: [],
            media: [],
        };
        entries.unshift(newEntry);
        saveData(STORAGE_KEYS.ENTRIES, entries);
        // Return format matching Flask backend: { entry: {...}, new_achievements: [] }
        return { entry: newEntry, new_achievements: [] };
    },

    async updateMoodEntry(entryId, entryData) {
        await delay(300);
        const entries = getStoredData(STORAGE_KEYS.ENTRIES, defaultMockEntries);
        const index = entries.findIndex(e => e.id === entryId);
        if (index !== -1) {
            entries[index] = { ...entries[index], ...entryData, updated_at: new Date().toISOString() };
            saveData(STORAGE_KEYS.ENTRIES, entries);
            // Return format matching Flask backend: { entry: {...} }
            return { entry: entries[index] };
        }
        throw new Error('Entry not found');
    },

    async deleteMoodEntry(entryId) {
        await delay(200);
        const entries = getStoredData(STORAGE_KEYS.ENTRIES, defaultMockEntries);
        const filtered = entries.filter(e => e.id !== entryId);
        saveData(STORAGE_KEYS.ENTRIES, filtered);
        return { success: true };
    },

    async getEntrySelections(entryId) {
        await delay(100);
        const entries = getStoredData(STORAGE_KEYS.ENTRIES, defaultMockEntries);
        const entry = entries.find(e => e.id === entryId);
        return entry?.selections || [];
    },

    async getEntryMedia(entryId) {
        await delay(100);
        const entries = getStoredData(STORAGE_KEYS.ENTRIES, defaultMockEntries);
        const entry = entries.find(e => e.id === entryId);
        return entry?.media || [];
    },

    // Statistics
    async getStatistics() {
        await delay(200);
        const entries = getStoredData(STORAGE_KEYS.ENTRIES, defaultMockEntries);
        const moodDist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        let total = 0;
        entries.forEach(e => {
            moodDist[e.mood] = (moodDist[e.mood] || 0) + 1;
            total += e.mood;
        });
        return {
            total_entries: entries.length,
            average_mood: entries.length ? (total / entries.length).toFixed(1) : 0,
            mood_distribution: moodDist,
            entries_this_week: entries.filter(e => new Date(e.created_at) > new Date(Date.now() - 7 * 86400000)).length,
            entries_this_month: entries.length,
            most_common_mood: Object.entries(moodDist).sort((a, b) => b[1] - a[1])[0]?.[0] || 3,
            mood_trend: 'stable',
        };
    },

    async getCurrentStreak() {
        await delay(100);
        return mockStreak;
    },

    async getStreakDetails() {
        await delay(100);
        return { ...mockStreak, streak_dates: [] };
    },

    // Groups
    async getGroups() {
        await delay(200);
        return getStoredData(STORAGE_KEYS.GROUPS, defaultMockGroups);
    },

    async createGroup(groupData) {
        await delay(300);
        const groups = getStoredData(STORAGE_KEYS.GROUPS, defaultMockGroups);
        const newGroup = {
            id: `group-${Date.now()}`,
            name: groupData.name || groupData,
            icon: groupData.icon || '📁',
            user_id: 'mock-user-001',
            options: [],
        };
        groups.push(newGroup);
        saveData(STORAGE_KEYS.GROUPS, groups);
        return newGroup;
    },

    async createGroupOption(groupId, optionData) {
        await delay(200);
        const groups = getStoredData(STORAGE_KEYS.GROUPS, defaultMockGroups);
        const group = groups.find(g => g.id === groupId);
        if (group) {
            const newOption = {
                id: `opt-${Date.now()}`,
                name: optionData.name || optionData,
                group_id: groupId,
            };
            group.options.push(newOption);
            saveData(STORAGE_KEYS.GROUPS, groups);
            return newOption;
        }
        throw new Error('Group not found');
    },

    async deleteGroupOption(optionId) {
        await delay(200);
        const groups = getStoredData(STORAGE_KEYS.GROUPS, defaultMockGroups);
        groups.forEach(g => {
            g.options = g.options.filter(o => o.id !== optionId);
        });
        saveData(STORAGE_KEYS.GROUPS, groups);
        return { success: true };
    },

    async moveGroupOption(optionId, newGroupId) {
        await delay(200);
        const groups = getStoredData(STORAGE_KEYS.GROUPS, defaultMockGroups);
        let option = null;
        groups.forEach(g => {
            const idx = g.options.findIndex(o => o.id === optionId);
            if (idx !== -1) {
                option = g.options.splice(idx, 1)[0];
            }
        });
        if (option) {
            const targetGroup = groups.find(g => g.id === newGroupId);
            if (targetGroup) {
                option.group_id = newGroupId;
                targetGroup.options.push(option);
            }
            saveData(STORAGE_KEYS.GROUPS, groups);
        }
        return { success: true };
    },

    async deleteGroup(groupId) {
        await delay(200);
        const groups = getStoredData(STORAGE_KEYS.GROUPS, defaultMockGroups);
        const filtered = groups.filter(g => g.id !== groupId);
        saveData(STORAGE_KEYS.GROUPS, filtered);
        return { success: true };
    },

    // Goals
    async getGoals() {
        await delay(200);
        return getStoredData(STORAGE_KEYS.GOALS, defaultMockGoals);
    },

    async createGoal(goalData) {
        await delay(300);
        const goals = getStoredData(STORAGE_KEYS.GOALS, defaultMockGoals);
        const newGoal = {
            id: `goal-${Date.now()}`,
            user_id: 'mock-user-001',
            ...goalData,
            current_count: 0,
            created_at: new Date().toISOString(),
        };
        goals.push(newGoal);
        saveData(STORAGE_KEYS.GOALS, goals);
        return newGoal;
    },

    async updateGoal(goalId, patch) {
        await delay(200);
        const goals = getStoredData(STORAGE_KEYS.GOALS, defaultMockGoals);
        const index = goals.findIndex(g => g.id === goalId);
        if (index !== -1) {
            goals[index] = { ...goals[index], ...patch };
            saveData(STORAGE_KEYS.GOALS, goals);
            return goals[index];
        }
        throw new Error('Goal not found');
    },

    async deleteGoal(goalId) {
        await delay(200);
        const goals = getStoredData(STORAGE_KEYS.GOALS, defaultMockGoals);
        const filtered = goals.filter(g => g.id !== goalId);
        saveData(STORAGE_KEYS.GOALS, filtered);
        return { success: true };
    },

    async incrementGoalProgress(goalId) {
        await delay(200);
        const goals = getStoredData(STORAGE_KEYS.GOALS, defaultMockGoals);
        const goal = goals.find(g => g.id === goalId);
        if (goal) {
            goal.current_count = (goal.current_count || 0) + 1;
            saveData(STORAGE_KEYS.GOALS, goals);
            return goal;
        }
        throw new Error('Goal not found');
    },

    async getGoalCompletions() {
        await delay(100);
        return [
            { goal_id: 'goal-3', completed_at: daysAgo(7) },
            { goal_id: 'goal-5', completed_at: daysAgo(3) },
        ];
    },

    async toggleGoalCompletion(goalId) {
        await delay(200);
        return { success: true, goalId };
    },

    // Achievements
    async getAchievementDefinitions() {
        await delay(120);
        return mockAchievementDefinitions;
    },

    async getUserAchievements() {
        await delay(200);
        const progress = await this.getAchievementsProgress();
        return progress
            .filter((row) => row.is_unlocked)
            .map((row, idx) => ({
                id: idx + 1,
                achievement_type: row.achievement_type,
                name: row.name,
                description: row.description,
                icon: row.icon,
                rarity: row.rarity,
                secret: row.secret,
                unlocked_at: daysAgo(Math.max(1, 14 - idx)),
            }));
    },

    async checkAchievements() {
        await delay(200);
        return { new_achievements: [] };
    },

    async getAchievementsProgress() {
        await delay(200);
        const progressByType = {
            first_entry: 1,
            week_warrior: 7,
            consistency_king: 12,
            data_lover: 5,
            mood_master: 46,
            complex_person: 4,
            half_year: 12,
            devoted: 12,
            photographer: 8,
            goal_crusher: 4,
            comeback_king: 2,
            milestone_50: 46,
            milestone_250: 46,
            milestone_500: 46,
        };

        return mockAchievementDefinitions.map((definition) => {
            const current = Math.min(
                definition.target,
                progressByType[definition.achievement_type] ?? 0
            );
            const max = Math.max(1, definition.target);
            const percent = Math.round((current / max) * 100);
            return {
                ...definition,
                current,
                max,
                percent,
                is_unlocked: current >= max,
            };
        });
    },

    // Analytics - return meaningful correlations and insights
    async getAnalyticsCorrelations() {
        await delay(200);
        return [
            { option_name: 'Exercise', correlation_strength: 0.8, count: 8, average_mood: 4.5 },
            { option_name: 'Friends', correlation_strength: 0.7, count: 7, average_mood: 4.3 },
            { option_name: 'Nature', correlation_strength: 0.6, count: 6, average_mood: 4.2 },
            { option_name: 'Partner', correlation_strength: 0.5, count: 5, average_mood: 4.4 },
            { option_name: 'Poor Sleep', correlation_strength: -0.7, count: 3, average_mood: 2.3 },
            { option_name: 'Stress', correlation_strength: -0.6, count: 4, average_mood: 2.5 },
            { option_name: 'Work', correlation_strength: 0.1, count: 10, average_mood: 3.4 },
        ];
    },

    async getAnalyticsCoOccurrence() {
        await delay(200);
        return [
            { option1_name: 'Exercise', option1_icon: 'Dumbbell', option2_name: 'Nature', option2_icon: 'TreePine', count: 4 },
            { option1_name: 'Friends', option1_icon: 'Users', option2_name: 'Coffee', option2_icon: 'Coffee', count: 3 },
            { option1_name: 'Partner', option1_icon: 'Heart', option2_name: 'Restaurant', option2_icon: 'Utensils', count: 3 },
            { option1_name: 'Work', option1_icon: 'Briefcase', option2_name: 'Stress', option2_icon: 'AlertCircle', count: 3 },
            { option1_name: 'Poor Sleep', option1_icon: 'Moon', option2_name: 'Headache', option2_icon: 'Brain', count: 2 },
        ];
    },

    async getMoodStability() {
        await delay(200);
        // Trend data for chart
        const trend = Array.from({ length: 30 }, (_, i) => ({
            date: new Date(Date.now() - (29 - i) * 86400000).toISOString().slice(0, 10),
            score: 50 + Math.random() * 40 // Random score 50-90
        }));

        return {
            stability_score: 78,
            variance: 0.92,
            trend: 'stable',
            // Structure expected by MoodStability component
            score: { score: 78, count: 32 },
            trend_data: trend
        };
    },

    async getAnalyticsCoOccurrenceByMood(mood) {
        await delay(200);
        // Return flat array based on mood, handling numeric or string input
        // If mood is 'all', return all. If undefined, return empty.

        const highMood = [
            { option1_name: 'Exercise', option2_name: 'Nature', count: 6, average_mood: 4.8, option1_icon: '💪', option2_icon: '🎯' },
            { option1_name: 'Friends', option2_name: 'Food', count: 5, average_mood: 4.7, option1_icon: '👥', option2_icon: '🍽️' },
            { option1_name: 'Nature', option2_name: 'Photo', count: 5, average_mood: 4.6, option1_icon: '🎯', option2_icon: '📸' },
        ];

        const lowMood = [
            { option1_name: 'Poor Sleep', option2_name: 'Stress', count: 3, average_mood: 2.1, option1_icon: '❤️', option2_icon: '💭' },
            { option1_name: 'Stress', option2_name: 'Work', count: 3, average_mood: 2.3, option1_icon: '💭', option2_icon: '🎯' },
            { option1_name: 'Sick', option2_name: 'Tired', count: 2, average_mood: 1.8, option1_icon: '❤️', option2_icon: '❤️' },
        ];

        // Simple logic: mood > 3 is high
        if (Number(mood) >= 4) return highMood;
        if (Number(mood) <= 3) return lowMood;
        return [...highMood, ...lowMood];
    },

    // Batch analytics endpoint for Statistics page
    async getAnalyticsBatch() {
        await delay(200);
        const correlations = await this.getAnalyticsCorrelations();
        const coOccurrence = await this.getAnalyticsCoOccurrence();

        // Generate mock scales
        const scales = [
            { id: 1, user_id: 1, name: 'Energy', min_value: 0, max_value: 10, color_hex: '#8b5cf6', created_at: new Date().toISOString() },
            { id: 2, user_id: 1, name: 'Anxiety', min_value: 0, max_value: 10, color_hex: '#ef4444', created_at: new Date().toISOString() },
        ];

        // Generate mock scale entries for the past 7 days
        const scaleEntries = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            scaleEntries.push(
                { date: dateStr, name: 'Energy', value: Math.floor(Math.random() * 4) + 6 },
                { date: dateStr, name: 'Anxiety', value: Math.floor(Math.random() * 4) + 2 }
            );
        }

        return { correlations, coOccurrence, scales, scaleEntries };
    },

    async getAdvancedCorrelations() {
        await delay(200);
        return {
            positive_correlations: [
                { factor: 'Exercise', correlation: 0.72, confidence: 'high' },
                { factor: 'Social Activity', correlation: 0.68, confidence: 'high' },
                { factor: 'Good Sleep', correlation: 0.61, confidence: 'medium' },
            ],
            negative_correlations: [
                { factor: 'Poor Sleep', correlation: -0.74, confidence: 'high' },
                { factor: 'Work Stress', correlation: -0.58, confidence: 'medium' },
            ],
            insights: [
                'Your mood tends to be highest on days with exercise (+0.72)',
                'Social activities consistently boost your mood (+0.68)',
                'Poor sleep has a significant negative impact on your mood (-0.74)',
            ],
        };
    },

    // Mood Definitions
    async getMoodDefinitions() {
        await delay(100);
        return [
            { score: 1, label: 'Awful', color: '#ef4444', emoji: '😢' },
            { score: 2, label: 'Bad', color: '#f97316', emoji: '😕' },
            { score: 3, label: 'Okay', color: '#eab308', emoji: '😐' },
            { score: 4, label: 'Good', color: '#84cc16', emoji: '🙂' },
            { score: 5, label: 'Great', color: '#22c55e', emoji: '😄' },
        ];
    },

    async updateMoodDefinition(score, updates) {
        await delay(200);
        return { score, ...updates };
    },

    // Scales
    async getScales() {
        await delay(100);
        return [];
    },

    async createScale() {
        await delay(200);
        return { id: `scale-${Date.now()}` };
    },

    async updateScale() {
        await delay(200);
        return { success: true };
    },

    async deleteScale() {
        await delay(200);
        return { success: true };
    },

    async getScaleEntries() {
        await delay(100);
        return [];
    },

    async getEntryScales() {
        await delay(100);
        return [];
    },

    async saveEntryScales() {
        await delay(100);
        return { success: true };
    },

    // Important Days
    async getImportantDays() {
        await delay(100);
        return [];
    },

    async createImportantDay() {
        await delay(200);
        return { id: `day-${Date.now()}` };
    },

    async updateImportantDay() {
        await delay(200);
        return { success: true };
    },

    async deleteImportantDay() {
        await delay(200);
        return { success: true };
    },

    async getUpcomingImportantDays() {
        await delay(100);
        return [];
    },

    // Settings
    async getUserSettings() {
        await delay(100);
        return { pin_enabled: false, lock_timeout: 300 };
    },

    async setPin() {
        await delay(200);
        return { success: true };
    },

    async removePin() {
        await delay(200);
        return { success: true };
    },

    async verifyPin() {
        await delay(200);
        return { valid: true };
    },

    async updateLockTimeout() {
        await delay(200);
        return { success: true };
    },

    // Reminder + push settings
    async getPushVapidPublicKey() {
        await delay(120);
        return { publicKey: 'BMk_fake_vapid_public_key_for_mock_mode_1234567890' };
    },

    async subscribePush() {
        await delay(120);
        return { status: 'subscribed' };
    },

    async sendTestPush() {
        await delay(120);
        return { message: 'Mock notification sent.' };
    },

    async getReminders() {
        await delay(120);
        return getStoredData(STORAGE_KEYS.REMINDERS, []);
    },

    async createReminder(payload) {
        await delay(180);
        const reminders = getStoredData(STORAGE_KEYS.REMINDERS, []);
        const reminder = {
            id: Date.now(),
            time: payload.time,
            days: Array.isArray(payload.days) ? payload.days : [0, 1, 2, 3, 4, 5, 6],
            message: payload.message || 'Time to log your mood!',
            goal_id: payload.goal_id ?? null,
            is_active: payload.is_active ?? true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };
        reminders.push(reminder);
        saveData(STORAGE_KEYS.REMINDERS, reminders);
        return { status: 'created', id: reminder.id };
    },

    async updateReminder(reminderId, payload) {
        await delay(180);
        const reminders = getStoredData(STORAGE_KEYS.REMINDERS, []);
        const index = reminders.findIndex((item) => item.id === reminderId);
        if (index === -1) {
            throw new Error('Reminder not found');
        }
        reminders[index] = {
            ...reminders[index],
            ...payload,
            updated_at: new Date().toISOString(),
        };
        saveData(STORAGE_KEYS.REMINDERS, reminders);
        return { status: 'updated' };
    },

    async deleteReminder(reminderId) {
        await delay(180);
        const reminders = getStoredData(STORAGE_KEYS.REMINDERS, []);
        saveData(
            STORAGE_KEYS.REMINDERS,
            reminders.filter((item) => item.id !== reminderId)
        );
        return { status: 'deleted' };
    },

    // Media
    async uploadMedia() {
        await delay(500);
        return { id: `media-${Date.now()}`, url: '' };
    },

    async deleteMedia() {
        await delay(200);
        return { success: true };
    },

    // Data Management
    async importData() {
        await delay(500);
        return { message: 'Import finished', stats: { entries: 0, errors: 0 } };
    },

    async importDaylioBackup(_file, dryRun = false) {
        await delay(220);
        const jobId = `mock-daylio-${mockDaylioJobSeq++}`;
        const now = new Date().toISOString();
        mockDaylioJobs.set(jobId, {
            job_id: jobId,
            filename: 'mock-backup.daylio',
            status: 'completed',
            progress: 100,
            dry_run: Boolean(dryRun),
            stats: {
                total_entries: 24,
                processed_entries: 24,
                imported_entries: dryRun ? 24 : 20,
                skipped_duplicates: dryRun ? 0 : 4,
                created_groups: 3,
                created_options: 9,
                failed_entries: 0,
            },
            errors: [],
            created_at: now,
            started_at: now,
            finished_at: now,
        });
        return { job_id: jobId };
    },

    async getDaylioImportJob(jobId) {
        await delay(140);
        return (
            mockDaylioJobs.get(jobId) || {
                job_id: jobId,
                filename: 'mock-backup.daylio',
                status: 'failed',
                progress: 100,
                dry_run: false,
                stats: {
                    total_entries: 0,
                    processed_entries: 0,
                    imported_entries: 0,
                    skipped_duplicates: 0,
                    created_groups: 0,
                    created_options: 0,
                    failed_entries: 0,
                },
                errors: [{ index: null, reason: 'Mock import job not found' }],
                created_at: new Date().toISOString(),
                started_at: null,
                finished_at: new Date().toISOString(),
            }
        );
    },

    async deleteAccount() {
        await delay(500);
        localStorage.removeItem(STORAGE_KEYS.ENTRIES);
        localStorage.removeItem(STORAGE_KEYS.GROUPS);
        localStorage.removeItem(STORAGE_KEYS.GOALS);
        localStorage.removeItem(STORAGE_KEYS.REMINDERS);
        return { success: true };
    },

    // Gallery
    async getGalleryPhotos({ limit = 50, offset = 0, startDate, endDate } = {}) {
        await delay(200);
        const entries = getStoredData(STORAGE_KEYS.ENTRIES, defaultMockEntries);

        const normalizeDate = (dateValue) => {
            if (!dateValue) {
                return '';
            }
            if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
                return dateValue;
            }
            const parsed = new Date(dateValue);
            if (Number.isNaN(parsed.getTime())) {
                return '';
            }
            return parsed.toISOString().slice(0, 10);
        };

        const photos = entries.flatMap((entry) => {
            const entryDate = normalizeDate(entry.date || entry.created_at);
            const mediaItems = Array.isArray(entry.media) ? entry.media : [];
            return mediaItems.map((media, index) => ({
                id: media.id ?? `mock-media-${entry.id}-${index}`,
                entry_id: entry.id,
                file_path: media.file_path ?? '',
                file_type: media.file_type ?? 'image/jpeg',
                thumbnail_path: media.thumbnail_path,
                created_at: media.created_at ?? entry.created_at ?? new Date().toISOString(),
                entry_date: entryDate,
                entry_mood: entry.mood ?? 3,
            }));
        });

        const filtered = photos.filter((photo) => {
            if ((startDate || endDate) && !photo.entry_date) {
                return false;
            }
            if (startDate && photo.entry_date < startDate) {
                return false;
            }
            if (endDate && photo.entry_date > endDate) {
                return false;
            }
            return true;
        });

        const sorted = filtered.sort((a, b) => {
            if (a.entry_date !== b.entry_date) {
                return a.entry_date < b.entry_date ? 1 : -1;
            }
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });

        const paginated = sorted.slice(offset, offset + limit);

        return {
            photos: paginated,
            total: sorted.length,
            has_more: offset + paginated.length < sorted.length,
        };
    },
};

// Mock mode logging is disabled in production
