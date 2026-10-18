<?php

use Illuminate\Support\Facades\Broadcast;

/*
|--------------------------------------------------------------------------
| Broadcast Channels
|--------------------------------------------------------------------------
*/

// File d'attente d'une entreprise — accessible publiquement (TV display)
Broadcast::channel('company.{companyId}.queue', function ($user, $companyId) {
    // Public : un client non connecté peut suivre la file
    return true;
});

// Suivi d'un ticket individuel — accessible publiquement
Broadcast::channel('ticket.{ticketId}', function ($user, $ticketId) {
    // Public : le client suit son propre ticket
    return true;
});
