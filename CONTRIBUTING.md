# Guide de contribution — QuickLine

## 🌿 Branches

- **main** — branche de production stable (protégée)
- **develop** — branche d'intégration
- **feature/** — une branche par fonctionnalité
  - `feature/auth` — Authentification
  - `feature/ticket` — Prise de ticket
  - `feature/call-next` — Appel du suivant
  - `feature/display` — Écran TV
  - `feature/stats` — Statistiques

## 📝 Convention de commits

Format : **`type(scope): description`**

### Types autorisés

| Type | Usage |
|------|-------|
| feat | Nouvelle fonctionnalité |
| fix | Correction de bug |
| docs | Documentation |
| style | Formatage (pas de logique) |
| refactor | Refactoring |
| test | Ajout de tests |
| chore | Tâches diverses |

### Exemples

```
feat(auth): login unifié agent et admin
fix(call-next): utiliser SKIP LOCKED au lieu de lockForUpdate
test(concurrency): test SKIP LOCKED sur 20 appels simultanés
docs(readme): ajouter les URLs de démarrage
```

## 🔀 Pull Requests

1. Créer une branche : `git checkout -b feature/ma-fonctionnalite`
2. Faire les modifications + tests
3. Commit + push : `git push origin feature/ma-fonctionnalite`
4. Ouvrir une PR vers `main`
5. Demander une revue (au moins 1 personne)
6. Fusionner après approbation

## ✅ Checklist avant de commit

- [ ] Les tests passent (`php artisan test`)
- [ ] Pas de `console.log` ou `dd()` oubliés
- [ ] Pas de secrets dans le code (clés API, mots de passe)
- [ ] Le code est formaté (`./vendor/bin/pint`)
- [ ] Les nouvelles fonctionnalités sont testées
