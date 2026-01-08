const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function createAdmin() {
    try {
        // Vérifier si un admin existe déjà
        const existingAdmin = await prisma.user.findFirst({
            where: { role: 'ADMIN' }
        });

        if (existingAdmin) {
            console.log('❌ Un compte admin existe déjà:', existingAdmin.email);
            return;
        }

        // Créer le mot de passe haché
        const hashedPassword = await bcrypt.hash('admin123', 10);

        // Créer l'utilisateur admin
        const admin = await prisma.user.create({
            data: {
                name: 'Admin',
                email: 'admin@dailyfoot.com',
                password: hashedPassword,
                role: 'ADMIN',
                isActive: true,
            }
        });

        console.log('✅ Compte admin créé avec succès !');
        console.log('📧 Email:', admin.email);
        console.log('🔑 Mot de passe: admin123');
        console.log('');
        console.log('⚠️  N\'oubliez pas de changer le mot de passe après la première connexion !');
    } catch (error) {
        console.error('❌ Erreur lors de la création du compte admin:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createAdmin();
