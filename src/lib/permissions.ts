// Helixa Central Permission Engine — server-style logic, usable in any component.
// All access control across modules MUST flow through `can()`.

export type Role = "ROLE_CEO" | "ROLE_MANAGER" | "ROLE_EMP" | "ROLE_PUBLIC";

export type DenyCode =
  | "AUTH_REQUIRED"
  | "ACCOUNT_INACTIVE"
  | "ROLE_INSUFFICIENT"
  | "RESOURCE_LOCKED"
  | "SCOPE_VIOLATION"
  | "PERMISSION_DISABLED";

export const RoleRank: Record<Role, number> = {
  ROLE_PUBLIC: 0,
  ROLE_EMP: 1,
  ROLE_MANAGER: 2,
  ROLE_CEO: 3,
};

export interface PermissionProfile {
  messages: {
    canSend: boolean;
    canInitiate: boolean;
    canShareInternally: boolean;
    scopeLimit: "own_dept" | "company_wide" | "cross_company";
  };
  homeFeed: {
    canPost: boolean;
    canUploadMedia: boolean;
    canComment: boolean;
    canShare: boolean;
    visibilityTier: "all" | "role_based" | "dept_only";
  };
  operations: {
    canCreateTasks: boolean;
    canAssignTasks: boolean;
    canViewAllOps: boolean;
    canEscalate: boolean;
  };
  recherche: {
    canReceiveMessages: boolean;
    canPublishContent: boolean;
    canSendMessages: boolean;
  };
  ai: {
    voiceAccess: "full" | "limited" | "none";
    analyticsAccess: boolean;
  };
}

export interface Actor {
  userId: string | null;
  role: Role;
  active: boolean;
  permissions: PermissionProfile;
  scope: { departmentId?: string | null; companyId?: string | null };
}

export type Action =
  | "messages.view"
  | "messages.send"
  | "messages.initiate"
  | "messages.like"
  | "messages.comment"
  | "messages.shareInternally"
  | "messages.openProfile"
  | "feed.view"
  | "feed.post"
  | "feed.uploadMedia"
  | "feed.comment"
  | "feed.like"
  | "feed.share"
  | "operations.viewOwn"
  | "operations.viewAll"
  | "operations.create"
  | "operations.assign"
  | "operations.escalate"
  | "recherche.view"
  | "recherche.send"
  | "recherche.publish"
  | "admin.managePermissions"
  | "ai.full"
  | "ai.limited";

export interface Resource {
  id?: string;
  ownerId?: string;
  recipients?: string[];
  visibilityTier?: "COMPANY_WIDE" | "ROLE_RESTRICTED" | "DEPT_ONLY";
  allowedRoles?: Role[];
  departmentId?: string;
  companyId?: string;
  allowComments?: boolean;
  allowShare?: boolean;
  canReceiveMessages?: boolean;
  locked?: boolean;
}

export interface CanResult {
  allowed: boolean;
  reason: DenyCode | null;
}

const ALLOW: CanResult = { allowed: true, reason: null };
const deny = (reason: DenyCode): CanResult => ({ allowed: false, reason });

// Default deny-first permission baselines per role.
export function defaultPermissionsFor(role: Role): PermissionProfile {
  switch (role) {
    case "ROLE_CEO":
      return {
        messages: { canSend: true, canInitiate: true, canShareInternally: true, scopeLimit: "cross_company" },
        homeFeed: { canPost: true, canUploadMedia: true, canComment: true, canShare: true, visibilityTier: "all" },
        operations: { canCreateTasks: true, canAssignTasks: true, canViewAllOps: true, canEscalate: true },
        recherche: { canReceiveMessages: true, canPublishContent: true, canSendMessages: true },
        ai: { voiceAccess: "full", analyticsAccess: true },
      };
    case "ROLE_MANAGER":
      return {
        messages: { canSend: true, canInitiate: true, canShareInternally: true, scopeLimit: "company_wide" },
        homeFeed: { canPost: true, canUploadMedia: true, canComment: true, canShare: true, visibilityTier: "role_based" },
        operations: { canCreateTasks: true, canAssignTasks: true, canViewAllOps: true, canEscalate: true },
        recherche: { canReceiveMessages: false, canPublishContent: false, canSendMessages: true },
        ai: { voiceAccess: "limited", analyticsAccess: true },
      };
    case "ROLE_EMP":
      return {
        messages: { canSend: false, canInitiate: false, canShareInternally: false, scopeLimit: "own_dept" },
        homeFeed: { canPost: false, canUploadMedia: false, canComment: false, canShare: false, visibilityTier: "dept_only" },
        operations: { canCreateTasks: false, canAssignTasks: false, canViewAllOps: false, canEscalate: false },
        recherche: { canReceiveMessages: false, canPublishContent: false, canSendMessages: true },
        ai: { voiceAccess: "limited", analyticsAccess: false },
      };
    case "ROLE_PUBLIC":
    default:
      return {
        messages: { canSend: false, canInitiate: false, canShareInternally: false, scopeLimit: "own_dept" },
        homeFeed: { canPost: false, canUploadMedia: false, canComment: false, canShare: false, visibilityTier: "dept_only" },
        operations: { canCreateTasks: false, canAssignTasks: false, canViewAllOps: false, canEscalate: false },
        recherche: { canReceiveMessages: false, canPublishContent: false, canSendMessages: true },
        ai: { voiceAccess: "none", analyticsAccess: false },
      };
  }
}

export function makePublicActor(): Actor {
  return {
    userId: null,
    role: "ROLE_PUBLIC",
    active: true,
    permissions: defaultPermissionsFor("ROLE_PUBLIC"),
    scope: {},
  };
}

export function makeActor(role: Role, userId: string, overrides: Partial<PermissionProfile> = {}): Actor {
  const base = defaultPermissionsFor(role);
  return {
    userId,
    role,
    active: true,
    permissions: { ...base, ...overrides } as PermissionProfile,
    scope: {},
  };
}

// Core evaluator — follows the 6-step order from the spec.
export function can(actor: Actor | null, action: Action, target?: Resource): CanResult {
  // 1. authenticated?  (ROLE_PUBLIC counts as unauthenticated for protected actions)
  const requiresAuth = !action.startsWith("recherche.view") && !action.startsWith("ai.") || action === "ai.full";
  if (!actor) return deny("AUTH_REQUIRED");
  if (requiresAuth && actor.role === "ROLE_PUBLIC" && action !== "recherche.view" && action !== "recherche.send") {
    return deny("AUTH_REQUIRED");
  }

  // 2. account active?
  if (!actor.active) return deny("ACCOUNT_INACTIVE");

  // 3. role rank meets minimum for action
  const minRank: Record<Action, number> = {
    "messages.view": 1,
    "messages.send": 1,
    "messages.initiate": 2,
    "messages.like": 1,
    "messages.comment": 1,
    "messages.shareInternally": 1,
    "messages.openProfile": 1,
    "feed.view": 1,
    "feed.post": 2,
    "feed.uploadMedia": 2,
    "feed.comment": 1,
    "feed.like": 1,
    "feed.share": 1,
    "operations.viewOwn": 1,
    "operations.viewAll": 2,
    "operations.create": 2,
    "operations.assign": 2,
    "operations.escalate": 2,
    "recherche.view": 0,
    "recherche.send": 0,
    "recherche.publish": 3,
    "admin.managePermissions": 3,
    "ai.full": 3,
    "ai.limited": 1,
  };
  if (RoleRank[actor.role] < minRank[action]) return deny("ROLE_INSUFFICIENT");

  // 4. resource locked?
  if (target?.locked) return deny("RESOURCE_LOCKED");

  // 5. scope check
  if (target) {
    if (action === "messages.view" && target.recipients && actor.userId && !target.recipients.includes(actor.userId)) {
      return deny("SCOPE_VIOLATION");
    }
    if (action === "feed.view" && target.visibilityTier === "ROLE_RESTRICTED" && target.allowedRoles && !target.allowedRoles.includes(actor.role)) {
      return deny("SCOPE_VIOLATION");
    }
    if (action === "feed.view" && target.visibilityTier === "DEPT_ONLY" && target.departmentId && actor.scope.departmentId !== target.departmentId) {
      return deny("SCOPE_VIOLATION");
    }
  }

  // 6. permission flag
  switch (action) {
    case "messages.send":
      if (!actor.permissions.messages.canSend) return deny("PERMISSION_DISABLED");
      break;
    case "messages.initiate":
      if (!actor.permissions.messages.canInitiate) return deny("PERMISSION_DISABLED");
      break;
    case "messages.shareInternally":
      if (!actor.permissions.messages.canShareInternally) return deny("PERMISSION_DISABLED");
      break;
    case "feed.post":
      if (!actor.permissions.homeFeed.canPost) return deny("PERMISSION_DISABLED");
      break;
    case "feed.uploadMedia":
      if (!actor.permissions.homeFeed.canUploadMedia) return deny("PERMISSION_DISABLED");
      break;
    case "feed.comment":
      if (!actor.permissions.homeFeed.canComment) return deny("PERMISSION_DISABLED");
      if (target && target.allowComments === false) return deny("RESOURCE_LOCKED");
      break;
    case "feed.share":
      if (!actor.permissions.homeFeed.canShare) return deny("PERMISSION_DISABLED");
      if (target && target.allowShare === false) return deny("RESOURCE_LOCKED");
      break;
    case "operations.create":
      if (!actor.permissions.operations.canCreateTasks) return deny("PERMISSION_DISABLED");
      break;
    case "operations.assign":
      if (!actor.permissions.operations.canAssignTasks) return deny("PERMISSION_DISABLED");
      break;
    case "operations.viewAll":
      if (!actor.permissions.operations.canViewAllOps) return deny("PERMISSION_DISABLED");
      break;
    case "operations.escalate":
      if (!actor.permissions.operations.canEscalate) return deny("PERMISSION_DISABLED");
      break;
    case "recherche.send":
      // Dual check: company must allow receive AND visitor must be allowed to send
      if (target && target.canReceiveMessages !== true) return deny("RESOURCE_LOCKED");
      if (!actor.permissions.recherche.canSendMessages) return deny("PERMISSION_DISABLED");
      break;
    case "recherche.publish":
      if (!actor.permissions.recherche.canPublishContent) return deny("PERMISSION_DISABLED");
      break;
    case "ai.full":
      if (actor.permissions.ai.voiceAccess !== "full") return deny("PERMISSION_DISABLED");
      break;
    case "ai.limited":
      if (actor.permissions.ai.voiceAccess === "none") return deny("PERMISSION_DISABLED");
      break;
  }

  return ALLOW;
}

export const denyMessage = (code: DenyCode): string => {
  switch (code) {
    case "AUTH_REQUIRED": return "Sign in required.";
    case "ACCOUNT_INACTIVE": return "Account is not active.";
    case "ROLE_INSUFFICIENT": return "Your role does not allow this.";
    case "RESOURCE_LOCKED": return "This item is locked.";
    case "SCOPE_VIOLATION": return "This is outside your assigned scope.";
    case "PERMISSION_DISABLED": return "Permission not granted by your administrator.";
  }
};
