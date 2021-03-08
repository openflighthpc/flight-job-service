import Dashboard from './Dashboard';
import ScriptsPage from './ScriptsPage';
import TemplateQuestionsPage from './TemplateQuestionsPage';
import TemplatesPage from './TemplatesPage';
import UnconfiguredDashboard from './UnconfiguredDashboard';

const routes = [
  {
    path: '/templates',
    name: 'Templates',
    Component: TemplatesPage,
    authenticated: true,
    sideNav: true,
  },
  {
    path: `/templates/:id`,
    name: 'Template',
    Component: TemplateQuestionsPage,
    authenticated: true,
    sideNav: true,
  },
  {
    path: '/scripts',
    name: 'Scripts',
    Component: ScriptsPage,
    authenticated: true,
    sideNav: false,
  },
  {
    path: '/',
    name: 'Home',
    Component: Dashboard,
    sideNav: true,
  },
]

const unconfiguredRoutes = [
  {
    path: '/',
    name: 'Home',
    Component: UnconfiguredDashboard,
    sideNav: true,
  },
];

export {
  routes,
  unconfiguredRoutes,
};
