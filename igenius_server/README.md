bash for setup - laravel project :

        composer create-project laravel/laravel project-name

migration

        php artisan make:migration create_personal_access_tokens_table

        <?php

        use Illuminate\Database\Migrations\Migration;
        use Illuminate\Database\Schema\Blueprint;
        use Illuminate\Support\Facades\Schema;

        return new class extends Migration
        {
            /**
            * Run the migrations.
            */
            public function up(): void
            {
                Schema::create('personal_access_tokens', function (Blueprint $table) {
                    $table->id();
                    $table->morphs('tokenable');
                    $table->text('name');
                    $table->string('token', 64)->unique();
                    $table->text('abilities')->nullable();
                    $table->timestamp('last_used_at')->nullable();
                    $table->timestamp('expires_at')->nullable()->index();
                    $table->timestamps();
                });
            }

            /**
            * Reverse the migrations.
            */
            public function down(): void
            {
                Schema::dropIfExists('personal_access_tokens');
            }
        };

BASH

        php artisan migrate

Step 1: Install Laravel Sanctum
bash

# Install Sanctum via Composer

composer require laravel/sanctum

# Publish Sanctum configuration and migration files

php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"

> creates migration personal token and sanctum.php

updated bootstrapp app.php

<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        channels: __DIR__.'/../routes/channels.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // Register middleware aliases
        $middleware->alias([
            'auth' => Illuminate\Auth\Middleware\Authenticate::class,
            'auth.basic' => Illuminate\Auth\Middleware\AuthenticateWithBasicAuth::class,
            'auth.session' => Illuminate\Session\Middleware\AuthenticateSession::class,
            'cache.headers' => Illuminate\Http\Middleware\SetCacheHeaders::class,
            'can' => Illuminate\Auth\Middleware\Authorize::class,
            'guest' => App\Http\Middleware\RedirectIfAuthenticated::class,
            'password.confirm' => Illuminate\Auth\Middleware\RequirePassword::class,
            'signed' => Illuminate\Routing\Middleware\ValidateSignature::class,
            'throttle' => Illuminate\Routing\Middleware\ThrottleRequests::class,
            'verified' => Illuminate\Auth\Middleware\EnsureEmailIsVerified::class,
            
            // Your custom middleware
            'admin' => App\Http\Middleware\AdminMiddleware::class,
        ]);
        
        // API middleware group with Sanctum
        $middleware->group('api', [
            \Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class,
            'throttle:api',
            \Illuminate\Routing\Middleware\SubstituteBindings::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();


    creating missing middlewares files
# Create AdminMiddleware
php artisan make:middleware AdminMiddleware

# Create RedirectIfAuthenticated middleware
php artisan make:middleware RedirectIfAuthenticated

# Create Authenticate middleware (if not exists)
php artisan make:middleware Authenticate


# testing endpoints

- user registeration - http://localhost:8000/api/register
{
    "name": "Pravin Bhoye",
    "email": "pravin@igenius.com",
    "password": "password123",
    "password_confirmation": "password123"
  }

- user login - http://localhost:8000/api/login
{

    "email": "pravin@igenius.com",
    "password": "password123"
}

- check Authenticate - http://localhost:8000/api/check-auth

- logout endpoint - http://localhost:8000/api/logout

- admin login
{

    "email": "yatin@igenius.com",
    "password": "yatin123"
}
