<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureCompanyIsolation
{
    /**
     * Vérifie que l'utilisateur est bien rattaché à une entreprise.
     * Bloque tout accès si company_id est absent.
     * Les contrôleurs utilisent ensuite $request->user()->company_id
     * pour filtrer toutes les requêtes Eloquent.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Non authentifié.'], 401);
        }

        if (!$user->company_id) {
            return response()->json([
                'message' => 'Utilisateur non rattaché à une entreprise.',
            ], 403);
        }

        return $next($request);
    }
}
