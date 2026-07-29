import { PrismaClient } from '@prisma/client'; 
const prisma = new PrismaClient(); 
prisma.$executeRawUnsafe(`CREATE EXTENSION IF NOT EXISTS vector;`)
  .then(() => { 
    console.log('Vector extension created successfully!'); 
    return prisma.$disconnect(); 
  })
  .catch(e => { 
    console.error('Failed to create vector extension:', e); 
    process.exit(1); 
  });
