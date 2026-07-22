'use strict';
const { PrismaClient } = require('@prisma/client');
const { v4: uuidv4 }   = require('uuid');
const { hashPassword }          = require('./helpers/hashPassword');
const { generateAccountNumber } = require('./helpers/accountNumber');
const { generateReferenceNumber } = require('./helpers/referenceNumber');

const prisma  = new PrismaClient();
const usedAcc = new Set();
const usedRef = new Set();
const daysAgo  = n => { const d=new Date(); d.setDate(d.getDate()-n); return d; };
const hoursAgo = n => { const d=new Date(); d.setHours(d.getHours()-n); return d; };

async function main() {
  console.log('🌱 Seeding FinCore v1.1…');
  const pw = await hashPassword('Demo@1234');

  // ── Users ──────────────────────────────────────────────────────────────────
  const [admin, deep, priya] = await Promise.all([
    prisma.user.upsert({ where:{email:'admin@fincore.io'}, update:{}, create:{id:uuidv4(),firstName:'Admin',lastName:'User',email:'admin@fincore.io',phone:'+91-9000000001',passwordHash:pw,role:'ADMIN',isVerified:true,upiId:'admin@fincore',createdAt:daysAgo(60)} }),
    prisma.user.upsert({ where:{email:'deep@fincore.io'},  update:{}, create:{id:uuidv4(),firstName:'Deep',lastName:'Patel',email:'deep@fincore.io',phone:'+91-9000000002',passwordHash:pw,role:'USER',isVerified:true,upiId:'deep.patel@fincore',createdAt:daysAgo(30)} }),
    prisma.user.upsert({ where:{email:'priya@fincore.io'}, update:{}, create:{id:uuidv4(),firstName:'Priya',lastName:'Yadav',email:'priya@fincore.io',phone:'+91-9000000003',passwordHash:pw,role:'USER',isVerified:true,upiId:'priya.yadav@fincore',createdAt:daysAgo(25)} }),
  ]);

  // ── Accounts ───────────────────────────────────────────────────────────────
  const [adminAcc, deepAcc, priyaAcc] = await Promise.all([
    prisma.account.create({data:{id:uuidv4(),userId:admin.id,accountNumber:generateAccountNumber(usedAcc),accountType:'SAVINGS',balance:1000000,currency:'INR',status:'ACTIVE',createdAt:daysAgo(60)}}),
    prisma.account.create({data:{id:uuidv4(),userId:deep.id, accountNumber:generateAccountNumber(usedAcc),accountType:'SAVINGS',balance:25000, currency:'INR',status:'ACTIVE',createdAt:daysAgo(30)}}),
    prisma.account.create({data:{id:uuidv4(),userId:priya.id,accountNumber:generateAccountNumber(usedAcc),accountType:'CURRENT',balance:18500, currency:'INR',status:'ACTIVE',createdAt:daysAgo(25)}}),
  ]);

  // ── Beneficiaries (Enhancement 1: receiverAccountId, Enhancement 3: isFavourite) ──
  await Promise.all([
    prisma.beneficiary.create({data:{id:uuidv4(),userId:deep.id, beneficiaryName:'Priya Yadav',accountNumber:priyaAcc.accountNumber,bankName:'FinCore Bank',ifscCode:'FINC0000001',receiverAccountId:priyaAcc.id,isFavourite:true, createdAt:daysAgo(20)}}),
    prisma.beneficiary.create({data:{id:uuidv4(),userId:priya.id,beneficiaryName:'Deep Patel', accountNumber:deepAcc.accountNumber, bankName:'FinCore Bank',ifscCode:'FINC0000001',receiverAccountId:deepAcc.id, isFavourite:false,createdAt:daysAgo(18)}}),
  ]);

  // ── Transactions ───────────────────────────────────────────────────────────
  const txns = await Promise.all([
    prisma.transaction.create({data:{id:uuidv4(),senderAccountId:null,receiverAccountId:deepAcc.id, amount:30000,transactionType:'DEPOSIT',   description:'Salary Credit — Oct 2025',   status:'COMPLETED',referenceNumber:generateReferenceNumber(usedRef),createdAt:daysAgo(20)}}),
    prisma.transaction.create({data:{id:uuidv4(),senderAccountId:deepAcc.id,receiverAccountId:null,  amount:5000, transactionType:'WITHDRAWAL',description:'ATM Withdrawal',             status:'COMPLETED',referenceNumber:generateReferenceNumber(usedRef),createdAt:daysAgo(15)}}),
    prisma.transaction.create({data:{id:uuidv4(),senderAccountId:deepAcc.id,receiverAccountId:priyaAcc.id,amount:2500,transactionType:'TRANSFER',description:'Rent Payment — Nov 2025',status:'COMPLETED',referenceNumber:generateReferenceNumber(usedRef),createdAt:daysAgo(10)}}),
    prisma.transaction.create({data:{id:uuidv4(),senderAccountId:priyaAcc.id,receiverAccountId:deepAcc.id,amount:1000,transactionType:'TRANSFER',description:'Lunch Split — Farzi Cafe',status:'COMPLETED',referenceNumber:generateReferenceNumber(usedRef),createdAt:daysAgo(5)}}),
    prisma.transaction.create({data:{id:uuidv4(),senderAccountId:null,receiverAccountId:priyaAcc.id,amount:20000,transactionType:'DEPOSIT',description:'Freelance Payment — UI Design',status:'COMPLETED',referenceNumber:generateReferenceNumber(usedRef),createdAt:daysAgo(3)}}),
  ]);

  // ── Scheduled Transfer (Enhancement 8) ───────────────────────────────────
  const futureDate = new Date(); futureDate.setDate(futureDate.getDate()+3);
  await prisma.scheduledTransfer.create({data:{id:uuidv4(),userId:deep.id,senderAccountId:deepAcc.id,receiverAccountId:priyaAcc.id,amount:3000,description:'Advance Rent — Dec 2025',executeAt:futureDate,status:'PENDING'}});

  // ── Standing Instruction (Enhancement 9) ─────────────────────────────────
  const nextRun = new Date(); nextRun.setDate(5); nextRun.setHours(9,0,0,0);
  if (nextRun <= new Date()) nextRun.setMonth(nextRun.getMonth()+1);
  await prisma.standingInstruction.create({data:{id:uuidv4(),userId:priya.id,senderAccountId:priyaAcc.id,receiverAccountId:deepAcc.id,amount:1500,description:'Monthly Contribution',frequency:'MONTHLY',dayOfMonth:5,nextRunAt:nextRun,status:'ACTIVE'}});

  // ── Audit Logs ────────────────────────────────────────────────────────────
  await prisma.auditLog.createMany({ data:[
    {id:uuidv4(),userId:deep.id, action:'REGISTER',ipAddress:'192.168.1.10',userAgent:'Chrome/119',metadata:{email:deep.email},                   createdAt:daysAgo(30)},
    {id:uuidv4(),userId:deep.id, action:'LOGIN',   ipAddress:'192.168.1.10',userAgent:'Chrome/119',metadata:{success:true},                        createdAt:daysAgo(20)},
    {id:uuidv4(),userId:deep.id, action:'TRANSFER',ipAddress:'192.168.1.10',userAgent:'Chrome/119',metadata:{amount:2500,referenceNumber:txns[2].referenceNumber,receiver:'Priya Yadav'},createdAt:daysAgo(10)},
    {id:uuidv4(),userId:priya.id,action:'LOGIN',   ipAddress:'103.21.58.74',userAgent:'Safari/iOS', metadata:{success:true},                        createdAt:daysAgo(5)},
    {id:uuidv4(),userId:priya.id,action:'TRANSFER',ipAddress:'103.21.58.74',userAgent:'Safari/iOS', metadata:{amount:1000,referenceNumber:txns[3].referenceNumber,receiver:'Deep Patel'},createdAt:daysAgo(5)},
    {id:uuidv4(),userId:admin.id,action:'LOGIN',   ipAddress:'10.0.0.1',    userAgent:'Chrome/119', metadata:{role:'ADMIN'},                        createdAt:hoursAgo(2)},
  ]});

  const [u,a,b,t,sc,si,al] = await Promise.all([
    prisma.user.count(), prisma.account.count(), prisma.beneficiary.count(),
    prisma.transaction.count(), prisma.scheduledTransfer.count(),
    prisma.standingInstruction.count(), prisma.auditLog.count(),
  ]);

  console.log('\n─────────────────────────────────────────');
  console.log('  FinCore v1.1 — Phase 4.1 seed complete\n');
  console.log(`  users:                  ${u}`);
  console.log(`  accounts:               ${a}`);
  console.log(`  beneficiaries:          ${b}  (linked ✓  |  1 favourite ⭐)`);
  console.log(`  transactions:           ${t}`);
  console.log(`  scheduled_transfers:    ${sc}  (1 pending, executes in 3 days)`);
  console.log(`  standing_instructions:  ${si}  (1 active monthly)`);
  console.log(`  audit_logs:             ${al}`);
  console.log('\n  ── Login credentials ──────────────────');
  console.log('  admin@fincore.io  /  Demo@1234  (ADMIN)');
  console.log('  deep@fincore.io   /  Demo@1234  (USER)');
  console.log('  priya@fincore.io  /  Demo@1234  (USER)');
  console.log('\n  ── UPI IDs ─────────────────────────────');
  console.log('  deep.patel@fincore');
  console.log('  priya.yadav@fincore');
  console.log('  admin@fincore');
  console.log('─────────────────────────────────────────\n');
}

main()
  .catch(e => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
