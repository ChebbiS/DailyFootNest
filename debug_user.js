const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Fetching user...');
        const user = await prisma.user.findUnique({
            where: { email: 'admin@dailyfoot.com' }
        });
        console.log('User found:', user);
    } catch (e) {
        console.error('Error fetching user:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
