import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Configuration
const STATS_CONFIG = {
    AGENTS_COUNT: 4,
    PLAYERS_PER_AGENT: 5,
    DEFAULT_PASSWORD: 'Password123!',
};

// Helper for random numbers
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min: number, max: number) => Number((Math.random() * (max - min) + min).toFixed(2));
const pickRandom = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// Data Lists
const FIRST_NAMES = ['Jean', 'Pierre', 'Paul', 'Lucas', 'Thomas', 'Nicolas', 'Julien', 'Antoine', 'David', 'Alexandre', 'Kevin', 'Maxime', 'Sofiane', 'Karim', 'Mehdi', 'Yassine', 'Mohamed', 'Chris', 'Leo', 'Hugo'];
const LAST_NAMES = ['Martin', 'Bernard', 'Dubois', 'Petit', 'Robert', 'Richard', 'Durand', 'Leroy', 'Moreau', 'Simon', 'Laurent', 'Lefebvre', 'Michel', 'Garcia', 'David', 'Benali', 'Traore', 'Kone', 'Diallo', 'Sow'];
const CLUBS = ['Paris SG', 'Marseille', 'Lyon', 'Monaco', 'Lille', 'Rennes', 'Nice', 'Lens', 'Montpellier', 'Nantes', 'Reims', 'Strasbourg', 'Toulouse', 'Brest', 'Lorient'];
const POSITIONS = ['Gardien', 'Défenseur Central', 'Latéral Droit', 'Latéral Gauche', 'Milieu Défensif', 'Milieu Relayeur', 'Milieu Offensif', 'Ailier Droit', 'Ailier Gauche', 'Attaquant'];
const NATIONALITIES = ['Française', 'Espagnole', 'Brésilienne', 'Sénégalaise', 'Marocaine', 'Algérienne', 'Ivoirienne', 'Belge', 'Portugaise', 'Argentine'];

async function main() {
    console.log('🌱 Starting seeding...');

    // Hash password once
    const hashedPassword = await bcrypt.hash(STATS_CONFIG.DEFAULT_PASSWORD, 10);

    // Clean DB (Optional - be careful in prod, but good for dev)
    // await prisma.statistic.deleteMany();
    // await prisma.event.deleteMany();
    // await prisma.player.deleteMany();
    // await prisma.agent.deleteMany();
    // await prisma.user.deleteMany({ where: { NOT: { email: 'admin@dailyfoot.com' } } }); 

    // Create Agents
    for (let i = 0; i < STATS_CONFIG.AGENTS_COUNT; i++) {
        const firstName = pickRandom(FIRST_NAMES);
        const lastName = pickRandom(LAST_NAMES);
        const email = `agent${i + 1}_${Date.now()}@test.com`; // Unique email

        const agentUser = await prisma.user.create({
            data: {
                name: `${firstName} ${lastName}`,
                email: email,
                password: hashedPassword,
                role: Role.AGENT,
                isActive: true,
                avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${firstName}${lastName}`,
                agent: {
                    create: {}
                }
            },
            include: {
                agent: true
            }
        });

        console.log(`Created Agent: ${agentUser.email} (ID: ${agentUser.id})`);

        // Create Players for this Agent
        for (let j = 0; j < STATS_CONFIG.PLAYERS_PER_AGENT; j++) {
            const pFirstName = pickRandom(FIRST_NAMES);
            const pLastName = pickRandom(LAST_NAMES);
            const pEmail = `player${i}_${j}_${Date.now()}@test.com`;

            const playerUser = await prisma.user.create({
                data: {
                    name: `${pFirstName} ${pLastName}`,
                    email: pEmail,
                    password: hashedPassword,
                    role: Role.PLAYER,
                    isActive: true,
                    avatar: `https://api.dicebear.com/7.x/micah/svg?seed=${pFirstName}${pLastName}`,
                    player: {
                        create: {
                            agentId: agentUser.agent!.id,
                            name: `${pFirstName} ${pLastName}`,
                            age: randomInt(17, 34),
                            nationality: pickRandom(NATIONALITIES),
                            poste: pickRandom(POSITIONS),
                            club: pickRandom(CLUBS),
                            email: pEmail,
                            image: `https://api.dicebear.com/7.x/micah/svg?seed=${pFirstName}${pLastName}`,
                            notes: "Joueur prometteur avec un bon potentiel physique.",
                            statistics: {
                                create: {
                                    season: '2023-2024',
                                    matchesPlayed: randomInt(10, 38),
                                    minutesPlayed: randomInt(800, 3400),
                                    rating: randomFloat(5.5, 8.5),
                                    goals: randomInt(0, 25),
                                    assists: randomInt(0, 15),
                                    shotsTotal: randomInt(10, 80),
                                    shotsOnTarget: randomInt(5, 40),
                                    passesTotal: randomInt(200, 2000),
                                    passesKey: randomInt(10, 100),
                                    passesAccuracy: randomFloat(70, 95),
                                    tacklesTotal: randomInt(10, 60),
                                    blocks: randomInt(0, 20),
                                    interceptions: randomInt(5, 50),
                                    duelsTotal: randomInt(50, 300),
                                    duelsWon: randomInt(20, 150),
                                    dribblesAttempts: randomInt(10, 100),
                                    dribblesSuccess: randomInt(5, 60),
                                    foulsCommitted: randomInt(5, 40),
                                    foulsDrawn: randomInt(10, 50),
                                    height: randomInt(165, 195),
                                    weight: randomInt(60, 95),
                                    yellowCards: randomInt(0, 10),
                                    redCards: randomInt(0, 2)
                                }
                            }
                        }
                    }
                },
            });
            console.log(`  -> Created Player: ${playerUser.email}`);
        }
    }

    console.log('✅ Seeding completed.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
