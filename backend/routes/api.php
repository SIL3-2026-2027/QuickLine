<?php

use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\AgentController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\PublicController;
use App\Http\Controllers\Api\TicketController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API QuickLine v1
|--------------------------------------------------------------------------
| Conforme au cahier des charges v3
|--------------------------------------------------------------------------
*/

Route::prefix('v1')->group(function () {

    // ========================================================
    // PUBLIC (pas d'authentification)
    // ========================================================
    Route::post('/admin/register', [AdminController::class, 'register']);
    Route::post('/auth/login',     [AuthController::class, 'login']);

    Route::get('/companies/{slug}', [PublicController::class, 'company']);
    Route::get('/time',             [PublicController::class, 'time']);

    Route::post('/tickets',            [TicketController::class, 'store']);
    Route::get('/tickets/{ticket}',    [TicketController::class, 'show']);
    Route::delete('/tickets/{ticket}', [TicketController::class, 'cancel']);

    Route::get('/display/{slug}', [PublicController::class, 'display']);

    // ========================================================
    // AUTHENTIFIÉ (agent ou admin)
    // ========================================================
    Route::middleware(['auth:sanctum', 'company.isolation'])->group(function () {

        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::get('/auth/me',      [AuthController::class, 'me']);

        // ---------- AGENT ----------
        Route::middleware(['role:agent'])->prefix('agent')->group(function () {
            Route::get('/counters',                   [AgentController::class, 'listCounters']);
            Route::post('/call-next',                 [AgentController::class, 'callNext']);
            Route::post('/tickets/{ticket}/finish',   [AgentController::class, 'finish']);
            Route::post('/tickets/{ticket}/absent',   [AgentController::class, 'absent']);
            Route::post('/tickets/{ticket}/recall',   [AgentController::class, 'recall']);
            Route::post('/counter/pause',             [AgentController::class, 'togglePause']);
            Route::get('/queue',                      [AgentController::class, 'queue']);
        });

        // ---------- ADMIN ----------
        Route::middleware(['role:admin'])->prefix('admin')->group(function () {

            // Services
            Route::get('/services',              [AdminController::class, 'listServices']);
            Route::post('/services',             [AdminController::class, 'createService']);
            Route::put('/services/{service}',    [AdminController::class, 'updateService']);
            Route::delete('/services/{service}', [AdminController::class, 'deleteService']);

            // Guichets
            Route::get('/counters',              [AdminController::class, 'listCounters']);
            Route::post('/counters',             [AdminController::class, 'createCounter']);
            Route::delete('/counters/{counter}', [AdminController::class, 'deleteCounter']);

            // Agents
            Route::get('/agents',                [AdminController::class, 'listAgents']);
            Route::post('/agents',               [AdminController::class, 'createAgent']);
            Route::delete('/agents/{user}',      [AdminController::class, 'deactivateAgent']);

            // Statistiques
            Route::get('/stats',                 [AdminController::class, 'stats']);
        });
    });
});
