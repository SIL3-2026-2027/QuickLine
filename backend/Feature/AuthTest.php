<?php

namespace Tests\Feature;

class AuthTest extends QuickLineTestCase
{
    /** @test */
    public function agent_can_login_with_valid_credentials()
    {
        $response = $this->postJson('/api/v1/auth/login', [
            'email'    => $this->agent->email,
            'password' => 'password123',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure(['token', 'user' => ['id', 'email', 'role']])
            ->assertJsonPath('user.role', 'agent');
    }

    /** @test */
    public function login_fails_with_invalid_password()
    {
        $response = $this->postJson('/api/v1/auth/login', [
            'email'    => $this->agent->email,
            'password' => 'mauvais-mot-de-passe',
        ]);

        $response->assertStatus(422);
    }

    /** @test */
    public function inactive_user_cannot_login()
    {
        $this->agent->update(['is_active' => false]);

        $response = $this->postJson('/api/v1/auth/login', [
            'email'    => $this->agent->email,
            'password' => 'password123',
        ]);

        $response->assertStatus(403)
            ->assertJson(['message' => 'Compte désactivé. Contactez votre administrateur.']);
    }

    /** @test */
    public function admin_and_agent_have_different_roles()
    {
        $agentLogin = $this->postJson('/api/v1/auth/login', [
            'email'    => $this->agent->email,
            'password' => 'password123',
        ]);
        $agentLogin->assertJsonPath('user.role', 'agent');

        $adminLogin = $this->postJson('/api/v1/auth/login', [
            'email'    => $this->admin->email,
            'password' => 'password123',
        ]);
        $adminLogin->assertJsonPath('user.role', 'admin');
    }

    /** @test */
    public function authenticated_user_can_logout()
    {
        // 1. Login via Sanctum (crée un token en BDD)
        $login = $this->postJson('/api/v1/auth/login', [
            'email'    => $this->agent->email,
            'password' => 'password123',
        ]);

        $token = $login->json('token');
        $this->assertNotNull($token);

        // 2. Vérifie que le token fonctionne
        $this->withHeader('Authorization', "Bearer $token")
            ->getJson('/api/v1/auth/me')
            ->assertStatus(200);

        // 3. Logout
        $this->withHeader('Authorization', "Bearer $token")
            ->postJson('/api/v1/auth/logout')
            ->assertStatus(204);

        // 4. ⚠️ SIMULE UNE NOUVELLE REQUÊTE HTTP indépendante
        //    On réinitialise l'application et on oublie les guards
        //    pour que Sanctum revalide le token depuis la BDD
        $this->refreshApplication();
        $this->app['auth']->forgetGuards();
        \Laravel\Sanctum\Sanctum::$accessTokenRetrievalCallback = null;
        \Laravel\Sanctum\Sanctum::$accessTokenAuthenticationCallback = null;

        // 5. Le token est maintenant révoqué → 401
        $this->withHeader('Authorization', "Bearer $token")
            ->getJson('/api/v1/auth/me')
            ->assertStatus(401);
    }
}
