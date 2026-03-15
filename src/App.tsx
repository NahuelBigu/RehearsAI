/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ApiKeyDialog } from './components/ApiKeyDialog';
import { Setup } from './pages/Setup';
import { GeneratingAssets } from './pages/GeneratingAssets';
import { Simulation } from './pages/Simulation';
import { Review } from './pages/Review';
import { SimulationProvider } from './context/SimulationContext';

export default function App() {
  return (
    <BrowserRouter>
      <ApiKeyDialog>
        <SimulationProvider>
          <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans selection:bg-indigo-500/30">
            <Routes>
              <Route path="/" element={<Setup />} />
              <Route path="/generating" element={<GeneratingAssets />} />
              <Route path="/simulation" element={<Simulation />} />
              <Route path="/review" element={<Review />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </SimulationProvider>
      </ApiKeyDialog>
    </BrowserRouter>
  );
}
