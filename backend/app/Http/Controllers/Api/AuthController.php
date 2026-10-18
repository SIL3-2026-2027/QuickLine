<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Connexion unifiée agent + admin.
     * Le rôle détermine les droits côté client.
     */
    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $data['email'])->first();

        if (!$user || !Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Identifiants invalides.'],
            ]);
        }

        if (!$user->is_active) {
            return response()->json([
                'message' => 'Compte désactivé. Contactez votre administrateur.',
            ], 403);
        }

        // Révoque les anciens tokens
        $user->tokens()->delete();

        $token = $user->createToken('quickline-' . $user->role)->plainTextToken;

        return response()->json([
            'token' => $token,
            'user'  => [
                'id'         => $user->id,
                'name'       => $user->name,
                'email'      => $user->email,
                'role'       => $user->role,
                'company_id' => $user->company_id,
            ],
        ]);
    }

    /**
     * Déconnexion — révoque le token courant.
     */
    public function logout(Request $request): JsonResponse
    {
        $user = $request->user();

        // Récupère le token Bearer depuis l'en-tête Authorization
        $bearerToken = $request->bearerToken();

        if ($bearerToken) {
            // Sanctum stocke le hash SHA256 du token dans la colonne `token`
            $hashed = hash('sha256', $bearerToken);

            // Supprime UNIQUEMENT ce token (déconnexion locale)
            \Laravel\Sanctum\PersonalAccessToken::where('token', $hashed)
                ->where('tokenable_id', $user->id)
                ->where('tokenable_type', get_class($user))
                ->delete();

            return response()->json(null, 204);
        }

        // Fallback : supprime TOUS les tokens de l'utilisateur
        $user->tokens()->delete();

        return response()->json(null, 204);
    }

    /**
     * Profil de l'utilisateur connecté.
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user()->load('company');

        return response()->json([
            'id'         => $user->id,
            'name'       => $user->name,
            'email'      => $user->email,
            'role'       => $user->role,
            'company_id' => $user->company_id,
            'company'    => $user->company ? [
                'id'   => $user->company->id,
                'name'   => $user->company->name,
                'slug'   => $user->company->slug,
            ] : null,
        ]);
    }
}
