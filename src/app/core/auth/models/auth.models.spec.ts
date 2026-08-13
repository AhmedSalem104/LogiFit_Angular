import { capabilitiesForWorkspace, WorkspaceCapabilities } from './auth.models';

describe('workspace capability fallbacks', () => {
  it('fails closed when a session has no workspace type', () => {
    expect(capabilitiesForWorkspace(undefined)).toEqual([]);
    expect(capabilitiesForWorkspace(0)).toEqual([]);
  });

  it('keeps Gym capabilities out of FreelanceCoach sessions', () => {
    const capabilities = capabilitiesForWorkspace(2);

    expect(capabilities).toContain(WorkspaceCapabilities.CoachingClients);
    expect(capabilities).toContain(WorkspaceCapabilities.CoachingPrograms);
    expect(capabilities).not.toContain(WorkspaceCapabilities.GymFacilities);
    expect(capabilities).not.toContain(WorkspaceCapabilities.GymStaff);
    expect(capabilities).not.toContain(WorkspaceCapabilities.GymInventory);
    expect(capabilities).not.toContain(WorkspaceCapabilities.GymPOS);
  });

  it('keeps Gym capabilities available for Gym sessions', () => {
    const capabilities = capabilitiesForWorkspace(1);

    expect(capabilities).toContain(WorkspaceCapabilities.GymFacilities);
    expect(capabilities).toContain(WorkspaceCapabilities.GymStaff);
    expect(capabilities).toContain(WorkspaceCapabilities.GymInventory);
    expect(capabilities).toContain(WorkspaceCapabilities.GymPOS);
  });
});
