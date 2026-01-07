
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Connecting to DB...');
        await prisma.$connect();
        console.log('Connected.');

        const email = 'test_debug_' + Date.now() + '@test.com';
        const password = 'password123';
        const hashedPassword = await bcrypt.hash(password, 10);

        console.log('Creating user...');
        const user = await prisma.user.create({
            data: {
                name: 'Debug User',
                email: email,
                password: hashedPassword,
                role: 'AGENT',
                isActive: true
            },
        });
        console.log('User created:', user);

    } catch (e) {
        console.error('ERROR OCCURRED:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
