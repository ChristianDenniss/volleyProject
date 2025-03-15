// Mock repository
export const mockRepository = {
  find: jest.fn(),
  findOne: jest.fn(),
  findOneBy: jest.fn(),
  findByIds: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
  update: jest.fn(),
  createQueryBuilder: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  getOne: jest.fn(),
  getMany: jest.fn()
};

// Mock User
export const mockUser = {
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  password: 'hashedpassword',
  role: 'user',
  createdAt: new Date(),
  updatedAt: new Date()
};

// Mock Users
export const mockUsers = [
  mockUser,
  {
    id: 2,
    username: 'anotheruser',
    email: 'another@example.com',
    password: 'hashedpassword',
    role: 'user',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Mock Token
export const mockToken = 'mock.jwt.token';

// Create mock season with complete structure
const mockSeasonEntity = {
  id: 1,
  name: 'Season 2024',
  year: 2024,
  teams: [],
  games: [],
  createdAt: new Date(),
  updatedAt: new Date()
};

// Mock Team with properly typed season
export const mockTeam: { 
  id: number;
  name: string;
  season: typeof mockSeasonEntity;
  players: typeof mockPlayer[];  // Explicitly defining players as an array of mockPlayer
  games: any[];
  createdAt: Date;
  updatedAt: Date;
} = {
  id: 1,
  name: 'Test Team1',
  season: mockSeasonEntity,
  players: [],  // Fix: Ensuring players is explicitly an array
  games: [],
  createdAt: new Date(),
  updatedAt: new Date()
};

// Mock Teams
export const mockTeams = [
  mockTeam,
  {
    id: 2,
    name: 'Another Team',
    season: mockSeasonEntity,
    players: [],
    games: [],
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Mock Player
export const mockPlayer = {
  id: 1,
  name: 'John Doe',
  position: 'Forward',
  team: mockTeam, // Will be assigned later
  stats: {
    goals: 10,
    assists: 5,
    gamesPlayed: 15
  },
  createdAt: new Date(),
  updatedAt: new Date()
};

// Ensure players array can accept mockPlayer
mockTeam.players.push(mockPlayer);

// Mock Players (array of mockPlayer objects)
export const mockPlayers = [
  mockPlayer, // Reusing the single mockPlayer object
  {
    id: 2,
    name: 'Jane Doe',
    position: 'Midfielder',
    team: mockTeam, // Assigning to the same mockTeam
    stats: {
      goals: 8,
      assists: 7,
      gamesPlayed: 18
    },
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Adjusted Mock Saved Player
export const savedPlayer = {
  ...mockPlayer, // Spread the original mockPlayer object
  id: 3,  // Unique ID for the saved player
  createdAt: new Date('2024-03-13T00:00:00Z'),  // Set to a specific date
  updatedAt: new Date('2025-03-13T00:00:00Z'),  // Set to a specific date
  stats: {
    ...mockPlayer.stats,  // Spread existing stats
    goals: 15,  // Adjusted stats
    assists: 10,
  }
};

// Mock Game
export const mockGame = {
  id: 1,
  homeTeam: mockTeam,  // Linking to mockTeam
  awayTeam: mockTeam,  // Linking to mockTeam
  score: {
    homeTeam: 2,
    awayTeam: 1,
  },
  createdAt: new Date('2024-03-13T00:00:00Z'),
  updatedAt: new Date('2025-03-13T00:00:00Z'),
  date: new Date('2024-03-13T00:00:00Z'), // Game date
  seasonId: 1,  // Adding the season ID
  teamIds: [mockTeam.id, mockTeam.id], // List of team IDs involved
  // You can add other necessary fields here as per the game model
};

// Mock Games (Array)
export const mockGames = [
  mockGame, // First game from mockGame
  {
    id: 2,
    homeTeam: mockTeams[0],  // Using first team in mockTeams
    awayTeam: mockTeams[1],  // Using second team in mockTeams
    score: {
      homeTeam: 1,
      awayTeam: 3,
    },
    createdAt: new Date('2024-03-14T00:00:00Z'),
    updatedAt: new Date('2025-03-14T00:00:00Z'),
    date: new Date('2024-03-14T00:00:00Z'), // Game date
    seasonId: 1,  // Adding the season ID
    teamIds: [mockTeams[0].id, mockTeams[1].id], // List of team IDs involved
    // You can add other necessary fields here as per the game model
  }
];

// Saved Game
export const savedGame = {
  ...mockGame, // Spread the original mockGame object
  id: 3, // New ID for the saved game
  score: {
    homeTeam: 3, // Adjusted score
    awayTeam: 2,
  },
  createdAt: new Date('2024-03-13T00:00:00Z'), // Set to the same date as mockGame
  updatedAt: new Date('2025-03-13T00:00:00Z'), // Adjusted updatedAt
  date: new Date('2024-03-13T00:00:00Z'), // Game date
  seasonId: 1,  // Adding the season ID
  teamIds: [mockTeam.id, mockTeam.id], // List of team IDs involved
};



// Mock Season
export const mockSeason = mockSeasonEntity;
