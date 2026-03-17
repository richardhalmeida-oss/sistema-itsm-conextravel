import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Seed script - creates default roles, permissions, and admin user.
 * Run with: npm run seed
 */
async function runSeed(): Promise<void> {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'itsm_db',
    synchronize: true, // Create tables from entities
    entities: [__dirname + '/../entities/*{.ts,.js}'],
  });

  await dataSource.initialize();
  console.log('📊 Database connected. Running seed...');

  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    // Clean slate for seed
    const tableNames = [
      'audit_logs', 'notifications', 'ticket_comments', 'tickets', 
      'sla_configs', 'categories', 'groups', 'user_roles', 'role_permissions', 
      'permissions', 'users', 'roles'
    ];
    for (const table of tableNames) {
      await queryRunner.query(`TRUNCATE TABLE "${table}" RESTART IDENTITY CASCADE`);
    }
    console.log('🧹 Cleaned existing data');

    // ============================================
    // 1. CREATE PERMISSIONS
    // ============================================
    const resources = ['tickets', 'users', 'sla', 'automation', 'audit', 'notifications', 'dashboard', 'categories'];
    const actions = ['create', 'read', 'update', 'delete'];
    const permissions: Array<{ id: string; resource: string; action: string; slug: string }> = [];

    for (const resource of resources) {
      for (const action of actions) {
        const id = uuidv4();
        const slug = `${resource}:${action}`;
        permissions.push({ id, resource, action, slug });

        await queryRunner.query(
          `INSERT INTO permissions (id, resource, action, description, slug, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
           ON CONFLICT (slug) DO NOTHING`,
          [id, resource, action, `${action} ${resource}`, slug],
        );
      }
    }
    console.log(`✅ ${permissions.length} permissions created`);

    // ============================================
    // 2. CREATE ROLES
    // ============================================
    const adminRoleId = uuidv4();
    const techRoleId = uuidv4();
    const userRoleId = uuidv4();
    const supervisorRoleId = uuidv4();

    const roles = [
      { id: adminRoleId, name: 'admin', description: 'Administrator with full access', isSystem: true },
      { id: supervisorRoleId, name: 'supervisor', description: 'Supervisor with elevated access', isSystem: true },
      { id: techRoleId, name: 'technician', description: 'Technician with ticket management access', isSystem: true },
      { id: userRoleId, name: 'user', description: 'Regular user with basic access', isSystem: true },
    ];

    for (const role of roles) {
      await queryRunner.query(
        `INSERT INTO roles (id, name, description, is_system, created_at, updated_at)
         VALUES ($1, $2, $3, $4, NOW(), NOW())
         ON CONFLICT (name) DO NOTHING`,
        [role.id, role.name, role.description, role.isSystem],
      );
    }
    console.log(`✅ ${roles.length} roles created`);

    // ============================================
    // 3. ASSIGN PERMISSIONS TO ROLES
    // ============================================
    // Admin gets ALL permissions
    for (const perm of permissions) {
      await queryRunner.query(
        `INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [adminRoleId, perm.id],
      );
    }

    // Supervisor gets most permissions (not user/audit management)
    const supervisorPerms = permissions.filter(
      (p) => !['users:delete', 'audit:delete', 'audit:update'].includes(p.slug),
    );
    for (const perm of supervisorPerms) {
      await queryRunner.query(
        `INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [supervisorRoleId, perm.id],
      );
    }

    // Technician gets ticket + notification access
    const techPerms = permissions.filter(
      (p) => ['tickets', 'notifications', 'categories', 'dashboard'].includes(p.resource),
    );
    for (const perm of techPerms) {
      await queryRunner.query(
        `INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [techRoleId, perm.id],
      );
    }

    // User gets basic access (create tickets, read own)
    const userPerms = permissions.filter(
      (p) =>
        (p.resource === 'tickets' && ['create', 'read'].includes(p.action)) ||
        (p.resource === 'notifications' && ['read', 'update'].includes(p.action)) ||
        (p.resource === 'categories' && p.action === 'read') ||
        (p.resource === 'dashboard' && p.action === 'read'),
    );
    for (const perm of userPerms) {
      await queryRunner.query(
        `INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [userRoleId, perm.id],
      );
    }
    console.log('✅ Role-permission assignments created');

    // ============================================
    // 4. CREATE ADMIN USER
    // ============================================
    const adminUserId = uuidv4();
    const adminPasswordHash = await bcrypt.hash('D26m06002003@', 12);

    await queryRunner.query(
      `INSERT INTO users (id, email, name, password_hash, status, failed_login_attempts, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       ON CONFLICT (email) DO NOTHING`,
      [adminUserId, 'tecnologia@conextravel.com.br', 'RICHARD - TI', adminPasswordHash, 'active', 0],
    );

    await queryRunner.query(
      `INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [adminUserId, adminRoleId],
    );
    console.log('✅ Admin user created: tecnologia@conextravel.com.br');

    // ============================================
    // 5. CREATE DEFAULT SLA CONFIG
    // ============================================
    const defaultSlaId = uuidv4();
    await queryRunner.query(
      `INSERT INTO sla_configs (id, name, description, response_time_minutes, resolution_time_minutes, escalation_rules, is_active, is_default, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
       ON CONFLICT DO NOTHING`,
      [
        defaultSlaId,
        'Default SLA',
        'Default SLA configuration for all tickets',
        60, // 1 hour for response
        480, // 8 hours for resolution
        JSON.stringify([
          {
            level: 1,
            triggerAfterMinutes: 30,
            notifyUserIds: [],
            notifyGroupIds: [],
            autoReassign: false,
          },
          {
            level: 2,
            triggerAfterMinutes: 120,
            notifyUserIds: [],
            notifyGroupIds: [],
            autoReassign: false,
          },
          {
            level: 3,
            triggerAfterMinutes: 360,
            notifyUserIds: [],
            notifyGroupIds: [],
            autoReassign: true,
          },
        ]),
        true,
        true,
      ],
    );

    // Critical SLA
    const criticalSlaId = uuidv4();
    await queryRunner.query(
      `INSERT INTO sla_configs (id, name, description, priority, response_time_minutes, resolution_time_minutes, escalation_rules, is_active, is_default, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
       ON CONFLICT DO NOTHING`,
      [
        criticalSlaId,
        'Critical SLA',
        'SLA for critical priority tickets',
        'critical',
        15, // 15 min for response
        120, // 2 hours for resolution
        JSON.stringify([
          {
            level: 1,
            triggerAfterMinutes: 10,
            notifyUserIds: [],
            notifyGroupIds: [],
            autoReassign: false,
          },
          {
            level: 2,
            triggerAfterMinutes: 30,
            notifyUserIds: [],
            notifyGroupIds: [],
            autoReassign: true,
          },
          {
            level: 3,
            triggerAfterMinutes: 60,
            notifyUserIds: [],
            notifyGroupIds: [],
            autoReassign: true,
          },
        ]),
        true,
        false,
      ],
    );
    console.log('✅ Default SLA configurations created');

    // ============================================
    // 6. CREATE DEFAULT CATEGORIES
    // ============================================
    const categories = [
      { id: uuidv4(), name: 'Hardware', description: 'Problemas com hardware' },
      { id: uuidv4(), name: 'Software', description: 'Problemas com software' },
      { id: uuidv4(), name: 'Rede', description: 'Problemas de rede' },
      { id: uuidv4(), name: 'Acesso', description: 'Solicitações de acesso' },
      { id: uuidv4(), name: 'Outros', description: 'Outros tipos de chamados' },
    ];

    for (let i = 0; i < categories.length; i++) {
      await queryRunner.query(
        `INSERT INTO categories (id, name, description, is_active, sort_order, created_at, updated_at)
         VALUES ($1, $2, $3, true, $4, NOW(), NOW())
         ON CONFLICT DO NOTHING`,
        [categories[i].id, categories[i].name, categories[i].description, i],
      );
    }
    console.log(`✅ ${categories.length} categories created`);

    // ============================================
    // 7. CREATE DEFAULT GROUPS
    // ============================================
    const groups = [
      { id: uuidv4(), name: 'TI', description: 'Equipe de Tecnologia da Informação' },
      { id: uuidv4(), name: 'Suporte N1', description: 'Suporte Nível 1' },
      { id: uuidv4(), name: 'Suporte N2', description: 'Suporte Nível 2' },
      { id: uuidv4(), name: 'Infraestrutura', description: 'Equipe de Infraestrutura' },
    ];

    for (const group of groups) {
      await queryRunner.query(
        `INSERT INTO groups (id, name, description, created_at, updated_at)
         VALUES ($1, $2, $3, NOW(), NOW())
         ON CONFLICT DO NOTHING`,
        [group.id, group.name, group.description],
      );
    }
    console.log(`✅ ${groups.length} groups created`);

    await queryRunner.commitTransaction();
    console.log('\n🎉 Seed completed successfully!');
  } catch (error) {
    console.error('❌ Seed failed:', error);
    await queryRunner.rollbackTransaction();
  } finally {
    await queryRunner.release();
    await dataSource.destroy();
  }
}

runSeed().catch(console.error);
