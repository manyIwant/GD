import type { ReactNode } from 'react';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import RoutePage from './pages/RoutePage';
import OrdersPage from './pages/OrdersPage';
import PassportPage from './pages/PassportPage';
import MonitorPage from './pages/MonitorPage';
import DestinationsPage from './pages/DestinationsPage';
import LevelPage from './pages/LevelPage';
import TasksPage from './pages/TasksPage';
import LeaderboardPage from './pages/LeaderboardPage';
import ShipsPage from './pages/ShipsPage';
import LogsPage from './pages/LogsPage';
import CommPage from './pages/CommPage';
import AdminPage from './pages/AdminPage';
import StarMapPage from './pages/StarMapPage';

export interface RouteConfig {
  name: string;
  path: string;
  element: ReactNode;
  visible?: boolean;
  public?: boolean;
}

export const routes: RouteConfig[] = [
  { name: '登录', path: '/login', element: <LoginPage />, public: true },
  { name: '首页', path: '/', element: <HomePage /> },
  { name: '航线', path: '/route', element: <RoutePage /> },
  { name: '订单', path: '/orders', element: <OrdersPage /> },
  { name: '通行证', path: '/passport', element: <PassportPage /> },
  { name: '监控', path: '/monitor', element: <MonitorPage /> },
  { name: '目的地', path: '/destinations', element: <DestinationsPage /> },
  { name: '等级成就', path: '/level', element: <LevelPage /> },
  { name: '每日任务', path: '/tasks', element: <TasksPage /> },
  { name: '排行榜', path: '/leaderboard', element: <LeaderboardPage /> },
  { name: '飞船', path: '/ships', element: <ShipsPage /> },
  { name: '飞行日志', path: '/logs', element: <LogsPage /> },
  { name: '通讯', path: '/comm', element: <CommPage /> },
  { name: '银河星图', path: '/galaxy', element: <StarMapPage /> },
  { name: '管理控制台', path: '/admin', element: <AdminPage /> },
];
