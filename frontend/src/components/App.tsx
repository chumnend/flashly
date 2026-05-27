import { Outlet, ScrollRestoration } from 'react-router-dom'

import Navbar from './Navbar'
import AuthProvider from '../providers/AuthProvider'

const App = () => {
    return (
        <AuthProvider>
            <ScrollRestoration />
            <Navbar />
            <main>
                <Outlet />
            </main>
        </AuthProvider>
    )
}

export default App
