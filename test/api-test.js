/**
 * End-to-End API test for the Auth -> Workspace -> Project -> Sprint -> Task flow.
 *
 * Fixes vs. the original script:
 *  - Actually REGISTERS both users first (the old script jumped straight to /auth/login,
 *    which fails with "Invalid email or password" since neither user exists yet).
 *  - Removes the undefined `userB` reference (register/login only ever return
 *    { accessToken } per your AuthController, never the user id) — we now decode the
 *    JWT payload locally to pull `userId` out of the access token.
 *  - Posts to the REAL project route: `/workspace/:id/project`, not `/project`.
 *  - Runs the workspace-invite handshake before adding User B to the project, because
 *    ProjectService.addMember() requires the target user to already be a WorkspaceMember
 *    (it 403s otherwise: "User must be a member of the workspace to join the project.").
 *  - Respects your guards: task creation is ProjectManagerGuard-only, so User B (a
 *    non-manager project member) can't create tasks — User A creates both tasks and
 *    assigns one to User B via `assigneeId` instead. update/move/delete on tasks and
 *    sprints only require JwtAuthGuard in your controllers, so User B can move their
 *    own assigned task.
 *  - Adds small setTimeout-based waits after writes that have knock-on side effects
 *    (invite creation before listing invites, moves/deletes before re-reading state),
 *    to avoid flaky races against your DB.
 *
 * Prerequisites:
 *  - `npm install axios` if not already installed.
 *  - Your Nest server running locally.
 *  - Adjust API_URL below if your app doesn't use URI versioning w/ a default of v1.
 *  - Adjust the `role: 'CONTRIBUTOR'` value in step 5 to match whatever your actual
 *    `ProjectRole` enum defines in schema.prisma — the code only confirms MANAGER
 *    (auto-assigned to the creator) and VIEWER (the default) exist for certain.
 */

const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:3001/v1';

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

// Decodes a JWT payload WITHOUT verifying the signature. That's fine here since we
// only need to read back the `userId` your AuthService already signed into the token
// for a test we control — never do this to trust a token you didn't issue yourself.
function decodeJwtPayload(token) {
  const payloadSegment = token.split('.')[1];
  const json = Buffer.from(payloadSegment, 'base64').toString('utf8');
  return JSON.parse(json);
}

// Hardcoded but non-generic credentials that satisfy your IsStrongPassword rules
// (min 8 chars, 1 lowercase, 1 uppercase, 1 number, 1 symbol).
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

async function registerAndLogin(user) {
  log(`Registering ${user.email}...`);
  let accessToken;
  try {
    const res = await axios.post(`${API_URL}/auth/register`, {
      email: user.email,
      password: user.password,
      name: user.name,
    });
    accessToken = res.data.accessToken;
    success(`Registered ${user.email}`);
  } catch (err) {
    // If you re-run this script against a DB that already has these users,
    // fall back to logging in instead of hard-failing on the 409 Conflict.
    if (err.response?.status === 409) {
      console.log(`ℹ️  ${user.email} already exists, logging in instead...`);
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
    log('Starting End-to-End API Tests...');

    // ---------------------------------------------------------
    // 1. AUTHENTICATION (register, or login if already seeded)
    // ---------------------------------------------------------
    const userA = await registerAndLogin(USER_A);
    await wait(300); // small buffer so we don't butt up against the login/register throttle windows
    const userB = await registerAndLogin(USER_B);

    assert(!!userA.userId && !!userB.userId, 'Both users obtained access tokens with decodable user IDs');

    // ---------------------------------------------------------
    // 2. WORKSPACE CREATION (User A)
    // ---------------------------------------------------------
    log('User A creating Workspace...');
    const workspaceRes = await userA.api.post('/workspace/create', { name: 'Meridian Product Launch' });
    const workspaceId = workspaceRes.data.id;
    assert(!!workspaceId, 'Workspace created successfully');

    // ---------------------------------------------------------
    // 3. INVITE USER B TO THE WORKSPACE
    //    (required before addMember() will accept them onto a project)
    // ---------------------------------------------------------
    log('User A inviting User B to the workspace...');
    await userA.api.post(`/workspace/${workspaceId}/invite`, {
      email: userB.email,
      role: 'USER',
    });
    success('Invite sent to User B');

    // inviteMemberToWorkspace() never returns the invite token directly, so we
    // fetch the invite list (admin-only) to grab it.
    await wait(200);
    const invitesRes = await userA.api.get(`/workspace/${workspaceId}/invites`);
    const inviteRecord = invitesRes.data.find((inv) => inv.email === userB.email);
    assert(!!inviteRecord, 'Located the pending invite for User B');

    log('User B accepting the workspace invite...');
    await userB.api.post(`/workspace/${workspaceId}/invites/${inviteRecord.token}/accept`);
    success('User B accepted the workspace invite');

    // ---------------------------------------------------------
    // 4. PROJECT CREATION (User A) — real route is /workspace/:id/project
    // ---------------------------------------------------------
    log('User A creating Project...');
    const projectRes = await userA.api.post(`/workspace/${workspaceId}/project`, {
      name: 'Kanban Rollout',
      description: 'End-to-end test project',
    });
    const projectId = projectRes.data.id;
    assert(!!projectId, 'Project created successfully');

    // ---------------------------------------------------------
    // 5. ADD USER B TO THE PROJECT WITH A ROLE
    // ---------------------------------------------------------
    log('User A adding User B to the Project...');
    await userA.api.post(`/workspace/${workspaceId}/project/${projectId}/members`, {
      userId: userB.userId,
      role: 'CONTRIBUTOR', // <-- adjust to match your real ProjectRole enum values
    });
    success('User B added to the project');

    // ---------------------------------------------------------
    // 6. SPRINT CREATION — ProjectManagerGuard, so this must be User A
    // ---------------------------------------------------------
    log('User A creating a Sprint...');
    const sprintRes = await userA.api.post(`/project/${projectId}/sprint`, {
      name: 'Sprint 1',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });
    const sprintId = sprintRes.data.id;
    assert(!!sprintId, 'Sprint created successfully');

    // ---------------------------------------------------------
    // 7. TASK CREATION + ASSIGNMENT
    //    Task creation is also ProjectManagerGuard-only, so User A creates both
    //    tasks and assigns the second one to User B via assigneeId.
    // ---------------------------------------------------------
    log('User A creating Task 1 in the Backlog...');
    const task1Res = await userA.api.post(`/project/${projectId}/task`, {
      title: 'Set up database schema',
      description: 'Run Prisma migrations against staging',
    });
    const task1Id = task1Res.data.id;
    success('Task 1 created in backlog (no sprintId)');

    log('User A creating Task 2 directly in Sprint 1, assigned to User B...');
    const task2Res = await userA.api.post(`/project/${projectId}/task`, {
      title: 'Design onboarding UI',
      sprintId: sprintId,
      assigneeId: userB.userId,
    });
    const task2Id = task2Res.data.id;
    assert(task2Res.data.assignee?.id === userB.userId, 'Task 2 assigned to User B successfully');

    // ---------------------------------------------------------
    // 8. MOVE TASK (drag & drop) — task/:id/move only needs JwtAuthGuard,
    //    so User B can move their own assigned task.
    // ---------------------------------------------------------
    log('User B dragging Task 2 to IN_PROGRESS...');
    await userB.api.patch(`/task/${task2Id}/move`, {
      status: 'IN_PROGRESS',
      order: 1.5,
      sprintId: sprintId,
    });

    await wait(200);
    const boardRes = await userA.api.get(`/project/${projectId}/task?sprintId=${sprintId}`);
    assert(boardRes.data.length === 1, 'Sprint board contains exactly 1 task (Task 2)');
    const movedTask = boardRes.data.find((t) => t.id === task2Id);
    assert(movedTask?.status === 'IN_PROGRESS', 'Task 2 status updated via the move endpoint');

    // ---------------------------------------------------------
    // 9. SAFE SPRINT DELETE — tasks should fall back to the backlog
    // ---------------------------------------------------------
    log('User A dragging Task 1 into Sprint 1 as well...');
    await userA.api.patch(`/task/${task1Id}/move`, {
      status: 'TODO',
      order: 1,
      sprintId: sprintId,
    });

    log('User A deleting Sprint 1 (testing safe delete / backlog fallback)...');
    await userA.api.delete(`/sprint/${sprintId}`);
    success('Sprint deleted');

    await wait(200);
    log('Verifying both tasks were moved back to the backlog...');
    const backlogRes = await userA.api.get(`/project/${projectId}/task?sprintId=null`);
    const task1Found = backlogRes.data.some((t) => t.id === task1Id);
    const task2Found = backlogRes.data.some((t) => t.id === task2Id);
    assert(task1Found && task2Found, 'Both tasks survived sprint deletion and returned to the backlog');

    log('🎉 ALL TESTS PASSED SUCCESSFULLY! Auth -> Workspace -> Project -> Sprint -> Task flow is solid.');
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