<?php

namespace App\Http\Controllers\Api;

use App\Events\TicketCalled;
use App\Http\Controllers\Controller;
use App\Models\Counter;
use App\Models\Ticket;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AgentController extends Controller
{
    /**
     * Liste les guichets de la company (accessible aux agents).
     */
    public function listCounters(Request $request): JsonResponse
    {
        $counters = Counter::where('company_id', $request->user()->company_id)
            ->where('is_active', true)
            ->orderBy('number')
            ->get(['id', 'name', 'number', 'is_paused']);

        return response()->json($counters);
    }

    /**
     * Appeler le ticket suivant — CONCURRENCE SAFE via SKIP LOCKED.
     */
    public function callNext(Request $request): JsonResponse
    {
        $data = $request->validate([
            'counter_id' => 'required|uuid|exists:counters,id',
        ]);

        $counter = Counter::where('id', $data['counter_id'])
            ->where('company_id', $request->user()->company_id)
            ->firstOrFail();

        if ($counter->is_paused) {
            return response()->json(['error' => 'Guichet en pause.'], 423);
        }

        if (!$counter->is_active) {
            return response()->json(['error' => 'Guichet inactif.'], 423);
        }

        $serviceIds = $counter->services()->pluck('services.id')->toArray();

        if (empty($serviceIds)) {
            return response()->json(['error' => 'Aucun service associé à ce guichet.'], 422);
        }

        $companyId = $request->user()->company_id;
        $userId    = $request->user()->id;
        $counterId = $counter->id;

        $ticketId = DB::transaction(function () use ($serviceIds, $companyId, $userId, $counterId) {
            // Construit les placeholders pour les UUIDs
            $placeholders = implode(',', array_fill(0, count($serviceIds), '?'));

            // 🔒 SELECT ... FOR UPDATE SKIP LOCKED (SQL brut PostgreSQL)
            $row = DB::selectOne("
                SELECT id
                FROM tickets
                WHERE service_id IN ($placeholders)
                AND company_id = ?
                AND status = 'EN_ATTENTE'
                ORDER BY created_at ASC
                FOR UPDATE SKIP LOCKED
                LIMIT 1
            ", [...$serviceIds, $companyId]);

            if (!$row) {
                return null;
            }

            Ticket::where('id', $row->id)->update([
                'status'     => 'EN_COURS',
                'counter_id' => $counterId,
                'user_id'    => $userId,
                'called_at'  => now(),
            ]);

            return $row->id;
        });

        if (!$ticketId) {
            return response()->json(['message' => 'Aucun ticket en attente.'], 204);
        }

        $ticket = Ticket::with(['service', 'counter'])->find($ticketId);

        broadcast(new TicketCalled($ticket))->toOthers();

        return response()->json($ticket);
    }

    /**
     * Terminer un passage.
     */
    public function finish(Request $request, Ticket $ticket): JsonResponse
    {
        $this->authorizeTicket($request, $ticket);

        $ticket->update([
            'status'      => 'TERMINE',
            'finished_at' => now(),
        ]);

        return response()->json($ticket);
    }

    /**
     * Signaler un client absent (statut ABSENT distinct de ANNULE).
     */
    public function absent(Request $request, Ticket $ticket): JsonResponse
    {
        $this->authorizeTicket($request, $ticket);

        $ticket->update([
            'status'      => 'ABSENT',
            'finished_at' => now(),
        ]);

        return response()->json($ticket);
    }

    /**
     * Rappeler le client (relance le signal WebSocket).
     */
    public function recall(Request $request, Ticket $ticket): JsonResponse
    {
        $this->authorizeTicket($request, $ticket);

        broadcast(new TicketCalled($ticket->load('counter', 'service')))->toOthers();

        return response()->json(['ok' => true]);
    }

    /**
     * Mettre le guichet en pause / le réactiver.
     */
    public function togglePause(Request $request): JsonResponse
    {
        $data = $request->validate([
            'counter_id' => 'required|uuid|exists:counters,id',
        ]);

        $counter = Counter::where('id', $data['counter_id'])
            ->where('company_id', $request->user()->company_id)
            ->firstOrFail();

        $counter->update(['is_paused' => !$counter->is_paused]);

        return response()->json($counter);
    }

    /**
     * File d'attente en direct pour ce guichet.
     */
    public function queue(Request $request): JsonResponse
    {
        $data = $request->validate([
            'counter_id' => 'required|uuid|exists:counters,id',
        ]);

        $counter = Counter::where('id', $data['counter_id'])
            ->where('company_id', $request->user()->company_id)
            ->firstOrFail();

        $serviceIds = $counter->services()->pluck('services.id');

        $waiting = Ticket::whereIn('service_id', $serviceIds)
            ->where('status', 'EN_ATTENTE')
            ->orderBy('created_at')
            ->take(20)
            ->get(['id', 'number', 'service_id', 'created_at']);

        // Comptage par service
        $byService = \App\Models\Service::whereIn('id', $serviceIds)
            ->withCount(['tickets' => fn($q) => $q->where('status', 'EN_ATTENTE')])
            ->get(['id', 'name', 'ticket_prefix', 'estimated_time_min']);

        return response()->json([
            'counter'   => $counter->only(['id', 'name', 'number', 'is_paused']),
            'waiting'   => $waiting,
            'by_service'=> $byService,
            'total'     => $waiting->count(),
        ]);
    }

    // ========================================================
    // HELPERS
    // ========================================================

    private function authorizeTicket(Request $request, Ticket $ticket): void
    {
        if ($ticket->company_id !== $request->user()->company_id) {
            abort(403, 'Accès refusé : ticket d\'une autre entreprise.');
        }
    }
}
