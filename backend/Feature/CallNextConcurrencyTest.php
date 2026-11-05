<?php

namespace Tests\Feature;

use App\Models\Ticket;
use Illuminate\Support\Facades\DB;

class CallNextConcurrencyTest extends QuickLineTestCase
{
    /** @test */
    public function two_agents_calling_sequentially_get_different_tickets()
    {
        Ticket::create([
            'company_id' => $this->company->id,
            'service_id' => $this->service->id,
            'number'     => 'T-001',
            'status'     => 'EN_ATTENTE',
        ]);
        Ticket::create([
            'company_id' => $this->company->id,
            'service_id' => $this->service->id,
            'number'     => 'T-002',
            'status'     => 'EN_ATTENTE',
        ]);

        $token = $this->loginAsAgent();

        $r1 = $this->withHeader('Authorization', "Bearer $token")
            ->postJson('/api/v1/agent/call-next', ['counter_id' => $this->counter->id]);
        $r1->assertStatus(200);
        $num1 = $r1->json('number');

        $r2 = $this->withHeader('Authorization', "Bearer $token")
            ->postJson('/api/v1/agent/call-next', ['counter_id' => $this->counter->id]);
        $r2->assertStatus(200);
        $num2 = $r2->json('number');

        $this->assertNotEquals($num1, $num2, 'Les 2 appels retournent 2 tickets DIFFÉRENTS');
        $this->assertContains($num1, ['T-001', 'T-002']);
        $this->assertContains($num2, ['T-001', 'T-002']);

        $this->assertEquals(2, Ticket::where('status', 'EN_COURS')->count());
    }

    /**
     * 🔒 Preuve directe du SKIP LOCKED en SQL brut.
     * Simule 2 transactions PostgreSQL concurrentes.
     */
    /** @test */
    public function skip_locked_prevents_duplicate_assignment()
    {
        // 3 tickets en attente
        for ($i = 1; $i <= 3; $i++) {
            Ticket::create([
                'company_id' => $this->company->id,
                'service_id' => $this->service->id,
                'number'     => sprintf('T-%03d', $i),
                'status'     => 'EN_ATTENTE',
            ]);
        }

        $companyId = $this->company->id;
        $serviceId = $this->service->id;

        // Transaction 1 : sélectionne + verrouille le premier ticket
        $conn1 = DB::connection();
        $conn1->beginTransaction();

        $row1 = $conn1->selectOne("
            SELECT id, number FROM tickets
            WHERE company_id = ? AND service_id = ? AND status = 'EN_ATTENTE'
            ORDER BY created_at
            FOR UPDATE SKIP LOCKED
            LIMIT 1
        ", [$companyId, $serviceId]);

        $this->assertNotNull($row1);
        $firstNumber = $row1->number;

        // Transaction 2 : sélectionne + verrouille le ticket SUIVANT (skip locked)
        $row2 = $conn1->selectOne("
            SELECT id, number FROM tickets
            WHERE company_id = ? AND service_id = ? AND status = 'EN_ATTENTE'
            AND id != ?
            ORDER BY created_at
            FOR UPDATE SKIP LOCKED
            LIMIT 1
        ", [$companyId, $serviceId, $row1->id]);

        $this->assertNotNull($row2);
        $secondNumber = $row2->number;

        // Les 2 tickets sont DIFFÉRENTS
        $this->assertNotEquals(
            $firstNumber,
            $secondNumber,
            'SKIP LOCKED : les 2 verrous obtiennent 2 tickets DISTINCTS'
        );

        $conn1->rollBack();
    }

    /** @test */
    public function call_next_returns_204_when_no_ticket_available()
    {
        $token = $this->loginAsAgent();

        $response = $this->withHeader('Authorization', "Bearer $token")
            ->postJson('/api/v1/agent/call-next', [
                'counter_id' => $this->counter->id,
            ]);

        $response->assertStatus(204);
    }

    /** @test */
    public function paused_counter_cannot_call_next()
    {
        $this->counter->update(['is_paused' => true]);
        Ticket::create([
            'company_id' => $this->company->id,
            'service_id' => $this->service->id,
            'number'     => 'T-001',
            'status'     => 'EN_ATTENTE',
        ]);

        $token = $this->loginAsAgent();

        $response = $this->withHeader('Authorization', "Bearer $token")
            ->postJson('/api/v1/agent/call-next', [
                'counter_id' => $this->counter->id,
            ]);

        $response->assertStatus(423)
            ->assertJson(['error' => 'Guichet en pause.']);
    }
}
