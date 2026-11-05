import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing Supabase URL or Service Role Key in .env.local');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD in .env.local before running this script.");
  }

  console.log(`Checking existing user for ${adminEmail}...`);
  const { data: userList } = await supabaseAdmin.auth.admin.listUsers();
  const existingUser = userList?.users?.find(u => u.email === adminEmail);

  let userId: string;

  if (existingUser) {
    console.log(`User ${adminEmail} already exists (${existingUser.id}). Updating password...`);
    await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
      password: adminPassword,
      email_confirm: true,
      user_metadata: {
        role: 'admin',
        first_name: 'ผู้ดูแลระบบ',
        last_name: 'Admin'
      }
    });
    userId = existingUser.id;
  } else {
    console.log(`Creating new Admin user ${adminEmail}...`);
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: {
        role: 'admin',
        first_name: 'ผู้ดูแลระบบ',
        last_name: 'Admin'
      }
    });

    if (createError) {
      console.error('Error creating admin user:', createError);
      process.exit(1);
    }
    userId = newUser.user.id;
    console.log(`Admin user created with ID: ${userId}`);
  }

  // Create contractor record for this admin
  console.log('Ensuring contractor record for Admin...');
  const { data: existingContractor } = await supabaseAdmin
    .from('contractors')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  if (existingContractor) {
    await supabaseAdmin
      .from('contractors')
      .update({
        role: 'admin',
        status: 'active',
        first_name: 'ผู้ดูแลระบบ',
        last_name: 'Admin',
        display_name: 'ผู้ดูแลระบบ (Admin)',
        email: adminEmail,
        position_title: 'ผู้ดูแลระบบ (Administrator)'
      })
      .eq('id', existingContractor.id);
    console.log('Admin contractor record updated.');
  } else {
    const { data: newContractor, error: contractorError } = await supabaseAdmin
      .from('contractors')
      .insert({
        user_id: userId,
        role: 'admin',
        status: 'active',
        title: 'นาย',
        first_name: 'ผู้ดูแลระบบ',
        last_name: 'Admin',
        display_name: 'ผู้ดูแลระบบ (Admin)',
        email: adminEmail,
        position_title: 'ผู้ดูแลระบบ (Administrator)',
        address_line1: 'วิทยาลัยนักบริหารสาธารณสุข กระทรวงสาธารณสุข',
        address_line2: 'ตำบลบ้านหาด อำเภอบ้านลาด จังหวัดเพชรบุรี',
        address_full_arabic: 'วิทยาลัยนักบริหารสาธารณสุข กระทรวงสาธารณสุข ตำบลบ้านหาด อำเภอบ้านลาด จังหวัดเพชรบุรี',
        bank_name: 'ธนาคารกรุงไทย'
      })
      .select()
      .single();

    if (contractorError) {
      console.error('Error creating admin contractor record:', contractorError);
      process.exit(1);
    }
    console.log('Admin contractor record created:', newContractor.id);
  }

  console.log('Admin setup completed successfully!');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
