<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\Counter;
use App\Models\Service;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

abstract class QuickLineTestCase extends TestCase
{
    use RefreshDatabase;

    protected Company $company;
    protected User $admin;
    protected User $agent;
    protected Service $service;
    protected Counter $counter;

    protected function setUp(): void
    {
        parent::setUp();

        // Crée une entreprise de test
        $this->company = Company::create([
            'name' => 'Test Banque',
            'slug' => 'test-banque',
        ]);

        // Admin
        $this->admin = User::create([
            'company_id' => $this->company->id,
            'name'       => 'Admin Test',
            'email'      => 'admin@test.com',
            'password'   => Hash::make('password123'),
            'role'       => 'admin',
            'is_active'  => true,
        ]);

        // Agent
        $this->agent = User::create([
            'company_id' => $this->company->id,
            'name'       => 'Agent Test',
            'email'      => 'agent@test.com',
            'password'   => Hash::make('password123'),
            'role'       => 'agent',
            'is_active'  => true,
        ]);

        // Service
        $this->service = Service::create([
            'company_id'         => $this->company->id,
            'name'               => 'Service Test',
            'ticket_prefix'      => 'T',
            'estimated_time_min' => 10,
            'is_active'          => true,
        ]);

        // Guichet
        $this->counter = Counter::create([
            'company_id' => $this->company->id,
            'name'       => 'Guichet Test',
            'number'     => 1,
            'is_active'  => true,
        ]);
        $this->counter->services()->sync([$this->service->id]);
    }

    protected function loginAsAgent(): string
    {
        $response = $this->postJson('/api/v1/auth/login', [
            'email'    => $this->agent->email,
            'password' => 'password123',
        ]);
        return $response->json('token');
    }

    protected function loginAsAdmin(): string
    {
        $response = $this->postJson('/api/v1/auth/login', [
            'email'    => $this->admin->email,
            'password' => 'password123',
        ]);
        return $response->json('token');
    }
}
