import { BrowserRouter as Router } from "react-router-dom";

import {
  FetchProvider,
  BrandingProvider,
  EnvironmentProvider,
  ConfigProvider,
  CurrentUserProvider,
} from 'flight-webapp-components';

import * as Toast from './ToastContext';
import AppLayout from './AppLayout';

function App() {
  return (
    <div className="App">
      <BrandingProvider>
        <EnvironmentProvider>
          <ConfigProvider>
            <Router basename={process.env.REACT_APP_MOUNT_PATH}>
              <CurrentUserProvider>
                <Toast.Provider>
                  <Toast.Container />
                  <FetchProvider>
                    <AppLayout />
                  </FetchProvider>
                </Toast.Provider>
              </CurrentUserProvider>
            </Router>
          </ConfigProvider>
        </EnvironmentProvider>
      </BrandingProvider>
    </div>
  );
}

export default App;
