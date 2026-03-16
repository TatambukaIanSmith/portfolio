import { connectDatabase } from '../database/connection';
import { authorizationService } from '../services/authorizationService';
import { authService } from '../services/authService';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

async function seedSecurityData() {
  console.log('🔐 SEEDING SECURITY DATA\n');
  console.log('=' .repeat(50));
  
  try {
    // Connect to database
    await connectDatabase();
    console.log('✅ Database connected\n');

    // ==========================================
    // 1. CREATE DEFAULT ROLES
    // ==========================================
    console.log('👥 Creating default roles...');
    
    const defaultRoles = [
      {
        name: 'super_admin',
        description: 'Super Administrator with full system access',
        isSystemRole: true
      },
      {
        name: 'admin',
        description: 'System administrator with full access',
        isSystemRole: true
      },
      {
        name: 'user',
        description: 'Regular user with limited access',
        isSystemRole: true
      },
      {
        name: 'client',
        description: 'Client with project access',
        isSystemRole: true
      },
      {
        name: 'guest',
        description: 'Guest user with minimal access',
        isSystemRole: true
      }
    ];

    const createdRoles: Record<string, any> = {};
    
    for (const roleData of defaultRoles) {
      try {
        const role = await authorizationService.createRole(
          roleData.name,
          roleData.description,
          roleData.isSystemRole
        );
        createdRoles[roleData.name] = role;
        console.log(`   ✅ Created role: ${roleData.name}`);
      } catch (error) {
        if (error instanceof Error && error.message.includes('already exists')) {
          console.log(`   ⚠️  Role already exists: ${roleData.name}`);
          // Get existing role
          const roles = await authorizationService.getAllRoles();
          const existingRole = roles.find(r => r.name === roleData.name);
          if (existingRole) {
            createdRoles[roleData.name] = existingRole;
          }
        } else {
          console.error(`   ❌ Failed to create role ${roleData.name}:`, error);
        }
      }
    }

    console.log();

    // ==========================================
    // 2. CREATE DEFAULT PERMISSIONS
    // ==========================================
    console.log('🔑 Creating default permissions...');
    
    const defaultPermissions = [
      // Lead permissions
      { resource: 'leads', action: 'create', description: 'Create new leads' },
      { resource: 'leads', action: 'read', description: 'View leads' },
      { resource: 'leads', action: 'update', description: 'Update leads' },
      { resource: 'leads', action: 'delete', description: 'Delete leads' },
      { resource: 'leads', action: 'export', description: 'Export leads data' },
      
      // Phone call permissions
      { resource: 'phone_calls', action: 'create', description: 'Create phone call requests' },
      { resource: 'phone_calls', action: 'read', description: 'View phone calls' },
      { resource: 'phone_calls', action: 'update', description: 'Update phone calls' },
      { resource: 'phone_calls', action: 'delete', description: 'Delete phone calls' },
      
      // User permissions
      { resource: 'users', action: 'create', description: 'Create new users' },
      { resource: 'users', action: 'read', description: 'View users' },
      { resource: 'users', action: 'update', description: 'Update users' },
      { resource: 'users', action: 'delete', description: 'Delete users' },
      
      // Analytics permissions
      { resource: 'analytics', action: 'read', description: 'View analytics data' },
      { resource: 'analytics', action: 'export', description: 'Export analytics data' },
      
      // Project permissions
      { resource: 'projects', action: 'create', description: 'Create projects' },
      { resource: 'projects', action: 'read', description: 'View projects' },
      { resource: 'projects', action: 'update', description: 'Update projects' },
      { resource: 'projects', action: 'delete', description: 'Delete projects' },
      
      // Content permissions
      { resource: 'content', action: 'create', description: 'Create content' },
      { resource: 'content', action: 'read', description: 'View content' },
      { resource: 'content', action: 'update', description: 'Update content' },
      { resource: 'content', action: 'delete', description: 'Delete content' },
      { resource: 'content', action: 'publish', description: 'Publish content' }
    ];

    const createdPermissions: Record<string, any> = {};
    
    for (const permData of defaultPermissions) {
      try {
        const permission = await authorizationService.createPermission(
          permData.resource,
          permData.action,
          permData.description
        );
        createdPermissions[`${permData.resource}:${permData.action}`] = permission;
        console.log(`   ✅ Created permission: ${permData.resource}:${permData.action}`);
      } catch (error) {
        if (error instanceof Error && error.message.includes('already exists')) {
          console.log(`   ⚠️  Permission already exists: ${permData.resource}:${permData.action}`);
          // Get existing permission
          const permissions = await authorizationService.getAllPermissions();
          const existingPerm = permissions.find(p => 
            p.resource === permData.resource && p.action === permData.action
          );
          if (existingPerm) {
            createdPermissions[`${permData.resource}:${permData.action}`] = existingPerm;
          }
        } else {
          console.error(`   ❌ Failed to create permission ${permData.resource}:${permData.action}:`, error);
        }
      }
    }

    console.log();

    // ==========================================
    // 3. ASSIGN PERMISSIONS TO ROLES
    // ==========================================
    console.log('🔗 Assigning permissions to roles...');
    
    const rolePermissions = {
      super_admin: Object.keys(createdPermissions), // All permissions
      admin: [
        'leads:create', 'leads:read', 'leads:update', 'leads:delete', 'leads:export',
        'phone_calls:create', 'phone_calls:read', 'phone_calls:update', 'phone_calls:delete',
        'users:read', 'users:update',
        'analytics:read', 'analytics:export',
        'projects:create', 'projects:read', 'projects:update', 'projects:delete',
        'content:create', 'content:read', 'content:update', 'content:delete', 'content:publish'
      ],
      user: [
        'leads:create', 'leads:read',
        'phone_calls:create',
        'projects:read',
        'content:read'
      ],
      client: [
        'leads:create',
        'phone_calls:create',
        'projects:read',
        'content:read'
      ],
      guest: [
        'leads:create',
        'phone_calls:create',
        'projects:read',
        'content:read'
      ]
    };

    for (const [roleName, permissions] of Object.entries(rolePermissions)) {
      const role = createdRoles[roleName];
      if (!role) {
        console.log(`   ⚠️  Role not found: ${roleName}`);
        continue;
      }

      console.log(`   🔗 Assigning permissions to ${roleName}...`);
      
      for (const permissionKey of permissions) {
        const permission = createdPermissions[permissionKey];
        if (!permission) {
          console.log(`     ⚠️  Permission not found: ${permissionKey}`);
          continue;
        }

        try {
          await authorizationService.grantPermissionToRole(role.id, permission.id);
          console.log(`     ✅ Granted ${permissionKey} to ${roleName}`);
        } catch (error) {
          if (error instanceof Error && error.message.includes('already granted')) {
            console.log(`     ⚠️  Permission already granted: ${permissionKey} to ${roleName}`);
          } else {
            console.error(`     ❌ Failed to grant ${permissionKey} to ${roleName}:`, error);
          }
        }
      }
    }

    console.log();

    // ==========================================
    // 4. CREATE DEFAULT ADMIN USER
    // ==========================================
    console.log('👤 Creating default admin user...');
    
    try {
      // Check if admin user already exists
      const adminEmail = 'admin@iansmith.dev';
      const adminPassword = 'AdminPass123!'; // Change this in production!
      
      // Hash password
      const hashedPassword = await authService.hashPassword(adminPassword);
      
      // Insert admin user directly into database
      const { db } = await import('../database/connection');
      const adminId = uuidv4();
      
      try {
        await db.execute(
          `INSERT INTO users (id, email, password_hash, first_name, last_name, role, status, is_active) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [adminId, adminEmail, hashedPassword, 'Ian', 'Smith', 'super_admin', 'active', true]
        );
        
        console.log(`   ✅ Created admin user: ${adminEmail}`);
        console.log(`   🔑 Password: ${adminPassword} (CHANGE THIS IN PRODUCTION!)`);
        
        // Assign super_admin role to user
        if (createdRoles.super_admin) {
          await authorizationService.assignRole(adminId, createdRoles.super_admin.id);
          console.log(`   ✅ Assigned super_admin role to admin user`);
        }
        
      } catch (error) {
        if (error instanceof Error && error.message.includes('Duplicate entry')) {
          console.log(`   ⚠️  Admin user already exists: ${adminEmail}`);
        } else {
          throw error;
        }
      }
      
    } catch (error) {
      console.error('   ❌ Failed to create admin user:', error);
    }

    console.log();

    // ==========================================
    // 5. SUMMARY
    // ==========================================
    console.log('📊 SECURITY DATA SEEDING SUMMARY');
    console.log('=' .repeat(50));
    
    const roles = await authorizationService.getAllRoles();
    const permissions = await authorizationService.getAllPermissions();
    
    console.log(`✅ Roles created: ${roles.length}`);
    console.log(`✅ Permissions created: ${permissions.length}`);
    console.log(`✅ Admin user: admin@iansmith.dev`);
    console.log(`🔐 Security system ready for use!`);
    
    console.log('\n🎉 Security data seeding completed successfully!');

  } catch (error) {
    console.error('❌ Security data seeding failed:', error);
    process.exit(1);
  }
}

// Run the seeding
seedSecurityData()
  .then(() => {
    console.log('\n✅ Security seeding completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Security seeding failed:', error);
    process.exit(1);
  });