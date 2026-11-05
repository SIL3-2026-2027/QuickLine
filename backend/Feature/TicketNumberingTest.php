<?php

namespace Tests\Feature;

use App\Models\Ticket;
use App\Models\TicketCounter;
use Illuminate\Support\Carbon;

class TicketNumberingTest extends QuickLineTestCase
{
    /** @test */
    public function first_ticket_gets_number_001()
    {
        $response = $this->postJson('/api/v1/tickets', [
            'company_id' => $this->company->id,
            'service_id' => $this->service->id,
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('number', 'T-001')
            ->assertJsonPath('status', 'EN_ATTENTE');
    }

    /** @test */
    public function tickets_are_sequentially_numbered()
    {
        for ($i = 1; $i <= 5; $i++) {
            $response = $this->postJson('/api/v1/tickets', [
                'company_id' => $this->company->id,
                'service_id' => $this->service->id,
            ]);
            $response->assertJsonPath('number', sprintf('T-%03d', $i));
        }

        $this->assertEquals(5, Ticket::count());
        $this->assertEquals(5, TicketCounter::first()->last_number);
    }

    /** @test */
    public function numbering_resets_next_day()
    {
        // Jour 1 : 3 tickets
        for ($i = 1; $i <= 3; $i++) {
            $this->postJson('/api/v1/tickets', [
                'company_id' => $this->company->id,
                'service_id' => $this->service->id,
            ]);
        }

        // On avance au lendemain
        Carbon::setTestNow(Carbon::tomorrow());

        $response = $this->postJson('/api/v1/tickets', [
            'company_id' => $this->company->id,
            'service_id' => $this->service->id,
        ]);

        // Repart à 1 le lendemain
        $response->assertJsonPath('number', 'T-001');

        // Il y a bien 2 compteurs distincts
        $this->assertEquals(2, TicketCounter::count());
    }

    /** @test */
    public function ticket_prefix_comes_from_service()
    {
        $otherService = \App\Models\Service::create([
            'company_id'         => $this->company->id,
            'name'               => 'Autre Service',
            'ticket_prefix'      => 'A',
            'estimated_time_min' => 5,
        ]);

        $response = $this->postJson('/api/v1/tickets', [
            'company_id' => $this->company->id,
            'service_id' => $otherService->id,
        ]);

        $response->assertJsonPath('number', 'A-001');
    }
}
