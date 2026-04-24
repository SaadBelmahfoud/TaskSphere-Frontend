'use client';

import { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { useAuth } from '@/context/AuthContext';
import {
  createTask,
  getMyTasks,
  getTaskById,
  updateTask,
  updateTaskStatus,
  deleteTask,
} from '@/hooks/useTasks';
import { TaskCreateRequest, isApiError } from '@/types';
import { Button } from '@/components/ui/button';
import { Shield, Rocket, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

interface TestResult {
  test: string;
  status: 'pending' | 'success' | 'failure';
  detail: string;
}

export default function OwnershipPage() {
  const { auth } = useAuth();
  const [results, setResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addResult = (test: string, status: 'success' | 'failure', detail: string) => {
    setResults((prev) => [...prev, { test, status, detail }]);
  };

  const runOwnershipTests = async () => {
    setIsRunning(true);
    setResults([]);

    // Use a local variable to avoid stale React state in the async flow
    let createdTaskId: string | null = null;

    const timestamp = Date.now();

    // TEST 1: Création de tâche
    try {
      const task = await createTask({
        title: `Test Ownership [${timestamp}]`,
        description: 'Tâche créée pour tester l\'ownership',
        priority: 'HIGH',
      } satisfies TaskCreateRequest);
      createdTaskId = task.id;
      addResult(
        '1. Création de tâche',
        'success',
        `ID: ${task.id} | userId: ${task.userId} | Priorité: ${task.priority}`
      );
    } catch (err: unknown) {
      const message = isApiError(err)
        ? err.response.data.error || err.response.data.message || 'Erreur'
        : 'Erreur';
      addResult('1. Création de tâche', 'failure', message);
    }

    // TEST 2: Liste mes tâches (appel direct, pas de cache)
    try {
      const page = await getMyTasks(0, 100);
      const hasTimestamp = page.content.some((t) => t.title.includes(`[${timestamp}]`));
      addResult(
        '2. Liste de mes tâches',
        hasTimestamp ? 'success' : 'failure',
        `${page.totalElements} tâche(s) trouvée(s). Ma tâche de test présente: ${hasTimestamp}`
      );
    } catch {
      addResult('2. Liste de mes tâches', 'failure', 'Erreur lors de la récupération');
    }

    // TEST 3-6: Opérations sur la tâche créée
    if (createdTaskId) {
      try {
        const task = await getTaskById(createdTaskId);
        addResult('3. Accès à MA tâche (devrait réussir)', 'success', `Titre: ${task.title} | Status: ${task.status}`);
      } catch {
        addResult('3. Accès à MA tâche', 'failure', '404 inattendu !');
      }

      try {
        const updated = await updateTask(createdTaskId, { description: 'Description modifiée via test ownership' });
        addResult('4. Mise à jour de MA tâche', 'success', `Description mise à jour: "${updated.description?.substring(0, 40)}..."`);
      } catch {
        addResult('4. Mise à jour de MA tâche', 'failure', 'Échec de la mise à jour');
      }

      try {
        const updated = await updateTaskStatus(createdTaskId, 'DOING');
        addResult('5. Changement statut → DOING', 'success', `Nouveau statut: ${updated.status}`);
      } catch {
        addResult('5. Changement statut', 'failure', 'Échec du changement');
      }

      try {
        await deleteTask(createdTaskId);
        addResult('6. Soft delete de MA tâche', 'success', 'Tâche archivée avec succès');
        createdTaskId = null;
      } catch {
        addResult('6. Soft delete', 'failure', 'Échec de la suppression');
      }
    }

    // TEST 7: Tâche inexistante (404 attendu)
    try {
      await getTaskById('00000000-0000-0000-0000-000000000000');
      addResult('7. Accès tâche inexistante (devrait échouer)', 'failure', 'API aurait dû renvoyer 404 !');
    } catch (err: unknown) {
      const statusCode = isApiError(err) ? err.response.status : null;
      addResult(
        '7. Accès tâche inexistante (404 attendu)',
        statusCode === 404 ? 'success' : 'failure',
        `Status code: ${statusCode || 'inconnu'}`
      );
    }

    // TEST 8: Vérification JWT
    addResult(
      '8. Vérification JWT',
      auth.email && auth.role ? 'success' : 'failure',
      `Email: ${auth.email || 'N/A'} | Rôle: ${auth.role || 'N/A'}`
    );

    setIsRunning(false);
  };

  const successCount = results.filter((r) => r.status === 'success').length;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            Test Ownership
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Vérifie que chaque utilisateur ne peut accéder qu&apos;à ses propres tâches.
            Connecté en tant que : <strong>{auth.email}</strong> ({auth.role})
          </p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
          <strong>Comment tester l&apos;ownership :</strong>
          <ol className="list-decimal ml-4 mt-2 space-y-1">
            <li>Cliquez sur &quot;Lancer les tests&quot; — cela crée une tâche et la supprime.</li>
            <li>Déconnectez-vous et reconnectez-vous avec un <strong>autre compte</strong>.</li>
            <li>Relancez les tests — le TEST 7 vérifiera que l&apos;autre compte ne peut pas accéder à la tâche.</li>
            <li>Vérifiez que la liste (TEST 2) ne contient que les tâches de l&apos;utilisateur courant.</li>
          </ol>
        </div>

        <Button onClick={runOwnershipTests} disabled={isRunning} size="lg">
          {isRunning ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Tests en cours...</>
          ) : (
            <><Rocket className="h-4 w-4 mr-2" /> Lancer les tests d&apos;ownership</>
          )}
        </Button>

        {results.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">
              Résultats ({successCount}/{results.length})
            </h2>
            <div className="space-y-2">
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`rounded-lg border p-4 ${
                    result.status === 'success'
                      ? 'bg-emerald-50 border-emerald-200'
                      : result.status === 'failure'
                      ? 'bg-red-50 border-red-200'
                      : 'bg-muted border-border'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {result.status === 'success' ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    ) : result.status === 'failure' ? (
                      <XCircle className="h-5 w-5 text-red-600" />
                    ) : (
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    )}
                    <span className="font-medium text-foreground">{result.test}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 ml-7">{result.detail}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
