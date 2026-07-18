<?php

use App\Http\Controllers\Api\AccountController;
use App\Http\Controllers\Api\ActivityLogController;
use App\Http\Controllers\Api\AffiliateController;
use App\Http\Controllers\Api\AppointmentController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BlogPostController;
use App\Http\Controllers\Api\Bot\TelegramLinkController as BotTelegramLinkController;
use App\Http\Controllers\Api\Bot\TransactionController as BotTransactionController;
use App\Http\Controllers\Api\CampaignController;
use App\Http\Controllers\Api\ClientController;
use App\Http\Controllers\Api\CsatRatingController;
use App\Http\Controllers\Api\Coach\CoachController;
use App\Http\Controllers\Api\Coach\RoleController;
use App\Http\Controllers\Api\CalendarController;
use App\Http\Controllers\Api\ContentCreationController;
use App\Http\Controllers\Api\CourseAccessController;
use App\Http\Controllers\Api\CoursePlanController;
use App\Http\Controllers\Api\CourseRequestController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\FinanceController;
use App\Http\Controllers\Api\JournalController;
use App\Http\Controllers\Api\KpiController;
use App\Http\Controllers\Api\MarketController;
use App\Http\Controllers\Api\MarketingController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\SettingController;
use App\Http\Controllers\Api\StatsController;
use App\Http\Controllers\Api\SupportTicketController;
use Illuminate\Support\Facades\Route;

// ── Public routes ─────────────────────────────────────────────────────────────

Route::prefix('auth')->middleware('throttle:10,1')->group(function () {
    Route::post('login',           [AuthController::class, 'login']);
    Route::post('register',        [AuthController::class, 'register']);
    Route::post('request-code',    [AuthController::class, 'requestCode']);
    Route::post('claim',           [AuthController::class, 'claim']);
    Route::post('forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('reset-password',  [AuthController::class, 'resetPassword']);
});

// Public: course plans (read-only)
Route::get('course-plans',          [CoursePlanController::class, 'index']);
Route::get('course-plans/{coursePlan}', [CoursePlanController::class, 'show']);

// Public: blog posts (read-only, published only)
Route::get('blog',          [BlogPostController::class, 'index']);
Route::get('blog/{blogPost}', [BlogPostController::class, 'show']);

// Public: submit a support ticket
Route::post('tickets', [SupportTicketController::class, 'store']);

// Public: live market quotes (homepage ticker + Financial Markets section)
Route::get('market-quotes', [MarketController::class, 'quotes']);

// Public: headline stats for the homepage trust cards
Route::get('stats', [StatsController::class, 'index']);

// Public: CSAT rating page (token is the identity — no auth)
Route::get('csat/{token}',  [CsatRatingController::class, 'show']);
Route::post('csat/{token}', [CsatRatingController::class, 'submit']);

// ── Telegram bot → app (secured by the X-Bot-Secret header) ───────────────────
Route::prefix('bot')->middleware('bot.secret')->group(function () {
    Route::post('transactions',  [BotTransactionController::class, 'store']);
    Route::get('clients/{phone}', [BotTransactionController::class, 'lookup']);
    Route::post('link-telegram', [BotTelegramLinkController::class, 'store']);
});

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
        Route::get('appointments',     [AccountController::class, 'appointments']);
        Route::get('transactions',     [AccountController::class, 'transactions']);
        Route::get('course-requests',  [CourseRequestController::class, 'mine']);
        Route::post('course-requests', [CourseRequestController::class, 'store']);
        Route::get('journal/insights', [JournalController::class, 'insights']);
        Route::apiResource('journal', JournalController::class)->except('show');

        // Affiliate downline (the user's own clients + sub-IBs)
        Route::get('network', [AffiliateController::class, 'network']);
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
        Route::get('overview',  [DashboardController::class, 'overview'])->middleware('permission:view dashboard');

        // Analytics
        Route::get('analytics', [DashboardController::class, 'analytics'])->middleware('permission:view performance');

        // Activity log
        Route::get('activity-logs', [ActivityLogController::class, 'index'])->middleware('permission:view activity log');

        // CSAT ratings — agents request a link (needs client access); reports read the KPIs
        Route::post('csat/request', [CsatRatingController::class, 'request'])->middleware('permission:view clients');
        Route::get('csat',          [CsatRatingController::class, 'index'])->middleware('permission:view reports');
        Route::get('csat/summary',  [CsatRatingController::class, 'summary'])->middleware('permission:view reports');
        Route::delete('csat/{rating}', [CsatRatingController::class, 'destroy'])->middleware('permission:delete csat');

        // Settings (GET all / PUT batch-update)
        Route::get('settings', [SettingController::class, 'index'])->middleware('permission:view settings');
        Route::put('settings', [SettingController::class, 'update'])->middleware('permission:edit settings');

        // Coaches management
        Route::get('coaches', [CoachController::class, 'index'])->middleware('permission:view users');
        Route::post('coaches', [CoachController::class, 'store'])->middleware('permission:create users');
        Route::get('coaches/{coach}', [CoachController::class, 'show'])->middleware('permission:view users');
        Route::put('coaches/{coach}', [CoachController::class, 'update'])->middleware('permission:edit users');
        Route::patch('coaches/{coach}', [CoachController::class, 'update'])->middleware('permission:edit users');
        Route::delete('coaches/{coach}', [CoachController::class, 'destroy'])->middleware('permission:delete users');

        // Minimal coach picker for assignment (schedulers don't need full user management)
        Route::get('coaches-options', [CoachController::class, 'options'])
            ->middleware('permission:view scheduling|view appointments');

        // Roles & permissions
        Route::get('permissions', [RoleController::class, 'permissions'])->middleware('permission:view roles');
        Route::get('roles', [RoleController::class, 'index'])->middleware('permission:view roles');
        Route::post('roles', [RoleController::class, 'store'])->middleware('permission:create roles');
        Route::put('roles/{role}', [RoleController::class, 'update'])->middleware('permission:edit roles');
        Route::patch('roles/{role}', [RoleController::class, 'update'])->middleware('permission:edit roles');
        Route::delete('roles/{role}', [RoleController::class, 'destroy'])->middleware('permission:delete roles');

        // Course plans management
        Route::prefix('course-plans')->group(function () {
            Route::post('/', [CoursePlanController::class, 'store'])->middleware('permission:create courses');
            Route::put('{coursePlan}', [CoursePlanController::class, 'update'])->middleware('permission:edit courses');
            Route::delete('{coursePlan}', [CoursePlanController::class, 'destroy'])->middleware('permission:delete courses');
            Route::post('{coursePlan}/features', [CoursePlanController::class, 'storeFeature'])->middleware('permission:edit courses');
            Route::put('{coursePlan}/features/{feature}', [CoursePlanController::class, 'updateFeature'])->middleware('permission:edit courses');
            Route::delete('{coursePlan}/features/{feature}', [CoursePlanController::class, 'destroyFeature'])->middleware('permission:edit courses');
        });

        // CRM — clients & leads (one shared endpoint, so reads need either view
        // permission; writes need the matching create/edit/delete).
        Route::prefix('crm')->middleware('permission:view clients|view leads')->group(function () {
            Route::get('/',                          [ClientController::class, 'index']);
            Route::post('/',                         [ClientController::class, 'store'])->middleware('permission:create clients|create leads');
            Route::get('{client}',                   [ClientController::class, 'show']);
            Route::put('{client}',                   [ClientController::class, 'update'])->middleware('permission:edit clients|edit leads');
            Route::delete('{client}',                [ClientController::class, 'destroy'])->middleware('permission:delete clients|delete leads');
            Route::post('{client}/convert',          [ClientController::class, 'convert'])->middleware('permission:convert leads');
            Route::post('{client}/access-code',      [ClientController::class, 'issueAccessCode'])->middleware('permission:edit clients');
            // Notes (author = authenticated coach)
            Route::post('{client}/notes',            [ClientController::class, 'storeNote'])->middleware('permission:edit clients|edit leads');
            Route::delete('{client}/notes/{note}',   [ClientController::class, 'destroyNote'])->middleware('permission:edit clients|edit leads');
        });

        // Affiliates — multi-level IB network management
        Route::prefix('affiliates')->group(function () {
            Route::get('/',        [AffiliateController::class, 'index'])->middleware('permission:view affiliates');
            Route::get('tree',     [AffiliateController::class, 'tree'])->middleware('permission:view affiliates');
            Route::get('options',  [AffiliateController::class, 'options'])->middleware('permission:view clients|view affiliates');
            Route::get('brokers',  [AffiliateController::class, 'brokers'])->middleware('permission:view clients|view affiliates');
            Route::post('promote', [AffiliateController::class, 'promote'])->middleware('permission:manage affiliates');
            Route::put('{user}',   [AffiliateController::class, 'update'])->middleware('permission:manage affiliates');
            Route::delete('{user}',[AffiliateController::class, 'demote'])->middleware('permission:manage affiliates');
        });

        // Blog management
        Route::post('blog', [BlogPostController::class, 'store'])->middleware('permission:create blog');
        Route::put('blog/{blogPost}', [BlogPostController::class, 'update'])->middleware('permission:edit blog');
        Route::delete('blog/{blogPost}', [BlogPostController::class, 'destroy'])->middleware('permission:delete blog');

        // Support tickets management
        Route::middleware('permission:view support tickets')->group(function () {
            Route::get('tickets', [SupportTicketController::class, 'index']);
            Route::get('tickets/{supportTicket}', [SupportTicketController::class, 'show']);
            Route::put('tickets/{supportTicket}', [SupportTicketController::class, 'update'])->middleware('permission:edit support tickets');
            Route::delete('tickets/{supportTicket}', [SupportTicketController::class, 'destroy'])->middleware('permission:delete support tickets');
        });

        // Appointments
        Route::get('appointments', [AppointmentController::class, 'index'])->middleware('permission:view appointments');
        Route::post('appointments', [AppointmentController::class, 'store'])->middleware('permission:create appointments');
        Route::get('appointments/{appointment}', [AppointmentController::class, 'show'])->middleware('permission:view appointments');
        Route::put('appointments/{appointment}', [AppointmentController::class, 'update'])->middleware('permission:edit appointments');
        Route::patch('appointments/{appointment}', [AppointmentController::class, 'update'])->middleware('permission:edit appointments');
        Route::delete('appointments/{appointment}', [AppointmentController::class, 'destroy'])->middleware('permission:delete appointments');

        // Course requests (user applications → approve/decline)
        Route::get('course-requests', [CourseRequestController::class, 'index'])->middleware('permission:view courses');
        Route::put('course-requests/{courseRequest}', [CourseRequestController::class, 'update'])->middleware('permission:approve course requests');

        // Finance (gated by seeded finance permissions; analysts are read-only)
        Route::prefix('finance')->middleware('permission:view finance')->group(function () {
            Route::get('transactions', [FinanceController::class, 'transactions'])->middleware('permission:view transactions');
            Route::post('transactions', [FinanceController::class, 'storeTransaction'])->middleware('permission:create transactions');
            Route::put('transactions/{tx}', [FinanceController::class, 'updateTransaction'])->middleware('permission:edit transactions');
            Route::delete('transactions/{tx}', [FinanceController::class, 'destroyTransaction'])->middleware('permission:delete transactions');
            Route::get('expenses', [FinanceController::class, 'expenses'])->middleware('permission:view expenses');
            Route::post('expenses', [FinanceController::class, 'storeExpense'])->middleware('permission:create expenses');
            Route::delete('expenses/{expense}', [FinanceController::class, 'destroyExpense'])->middleware('permission:delete expenses');
            Route::get('wallet', [FinanceController::class, 'wallet'])->middleware('permission:view wallets');
            Route::get('topups', [FinanceController::class, 'topups'])->middleware('permission:view wallets');
            Route::post('wallet/topup', [FinanceController::class, 'topUpWallet'])->middleware('permission:edit wallets');
            Route::post('wallet/convert', [FinanceController::class, 'convertCurrency'])->middleware('permission:edit wallets');
            Route::post('wallet/rate', [FinanceController::class, 'updateRate'])->middleware('permission:edit wallets');
        });

        // Marketing
        Route::prefix('marketing')->group(function () {
            Route::get('campaigns', [CampaignController::class, 'index'])->middleware('permission:view campaigns');
            Route::post('campaigns', [CampaignController::class, 'store'])->middleware('permission:create campaigns');
            Route::get('campaigns/{campaign}', [CampaignController::class, 'show'])->middleware('permission:view campaigns');
            Route::put('campaigns/{campaign}', [CampaignController::class, 'update'])->middleware('permission:edit campaigns');
            Route::patch('campaigns/{campaign}', [CampaignController::class, 'update'])->middleware('permission:edit campaigns');
            Route::delete('campaigns/{campaign}', [CampaignController::class, 'destroy'])->middleware('permission:delete campaigns');

            Route::get('plans', [MarketingController::class, 'plans'])->middleware('permission:view content plans');
            Route::post('plans', [MarketingController::class, 'storePlan'])->middleware('permission:create content plans');
            Route::put('plans/{plan}', [MarketingController::class, 'updatePlan'])->middleware('permission:edit content plans');
            Route::delete('plans/{plan}', [MarketingController::class, 'destroyPlan'])->middleware('permission:delete content plans');
            Route::post('plans/{plan}/items', [MarketingController::class, 'storePlanItem'])->middleware('permission:edit content plans');
            Route::put('plans/{plan}/items/{item}', [MarketingController::class, 'updatePlanItem'])->middleware('permission:edit content plans');
            Route::delete('plans/{plan}/items/{item}', [MarketingController::class, 'destroyPlanItem'])->middleware('permission:edit content plans');

            Route::get('media', [MarketingController::class, 'mediaItems'])->middleware('permission:view media library');
            Route::post('media', [MarketingController::class, 'storeMediaItem'])->middleware('permission:create media library');
            Route::put('media/{item}', [MarketingController::class, 'updateMediaItem'])->middleware('permission:edit media library');
            Route::delete('media/{item}', [MarketingController::class, 'destroyMediaItem'])->middleware('permission:delete media library');

            Route::get('sent-notifications', [MarketingController::class, 'sentNotifications'])->middleware('permission:view telegram notifications');
            Route::post('send-notification', [MarketingController::class, 'sendNotification'])->middleware('permission:create telegram notifications');
            Route::get('telegram-recipients', [MarketingController::class, 'telegramRecipients'])->middleware('permission:view telegram notifications');
        });

        // Content creation (AI)
        Route::prefix('content')->group(function () {
            Route::get('/', [ContentCreationController::class, 'index'])->middleware('permission:view content');
            Route::post('generate', [ContentCreationController::class, 'generate'])->middleware('permission:create content');
            Route::post('/', [ContentCreationController::class, 'store'])->middleware('permission:create content');
            Route::delete('{content}', [ContentCreationController::class, 'destroy'])->middleware('permission:delete content');
        });

        // Course Telegram access management
        Route::prefix('courses')->group(function () {
            Route::get('all-grants', [CourseAccessController::class, 'allGrants'])->middleware('permission:view courses');
            Route::get('{coursePlan}/access-grants', [CourseAccessController::class, 'index'])->middleware('permission:view courses');
            Route::post('{coursePlan}/access-grants', [CourseAccessController::class, 'store'])->middleware('permission:create courses');
            Route::patch('{coursePlan}/access-grants/{grantId}', [CourseAccessController::class, 'extend'])->middleware('permission:edit courses');
            Route::delete('{coursePlan}/access-grants/{grantId}', [CourseAccessController::class, 'destroy'])->middleware('permission:delete courses');
            Route::patch('{coursePlan}/bot-plan', [CourseAccessController::class, 'updateBotPlan'])->middleware('permission:edit courses');
        });

        // Calendar (unified events + tasks)
        Route::prefix('calendar')->middleware('permission:view scheduling')->group(function () {
            Route::get('/', [CalendarController::class, 'index']);
            Route::post('tasks', [CalendarController::class, 'storeTask'])->middleware('permission:create scheduling');
            Route::put('tasks/{task}', [CalendarController::class, 'updateTask'])->middleware('permission:edit scheduling');
            Route::delete('tasks/{task}', [CalendarController::class, 'destroyTask'])->middleware('permission:delete scheduling');
        });

        // KPI management
        Route::prefix('kpi')->middleware('permission:view performance')->group(function () {
            Route::get('definitions', [KpiController::class, 'definitions']);
            Route::put('definitions/{definition}', [KpiController::class, 'updateDefinition']);
            Route::get('entries', [KpiController::class, 'entries']);
            Route::post('entries', [KpiController::class, 'storeEntry']);
            Route::put('entries/{entry}', [KpiController::class, 'updateEntry']);
            Route::delete('entries/{entry}', [KpiController::class, 'deleteEntry']);
            Route::get('summary', [KpiController::class, 'adminSummary']);
        });
    });

    // ── Coach self-service ────────────────────────────────────────────────────
    Route::prefix('coach')->middleware('coach')->group(function () {
        Route::get('kpi/scorecard', [KpiController::class, 'myScorecard']);
    });
});
