<?php

namespace App\Events;

use App\Models\Ticket;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TicketCalled implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public Ticket $ticket) {}

    public function broadcastOn(): array
    {
        return [
            new Channel('company.' . $this->ticket->company_id . '.queue'),
            new Channel('ticket.' . $this->ticket->id),
        ];
    }

    public function broadcastAs(): string
    {
        return 'ticket.called';
    }

    public function broadcastWith(): array
    {
        return [
            'id'        => $this->ticket->id,
            'number'    => $this->ticket->number,
            'status'    => $this->ticket->status,
            'counter'   => $this->ticket->counter?->name,
            'service'   => $this->ticket->service?->name,
            'called_at' => $this->ticket->called_at?->toIso8601String(),
        ];
    }
}
