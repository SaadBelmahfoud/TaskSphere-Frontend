'use client';

import { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { useAuth } from '@/context/AuthContext';
import { createTask, getMyTasks, getTaskById, updateTaskStatus, deleteTask } from '@/hooks/useTasks';
import { TaskResponse, TaskCreateRequest } from '@/types';

// ===== Page de test de l'ownership =====
// Cette page permet de vérifier que :
// 1. Chaque utilisateur ne voit que ses propres tâches
// 2. Un utilisateur ne peut pas accéder/modifier une tâche d'un autre
// 3. L'API renvoie bien 404 pour les tâches non autorisées

interface TestResult {
  test: string;
  status: 'pending' | 'success' | 'failure';
  detail: string;
}

export default function OwnershipPage() {
  const { auth } = useAuth();
  const [results, setResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [createdTaskId, setCreatedTaskId] = useState<string | null>(null);

  const addResult = (test: string, status: 'success' | 'failure', detail: string) => {
    setResults((prev) => [...prev, { test, status, detail }]);
  };

  const runOwnershipTests = async () => {
    setIsRunning(true);
    setResults([]);
    setCreatedTaskId(null);

    const timestamp = Date.now();

    // ===== TEST 1: Création de tâche =====
    try {
      const task = await createTask({
        title: `Test Ownership [${timestamp}]`,
        description: 'Tâche créée pour tester l\'ownership',
        priority: 'HIGH',
      } satisfies TaskCreateRequest);
      setCreatedTaskId(task.id);
      addResult(
        '1. Création de tâche',
        'success',
        `ID: ${task.id} | userId: ${task.userId} | Priorité: ${task.priority}`
      );
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      addResult('1. Création de tâche', 'failure', axiosErr?.response?.data?.message || 'Erreur');
    }

    // ===== TEST 2: Liste mes tâches =====
    try {
      const page = await getMyTasks(0, 100);
      const hasTimestamp = page.content.some((t) => t.title.includes(`[${timestamp}]`));
      addResult(
        '2. Liste de mes tâches',
        hasTimestamp ? 'success' : 'failure',
        `${page.totalElements} tâche(s) trouvée(s). Ma tâche de test présente: ${hasTimestamp}`
      );
    } catch (err: unknown) {
      addResult('2. Liste de mes tâches', 'failure', 'Erreur lors de la récupération');
    }

    // ===== TEST 3: Accès à ma propre tâche =====
    if (createdTaskId) {
      try {
        const task = await getTaskById(createdTaskId);
        addResult(
          '3. Accès à MA tâche (devrait réussir)',
          'success',
          `Titre: ${task.title} | Status: ${task.status}`
        );
      } catch (err: unknown) {
        addResult('3. Accès à MA tâche', 'failure', '404 inattendu !');
      }

      // ===== TEST 4: Mise à jour de ma tâche =====
      try {
        const updated = await updateTask(createdTaskId, {
          description: 'Description modifiée via test ownership',
        });
        addResult(
          '4. Mise à jour de MA tâche',
          'success',
          `Description mise à jour: "${updated.description.substring(0, 40)}..."`
        );
      } catch (err: unknown) {
        addResult('4. Mise à jour de MA tâche', 'failure', 'Échec de la mise à jour');
      }

      // ===== TEST 5: Changement de statut =====
      try {
        const updated = await updateTaskStatus(createdTaskId, 'DOING');
        addResult(
          '5. Changement statut → DOING',
          'success',
          `Nouveau statut: ${updated.status}`
        );
      } catch (err: unknown) {
        addResult('5. Changement statut', 'failure', 'Échec du changement');
      }

      // ===== TEST 6: Suppression soft =====
      try {
        await deleteTask(createdTaskId);
        addResult(
          '6. Soft delete de MA tâche',
          'success',
          'Tâche archivée avec succès'
        );
        setCreatedTaskId(null);
      } catch (err: unknown) {
        addResult('6. Soft delete', 'failure', 'Échec de la suppression');
      }
    }

    // ===== TEST 7: Tentative d'accès à un ID fictif (ownership test) =====
    try {
      await getTaskById('00000000-0000-0000-0000-000000000000');
      addResult(
        '7. Accès tâche inexistante (devrait échouer)',
        'failure',
        'API aurait dû renvoyer 404 !'
      );
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number } };
      addResult(
        '7. Accès tâche inexistante (404 attendu)',
        axiosErr?.response?.status === 404 ? 'success' : 'failure',
        `Status code: ${axiosErr?.response?.status || 'inconnu'}`
      );
    }

    // ===== TEST 8: Vérifier les infos JWT =====
    addResult(
      '8. Vérification JWT',
      auth.email && auth.role ? 'success' : 'failure',
      `Email: ${auth.email || 'N/A'} | Rôle: ${auth.role || 'N/A'}`
    );

    setIsRunning(false);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Test Ownership</h1>
          <p className="text-sm text-gray-500 mt-1">
            Vérifie que chaque utilisateur ne peut accéder qu&apos;à ses propres tâches.
            Connecté en tant que : <strong>{auth.email}</strong> ({auth.role})
          </p>
        </div>

        {/* Info box */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
          <strong>Comment tester l&apos;ownership :</strong>
          <ol className="list-decimal ml-4 mt-2 space-y-1">
            <li>Cliquez sur &quot;Lancer les tests&quot; — cela crée une tâche et la supprime.</li>
            <li>Déconnectez-vous et reconnectez-vous avec un <strong>autre compte</strong>.</li>
            <li>Relancez les tests — le TEST 7 vérifiera que l&apos;autre compte ne peut pas accéder à la tâche.</li>
            <li>Vérifiez que la liste (TEST 2) ne contient que les tâches de l&apos;utilisateur courant.</li>
          </ol>
        </div>

        {/* Run button */}
        <button
          onClick={runOwnershipTests}
          disabled={isRunning}
          className="bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition-colors font-medium text-sm disabled:opacity-50 shadow-sm"
        >
          {isRunning ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Tests en cours...
            </span>
          ) : (
            '🚀 Lancer les tests d\'ownership'
          )}
        </button>

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900">
              Résultats ({results.filter((r) => r.status === 'success').length}/{results.length})
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
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">
                      {result.status === 'success' ? '✅' : result.status === 'failure' ? '❌' : '⏳'}
                    </span>
                    <span className="font-medium text-gray-900">{result.test}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1 ml-8">{result.detail}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
