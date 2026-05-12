'use client';

import { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { TaskCreateRequest, TaskResponse, TaskPageResponse, isApiError } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Rocket, CheckCircle2, XCircle, Loader2, Info, Trash2, Eye } from 'lucide-react';

interface TestResult {
  test: string;
  status: 'pending' | 'success' | 'failure';
  detail: string;
}

export default function OwnershipPage() {
  const { auth } = useAuth();
  const [results, setResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [keepTask, setKeepTask] = useState(false);
  const [lastCreatedTaskId, setLastCreatedTaskId] = useState<string | null>(null);

  const addResult = (test: string, status: 'success' | 'failure', detail: string) => {
    setResults((prev) => [...prev, { test, status, detail }]);
  };

  const runOwnershipTests = async () => {
    setIsRunning(true);
    setResults([]);
    setLastCreatedTaskId(null);

    let createdTaskId: string | null = null;
    const timestamp = Date.now();

    // TEST 1: Create task
    try {
      const res = await api.post<TaskResponse>('/tasks', {
        title: `Test Ownership [${timestamp}]`,
        description: 'Task created to test ownership and visibility',
        priority: 'HIGH',
      } satisfies TaskCreateRequest);
      createdTaskId = res.data.id;
      setLastCreatedTaskId(res.data.id);
      addResult('1. Create task', 'success', `ID: ${res.data.id} | userId: ${res.data.userId} | Priority: ${res.data.priority}`);
    } catch (err: unknown) {
      const message = isApiError(err) ? err.response.data.error || err.response.data.message || 'Error' : 'Error';
      addResult('1. Create task', 'failure', message);
    }

    // TEST 2: List my tasks
    try {
      const res = await api.get<TaskPageResponse>('/tasks', { params: { page: 0, size: 100 } });
      const hasTimestamp = res.data.content.some((t) => t.title.includes(`[${timestamp}]`));
      addResult('2. List my tasks (GET /tasks)', hasTimestamp ? 'success' : 'failure',
        hasTimestamp ? `${res.data.totalElements} task(s) found. My test task IS present.` : `${res.data.totalElements} task(s) found. My test task NOT found!`);
    } catch (err: unknown) {
      const message = isApiError(err) ? err.response.data.error || err.response.data.message || 'Error' : 'Error';
      addResult('2. List my tasks', 'failure', `Error fetching tasks: ${message}`);
    }

    // TESTS 3-6: Operations on created task
    if (createdTaskId) {
      // TEST 3: Access MY task
      try {
        const res = await api.get<TaskResponse>(`/tasks/${createdTaskId}`);
        addResult('3. Access MY task (should succeed)', 'success', `Title: ${res.data.title} | Status: ${res.data.status} | Owner: ${res.data.userId}`);
      } catch (err: unknown) {
        const statusCode = isApiError(err) ? err.response.status : null;
        addResult('3. Access MY task', 'failure', `Unexpected error! Status code: ${statusCode || 'unknown'}. The owner should always be able to access their task.`);
      }

      // TEST 4: Update MY task
      try {
        const res = await api.put<TaskResponse>(`/tasks/${createdTaskId}`, { description: 'Description modified via ownership test' });
        addResult('4. Update MY task', 'success', `Description updated: "${res.data.description?.substring(0, 50)}..."`);
      } catch (err: unknown) {
        const message = isApiError(err) ? err.response.data.error || err.response.data.message || 'Error' : 'Error';
        addResult('4. Update MY task', 'failure', `Update failed: ${message}`);
      }

      // TEST 5: Change status
      try {
        const res = await api.patch<TaskResponse>(`/tasks/${createdTaskId}/status`, { status: 'DOING' });
        addResult('5. Change status -> DOING', 'success', `New status: ${res.data.status}`);
      } catch (err: unknown) {
        const message = isApiError(err) ? err.response.data.error || err.response.data.message || 'Error' : 'Error';
        addResult('5. Change status', 'failure', `Status change failed: ${message}`);
      }

      // TEST 6: Soft delete
      if (keepTask) {
        addResult('6. Soft delete', 'success', 'SKIPPED — "Keep task" is enabled. The task remains active.');
      } else {
        try {
          await api.delete(`/tasks/${createdTaskId}`);
          addResult('6. Soft delete MY task', 'success', 'Task archived (soft-deleted). It will NO LONGER appear in "My Tasks".');
          createdTaskId = null;
          setLastCreatedTaskId(null);
        } catch (err: unknown) {
          const message = isApiError(err) ? err.response.data.error || err.response.data.message || 'Error' : 'Error';
          addResult('6. Soft delete', 'failure', `Delete failed: ${message}`);
        }
      }
    }

    // TEST 7: Non-existent task (expect 404)
    try {
      await api.get('/tasks/00000000-0000-0000-0000-000000000000');
      addResult('7. Access non-existent task (should fail)', 'failure', 'API should have returned 404!');
    } catch (err: unknown) {
      const statusCode = isApiError(err) ? err.response.status : null;
      addResult('7. Access non-existent task (404 expected)', statusCode === 404 ? 'success' : 'failure', `Status code: ${statusCode || 'unknown'}`);
    }

    // TEST 8: JWT verification
    addResult('8. JWT verification', auth?.email && auth?.role ? 'success' : 'failure', `Email: ${auth?.email || 'N/A'} | Role: ${auth?.role || 'N/A'}`);

    setIsRunning(false);
  };

  const successCount = results.filter((r) => r.status === 'success').length;
  const failureCount = results.filter((r) => r.status === 'failure').length;

  if (!auth?.isAuthenticated) return null;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            Ownership Test
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Verify that each user can only access their own tasks.
            Logged in as: <strong>{auth.email}</strong> ({auth.role})
          </p>
        </div>

        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950 dark:border-amber-800">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
              <div className="space-y-2 text-sm text-amber-800 dark:text-amber-200">
                <p className="font-semibold">How to test ownership:</p>
                <ol className="list-decimal ml-4 space-y-1">
                  <li>Click &quot;Run tests&quot; — this creates a task, tests it, then optionally deletes it.</li>
                  <li>By default, the test soft-deletes the task at step 6.</li>
                  <li>Check &quot;Keep task after test&quot; if you want the task to remain visible.</li>
                  <li>Log out and log back in with a <strong>different account</strong> to verify access control.</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <Button onClick={runOwnershipTests} disabled={isRunning} size="lg">
            {isRunning ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Running tests...</> : <><Rocket className="h-4 w-4 mr-2" /> Run ownership tests</>}
          </Button>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" checked={keepTask} onChange={(e) => setKeepTask(e.target.checked)} className="h-4 w-4 rounded border-border text-primary focus:ring-primary" />
            <span className="text-sm text-foreground flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5" /> Keep task after test
            </span>
          </label>
        </div>

        {results.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-foreground">Results</h2>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 border-emerald-200">
                  <CheckCircle2 className="h-3 w-3 mr-1" />{successCount} passed
                </Badge>
                {failureCount > 0 && (
                  <Badge variant="destructive" className="bg-red-100 text-red-700 border-red-200">
                    <XCircle className="h-3 w-3 mr-1" />{failureCount} failed
                  </Badge>
                )}
              </div>
            </div>
            <div className="space-y-2">
              {results.map((result, index) => (
                <div key={index} className={`rounded-lg border p-4 ${result.status === 'success' ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950 dark:border-emerald-800' : result.status === 'failure' ? 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800' : 'bg-muted border-border'}`}>
                  <div className="flex items-center gap-2">
                    {result.status === 'success' ? <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" /> : result.status === 'failure' ? <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" /> : <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
                    <span className="font-medium text-foreground">{result.test}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 ml-7">{result.detail}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {lastCreatedTaskId && !isRunning && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-3">
              <p className="text-sm text-foreground">
                <strong>Created task ID:</strong>{' '}
                <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono break-all">{lastCreatedTaskId}</code>
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
