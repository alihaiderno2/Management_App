/**
 * Complex End-to-End API test — Auth -> Workspace -> Project -> Sprint -> Task,
 * plus permission edge cases, ordering guarantees, and negative-path validation.
 *
 * Builds on the earlier passing script. New in this version:
 *  - A third user (userC) who is never invited to the workspace, used to prove
 *    ProjectService.addMember() really enforces workspace membership (expects 403).
 *  - Role-permission testing: User B starts as a project VIEWER and is asserted to be
 *    BLOCKED from creating sprints/tasks, then promoted to MANAGER and asserted to
 *    succeed afterwards.
 *  - Self-role-change guard: a manager can't change their own project role.
 *  - Backlog ordering: creates 3 backlog tasks, asserts `order` increments 1,2,3.
 *  - Cross-sprint task moves + assigneeId/status filter coverage.
 *  - Negative/validation tests (invalid enum, bogus ids) using an expectError() helper.
 *  - Cascading safe-delete across two sprints with a final backlog count check.
 *
 * Prerequisites: same as before — `npm install axios`, server running, adjust
 * API_URL/host if needed, and double check the ProjectRole enum values you use below.
 */

const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:3001/v1';
const RUN_TAG = Date.now(); // keeps workspace/project names unique across reruns

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const log = (msg) => console.log(`\n[TEST] ${msg}`);
const success = (msg) => console.log(`✅ ${msg}`);
const assert = (condition, msg) => {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${msg}`);
    process.exit(1);
  }
  success(msg);
};

// Asserts that a promise REJECTS with one of the expected HTTP statuses.
// Fails loudly if it either succeeds, or fails with the wrong status.
async function expectError(promise, expectedStatuses, msg) {
  try {
    await promise;
    console.error(`❌ ASSERTION FAILED (expected this to be rejected): ${msg}`);
    process.exit(1);
  } catch (err) {
    const status = err.response?.status;
    if (expectedStatuses.includes(status)) {
      success(`${msg} (correctly rejected with ${status})`);
    } else {
      console.error(`❌ ASSERTION FAILED: ${msg} — expected status in [${expectedStatuses}], got ${status}`);
      console.error(err.response?.data || err.message);
      process.exit(1);
    }
  }
}

function decodeJwtPayload(token) {
  const payloadSegment = token.split('.')[1];
  return JSON.parse(Buffer.from(payloadSegment, 'base64').toString('utf8'));
}

const USER_A = {
  name: 'Rosalind Achterberg',
  email: 'rosalind.achterberg.qa+e2e91@meridianlabs.dev',
  password: 'Tr0ub4dor&Falcon!92',
};
const USER_B = {
  name: 'Kwame Osei-Bonsu',
  email: 'kwame.osei-bonsu.qa+e2e47@meridianlabs.dev',
  password: 'V3lvetHammer_Quokka#7',
};
const USER_C = {
  name: 'Priya Venkataraman',
  email: 'priya.venkataraman.qa+outsider03@meridianlabs.dev',
  password: 'Ir0nOrchid$Compass61',
};

async function registerAndLogin(user) {
  let accessToken;
  try {
    const res = await axios.post(`${API_URL}/auth/register`, {
      email: user.email,
      password: user.password,
      name: user.name,
    });
    accessToken = res.data.accessToken;
  } catch (err) {
    if (err.response?.status === 409) {
      const loginRes = await axios.post(`${API_URL}/auth/login`, {
        email: user.email,
        password: user.password,
      });
      accessToken = loginRes.data.accessToken;
    } else {
      throw err;
    }
  }

  const { userId } = decodeJwtPayload(accessToken);
  const api = axios.create({
    baseURL: API_URL,
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return { ...user, userId, accessToken, api };
}

async function runTests() {
  try {
    log('Starting Complex End-to-End API Tests...');

    // ---------------------------------------------------------
    // 1. AUTH — three users this time
    // ---------------------------------------------------------
    const userA = await registerAndLogin(USER_A);
    await wait(300);
    const userB = await registerAndLogin(USER_B);
    await wait(300);
    const userC = await registerAndLogin(USER_C);
    assert(userA.userId && userB.userId && userC.userId, 'All three users authenticated with decodable user IDs');

    // ---------------------------------------------------------
    // 2. WORKSPACE + INVITE (User B only — User C stays an outsider)
    // ---------------------------------------------------------
    log('User A creating Workspace...');
    const workspaceRes = await userA.api.post('/workspace/create', { name: `Meridian Launch ${RUN_TAG}` });
    const workspaceId = workspaceRes.data.id;
    assert(!!workspaceId, 'Workspace created');

    log('User A inviting User B (not User C)...');
    await userA.api.post(`/workspace/${workspaceId}/invite`, { email: userB.email, role: 'USER' });
    await wait(200);
    const invitesRes = await userA.api.get(`/workspace/${workspaceId}/invites`);
    const inviteRecord = invitesRes.data.find((inv) => inv.email === userB.email);
    assert(!!inviteRecord, 'Located pending invite for User B');
    await userB.api.post(`/workspace/${workspaceId}/invites/${inviteRecord.token}/accept`);
    success('User B accepted the workspace invite (User C deliberately left out)');

    // ---------------------------------------------------------
    // 3. PROJECT CREATION
    // ---------------------------------------------------------
    log('User A creating Project...');
    const projectRes = await userA.api.post(`/workspace/${workspaceId}/project`, {
      name: `Kanban Rollout ${RUN_TAG}`,
      description: 'Complex test-suite project',
    });
    const projectId = projectRes.data.id;
    assert(!!projectId, 'Project created');

    // ---------------------------------------------------------
    // 4. NEGATIVE: outsider (User C) cannot be added to the project
    // ---------------------------------------------------------
    log('Attempting to add User C (non-workspace-member) to the project...');
    await expectError(
      userA.api.post(`/workspace/${workspaceId}/project/${projectId}/members`, {
        userId: userC.userId,
        role: 'VIEWER',
      }),
      [403],
      'Adding an outsider directly to a project is rejected'
    );

    // ---------------------------------------------------------
    // 5. Add User B as a low-privilege VIEWER first
    // ---------------------------------------------------------
    log('User A adding User B to the project as VIEWER...');
    await userA.api.post(`/workspace/${workspaceId}/project/${projectId}/members`, {
      userId: userB.userId,
      role: 'VIEWER',
    });
    success('User B added as VIEWER');

    // ---------------------------------------------------------
    // 6. NEGATIVE: VIEWER cannot create sprints or tasks
    // ---------------------------------------------------------
    log('Confirming a VIEWER cannot create a sprint...');
    await expectError(
      userB.api.post(`/project/${projectId}/sprint`, {
        name: 'Should Not Be Created',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 86400000).toISOString(),
      }),
      [401, 403],
      'VIEWER blocked from creating a sprint'
    );

    log('Confirming a VIEWER cannot create a task...');
    await expectError(
      userB.api.post(`/project/${projectId}/task`, { title: 'Should Not Be Created' }),
      [401, 403],
      'VIEWER blocked from creating a task'
    );

    // ---------------------------------------------------------
    // 7. Promote User B to MANAGER, re-test that it now works
    // ---------------------------------------------------------
    log('User A promoting User B to MANAGER...');
    await userA.api.patch(`/workspace/${workspaceId}/project/${projectId}/members/${userB.userId}`, {
      role: 'MANAGER',
    });
    success('User B promoted to MANAGER');

    log('User A attempting to change their OWN project role (should fail)...');
    await expectError(
      userA.api.patch(`/workspace/${workspaceId}/project/${projectId}/members/${userA.userId}`, {
        role: 'VIEWER',
      }),
      [403],
      'Manager cannot change their own project role'
    );

    // ---------------------------------------------------------
    // 8. SPRINTS — one created by each manager
    // ---------------------------------------------------------
    log('User A creating Sprint 1...');
    const sprint1Res = await userA.api.post(`/project/${projectId}/sprint`, {
      name: 'Sprint 1',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 7 * 86400000).toISOString(),
    });
    const sprint1Id = sprint1Res.data.id;

    log('User B (now a manager) creating Sprint 2...');
    const sprint2Res = await userB.api.post(`/project/${projectId}/sprint`, {
      name: 'Sprint 2',
      startDate: new Date(Date.now() + 7 * 86400000).toISOString(),
      endDate: new Date(Date.now() + 14 * 86400000).toISOString(),
    });
    const sprint2Id = sprint2Res.data.id;
    assert(!!sprint1Id && !!sprint2Id, 'Both sprints created (one per manager)');

    // ---------------------------------------------------------
    // 9. BACKLOG ORDERING — 3 tasks created with no sprintId
    // ---------------------------------------------------------
    log('Creating 3 backlog tasks to verify ordering increments...');
    const backlog1 = await userA.api.post(`/project/${projectId}/task`, { title: 'Backlog Item A' });
    const backlog2 = await userA.api.post(`/project/${projectId}/task`, { title: 'Backlog Item B' });
    const backlog3 = await userA.api.post(`/project/${projectId}/task`, { title: 'Backlog Item C' });
    assert(
      backlog1.data.order === 1 && backlog2.data.order === 2 && backlog3.data.order === 3,
      `Backlog task order increments correctly (got ${backlog1.data.order}, ${backlog2.data.order}, ${backlog3.data.order})`
    );

    // ---------------------------------------------------------
    // 10. Task created directly into Sprint 1, assigned to User B
    // ---------------------------------------------------------
    log('User A creating a task directly in Sprint 1, assigned to User B...');
    const sprintTaskRes = await userA.api.post(`/project/${projectId}/task`, {
      title: 'Design onboarding UI',
      sprintId: sprint1Id,
      assigneeId: userB.userId,
    });
    const sprintTaskId = sprintTaskRes.data.id;
    assert(sprintTaskRes.data.assignee?.id === userB.userId, 'Task created in Sprint 1 and assigned to User B');

    // ---------------------------------------------------------
    // 11. FILTERS — by sprintId, assigneeId, and status
    // ---------------------------------------------------------
    await wait(150);
    const sprint1Tasks = await userA.api.get(`/project/${projectId}/task?sprintId=${sprint1Id}`);
    assert(sprint1Tasks.data.length === 1 && sprint1Tasks.data[0].id === sprintTaskId, 'sprintId filter returns exactly the Sprint 1 task');

    const assigneeTasks = await userA.api.get(`/project/${projectId}/task?assigneeId=${userB.userId}`);
    assert(assigneeTasks.data.some((t) => t.id === sprintTaskId), 'assigneeId filter finds the task assigned to User B');

    // ---------------------------------------------------------
    // 12. MOVE — drag task from Sprint 1 into Sprint 2, change status
    // ---------------------------------------------------------
    log('User B moving their assigned task from Sprint 1 into Sprint 2...');
    await userB.api.patch(`/task/${sprintTaskId}/move`, {
      status: 'IN_PROGRESS',
      order: 1,
      sprintId: sprint2Id,
    });

    await wait(150);
    const sprint1AfterMove = await userA.api.get(`/project/${projectId}/task?sprintId=${sprint1Id}`);
    const sprint2AfterMove = await userA.api.get(`/project/${projectId}/task?sprintId=${sprint2Id}`);
    assert(sprint1AfterMove.data.length === 0, 'Task no longer appears under Sprint 1 after the move');
    assert(
      sprint2AfterMove.data.length === 1 && sprint2AfterMove.data[0].status === 'IN_PROGRESS',
      'Task now appears under Sprint 2 with status IN_PROGRESS'
    );

    const statusTasks = await userA.api.get(`/project/${projectId}/task?status=IN_PROGRESS`);
    assert(statusTasks.data.some((t) => t.id === sprintTaskId), 'status filter finds the IN_PROGRESS task');

    // ---------------------------------------------------------
    // 13. NEGATIVE / VALIDATION — bad enum value on move
    // ---------------------------------------------------------
    log('Attempting to move a task to an invalid status enum value...');
    await expectError(
      userA.api.patch(`/task/${sprintTaskId}/move`, { status: 'NOT_A_REAL_STATUS', order: 1 }),
      [400],
      'Invalid TaskStatus enum value rejected by DTO validation'
    );

    // ---------------------------------------------------------
    // 14. INFORMATIONAL — task/:id endpoints only require JwtAuthGuard,
    //     not project membership, and TaskService has no NotFoundException
    //     guard on update/move/delete (only findOne throws one). A bogus id
    //     will surface as whatever Prisma's "record not found" error maps to
    //     (commonly a 500 unless you've added a global Prisma exception
    //     filter) rather than a clean 404. This block just documents that —
    //     it isn't asserting your app is broken, only what to expect.
    // ---------------------------------------------------------
    log('Probing move on a non-existent task id (informational only)...');
    await expectError(
      userA.api.patch(`/task/00000000-0000-0000-0000-000000000000/move`, { status: 'TODO', order: 1 }),
      [400, 404, 500],
      'Non-existent task id surfaces as an error (see comment above on Prisma error mapping)'
    );

    // ---------------------------------------------------------
    // 15. CASCADING SAFE-DELETE across two sprints
    // ---------------------------------------------------------
    log('Deleting Sprint 2 (should drop its task back to backlog)...');
    await userA.api.delete(`/sprint/${sprint2Id}`);
    log('Deleting Sprint 1 (already empty after the move)...');
    await userA.api.delete(`/sprint/${sprint1Id}`);

    await wait(200);
    const finalBacklog = await userA.api.get(`/project/${projectId}/task?sprintId=null`);
    // 3 original backlog tasks + the one that just fell out of Sprint 2 = 4
    assert(
      finalBacklog.data.length === 4 && finalBacklog.data.some((t) => t.id === sprintTaskId),
      `Backlog contains all 4 tasks after both sprints were deleted (found ${finalBacklog.data.length})`
    );

    log('🎉 ALL COMPLEX TESTS PASSED! Permission boundaries, ordering, cross-sprint moves, and safe-delete all check out.');
  } catch (error) {
    console.error('\n❌ TEST SCRIPT FAILED!');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Data:', error.response.data);
    } else {
      console.error(error.message);
    }
    process.exit(1);
  }
}

runTests();