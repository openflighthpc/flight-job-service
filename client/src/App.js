import { BrowserRouter as Router } from "react-router-dom";

import * as Toast from './ToastContext';
import AppLayout from './AppLayout';
import {
  FetchProvider,
  BrandingProvider,
  EnvironmentProvider,
  ConfigProvider,
} from './lib';
import { Provider as CurrentUserProvider } from './account/CurrentUserContext';

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
