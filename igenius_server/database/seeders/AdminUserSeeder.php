<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        // Check if admin already exists
        if (User::where('email', 'yatin@igenius.com')->exists()) {
            echo "⚠️  Admin user already exists\n";
            return;
        }

        // Create admin user
        User::create([
            'name' => 'Yatin Chaudhari',
            'email' => 'yatin@igenius.com',
            'password' => Hash::make('yatin123'),
            'role' => 'admin',
        ]);
        
       
        
        echo "✅ Admin user created:";
    }
}