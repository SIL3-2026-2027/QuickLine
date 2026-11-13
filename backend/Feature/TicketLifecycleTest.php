<?php

namespace Tests\Feature;

use App\Models\Ticket;

class TicketLifecycleTest extends QuickLineTestCase
{
    /** @test */
    public function client_can_create_and_track_ticket()
    {
        // 1. Client prend un ticket
        $create = $this->postJson('/api/v1/tickets', [
            'company_id' => $this->company->id,
            'service_id' => $this->service->id,
            'phone'      => '+22960000000',
        ]);

        $create->assertStatus(201);
        $ticketId = $create->json('id');
        $this->assertEquals('T-001', $create->json('number'));

        // 2. Client suit son ticket
        $track = $this->getJson("/api/v1/tickets/{$ticketId}");
        $track->assertStatus(200)
            ->assertJsonPath('ticket.status', 'EN_ATTENTE')
            ->assertJsonPath('people_ahead', 0);
    }

    /** @test */
    public function full_lifecycle_waiting_to_terminated()
    {
        // Client prend un ticket
        $create = $this->postJson('/api/v1/tickets', [
            'company_id' => $this->company->id,
            'service_id' => $this->service->id,
        ]);
        $ticketId = $create->json('id');

        $token = $this->loginAsAgent();

        // Agent appelle le suivant
        $call = $this->withHeader('Authorization', "Bearer $token")
            ->postJson('/api/v1/agent/call-next', [
                'counter_id' => $this->counter->id,
            ]);
        $call->assertStatus(200)
            ->assertJsonPath('status', 'EN_COURS');

        // Agent termine le passage
        $finish = $this->withHeader('Authorization', "Bearer $token")
            ->postJson("/api/v1/agent/tickets/{$ticketId}/finish");
        $finish->assertStatus(200)
            ->assertJsonPath('status', 'TERMINE');

        // Vérifie en BDD
        $ticket = Ticket::find($ticketId);
        $this->assertEquals('TERMINE', $ticket->status);
        $this->assertNotNull($ticket->called_at);
        $this->assertNotNull($ticket->finished_at);
    }

    /** @test */
    public function client_can_cancel_waiting_ticket()
    {
        $create = $this->postJson('/api/v1/tickets', [
            'company_id' => $this->company->id,
            'service_id' => $this->service->id,
        ]);
        $ticketId = $create->json('id');

        $cancel = $this->deleteJson("/api/v1/tickets/{$ticketId}");
        $cancel->assertStatus(204);

        $this->assertEquals('ANNULE', Ticket::find($ticketId)->status);
    }

    /** @test */
    public function client_cannot_cancel_ticket_already_in_progress()
    {
        $create = $this->postJson('/api/v1/tickets', [
            'company_id' => $this->company->id,
            'service_id' => $this->service->id,
        ]);
        $ticketId = $create->json('id');

        $token = $this->loginAsAgent();
        $this->withHeader('Authorization', "Bearer $token")
            ->postJson('/api/v1/agent/call-next', ['counter_id' => $this->counter->id]);

        // Tente d'annuler un ticket EN_COURS
        $cancel = $this->deleteJson("/api/v1/tickets/{$ticketId}");
        $cancel->assertStatus(422);
    }

    /** @test */
    public function agent_can_mark_ticket_as_absent()
    {
        $create = $this->postJson('/api/v1/tickets', [
            'company_id' => $this->company->id,
            'service_id' => $this->service->id,
        ]);
        $ticketId = $create->json('id');

        $token = $this->loginAsAgent();

        $this->withHeader('Authorization', "Bearer $token")
            ->postJson('/api/v1/agent/call-next', ['counter_id' => $this->counter->id]);

        $absent = $this->withHeader('Authorization', "Bearer $token")
            ->postJson("/api/v1/agent/tickets/{$ticketId}/absent");

        $absent->assertStatus(200)
            ->assertJsonPath('status', 'ABSENT');

        $this->assertEquals('ABSENT', Ticket::find($ticketId)->status);
    }
}
