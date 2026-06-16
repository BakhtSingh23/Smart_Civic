import { Outlet } from 'react-router-dom';
import Sidebar from '../components/common/Sidebar.jsx';
import Topbar from '../components/common/Topbar.jsx';

export default function OfficerLayout() {
  return (
    <div className="flex min-h-screen bg-slateink-900 text-white transition-colors duration-300">
      <Sidebar role="officer" />
      <div className="flex flex-1 flex-col">
        <Topbar title="Officer Console" />
        <main className="flex-1 bg-slate-50 dark:bg-[#050A14] px-6 py-6 text-slateink-900 dark:text-[#F0F9FF] transition-colors duration-300">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
