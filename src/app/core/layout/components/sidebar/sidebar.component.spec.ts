import { NavGroup, NavItem, orderNavGroupsForWorkspace } from './sidebar.component';

function item(route: string): NavItem {
  return { label: route, icon: 'pi-circle', route };
}

function group(title: string, routes: string[]): NavGroup {
  return { title, items: routes.map(item) };
}

describe('sidebar navigation ordering', () => {
  it('keeps Gym operations in the expected back-office workflow', () => {
    const ordered = orderNavGroupsForWorkspace([
      group('Reports', ['/owner/reports']),
      group('Members', ['/owner/clients', '/owner/coaches']),
      group('Dashboard', ['/owner/operations', '/owner/dashboard']),
      group('Finance', ['/owner/payments', '/owner/invoices'])
    ], 'Gym');

    expect(ordered.map(section => section.title)).toEqual(['Dashboard', 'Members', 'Finance', 'Reports']);
    expect(ordered[0].items.map(navItem => navItem.route)).toEqual(['/owner/dashboard', '/owner/operations']);
  });

  it('keeps FreelanceCoach navigation focused on coaching work', () => {
    const ordered = orderNavGroupsForWorkspace([
      group('Profile', ['/coach/profile']),
      group('Team', ['/owner/freelance-team']),
      group('Coaching', ['/coach/reports', '/coach/finance', '/coach/settings']),
      group('Clients', ['/coach/diet-plans', '/coach/trainees', '/coach/workout-programs']),
      group('Sessions', ['/coach/appointments'])
    ], 'FreelanceCoach');

    expect(ordered.map(section => section.title)).toEqual(['Clients', 'Sessions', 'Coaching', 'Team', 'Profile']);
    expect(ordered[0].items.map(navItem => navItem.route)).toEqual([
      '/coach/trainees',
      '/coach/workout-programs',
      '/coach/diet-plans'
    ]);
    expect(ordered[2].items.map(navItem => navItem.route)).toEqual([
      '/coach/finance',
      '/coach/reports',
      '/coach/settings'
    ]);
  });

  it('keeps newly added routes stable when they are not in the workflow map', () => {
    const ordered = orderNavGroupsForWorkspace([
      group('First', ['/future/first']),
      group('Second', ['/future/second'])
    ], 'Gym');

    expect(ordered.map(section => section.title)).toEqual(['First', 'Second']);
  });
});
