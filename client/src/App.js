import { BrowserRouter as Router } from "react-router-dom";

import * as Toast from './ToastContext';
import AppLayout from './AppLayout';
import FetchProvider from './FetchProvider';
import { BrandingProvider, EnvironmentProvider } from './BrandingContext';
import { Provider as ConfigProvider } from './ConfigContext';
import { Provider as CurrentUserProvider } from './CurrentUserContext';

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
