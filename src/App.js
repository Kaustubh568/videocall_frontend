import { Routes, Route } from 'react-router-dom'
import './App.css';
import LobbyScreen from './screens/Lobby';
import Roompage from './screens/Room';

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path='/' element={<LobbyScreen />}/>
        <Route path='/room/:roomId' element={<Roompage />}/>
      </Routes>
    </div>
  );
}

export default App;
