<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\Service;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class IsolationTest extends QuickLineTestCase
{
    private Company $otherCompany;
    private User $otherAdmin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->otherCompany = Company::create([
            'name' => 'Autre Banque',
            'slug' => 'autre-banque',
        ]);

        $this->otherAdmin = User::create([
            'company_id' => $this->otherCompany->id,
            'name'       => 'Admin Autre',
            'email'      => 'admin@autre.com',
            'password'   => Hash::make('password123'),
            'role'       => 'admin',
            'is_active'  => true,
        ]);
    }

    /** @test */
    public function agent_cannot_access_admin_routes()
    {
        $token = $this->loginAsAgent();

        $this->withHeader('Authorization', "Bearer $token")
            ->getJson('/api/v1/admin/stats')
            ->assertStatus(403)
            ->assertJson(['message' => 'Accès refusé : rôle insuffisant.']);
    }

    /** @test */
    public function admin_only_sees_his_own_company_services()
    {
        // Service de la 1ère entreprise (déjà créé dans setUp)
        // Service de la 2ème entreprise
        Service::create([
            'company_id'         => $this->otherCompany->id,
            'name'               => 'Service Autre',
            'ticket_prefix'      => 'X',
            'estimated_time_min' => 10,
        ]);

        $token = $this->loginAsAdmin();

        $response = $this->withHeader('Authorization', "Bearer $token")
            ->getJson('/api/v1/admin/services');

        $response->assertStatus(200);
        $this->assertCount(1, $response->json(), 'L\'admin ne voit QUE ses propres services');
        $this->assertEquals('Service Test', $response->json('0.name'));
    }

    /** @test */
    public function admin_cannot_modify_other_company_service()
    {
        $otherService = Service::create([
            'company_id'         => $this->otherCompany->id,
            'name'               => 'Service Autre',
            'ticket_prefix'      => 'X',
            'estimated_time_min' => 10,
        ]);

        $token = $this->loginAsAdmin();

        $response = $this->withHeader('Authorization', "Bearer $token")
            ->putJson("/api/v1/admin/services/{$otherService->id}", [
                'name' => 'Hacked',
            ]);

        $response->assertStatus(403);
    }

    /** @test */
    public function agent_cannot_finish_ticket_from_other_company()
    {
        $otherTicket = Ticket::create([
            'company_id' => $this->otherCompany->id,
            'service_id' => $this->service->id,
            'number'     => 'X-001',
            'status'     => 'EN_COURS',
        ]);

        $token = $this->loginAsAgent();

        $response = $this->withHeader('Authorization', "Bearer $token")
            ->postJson("/api/v1/agent/tickets/{$otherTicket->id}/finish");

        $response->assertStatus(403);
    }

    /** @test */
    public function unauthenticated_user_cannot_access_protected_routes()
    {
        $this->getJson('/api/v1/admin/stats')->assertStatus(401);
        $this->postJson('/api/v1/agent/call-next')->assertStatus(401);
    }
}
