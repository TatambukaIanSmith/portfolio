import { connectDatabase } from '../database/connection';
import { authService } from '../services/authService';
import { authorizationService } from '../services/authorizationService';
import { v4 as uuidv4 } from 'uuid';

async function createAdminUser() {
  console.log('👤 CREATING ADMIN USER\n');
  
  try {
    await connectDatabase();
    
    const adminEmail = 'admin@iansmith.dev';
    const adminPassword = 'AdminPass123!';
    const adminId = uuidv4();
    
    // Hash the password
    const hashedPassword = await authService.hashPassword(adminPassword);
    
    // Get database connection
    const { db } = await import('../database/connection');
    
    // Delete existing admin user if exists
    await db.execute('DELETE FROM users WHERE email = ?', [adminEmail]);
    
    // Create new admin user with UUID
    await db.execute(
      `INSERT INTO users (id, email, password_hash, first_name, last_name, role, is_active) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [adminId, adminEmail, hashedPassword, 'Ian', 'Smith', 'super_admin', true]
    );
    
    console.log('✅ Admin user created successfully!');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
    console.log(`   ID: ${adminId}`);
    console.log(`   Role: super_admin`);
    
    // Assign super_admin role
    const roles = await authorizationService.getAllRoles();
    const superAdminRole = roles.find(r => r.name === 'super_admin');
    
    if (superAdminRole) {
      await authorizationService.assignRole(adminId, superAdminRole.id);
      console.log('✅ Super admin role assigned!');
    }
    
    console.log('\n🎉 Admin user ready for testing!');
    
  } catch (error) {
    console.error('❌ Failed to create admin user:', error);
    process.exit(1);
  }
}

createAdminUser()
  .then(() => {
    console.log('\n✅ Admin user creation completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Admin user creation failed:', error);
    process.exit(1);
  });