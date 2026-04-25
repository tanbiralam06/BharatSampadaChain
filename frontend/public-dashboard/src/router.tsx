import { Routes, Route } from 'react-router-dom';
import { Layout }          from './components/Layout';
import BrowseOfficials   from './pages/BrowseOfficials';
import OfficialProfile   from './pages/OfficialProfile';
import CompareOfficials  from './pages/CompareOfficials';

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index                    element={<BrowseOfficials />} />
        <Route path="official/:hash"    element={<OfficialProfile />} />
        <Route path="compare"           element={<CompareOfficials />} />
      </Route>
    </Routes>
  );
}
