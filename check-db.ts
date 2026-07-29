import { PrismaClient } from '@prisma/client'; 
const prisma = new PrismaClient(); 
prisma.$connect()
  .then(() => { 
    console.log('Database connection successful!'); 
    return prisma.$disconnect(); 
  })
  .catch(e => { 
    console.error('Database connection failed:', e); 
    process.exit(1); 
  });
