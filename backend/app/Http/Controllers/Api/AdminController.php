<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\Counter;
use App\Models\Service;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AdminController extends Controller
{
    /**
     * Créer une entreprise + son administrateur.
     */
    public function register(Request $request): JsonResponse
    {
        $data = $request->validate([
            'company_name' => 'required|string|max:150',
            'slug'         => 'required|string|max:100|unique:companies,slug|alpha_dash',
            'name'         => 'required|string|max:150',
            'email'        => 'required|email|unique:users,email',
            'password'     => 'required|string|min:8',
        ]);

        $result = DB::transaction(function () use ($data) {
            $company = Company::create([
                'name' => $data['company_name'],
                'slug' => Str::slug($data['slug']),
            ]);

            $admin = User::create([
                'company_id' => $company->id,
                'name'       => $data['name'],
                'email'      => $data['email'],
                'password'   => Hash::make($data['password']),
                'role'       => 'admin',
                'is_active'  => true,
            ]);

            return ['company' => $company, 'admin' => $admin];
        });

        return response()->json($result, 201);
    }

    // ========================================================
    // SERVICES
    // ========================================================

    public function listServices(Request $request): JsonResponse
    {
        $services = Service::where('company_id', $request->user()->company_id)
            ->orderBy('created_at')
            ->get();

        return response()->json($services);
    }

    public function createService(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'               => 'required|string|max:100',
            'ticket_prefix'      => 'required|string|max:5',
            'estimated_time_min' => 'required|integer|min:1',
        ]);

        $data['company_id'] = $request->user()->company_id;

        return response()->json(Service::create($data), 201);
    }

    public function updateService(Request $request, Service $service): JsonResponse
    {
        $this->authorizeCompany($request, $service->company_id);

        $data = $request->validate([
            'name'               => 'sometimes|string|max:100',
            'ticket_prefix'      => 'sometimes|string|max:5',
            'estimated_time_min' => 'sometimes|integer|min:1',
            'is_active'          => 'sometimes|boolean',
        ]);

        $service->update($data);

        return response()->json($service);
    }

    public function deleteService(Request $request, Service $service): JsonResponse
    {
        $this->authorizeCompany($request, $service->company_id);

        // Soft : désactiver au lieu de supprimer (préserve les données)
        $service->update(['is_active' => false]);

        return response()->json(null, 204);
    }

    // ========================================================
    // COUNTERS
    // ========================================================

    public function listCounters(Request $request): JsonResponse
    {
        $counters = Counter::where('company_id', $request->user()->company_id)
            ->with('services')
            ->orderBy('number')
            ->get();

        return response()->json($counters);
    }

    public function createCounter(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'        => 'required|string|max:100',
            'number'      => 'required|integer|min:1',
            'service_ids' => 'array',
            'service_ids.*' => 'uuid|exists:services,id',
        ]);

        $counter = DB::transaction(function () use ($data, $request) {
            $counter = Counter::create([
                'company_id' => $request->user()->company_id,
                'name'       => $data['name'],
                'number'     => $data['number'],
            ]);

            if (!empty($data['service_ids'])) {
                // Vérifie que les services appartiennent à la même company
                $validIds = Service::where('company_id', $request->user()->company_id)
                    ->whereIn('id', $data['service_ids'])
                    ->pluck('id')
                    ->toArray();

                $counter->services()->sync($validIds);
            }

            return $counter;
        });

        return response()->json($counter->load('services'), 201);
    }

    public function deleteCounter(Request $request, Counter $counter): JsonResponse
    {
        $this->authorizeCompany($request, $counter->company_id);

        DB::transaction(function () use ($counter) {
            // Détache les tickets en cours
            Ticket::where('counter_id', $counter->id)->update(['counter_id' => null]);
            // Détache les services
            $counter->services()->detach();
            // Désactive
            $counter->update(['is_active' => false]);
        });

        return response()->json(null, 204);
    }

    // ========================================================
    // AGENTS (USERS avec role=agent)
    // ========================================================

    public function listAgents(Request $request): JsonResponse
    {
        $agents = User::where('company_id', $request->user()->company_id)
            ->where('role', 'agent')
            ->orderBy('created_at')
            ->get(['id', 'name', 'email', 'is_active', 'created_at']);

        return response()->json($agents);
    }

    public function createAgent(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'     => 'required|string|max:150',
            'email'    => 'required|email|unique:users,email',
            'password' => 'required|string|min:8',
        ]);

        $agent = User::create([
            'company_id' => $request->user()->company_id,
            'name'       => $data['name'],
            'email'      => $data['email'],
            'password'   => Hash::make($data['password']),
            'role'       => 'agent',
            'is_active'  => true,
        ]);

        return response()->json($agent->only(['id', 'name', 'email', 'role', 'is_active']), 201);
    }

    public function deactivateAgent(Request $request, User $user): JsonResponse
    {
        $this->authorizeCompany($request, $user->company_id);

        if ($user->role !== 'agent') {
            return response()->json(['message' => 'Cet utilisateur n\'est pas un agent.'], 422);
        }

        $user->update(['is_active' => false]);
        $user->tokens()->delete(); // Révoque ses tokens

        return response()->json(null, 204);
    }

    // ========================================================
    // STATISTIQUES
    // ========================================================

    public function stats(Request $request): JsonResponse
    {
        $companyId = $request->user()->company_id;
        $serviceId = $request->query('service_id');
        $counterId = $request->query('counter_id');
        $from      = $request->query('from'); // YYYY-MM-DD
        $to        = $request->query('to');   // YYYY-MM-DD

        $base = Ticket::where('company_id', $companyId);

        if ($serviceId) $base->where('service_id', $serviceId);
        if ($counterId) $base->where('counter_id', $counterId);
        if ($from)      $base->whereDate('created_at', '>=', $from);
        if ($to)        $base->whereDate('created_at', '<=', $to);

        $total     = (clone $base)->count();
        $terminated= (clone $base)->where('status', 'TERMINE')->count();
        $absent    = (clone $base)->where('status', 'ABSENT')->count();
        $cancelled = (clone $base)->where('status', 'ANNULE')->count();
        $waiting   = (clone $base)->where('status', 'EN_ATTENTE')->count();

        // Temps moyen de traitement (finished_at - called_at)
        $avgDuration = (clone $base)
            ->whereNotNull('called_at')
            ->whereNotNull('finished_at')
            ->get()
            ->avg(fn($t) => $t->called_at->diffInSeconds($t->finished_at));

        // Absentéisme = ABSENT / (TERMINE + ABSENT)
        $attended = $terminated + $absent;
        $absentRate = $attended > 0 ? round(($absent / $attended) * 100, 2) : 0;

        // Répartition par service
        $byService = Service::where('company_id', $companyId)
            ->withCount(['tickets' => function ($q) use ($from, $to, $counterId) {
                if ($from) $q->whereDate('created_at', '>=', $from);
                if ($to)   $q->whereDate('created_at', '<=', $to);
                if ($counterId) $q->where('counter_id', $counterId);
            }])
            ->get(['id', 'name', 'ticket_prefix']);

        return response()->json([
            'total'          => $total,
            'terminated'     => $terminated,
            'absent'         => $absent,
            'cancelled'      => $cancelled,
            'waiting'        => $waiting,
            'avg_duration_s' => $avgDuration ? round($avgDuration) : null,
            'absent_rate'    => $absentRate,
            'by_service'     => $byService,
        ]);
    }

    // ========================================================
    // HELPERS
    // ========================================================

    private function authorizeCompany(Request $request, string $companyId): void
    {
        if ($request->user()->company_id !== $companyId) {
            abort(403, 'Accès refusé : ressources d\'une autre entreprise.');
        }
    }
}
