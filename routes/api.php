<?php

use App\Http\Controllers\Api\AccountController;
use App\Http\Controllers\Api\ActivityLogController;
use App\Http\Controllers\Api\AppointmentController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BlogPostController;
use App\Http\Controllers\Api\CampaignController;
use App\Http\Controllers\Api\ClientController;
use App\Http\Controllers\Api\Coach\CoachController;
use App\Http\Controllers\Api\Coach\RoleController;
use App\Http\Controllers\Api\CalendarController;
use App\Http\Controllers\Api\ContentCreationController;
use App\Http\Controllers\Api\CourseAccessController;
use App\Http\Controllers\Api\CoursePlanController;
use App\Http\Controllers\Api\CourseRequestController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\FinanceController;
use App\Http\Controllers\Api\KpiController;
use App\Http\Controllers\Api\MarketController;
use App\Http\Controllers\Api\MarketingController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\SettingController;
use App\Http\Controllers\Api\StatsController;
use App\Http\Controllers\Api\SupportTicketController;
use App\Http\Controllers\Api\WebinarController;
use Illuminate\Support\Facades\Route;

// ── Public routes ─────────────────────────────────────────────────────────────

Route::prefix('auth')->group(function () {
    Route::post('login',           [AuthController::class, 'login']);
    Route::post('register',        [AuthController::class, 'register']);
    Route::post('forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('reset-password',  [AuthController::class, 'resetPassword']);
});

// Public: course plans (read-only)
Route::get('course-plans',          [CoursePlanController::class, 'index']);
Route::get('course-plans/{coursePlan}', [CoursePlanController::class, 'show']);

// Public: blog posts (read-only, published only)
Route::get('blog',          [BlogPostController::class, 'index']);
Route::get('blog/{blogPost}', [BlogPostController::class, 'show']);

// Public: upcoming webinars
Route::get('webinars',          [WebinarController::class, 'index']);
Route::get('webinars/{webinar}', [WebinarController::class, 'show']);

// Public: submit a support ticket
Route::post('tickets', [SupportTicketController::class, 'store']);

// Public: live market quotes (homepage ticker + Financial Markets section)
Route::get('market-quotes', [MarketController::class, 'quotes']);

// Public: headline stats for the homepage trust cards
Route::get('stats', [StatsController::class, 'index']);

// ── Authenticated routes ──────────────────────────────────────────────────────

Route::middleware('auth:sanctum')->group(function () {

    // Auth utilities
    Route::prefix('auth')->group(function () {
        Route::post('logout',          [AuthController::class, 'logout']);
        Route::get('me',               [AuthController::class, 'me']);
        Route::put('change-password',  [AuthController::class, 'changePassword']);
        Route::put('update-profile',   [AuthController::class, 'updateProfile']);
    });

    // Self-service dashboard data (any authenticated user)
    Route::prefix('my')->group(function () {
        Route::get('appointments', [AccountController::class, 'appointments']);
        Route::get('course-requests',  [CourseRequestController::class, 'mine']);
        Route::post('course-requests', [CourseRequestController::class, 'store']);
    });

    // User notifications (scoped to the authenticated user)
    Route::prefix('notifications')->group(function () {
        Route::get('/',                    [NotificationController::class, 'index']);
        Route::post('/',                   [NotificationController::class, 'store']);
        Route::post('read-all',            [NotificationController::class, 'markAllRead']);
        Route::post('{notification}/read', [NotificationController::class, 'markRead']);
        Route::delete('{notification}',    [NotificationController::class, 'destroy']);
    });

    // ── Admin-only routes ─────────────────────────────────────────────────────
    Route::prefix('admin')->middleware('coach')->group(function () {

        // Dashboard overview
        Route::get('overview',  [DashboardController::class, 'overview']);

        // Analytics
        Route::get('analytics', [DashboardController::class, 'analytics']);

        // Activity log
        Route::get('activity-logs', [ActivityLogController::class, 'index']);

        // Settings (GET all / PUT batch-update)
        Route::get('settings', [SettingController::class, 'index']);
        Route::put('settings', [SettingController::class, 'update']);

        // Coaches management
        Route::middleware('permission:manage users')->group(function () {
            Route::apiResource('coaches', CoachController::class);
        });

        // Roles & permissions
        Route::middleware('permission:manage roles')->group(function () {
            Route::get('permissions',                  [RoleController::class, 'permissions']);
            Route::apiResource('roles', RoleController::class)->except('show');
        });

        // Course plans management
        Route::prefix('course-plans')->group(function () {
            Route::post('/',                                [CoursePlanController::class, 'store']);
            Route::put('{coursePlan}',                      [CoursePlanController::class, 'update']);
            Route::delete('{coursePlan}',                   [CoursePlanController::class, 'destroy']);
            Route::post('{coursePlan}/features',            [CoursePlanController::class, 'storeFeature']);
            Route::put('{coursePlan}/features/{feature}',   [CoursePlanController::class, 'updateFeature']);
            Route::delete('{coursePlan}/features/{feature}',[CoursePlanController::class, 'destroyFeature']);
        });

        // CRM — clients & leads
        Route::prefix('crm')->group(function () {
            Route::get('/',                          [ClientController::class, 'index']);
            Route::post('/',                         [ClientController::class, 'store']);
            Route::get('{client}',                   [ClientController::class, 'show']);
            Route::put('{client}',                   [ClientController::class, 'update']);
            Route::delete('{client}',                [ClientController::class, 'destroy']);
            Route::post('{client}/convert',          [ClientController::class, 'convert']);
            // Notes (author = authenticated coach)
            Route::post('{client}/notes',            [ClientController::class, 'storeNote']);
            Route::delete('{client}/notes/{note}',   [ClientController::class, 'destroyNote']);
        });

        // Blog management
        Route::post('blog',              [BlogPostController::class, 'store']);
        Route::put('blog/{blogPost}',    [BlogPostController::class, 'update']);
        Route::delete('blog/{blogPost}', [BlogPostController::class, 'destroy']);

        // Support tickets management
        Route::get('tickets',                    [SupportTicketController::class, 'index']);
        Route::get('tickets/{supportTicket}',    [SupportTicketController::class, 'show']);
        Route::put('tickets/{supportTicket}',    [SupportTicketController::class, 'update']);
        Route::delete('tickets/{supportTicket}', [SupportTicketController::class, 'destroy']);

        // Appointments
        Route::apiResource('appointments', AppointmentController::class);

        // Course requests (user applications → approve/decline)
        Route::get('course-requests',                  [CourseRequestController::class, 'index']);
        Route::put('course-requests/{courseRequest}',  [CourseRequestController::class, 'update']);

        // Webinars management
        Route::post('webinars',             [WebinarController::class, 'store']);
        Route::put('webinars/{webinar}',    [WebinarController::class, 'update']);
        Route::delete('webinars/{webinar}', [WebinarController::class, 'destroy']);

        // Finance
        Route::prefix('finance')->group(function () {
            Route::get('transactions',          [FinanceController::class, 'transactions']);
            Route::post('transactions',         [FinanceController::class, 'storeTransaction']);
            Route::put('transactions/{tx}',     [FinanceController::class, 'updateTransaction']);
            Route::delete('transactions/{tx}',  [FinanceController::class, 'destroyTransaction']);
            Route::get('expenses',              [FinanceController::class, 'expenses']);
            Route::post('expenses',             [FinanceController::class, 'storeExpense']);
            Route::delete('expenses/{expense}', [FinanceController::class, 'destroyExpense']);
            Route::get('wallet',                [FinanceController::class, 'wallet']);
            Route::post('wallet/topup',         [FinanceController::class, 'topUpWallet']);
            Route::post('wallet/convert',       [FinanceController::class, 'convertCurrency']);
            Route::post('wallet/rate',          [FinanceController::class, 'updateRate']);
        });

        // Marketing
        Route::prefix('marketing')->group(function () {
            Route::apiResource('campaigns', CampaignController::class);
            Route::get('plans',                        [MarketingController::class, 'plans']);
            Route::post('plans',                       [MarketingController::class, 'storePlan']);
            Route::put('plans/{plan}',                 [MarketingController::class, 'updatePlan']);
            Route::delete('plans/{plan}',              [MarketingController::class, 'destroyPlan']);
            Route::post('plans/{plan}/items',          [MarketingController::class, 'storePlanItem']);
            Route::put('plans/{plan}/items/{item}',    [MarketingController::class, 'updatePlanItem']);
            Route::delete('plans/{plan}/items/{item}', [MarketingController::class, 'destroyPlanItem']);
            Route::get('media',                        [MarketingController::class, 'mediaItems']);
            Route::post('media',                       [MarketingController::class, 'storeMediaItem']);
            Route::put('media/{item}',                 [MarketingController::class, 'updateMediaItem']);
            Route::delete('media/{item}',              [MarketingController::class, 'destroyMediaItem']);
            Route::get('sent-notifications',           [MarketingController::class, 'sentNotifications']);
            Route::post('send-notification',           [MarketingController::class, 'sendNotification']);
            Route::get('telegram-recipients',          [MarketingController::class, 'telegramRecipients']);
        });

        // Content creation (AI)
        Route::prefix('content')->group(function () {
            Route::get('/',            [ContentCreationController::class, 'index']);
            Route::post('generate',    [ContentCreationController::class, 'generate']);
            Route::post('/',           [ContentCreationController::class, 'store']);
            Route::delete('{content}', [ContentCreationController::class, 'destroy']);
        });

        // Course Telegram access management
        Route::prefix('courses')->group(function () {
            Route::get('all-grants',                              [CourseAccessController::class, 'allGrants']);
            Route::get('{coursePlan}/access-grants',              [CourseAccessController::class, 'index']);
            Route::post('{coursePlan}/access-grants',             [CourseAccessController::class, 'store']);
            Route::patch('{coursePlan}/access-grants/{grantId}',  [CourseAccessController::class, 'extend']);
            Route::delete('{coursePlan}/access-grants/{grantId}', [CourseAccessController::class, 'destroy']);
            Route::patch('{coursePlan}/bot-plan',                 [CourseAccessController::class, 'updateBotPlan']);
        });

        // Calendar (unified events + tasks)
        Route::prefix('calendar')->group(function () {
            Route::get('/',             [CalendarController::class, 'index']);
            Route::post('tasks',        [CalendarController::class, 'storeTask']);
            Route::put('tasks/{task}',  [CalendarController::class, 'updateTask']);
            Route::delete('tasks/{task}', [CalendarController::class, 'destroyTask']);
        });

        // KPI management
        Route::prefix('kpi')->group(function () {
            Route::get('definitions',               [KpiController::class, 'definitions']);
            Route::put('definitions/{definition}',  [KpiController::class, 'updateDefinition']);
            Route::get('entries',                   [KpiController::class, 'entries']);
            Route::post('entries',                  [KpiController::class, 'storeEntry']);
            Route::put('entries/{entry}',           [KpiController::class, 'updateEntry']);
            Route::delete('entries/{entry}',        [KpiController::class, 'deleteEntry']);
            Route::get('summary',                   [KpiController::class, 'adminSummary']);
        });
    });

    // ── Coach self-service ────────────────────────────────────────────────────
    Route::prefix('coach')->middleware('coach')->group(function () {
        Route::get('kpi/scorecard', [KpiController::class, 'myScorecard']);
    });
});
